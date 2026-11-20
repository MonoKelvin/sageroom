import { useEffect, useRef, useState } from "react"
import { IconKey, IconPlugConnected } from "@tabler/icons-react"
import type { ModelProfile, ModelTestResult } from "@/contracts/generated"
import { useConfiguration } from "@/app/configurationContext"
import { modelIsComplete } from "@/app/configurationStore"
import { errorMessage, IpcError } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { Field } from "./ConfigurationFields"

export function ModelCredentials({ profile, disabled = false, active = true }: { profile: ModelProfile; disabled?: boolean; active?: boolean }) {
  const store = useConfiguration()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<ModelTestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const alive = useRef(false)
  const busy = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const unavailable = disabled || !modelIsComplete(profile)

  async function operation(kind: "set" | "delete" | "test", secret?: string) {
    if (busy.current || disabled || (kind !== "delete" && !modelIsComplete(profile)) || (kind === "set" && !secret?.trim())) return
    busy.current = true
    setPending(true)
    setError(null)
    setMessage(null)
    setResult(null)
    setConfirmDelete(false)
    try {
      if (kind === "test") {
        const tested = await store.testModel(profile.id)
        if (alive.current) setResult(tested)
      } else {
        if (kind === "set") await store.setSecret(profile.id, secret!)
        else await store.deleteSecret(profile.id)
        if (alive.current) setMessage(kind === "set" ? "密钥已应用到系统凭据库，输入已清空。" : "密钥已从当前预设解绑；历史引用仍保留。")
      }
    } catch (cause) {
      const detail = cause instanceof IpcError ? cause.detail : null
      const safe = detail ? errorMessage(cause) : "操作未完成，请重试。"
      if (alive.current) setError(`${safe}${kind === "set" ? " 密钥输入已清空。" : ""}${detail?.may_have_been_charged ? " 本次请求可能已计费，重试可能再次计费。" : ""}`)
      if (kind === "set") throw new Error("凭据未能应用，请重新输入后重试。", { cause })
    } finally { busy.current = false; if (alive.current) setPending(false) }
  }

  return <div className="config-stack">
    <p className="form-caption"><IconKey size={15} className="inline" aria-hidden="true" /> {profile.credential_configured ? "已配置系统密钥" : "未配置系统密钥"}</p>
    <Field label="API Key" caption={unavailable ? "请先完成模型地址与标识，再配置密钥或测试。" : "离开输入框即应用；只写入系统凭据库，不读回、不回显、不随预设复制。"}><EditableInput label="API Key" active={active} type="password" value="" resetOnApply autoComplete="new-password" spellCheck={false} disabled={pending || unavailable} onApply={async (secret) => { await operation("set", secret) }} /></Field>
    <div className="config-actions"><Button variant="ghost" size="sm" disabled={pending || disabled || !profile.credential_configured} onClick={() => setConfirmDelete(true)}>移除密钥</Button><Button size="sm" disabled={pending || unavailable} onClick={() => void operation("test")}><IconPlugConnected size={16} aria-hidden="true" />{pending ? "处理中…" : "测试连接"}</Button></div>
    <p className="form-caption">仅点击测试才会调用模型服务，可能产生少量费用；成功不代表智能体已启动。</p>
    {confirmDelete && <div className="config-notice"><p>移除这份模型预设的系统密钥？</p><div className="config-actions"><Button size="sm" disabled={pending || disabled} onClick={() => void operation("delete")}>确认移除</Button><Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>保留密钥</Button></div></div>}
    {message && <p className="config-operation-status" role="status">{message}</p>}
    {result && <div className="config-operation-status" role="status"><p>{result.available ? `连接可用 · ${result.elapsed_ms} ms` : "模型暂不可用，请检查地址、模型标识与密钥。"}</p>{result.available && (result.usage_input_tokens !== null || result.usage_output_tokens !== null) && <p className="form-caption">{result.usage_input_tokens !== null ? `输入 ${result.usage_input_tokens} tokens` : ""}{result.usage_input_tokens !== null && result.usage_output_tokens !== null ? " · " : ""}{result.usage_output_tokens !== null ? `输出 ${result.usage_output_tokens} tokens` : ""}</p>}</div>}
    {error && <p role="alert">{error}</p>}
  </div>
}
