import { useRef, useState, type FormEvent } from "react"
import { IconDeviceDesktop, IconMoon, IconSun, IconLogout } from "@tabler/icons-react"
import type { Appearance, AppSnapshot, Theme } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { errorMessage, ipc } from "./ipc"
import { cn } from "@/lib/utils"

const choices = [
  { value: "system" as const, label: "跟随系统", icon: IconDeviceDesktop },
  { value: "light" as const, label: "浅色", icon: IconSun },
  { value: "dark" as const, label: "深色", icon: IconMoon },
]

function AppearanceForm({ snapshot, onSaved }: { snapshot: AppSnapshot; onSaved: (appearance: Appearance, generation: string) => void }) {
  const [theme, setTheme] = useState<Theme>(snapshot.appearance.theme)
  const [reduceMotion, setReduceMotion] = useState(snapshot.appearance.reduce_motion)
  const [revision, setRevision] = useState(snapshot.appearance.revision)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const retry = useRef<{ theme: Theme; reduced: boolean; revision: string; requestId: string } | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    setSaved(false)
    const previous = retry.current
    const requestId = previous && previous.theme === theme && previous.reduced === reduceMotion && previous.revision === revision
      ? previous.requestId
      : crypto.randomUUID()
    retry.current = { theme, reduced: reduceMotion, revision, requestId }
    try {
      const appearance = await ipc.saveAppearance({
        data_generation_id: snapshot.data_generation_id,
        client_request_id: requestId,
        expected_revision: revision,
        theme,
        reduce_motion: reduceMotion,
      })
      setRevision(appearance.revision)
      retry.current = null
      onSaved(appearance, snapshot.data_generation_id)
      setSaved(true)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)}>
      <fieldset disabled={pending}>
        <legend className="mb-2 text-sm font-medium">主题</legend>
        <div className="grid grid-cols-3 gap-2">
          {choices.map(({ value, label, icon: Icon }) => (
            <label key={value} className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-md border p-3 text-xs has-focus-visible:ring-2 has-focus-visible:ring-ring", theme === value ? "border-primary bg-primary/8 text-primary" : "border-border text-text-secondary")}>
              <input className="sr-only" name="theme" type="radio" value={value} checked={theme === value} onChange={() => { retry.current = null; setTheme(value); setSaved(false) }} />
              <Icon size={20} aria-hidden="true" /><span>{label}</span>
            </label>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={reduceMotion} onChange={(event) => { retry.current = null; setReduceMotion(event.target.checked); setSaved(false) }} className="size-4 accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring" />减少动画</label>
      </fieldset>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span aria-live="polite" className="text-xs text-text-secondary">{saved ? "外观已保存" : "设置保存在本机"}</span>
        <Button size="sm" type="submit" disabled={pending}>{pending ? "保存中" : "保存外观"}</Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </form>
  )
}

export function AppearanceDialog({ open, onOpenChange, snapshot, onSaved, onExit, onReturnFocus }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: AppSnapshot | null
  onSaved: (appearance: Appearance, generation: string) => void
  onExit: () => Promise<void>
  onReturnFocus?: () => void
}) {
  const [exitError, setExitError] = useState<string | null>(null)
  async function exit() {
    try {
      await onExit()
    } catch (cause) {
      setExitError(errorMessage(cause))
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(event) => { if (onReturnFocus) { event.preventDefault(); onReturnFocus() } }}>
        <DialogHeader><DialogTitle>外观与关于</DialogTitle><DialogDescription>一个安静的本地聊天室。</DialogDescription></DialogHeader>
        {snapshot ? <AppearanceForm key={snapshot.data_generation_id} snapshot={snapshot} onSaved={onSaved} /> : <p className="text-sm text-text-secondary">本地数据尚未就绪，外观设置暂不可用。你仍可退出应用。</p>}
        <div className="border-t border-border/70 pt-4">
          <p className="text-sm font-medium">Sageroom{snapshot ? ` ${snapshot.app_version}` : ""}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">文本保存在本机。模型、图片与联网工具尚未启用。</p>
          {snapshot && <div className="mt-3"><p className="text-xs text-text-secondary">数据目录</p><p className="mt-1 text-xs leading-relaxed [overflow-wrap:anywhere]">{snapshot.data_directory}</p></div>}
          <p className="mt-3 text-xs text-text-secondary">关闭主窗口会隐藏到托盘；退出会结束本地任务。</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => void exit()}><IconLogout size={16} aria-hidden="true" />退出应用</Button>
          {exitError && <p role="alert" className="mt-2 text-sm text-destructive">{exitError}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
