import { useEffect, useId, useRef, useState } from "react"
import { IconPlugConnected, IconPlugX } from "@tabler/icons-react"
import type { ModelProfile, ModelTestResult } from "@/contracts/generated"
import { useConfiguration } from "@/app/configurationContext"
import { modelIsComplete } from "@/app/configurationStore"
import { errorMessage, IpcError } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { SettingRow } from "@/components/ui/setting-row"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function relativeTime(timestamp: number | null): string {
  if (timestamp === null) return ""
  const minutes = Math.floor((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

function testTooltip(available: boolean | undefined, testedAt: number | null): string {
  const base = "点击测试模型是否可用，可能产生少量费用"
  if (available === undefined) return base
  return available
    ? `测试连接（${relativeTime(testedAt)}已测试，连接成功）`
    : "测试连接（刚刚已测试，连接失败）"
}

export function ModelCredentials({ profile, disabled = false, active = true, onTestResult }: {
  profile: ModelProfile
  disabled?: boolean
  active?: boolean
  onTestResult?: (available: boolean) => void
}) {
  const store = useConfiguration()
  const fieldId = useId()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<ModelTestResult | null>(null)
  const [testedAt, setTestedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(false)
  const busy = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const unavailable = disabled || !modelIsComplete(profile)

  async function operation(kind: "set" | "test", secret?: string) {
    if (busy.current || disabled || (kind !== "set" && !modelIsComplete(profile)) || (kind === "set" && (!secret?.trim() || !modelIsComplete(profile)))) return
    busy.current = true
    setPending(true)
    setError(null)
    setMessage(null)
    setResult(null)
    try {
      if (kind === "test") {
        const tested = await store.testModel(profile.id)
        if (alive.current) { setResult(tested); setTestedAt(Date.now()) }
        onTestResult?.(tested.available)
      } else {
        await store.setSecret(profile.id, secret!)
        if (alive.current) setMessage("密钥已应用到系统凭据库，输入已清空。")
      }
    } catch (cause) {
      const detail = cause instanceof IpcError ? cause.detail : null
      const safe = detail ? errorMessage(cause) : "操作未完成，请重试。"
      if (alive.current) setError(`${safe}${kind === "set" ? " 密钥输入已清空。" : ""}${detail?.may_have_been_charged ? " 本次请求可能已计费，重试可能再次计费。" : ""}`)
      if (kind === "test") { setTestedAt(Date.now()); onTestResult?.(false) }
      if (kind === "set") throw new Error("凭据未能应用，请重新输入后重试。", { cause })
    } finally { busy.current = false; if (alive.current) setPending(false) }
  }

  return <div className="config-stack">
    <SettingRow
      title="API Key"
      description={unavailable ? "请先完成模型地址与名称，再配置密钥或测试。" : undefined}
      htmlFor={fieldId}
    >
      <div className="credential-input-row">
        <EditableInput id={fieldId} label="API Key" active={active} type="password" value="" resetOnApply autoComplete="new-password" spellCheck={false} placeholder={profile.credential_configured ? "已配置系统密钥" : "未配置系统密钥"} disabled={pending || unavailable} onApply={async (secret) => { await operation("set", secret) }} />
        <Tooltip disableHoverableContent>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className={result ? (result.available ? "model-test-success" : "model-test-failure") : undefined} aria-label="测试模型是否可用" disabled={pending || unavailable} onClick={() => void operation("test")}>
              {result && !result.available ? <IconPlugX size={16} aria-hidden="true" /> : <IconPlugConnected size={16} aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{testTooltip(result?.available, testedAt)}</TooltipContent>
        </Tooltip>
      </div>
    </SettingRow>
    {message && <p className="config-operation-status" role="status">{message}</p>}
    {result && <div className="config-operation-status" role="status"><p>{result.available ? `连接可用 · ${result.elapsed_ms} ms` : "模型暂不可用，请检查地址、模型名称与密钥。"}</p>{result.available && (result.usage_input_tokens !== null || result.usage_output_tokens !== null) && <p className="form-caption">{result.usage_input_tokens !== null ? `输入 ${result.usage_input_tokens} tokens` : ""}{result.usage_input_tokens !== null && result.usage_output_tokens !== null ? " · " : ""}{result.usage_output_tokens !== null ? `输出 ${result.usage_output_tokens} tokens` : ""}</p>}</div>}
    {error && <p role="alert">{error}</p>}
  </div>
}
