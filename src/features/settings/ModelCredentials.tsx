import { useEffect, useRef, useState } from "react"
import { IconKey, IconPlugConnected } from "@tabler/icons-react"
import type { ModelProfile } from "@/contracts/generated"
import { errorMessage, ipc, IpcError } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { Field } from "./ConfigurationFields"

export function ModelCredentials({ profile, generation, disabled, onChanged, onBusy }: {
  profile: ModelProfile; generation: string; disabled: boolean
  onChanged: () => Promise<void>; onBusy: (busy: boolean) => void
}) {
  const [apiKey, setApiKey] = useState("")
  const [configured, setConfigured] = useState(profile.credential_configured)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const alive = useRef(false)
  const busy = useRef(false)
  const token = useRef(0)
  const busyCallback = useRef(onBusy)
  useEffect(() => { busyCallback.current = onBusy }, [onBusy])
  useEffect(() => { alive.current = true; return () => { alive.current = false; token.current += 1 } }, [])

  async function operation(kind: "status" | "set" | "delete" | "test") {
    if (busy.current || disabled) return
    const secret = apiKey
    if (kind === "set") setApiKey("")
    const request = { data_generation_id: generation, profile_id: profile.id, expected_revision: profile.revision }
    const epoch = ++token.current
    busy.current = true
    onBusy(true)
    setPending(true)
    setError(null)
    setMessage(null)
    setConfirmDelete(false)
    try {
      if (kind === "test") {
        const result = await ipc.testModel(request)
        if (alive.current && epoch === token.current) setMessage(result.available ? `连接可用，耗时 ${result.elapsed_ms} ms${result.usage_input_tokens === null ? "" : `；输入 ${result.usage_input_tokens} tokens`}${result.usage_output_tokens === null ? "" : `，输出 ${result.usage_output_tokens} tokens`}` : "模型暂不可用。检查地址、模型名称和密钥后重试。")
      } else {
        const result = kind === "set" ? await ipc.setSecret({ ...request, api_key: secret }) : kind === "delete" ? await ipc.deleteSecret(request) : await ipc.secretStatus(request)
        if (kind === "set" || kind === "delete") await onChanged()
        if (alive.current && epoch === token.current) { setConfigured(result.configured); setMessage(kind === "set" ? "密钥已写入系统凭据库，输入已清空。" : kind === "delete" ? "密钥已从当前预设解绑；历史引用仍保留。" : result.configured ? "已配置密钥。" : "尚未配置密钥。") }
      }
    } catch (cause) {
      if (alive.current && epoch === token.current) {
        const detail = cause instanceof IpcError ? cause.detail : null
        const text = detail ? errorMessage(cause) : "操作未完成，请重试。"
        setError(`${text}${kind === "set" ? " 密钥输入已清空。" : ""}${detail?.may_have_been_charged ? " 本次请求可能已计费，重试可能再次计费。" : ""}`)
      }
    } finally { busyCallback.current(false); if (alive.current && epoch === token.current) { busy.current = false; setPending(false) } }
  }

  return <div className="config-stack">
    <div className="config-item-heading"><p className="form-caption"><IconKey size={15} className="inline" aria-hidden="true" /> {configured ? "已配置系统密钥" : "未配置系统密钥"}</p><Button variant="ghost" size="sm" disabled={pending || disabled} onClick={() => void operation("status")}>刷新密钥状态</Button></div>
    <Field label="API Key" caption={disabled ? "请先保存模型预设，再配置密钥或测试连接。" : "只写入系统凭据库；不会返回、回显或随预设复制。"}><input className="form-control" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} disabled={pending || disabled} onChange={(event) => setApiKey(event.target.value)} /></Field>
    <div className="config-actions"><Button size="sm" variant="secondary" disabled={pending || disabled || !apiKey.trim()} onClick={() => void operation("set")}>写入密钥</Button><Button variant="ghost" size="sm" disabled={pending || disabled || !configured} onClick={() => setConfirmDelete(true)}>移除密钥</Button><Button variant="ghost" size="sm" disabled={pending || disabled} onClick={() => void operation("test")}><IconPlugConnected size={16} aria-hidden="true" />{pending ? "处理中…" : "测试连接"}</Button></div>
    <p className="form-caption">连接测试会调用模型服务，可能产生少量费用；成功不代表智能体已启动。</p>
    {confirmDelete && <div className="config-notice"><p>移除这份模型预设的系统密钥？</p><div className="config-actions"><Button size="sm" onClick={() => void operation("delete")}>确认移除</Button><Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>保留密钥</Button></div></div>}
    {message && !disabled && <p className="config-operation-status" role="status">{message}</p>}{error && !disabled && <p role="alert">{error}</p>}
  </div>
}
