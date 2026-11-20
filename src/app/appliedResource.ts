import { errorMessage, IpcError } from "./ipc"

export type Versioned = { revision: string }
export type ApplicationState<T> = {
  value: T | null
  confirmed: T | null
  loading: boolean
  status: "idle" | "pending" | "applied" | "error"
  error: string | null
}

type Deferred<T> = { resolve: (value: T) => void; reject: (error: unknown) => void }
type Change<T> = Deferred<void> & { kind: "change"; update: (value: T) => T }
type Barrier<T> = Deferred<unknown> & { kind: "barrier"; run: (confirmed: T) => Promise<unknown> }
type Operation<T> = Change<T> | Barrier<T>
type Batch<T> = { count: number; value: T; revision: string; requestId: string }

function localError(code: "DATA_GENERATION_CHANGED" | "SHUTTING_DOWN", message: string) {
  return new IpcError({ code, message, retryability: "after_user_action", field_path: null, trace_id: crypto.randomUUID(), may_have_been_charged: false })
}

export class AppliedResource<T extends Versioned> {
  private state: ApplicationState<T>
  private operations: Operation<T>[] = []
  private batch: Batch<T> | null = null
  private listeners = new Set<() => void>()
  private running: Promise<void> | null = null
  private loading: Promise<void> | null = null
  private failure: unknown = null
  private observed: T | null = null
  private blocked = false
  private disposed = false
  private frozen = false

  constructor(private readonly options: {
    load: () => Promise<T>
    write: (value: T, revision: string, requestId: string) => Promise<T>
    initial?: T
    onConfirmed?: (value: T) => void
  }) {
    this.state = { value: options.initial ?? null, confirmed: options.initial ?? null, loading: false, status: "idle", error: null }
  }

  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private publish(partial: Partial<ApplicationState<T>> = {}) {
    let value = partial.confirmed ?? this.state.confirmed
    if (!this.operations.length && value && this.observed) {
      if (BigInt(this.observed.revision) > BigInt(value.revision)) {
        value = this.observed
        partial = { ...partial, confirmed: value }
      }
      this.observed = null
    }
    if (value) for (const operation of this.operations) if (operation.kind === "change") value = operation.update(value)
    this.state = { ...this.state, ...partial, value }
    for (const listener of this.listeners) listener()
  }

  private accept() {
    if (this.disposed) throw localError("DATA_GENERATION_CHANGED", "数据世代已改变，未应用旧页面修改。")
    if (this.frozen) throw localError("SHUTTING_DOWN", "正在结束已应用修改，未接受新的设置。")
  }

  async ensureLoaded() {
    if (this.state.confirmed || this.disposed) return
    if (!this.loading) {
      this.publish({ loading: true, error: null })
      this.loading = this.options.load().then((confirmed) => {
        if (this.disposed) return
        this.options.onConfirmed?.(confirmed)
        this.publish({ confirmed, status: "idle" })
      }).catch((cause: unknown) => {
        if (!this.disposed) { this.failure = cause; this.publish({ error: errorMessage(cause), status: "error" }) }
      }).finally(() => {
        this.loading = null
        if (!this.disposed) this.publish({ loading: false })
      })
    }
    await this.loading
  }

  change(update: (value: T) => T): Promise<void> {
    try { this.accept() } catch (cause) { return Promise.reject(cause) }
    const current = this.state.value
    if (!current) return Promise.reject(new Error("本地设置尚未读取。"))
    if (JSON.stringify(update(current)) === JSON.stringify(current)) {
      if (this.blocked) return Promise.reject(this.failure)
      return this.operations.length ? this.flush() : Promise.resolve()
    }
    const promise = new Promise<void>((resolve, reject) => this.operations.push({ kind: "change", update, resolve, reject }))
    this.publish({ status: this.blocked ? "error" : "pending" })
    if (this.blocked) this.operations.at(-1)!.reject(this.failure)
    else this.start()
    return promise
  }

  persistInitial(): Promise<void> {
    try { this.accept() } catch (cause) { return Promise.reject(cause) }
    if (!this.state.confirmed) return Promise.reject(new Error("本地设置尚未读取。"))
    const promise = new Promise<void>((resolve, reject) => this.operations.push({ kind: "change", update: (value) => value, resolve, reject }))
    this.publish({ status: "pending" })
    this.start()
    return promise
  }

  exclusive<R>(run: (confirmed: T) => Promise<R>): Promise<R> {
    try { this.accept() } catch (cause) { return Promise.reject(cause) }
    if (!this.state.confirmed) return Promise.reject(new Error("本地设置尚未读取。"))
    if (this.blocked) return Promise.reject(this.failure)
    const promise = new Promise<R>((resolve, reject) => this.operations.push({ kind: "barrier", run, resolve: (value) => resolve(value as R), reject }))
    this.publish({ status: "pending" })
    this.start()
    return promise
  }

  private start() {
    if (this.running || this.disposed || this.blocked || !this.operations.length) return
    this.running = this.drain().finally(() => {
      this.running = null
      if (!this.disposed && !this.blocked && this.operations.length) this.start()
    })
  }

  private async drain() {
    while (this.operations.length && !this.disposed && !this.blocked) {
      const first = this.operations[0]
      this.publish({ status: "pending", error: null })
      if (first.kind === "barrier") {
        let result: unknown
        let operationError: unknown
        let refreshError: unknown
        try { result = await first.run(this.state.confirmed!) } catch (cause) { operationError = cause }
        let confirmed: T | undefined
        try { confirmed = await this.options.load() } catch (cause) { refreshError = cause }
        if (this.disposed) return
        this.operations.shift()
        if (confirmed) { this.options.onConfirmed?.(confirmed); this.publish({ confirmed }) }
        if (refreshError) {
          this.failure = refreshError
          this.blocked = true
          this.publish({ status: "error", error: errorMessage(refreshError) })
          first.reject(operationError ?? refreshError)
          this.rejectChanges(refreshError)
          return
        }
        if (operationError) first.reject(operationError)
        else first.resolve(result)
        this.publish({ status: this.operations.length ? "pending" : "applied", error: null })
        continue
      }
      if (!this.batch) {
        let value = this.state.confirmed!
        let count = 0
        for (const operation of this.operations) {
          if (operation.kind !== "change") break
          value = operation.update(value)
          count += 1
        }
        this.batch = { count, value, revision: this.state.confirmed!.revision, requestId: crypto.randomUUID() }
      }
      const batch = this.batch
      try {
        const confirmed = await this.options.write(batch.value, batch.revision, batch.requestId)
        if (this.disposed) return
        const completed = this.operations.splice(0, batch.count)
        this.batch = null
        this.failure = null
        this.options.onConfirmed?.(confirmed)
        this.publish({ confirmed, status: this.operations.length ? "pending" : "applied", error: null })
        for (const operation of completed) operation.resolve(undefined)
      } catch (cause) {
        if (this.disposed) return
        this.failure = cause
        this.blocked = true
        this.publish({ status: "error", error: errorMessage(cause) })
        this.rejectChanges(cause)
      }
    }
  }

  private rejectChanges(cause: unknown) {
    const retained: Operation<T>[] = []
    for (const operation of this.operations) {
      operation.reject(cause)
      if (operation.kind === "change") retained.push(operation)
    }
    this.operations = retained
  }

  async retry() {
    if (this.disposed || this.running) return
    if (!this.state.confirmed) { await this.ensureLoaded(); return }
    const code = this.failure instanceof IpcError ? this.failure.detail.code : null
    if (!this.batch || code === "CONFIG_CONFLICT" || code === "INVALID_INPUT") {
      try {
        const confirmed = await this.options.load()
        if (this.disposed) return
        this.batch = null
        this.options.onConfirmed?.(confirmed)
        this.publish({ confirmed })
      } catch (cause) { this.failure = cause; this.publish({ status: "error", error: errorMessage(cause) }); return }
    }
    this.blocked = false
    this.failure = null
    this.publish({ error: null, status: this.operations.length ? "pending" : "idle" })
    this.start()
    await this.running
  }

  async discard() {
    if (this.disposed) return
    await this.running
    const discarded = new Set(this.operations)
    let confirmed: T
    try {
      confirmed = await this.options.load()
    } catch (cause) {
      if (!this.disposed) {
        this.failure = cause
        this.blocked = true
        this.publish({ status: "error", error: errorMessage(cause) })
      }
      throw cause
    }
    if (this.disposed) return
    this.operations = this.operations.filter((operation) => !discarded.has(operation))
    for (const operation of discarded) operation.reject(new Error("本次应用已撤销。"))
    this.batch = null
    this.blocked = false
    this.failure = null
    this.options.onConfirmed?.(confirmed)
    this.publish({ confirmed, error: null, status: this.operations.length ? "pending" : "idle" })
    this.start()
  }

  ingest(confirmed: T) {
    if (this.disposed || (this.state.confirmed && BigInt(confirmed.revision) <= BigInt(this.state.confirmed.revision))) return
    if (!this.state.confirmed || this.loading || this.operations.length || this.running) {
      if (!this.observed || BigInt(confirmed.revision) > BigInt(this.observed.revision)) this.observed = confirmed
      return
    }
    this.publish({ confirmed })
  }

  freeze(value: boolean) { this.frozen = value }

  async flush() {
    await this.loading
    while (!this.disposed && this.operations.length && !this.blocked) {
      this.start()
      await this.running
    }
    if (this.blocked) throw this.failure
  }

  dispose() {
    this.disposed = true
    const error = localError("DATA_GENERATION_CHANGED", "数据世代已改变，旧修改不会应用到新数据。")
    for (const operation of this.operations) operation.reject(error)
    this.operations = []
    this.listeners.clear()
  }
}
