import { sendOnEnter } from "@/app/uiPreferences"
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react"
import { createPortal } from "react-dom"
import { IconClipboard, IconCopy, IconCut, IconFile, IconMoodSmile, IconPaperclip, IconPhoto, IconSelectAll, IconSendFilled, IconTrash, IconUsers, IconX } from "@tabler/icons-react"
import type { AttachmentObject, ChatMessage, Participant } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { ContextMenu, type ContextMenuItem } from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { cn } from "@/lib/utils"
import type { SendOptions } from "./useChatSession"
import { textValidationError } from "./textValidation"
import { activeMentionQuery, applyMention, collectMentionIds, splitMentions, type MentionTarget } from "./mentions"
import { caretPoint } from "./caret"
import { EMOJI_GROUPS, KAOMOJI } from "./emoji"
import { formatAttachmentSize, useAttachmentSource } from "./attachment-sources"

const MIN_COMPOSER_HEIGHT = 76
// 折叠/展开的过渡：与全局 motion token 一致，先快后慢
const HEIGHT_TRANSITION = "height var(--motion-duration-long) var(--motion-ease), min-height var(--motion-duration-long) var(--motion-ease)"
const NO_PARTICIPANTS: readonly Participant[] = []
const MENTION_ALL_NAME = "所有人"
const MAX_ATTACHMENTS = 9

type Props = {
  active?: boolean
  dataGenerationId: string | null
  disabled: boolean
  participants?: readonly Participant[]
  /** 本地用户自己：@ 列表里不该出现自己。 */
  localUserId?: string | null
  canMentionAll?: boolean
  quoteMessageId?: string | null
  quote?: ChatMessage | null
  /** 外部（例如右键头像「@某人」）请求插入的提及；nonce 变化即触发。 */
  mentionRequest?: { name: string; nonce: number } | null
  onRemoveQuote?: () => void
  onSend: (text: string, requestId: string, options: SendOptions) => Promise<unknown>
}

type FloatingAnchor = { top: number; left: number; width: number }

/** 提及列表除了名字还要头像，所以比纯逻辑层的 MentionTarget 多带一点展示信息。 */
type MentionOption = MentionTarget & { avatarId?: string | null; colorId?: string; kind: "user" | "agent" | "all" }

function AttachmentPreview({ generation, attachment, onRemove }: { generation: string | null; attachment: AttachmentObject; onRemove: () => void }) {
  const source = useAttachmentSource(generation, attachment.id, attachment.kind === "image")
  const remove = <button type="button" className="composer-attachment-remove" aria-label={`移除 ${attachment.file_name}`} onClick={onRemove}><IconX size={12} aria-hidden="true" /></button>
  // 图片只给缩略图，不再挂文件名；文件用矮的横向矩形，名字太长就在卡片里省略。
  if (attachment.kind === "image") {
    return <div className="composer-attachment" data-kind="image" title={attachment.file_name}>
      {source ? <img src={source} alt={attachment.file_name} draggable={false} /> : <span className="composer-attachment-placeholder" />}
      {remove}
    </div>
  }
  return <div className="composer-attachment" data-kind="file">
    <span className="composer-attachment-icon" aria-hidden="true"><IconFile size={16} stroke={1.6} /></span>
    <span className="composer-attachment-main">
      <span className="composer-attachment-file-name" title={attachment.file_name}>{attachment.file_name}</span>
      <span className="composer-attachment-file-size">{formatAttachmentSize(attachment.byte_size)}</span>
    </span>
    {remove}
  </div>
}

const EMOJI_TABS = [
  ...EMOJI_GROUPS.map((group) => ({ name: group.name, kaomoji: false, items: group.emojis })),
  { name: "字符", kaomoji: true, items: KAOMOJI },
]

function EmojiPanel({ id, anchor, trigger, onPick, onClose, onEscape }: {
  id: string; anchor: RefObject<HTMLFormElement | null>; trigger: RefObject<HTMLButtonElement | null>
  onPick: (emoji: string) => void; onClose: () => void; onEscape: () => void
}) {
  const [tab, setTab] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const form = anchor.current
    const node = panel.current
    if (!form || !node) return
    const position = () => {
      const box = form.getBoundingClientRect()
      node.style.left = `${Math.max(8, Math.min(box.left, window.innerWidth - node.offsetWidth - 8))}px`
      node.style.bottom = `${window.innerHeight - box.top + 8}px`
      node.style.maxHeight = `${Math.max(0, box.top - 16)}px`
    }
    position()
    if (document.activeElement === trigger.current) node.querySelector<HTMLElement>('[role="tab"]')?.focus({ preventScroll: true })
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(position)
    observer?.observe(form)
    window.addEventListener("resize", position)
    return () => { observer?.disconnect(); window.removeEventListener("resize", position) }
  }, [anchor, trigger])
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) onClose()
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      onEscape()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown) }
  }, [onClose, onEscape, trigger])

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    const count = EMOJI_TABS.length
    const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1
      : event.key === "ArrowLeft" ? (tab + count - 1) % count
      : event.key === "ArrowRight" ? (tab + 1) % count : null
    if (next === null) return
    event.preventDefault()
    setTab(next)
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus()
  }

  return createPortal(<div id={id} ref={panel} className="composer-emoji-panel" role="dialog" aria-label="选择表情">
    <div className="composer-emoji-tabs" role="tablist" aria-label="表情分类" onKeyDown={navigateTabs}>
      {EMOJI_TABS.map((item, index) => <button key={item.name} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={index === tab} aria-controls={`${id}-page-${index}`} tabIndex={index === tab ? 0 : -1} className="composer-emoji-tab" onClick={() => setTab(index)}>{item.name}</button>)}
    </div>
    <div className="composer-emoji-pages">
      {EMOJI_TABS.map((group, index) => <div key={group.name} id={`${id}-page-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} inert={index !== tab} className="composer-emoji-body" data-position={index === tab ? "current" : index < tab ? "before" : "after"}>
        <div className="composer-emoji-grid">
          {group.items.map((item, index) => <button key={`${item}-${index}`} type="button" className="composer-emoji" data-kind={group.kaomoji ? "text" : undefined} data-wide={group.kaomoji && item.length > 9 ? "" : undefined} title={group.kaomoji ? item : undefined} onClick={() => onPick(item)}>{item}</button>)}
        </div>
      </div>)}
    </div>
  </div>, document.body)
}

function MentionPanel({ anchor, items, active, generation, onPick }: { anchor: FloatingAnchor; items: readonly MentionOption[]; active: number; generation: string | null; onPick: (item: MentionTarget) => void }) {
  return createPortal(<div className="composer-mention-panel" role="listbox" aria-label="选择提及成员" style={{ position: "fixed", left: Math.min(anchor.left, window.innerWidth - 232), bottom: window.innerHeight - anchor.top + 6, width: Math.max(160, Math.min(anchor.width, 232)) }}>
    {items.map((item, index) => <button key={item.id} type="button" role="option" aria-selected={index === active} className="composer-mention-option" data-active={index === active} onMouseDown={(event) => { event.preventDefault(); onPick(item) }}>
      <span className="composer-mention-avatar" aria-hidden="true">
        {item.kind === "all"
          ? <IconUsers size={14} stroke={1.6} />
          : <Avatar name={item.name} avatarId={item.avatarId} colorId={item.colorId} generation={generation ?? undefined} size={18} radius={5} />}
      </span>
      <span className="composer-mention-name">{item.name}</span>
    </button>)}
  </div>, document.body)
}

export function MessageComposer({ active = true, dataGenerationId, disabled, participants = NO_PARTICIPANTS, localUserId = null, canMentionAll = false, quoteMessageId = null, quote = null, mentionRequest = null, onRemoveQuote, onSend }: Props) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentObject[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState<{ generation: string | null; quoteId: string | null } | null>(null)
  const [intentSource, setIntentSource] = useState({ generation: dataGenerationId, quoteId: quoteMessageId })
  const [attachmentsSource, setAttachmentsSource] = useState(dataGenerationId)
  if (attachmentsSource !== dataGenerationId) {
    // 数据根换了：旧附件已经不属于当前数据，直接丢弃。
    setAttachmentsSource(dataGenerationId)
    setAttachments([])
  }
  if (intentSource.generation !== dataGenerationId || intentSource.quoteId !== quoteMessageId) {
    setIntentSource({ generation: dataGenerationId, quoteId: quoteMessageId })
    setRetry(null)
    setError(null)
  }
  const [manualHeight, setManualHeight] = useState<number | null>(null)
  // 最大高度 = 聊天区域的一半，随窗口尺寸变化；无法测量时回退 190px。
  const [maxHeight, setMaxHeight] = useState(190)
  // 高度变化是否走过渡：拖拽时即时跟手，双击/键盘调整时启用缓动。
  const [animateHeight, setAnimateHeight] = useState(false)
  // 右键菜单用：打开前记录选区快照，菜单项启用状态据此决定，避免打开后选区被菜单夺焦清掉。
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const [caret, setCaret] = useState(0)
  const [composing, setComposing] = useState(false)
  // 只有真正的输入动作才允许呼出成员列表：点进已经 @ 好的名字里不该再弹一次。
  const [inputting, setInputting] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiPanelId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const emojiTrigger = useRef<HTMLButtonElement>(null)
  const closeEmoji = useCallback(() => setEmojiOpen(false), [])
  const [mentionAnchor, setMentionAnchor] = useState<FloatingAnchor | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const composingRef = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const highlight = useRef<HTMLDivElement>(null)
  const draftRevision = useRef(0)
  const inFlight = useRef(false)
  const currentGeneration = useRef(dataGenerationId)
  const alive = useRef(false)
  const resizeOrigin = useRef<{ y: number; height: number } | null>(null)
  const failedRequest = useRef<{ requestId: string; revision: number; generation: string | null } | null>(null)

  const mentionTargets = useMemo<MentionOption[]>(() => {
    // 自己不参与提及：@ 列表里出现「我」既没用也容易被误点。
    const targets = participants
      .filter((participant) => participant.id !== localUserId)
      .map<MentionOption>((participant) => ({
        id: participant.id,
        name: participant.display_name,
        avatarId: participant.avatar_id,
        // 智能体用 id 派生头像底色，本机用户走默认 logo，和聊天里保持一致。
        colorId: participant.kind === "agent" ? participant.id : undefined,
        kind: participant.kind,
      }))
    if (canMentionAll) targets.push({ id: "__all__", name: MENTION_ALL_NAME, kind: "all" })
    return targets
  }, [canMentionAll, localUserId, participants])
  const segments = useMemo(() => splitMentions(draft, mentionTargets), [draft, mentionTargets])
  const rich = segments.some((segment) => segment.kind === "mention")
  const limitError = draft.trim().length > 0 ? textValidationError(draft) : null
  const visibleError = error ?? limitError
  const canSend = !disabled && !sending && !uploading && (draft.trim().length > 0 || attachments.length > 0) && !limitError
  const isRetry = retry !== null && retry.generation === dataGenerationId && retry.quoteId === quoteMessageId

  const query = useMemo(() => activeMentionQuery(draft, caret), [draft, caret])
  const mentionMatches = useMemo(() => {
    if (!query) return []
    const keyword = query.query.trim().toLowerCase()
    return mentionTargets
      .filter((target) => !keyword || target.name.toLowerCase().includes(keyword))
      .slice(0, 8)
  }, [mentionTargets, query])
  const mentionOpen = mentionMatches.length > 0 && inputting && !emojiOpen

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  // 输入框最大高度取聊天区域的一半：拖到该上限即止，窗口缩放时同步更新。
  useEffect(() => {
    const textarea = input.current
    const host = textarea?.closest(".chat-conversation") ?? textarea?.closest(".chat-card")
    if (!host) return
    const measure = () => {
      const size = host.getBoundingClientRect().height
      if (size <= 0) return
      const next = Math.max(MIN_COMPOSER_HEIGHT, Math.round(size / 2))
      setMaxHeight(next)
      setManualHeight((current) => (current !== null && current > next ? next : current))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    draftRevision.current += 1
    failedRequest.current = null
    currentGeneration.current = dataGenerationId
  }, [quoteMessageId, dataGenerationId])

  useEffect(() => {
    if (!active) return
    const textarea = input.current
    if (!textarea) return
    // 只对双击/键盘这类离散调整启用过渡；拖拽跟手与文本自增高保持即时，避免滞后。
    textarea.style.transition = animateHeight ? HEIGHT_TRANSITION : "none"
    if (manualHeight !== null) {
      textarea.style.height = `${manualHeight}px`
      if (highlight.current) highlight.current.style.minHeight = `${manualHeight}px`
      return
    }
    textarea.style.height = "auto"
    const next = `${Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, textarea.scrollHeight))}px`
    textarea.style.height = next
    if (highlight.current) highlight.current.style.minHeight = next
  }, [active, draft, manualHeight, maxHeight, animateHeight])

  // 过渡结束后关闭动画标记，避免影响后续拖拽。
  useEffect(() => {
    if (!animateHeight) return
    const textarea = input.current
    if (!textarea) return
    const clear = () => setAnimateHeight(false)
    textarea.addEventListener("transitionend", clear, { once: true })
    return () => textarea.removeEventListener("transitionend", clear)
  }, [animateHeight])

  // 提及面板跟着光标走：只在打开时量一次，滚动或输入变化会重新量。
  useLayoutEffect(() => {
    const textarea = input.current
    if (!textarea || !mentionOpen || !query) { setMentionAnchor(null); return }
    const point = caretPoint(textarea, query.start)
    const box = textarea.getBoundingClientRect()
    setMentionAnchor({ top: box.top + point.top, left: box.left + Math.min(point.left, box.width - 24), width: box.width - point.left })
    setMentionIndex(0)
  }, [mentionOpen, query, draft])

  function editIntent() {
    draftRevision.current += 1
    failedRequest.current = null
    setRetry(null)
    setError(null)
  }

  function syncCaret() {
    const textarea = input.current
    if (!textarea) return
    setCaret(textarea.selectionStart)
    setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd })
  }

  /** 双击/Home：最小态展开到上限，其余折叠回最小，带动画。 */
  function resetHeight() {
    const current = input.current?.getBoundingClientRect().height ?? manualHeight ?? MIN_COMPOSER_HEIGHT
    setAnimateHeight(true)
    setManualHeight(current <= MIN_COMPOSER_HEIGHT + 1 ? maxHeight : MIN_COMPOSER_HEIGHT)
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    setAnimateHeight(false)
    const height = input.current?.getBoundingClientRect().height ?? MIN_COMPOSER_HEIGHT
    resizeOrigin.current = { y: event.clientY, height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function resize(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = resizeOrigin.current
    if (!origin) return
    setManualHeight(Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, origin.height - (event.clientY - origin.y))))
  }

  function endResize(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = resizeOrigin.current
    if (!origin) return
    const next = Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, origin.height - (event.clientY - origin.y)))
    setManualHeight(next <= MIN_COMPOSER_HEIGHT ? MIN_COMPOSER_HEIGHT : next)
    resizeOrigin.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  /** 在光标处插入文本，并把光标推到插入内容之后。 */
  const insertText = useCallback((value: string) => {
    const textarea = input.current
    const start = selection?.start ?? draft.length
    const end = selection?.end ?? draft.length
    const next = draft.slice(0, start) + value + draft.slice(end)
    const caretAfter = start + value.length
    editIntent()
    setInputting(false)
    setDraft(next)
    setCaret(caretAfter)
    setSelection({ start: caretAfter, end: caretAfter })
    requestAnimationFrame(() => {
      textarea?.focus({ preventScroll: true })
      textarea?.setSelectionRange(caretAfter, caretAfter)
    })
  }, [draft, selection])

  function pickMention(target: MentionTarget) {
    const textarea = input.current
    if (!textarea) return
    // 直接用文本框里的真实光标，不依赖可能落后一帧的 state。
    const live = activeMentionQuery(textarea.value, textarea.selectionStart)
    if (!live) return
    const applied = applyMention(textarea.value, live.start, textarea.selectionStart, target.name)
    editIntent()
    setInputting(false)
    setDraft(applied.text)
    setCaret(applied.caret)
    setSelection({ start: applied.caret, end: applied.caret })
    requestAnimationFrame(() => {
      const node = input.current
      if (!node) return
      node.focus({ preventScroll: true })
      node.setSelectionRange(applied.caret, applied.caret)
      // 段落变长后高度要跟着长，否则光标会落在可视区外。
      node.scrollTop = node.scrollHeight
    })
  }

  /** 右键头像的「@某人」：把提及追加到草稿末尾并聚焦。 */
  function appendMention(name: string) {
    const textarea = input.current
    const value = textarea?.value ?? draft
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const lead = start > 0 && !/\s/.test(value[start - 1] ?? "") ? " " : ""
    const insertion = `${lead}@${name} `
    const next = value.slice(0, start) + insertion + value.slice(end)
    const caretAfter = start + insertion.length
    editIntent()
    setInputting(false)
    setDraft(next)
    setCaret(caretAfter)
    setSelection({ start: caretAfter, end: caretAfter })
    requestAnimationFrame(() => {
      const node = input.current
      if (!node) return
      node.focus({ preventScroll: true })
      node.setSelectionRange(caretAfter, caretAfter)
      node.scrollTop = node.scrollHeight
    })
  }

  const mentionNonce = useRef(0)
  useEffect(() => {
    if (!mentionRequest || mentionRequest.nonce === mentionNonce.current) return
    mentionNonce.current = mentionRequest.nonce
    appendMention(mentionRequest.name)
    // appendMention 每次渲染都是新函数，用 nonce 保证只执行一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentionRequest])

  /** 图片与文件都走同一条上传链路；粘贴板里的 Blob 直接转 base64 过 IPC。 */
  const uploadBlobs = useCallback(async (blobs: { name: string; data: string }[]) => {
    if (!dataGenerationId || !blobs.length) return
    setUploading(true)
    setError(null)
    try {
      const uploaded: AttachmentObject[] = []
      for (const blob of blobs.slice(0, MAX_ATTACHMENTS)) {
        uploaded.push(await ipc.pasteAttachment({ data_generation_id: dataGenerationId, file_name: blob.name, data_base64: blob.data }))
      }
      if (!alive.current) return
      setAttachments((current) => [...current, ...uploaded].slice(0, MAX_ATTACHMENTS))
    } catch (cause) {
      if (alive.current) setError(errorMessage(cause))
    } finally {
      if (alive.current) setUploading(false)
    }
  }, [dataGenerationId])

  const uploadFiles = useCallback(async (files: readonly File[]) => {
    const blobs = await Promise.all(files.map(async (file) => ({
      name: file.name || "粘贴的图片.png",
      data: await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      }),
    })))
    await uploadBlobs(blobs)
  }, [uploadBlobs])

  const pickAttachments = useCallback(async (imagesOnly: boolean) => {
    if (!dataGenerationId) return
    setUploading(true)
    setError(null)
    try {
      const result = await ipc.pickAttachments({ data_generation_id: dataGenerationId, images_only: imagesOnly })
      if (!alive.current) return
      if (result.attachments.length) setAttachments((current) => [...current, ...result.attachments].slice(0, MAX_ATTACHMENTS))
    } catch (cause) {
      if (alive.current) setError(errorMessage(cause))
    } finally {
      if (alive.current) setUploading(false)
    }
  }, [dataGenerationId])

  /** 移除附件要顺手把暂存对象删掉，否则磁盘上会留下永远没人认领的文件。 */
  function removeAttachment(attachment: AttachmentObject) {
    setAttachments((current) => current.filter((item) => item.id !== attachment.id))
    if (!dataGenerationId) return
    void ipc.discardAttachments({ data_generation_id: dataGenerationId, attachment_ids: [attachment.id] }).catch(() => {})
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!active || !canSend || inFlight.current) return
    const revision = draftRevision.current
    const requestId = failedRequest.current?.revision === revision && failedRequest.current.generation === dataGenerationId
      ? failedRequest.current.requestId : crypto.randomUUID()
    const sentText = draft
    const sentAttachments = attachments
    const mentionAll = canMentionAll && sentText.includes(`@${MENTION_ALL_NAME}`)
    const mentionIds = collectMentionIds(sentText, mentionTargets.filter((target) => target.id !== "__all__"))
    const parts: SendOptions["parts"] = [
      ...sentAttachments.map((attachment) => ({ kind: "attachment" as const, attachment })),
      ...(sentText.trim() ? [{ kind: "text" as const, text: sentText }] : []),
    ]
    const options: SendOptions = { quote_message_id: quoteMessageId, mention_ids: mentionAll ? [] : mentionIds, mention_all: mentionAll, parts }
    inFlight.current = true
    setSending(true)
    setRetry(null)
    setError(null)
    try {
      await onSend(sentText, requestId, options)
      if (!alive.current) return
      failedRequest.current = null
      if (draftRevision.current === revision && currentGeneration.current === dataGenerationId) {
        draftRevision.current += 1
        setDraft("")
        setCaret(0)
        setAttachments([])
        onRemoveQuote?.()
      }
    } catch (cause) {
      if (!alive.current) return
      if (draftRevision.current === revision && currentGeneration.current === dataGenerationId) {
        failedRequest.current = { requestId, revision, generation: dataGenerationId }
        setRetry({ generation: dataGenerationId, quoteId: quoteMessageId })
      } else failedRequest.current = null
      setError(errorMessage(cause))
    } finally {
      inFlight.current = false
      if (alive.current) setSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        const delta = event.key === "ArrowDown" ? 1 : -1
        setMentionIndex((current) => (current + delta + mentionMatches.length) % mentionMatches.length)
        return
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        pickMention(mentionMatches[mentionIndex] ?? mentionMatches[0])
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        setCaret(-1)
        return
      }
    }
    if (event.key !== "Enter") return
    const enterSends = sendOnEnter()
    // Enter 发送模式下 Shift+Enter 换行；Ctrl+Enter 发送模式下 Enter 换行。
    if (enterSends ? event.shiftKey : !(event.ctrlKey || event.metaKey)) return
    if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    void submit()
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file))
    if (!files.length) return
    event.preventDefault()
    void uploadFiles(files)
  }

  const quotedText = quote?.parts.flatMap((part) => part.kind === "text" ? [part.text] : []).join("")
  const quoteName = quote ? participants.find((participant) => participant.id === quote.sender_id)?.display_name : null

  // ---- 输入框右键菜单：常规文本编辑 ----
  const selectedText = selection && selection.end > selection.start ? draft.slice(selection.start, selection.end) : ""
  const canEdit = !disabled && !sending

  function focusInput(next?: { start: number; end: number }) {
    const textarea = input.current
    if (!textarea) return
    textarea.focus({ preventScroll: true })
    if (next) textarea.setSelectionRange(next.start, next.end)
  }

  async function copySelection() {
    if (!selectedText) return
    try {
      await navigator.clipboard.writeText(selectedText)
      focusInput(selection ?? undefined)
    } catch { setError("复制失败，请重试。") }
  }

  async function cutSelection() {
    if (!selection || !selectedText) return
    try { await navigator.clipboard.writeText(selectedText) } catch { setError("剪切失败，请重试。"); return }
    editIntent()
    const next = draft.slice(0, selection.start) + draft.slice(selection.end)
    setDraft(next)
    setSelection({ start: selection.start, end: selection.start })
    requestAnimationFrame(() => focusInput({ start: selection.start, end: selection.start }))
  }

  async function pasteAtSelection() {
    const target = selection ?? { start: draft.length, end: draft.length }
    // 优先原生剪贴板：WebView2 的 navigator.clipboard.readText 需要额外授权，常被拒绝
    let text: string
    try {
      text = await ipc.readClipboardText()
    } catch (nativeError) {
      try {
        text = await navigator.clipboard.readText()
      } catch {
        setError(nativeError instanceof Error ? nativeError.message : "无法读取剪贴板，请检查系统权限。")
        return
      }
    }
    if (!text) return
    editIntent()
    const next = draft.slice(0, target.start) + text + draft.slice(target.end)
    const after = target.start + text.length
    setDraft(next)
    setSelection({ start: after, end: after })
    setCaret(after)
    requestAnimationFrame(() => focusInput({ start: after, end: after }))
  }

  function selectAll() {
    const textarea = input.current
    if (!textarea) return
    textarea.focus({ preventScroll: true })
    textarea.setSelectionRange(0, textarea.value.length)
    setSelection({ start: 0, end: textarea.value.length })
  }

  function deleteSelection() {
    if (!selection || !selectedText) return
    editIntent()
    const next = draft.slice(0, selection.start) + draft.slice(selection.end)
    setDraft(next)
    setSelection({ start: selection.start, end: selection.start })
    requestAnimationFrame(() => focusInput({ start: selection.start, end: selection.start }))
  }

  const editorMenuItems: ContextMenuItem[] = [
    { key: "copy", icon: <IconCopy size={16} aria-hidden="true" />, label: "复制", disabled: !selectedText, onSelect: () => void copySelection() },
    { key: "cut", icon: <IconCut size={16} aria-hidden="true" />, label: "剪切", disabled: !selectedText || !canEdit, onSelect: () => void cutSelection() },
    { key: "paste", icon: <IconClipboard size={16} aria-hidden="true" />, label: "粘贴", disabled: !canEdit, onSelect: () => void pasteAtSelection() },
    { key: "select-all", icon: <IconSelectAll size={16} aria-hidden="true" />, label: "全选", disabled: draft.length === 0, onSelect: selectAll },
    { key: "delete", icon: <IconTrash size={16} aria-hidden="true" />, label: "删除", variant: "destructive", disabled: !selectedText || !canEdit, onSelect: deleteSelection },
  ]

  function rememberSelection(event: React.MouseEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget
    setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd })
  }

  // 右键时若已有选区，阻止浏览器把光标移到点击处（那会清掉选区，让菜单操作失去目标）。
  function keepSelectionOnRightDown(event: React.MouseEvent<HTMLTextAreaElement>) {
    if (event.button !== 2) return
    const target = event.currentTarget
    if (target.selectionStart === target.selectionEnd) return
    event.preventDefault()
  }

  // 滚轮按「行」滚动：普通滚 1 行，按住 Ctrl 加速到 4 行。
  // 必须用原生监听且 passive: false —— React 的 onWheel 是 passive，
  // preventDefault 会被忽略，浏览器仍按默认约 3 行滚动。
  useEffect(() => {
    const textarea = input.current
    if (!textarea) return
    const onWheel = (event: WheelEvent) => {
      if (textarea.scrollHeight <= textarea.clientHeight) return
      const styles = getComputedStyle(textarea)
      const lineHeight = Number.parseFloat(styles.lineHeight) || Number.parseFloat(styles.fontSize) * 1.5 || 21
      const lines = event.ctrlKey ? 4 : 1
      event.preventDefault()
      textarea.scrollTop += Math.sign(event.deltaY) * lineHeight * lines
    }
    textarea.addEventListener("wheel", onWheel, { passive: false })
    return () => textarea.removeEventListener("wheel", onWheel)
  }, [])

  const dismissEmoji = useCallback(() => {
    closeEmoji()
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }))
  }, [closeEmoji])

  return (
    <form ref={formRef} onSubmit={(event) => void submit(event)} className="message-composer">
      <div className="composer-field">
        <div className="composer-resize-handle" role="separator" aria-orientation="horizontal" aria-label="拖动上边界调整输入框高度" tabIndex={0}
          onDoubleClick={resetHeight} onPointerDown={startResize} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize}
          onKeyDown={(event) => {
            if (event.key === "Home") { event.preventDefault(); resetHeight(); return }
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
            event.preventDefault()
            const current = manualHeight ?? input.current?.getBoundingClientRect().height ?? MIN_COMPOSER_HEIGHT
            setAnimateHeight(true)
            setManualHeight(Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, current + (event.key === "ArrowUp" ? 12 : -12))))
          }} />
        {quoteMessageId && <div className="composer-context">
          <div className="composer-quote" aria-label="引用预览">
            <span><strong>{quoteName ?? "引用"}</strong><span>{quote?.state === "visible" ? quotedText?.slice(0, 120) : "原消息不可用"}</span></span>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="取消引用" onClick={() => { editIntent(); onRemoveQuote?.(); input.current?.focus() }}><IconX size={16} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>取消引用</TooltipContent></Tooltip>
          </div>
        </div>}
        {attachments.length > 0 && <div className="composer-attachments" aria-label="待发送附件">
          {attachments.map((attachment) => <AttachmentPreview key={attachment.id} generation={dataGenerationId} attachment={attachment} onRemove={() => removeAttachment(attachment)} />)}
        </div>}
        <ContextMenu items={editorMenuItems} label="输入框编辑" preserveTriggerFocus
          // 只把焦点还给输入框，不重设范围：菜单操作已自行设好光标，用旧 state 会覆盖它
          onCloseAutoFocus={(event) => { event.preventDefault(); focusInput() }}>
          <div className={cn("composer-input-wrap", rich && "composer-input-rich", composing && "composer-input-composing")}>
            <div ref={highlight} className="composer-highlight" aria-hidden="true">
              {segments.map((segment, index) => segment.kind === "mention"
                ? <span key={index} className="composer-mention-capsule">{segment.text}</span>
                : <span key={index}>{segment.text}</span>)}
              {"\u200b"}
            </div>
            <textarea ref={input} aria-label="消息输入" placeholder={attachments.length ? "给这些附件加句话…" : "说点什么……"} value={draft} rows={3} className="composer-input"
              onChange={(event) => { editIntent(); setInputting(true); setDraft(event.target.value); setCaret(event.target.selectionStart); setSelection({ start: event.target.selectionStart, end: event.target.selectionEnd }) }}
              onSelect={syncCaret}
              onPointerDown={() => setInputting(false)}
              onClick={() => setInputting(false)}
              onScroll={(event) => { if (highlight.current) highlight.current.scrollTop = event.currentTarget.scrollTop }}
              onContextMenu={rememberSelection}
              onMouseDown={keepSelectionOnRightDown}
              onPaste={handlePaste}
              onCompositionStart={() => { composingRef.current = true; setComposing(true) }}
              onCompositionEnd={() => { composingRef.current = false; setComposing(false) }}
              onKeyDown={handleKeyDown}
              aria-invalid={Boolean(visibleError)} aria-describedby={visibleError ? "composer-error" : undefined} disabled={disabled} />
          </div>
        </ContextMenu>
        <div className="composer-actions">
          <div className="composer-tools">
            <Tooltip><TooltipTrigger asChild><Button ref={emojiTrigger} type="button" variant="ghost" size="icon" aria-label="表情" aria-haspopup="dialog" aria-expanded={active && emojiOpen} aria-controls={active && emojiOpen ? emojiPanelId : undefined} disabled={disabled}
              onMouseDown={(event) => { if (document.activeElement === input.current) event.preventDefault() }}
              onClick={() => { if (emojiOpen) dismissEmoji(); else setEmojiOpen(true) }}><IconMoodSmile size={18} stroke={1.6} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>表情</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="发送图片" disabled={disabled || uploading} onClick={() => void pickAttachments(true)}><IconPhoto size={18} stroke={1.6} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>发送图片</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="发送文件" disabled={disabled || uploading} onClick={() => void pickAttachments(false)}><IconPaperclip size={18} stroke={1.6} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>发送文件</TooltipContent></Tooltip>
            {uploading && <span className="composer-uploading" role="status">上传中…</span>}
          </div>
          <Tooltip><TooltipTrigger asChild><Button type="submit" size="icon" className="composer-send" disabled={!canSend} aria-label={isRetry ? "重试发送" : "发送消息"}><IconSendFilled size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>{isRetry ? "重试发送" : "发送"}</TooltipContent></Tooltip>
        </div>
      </div>
      {mentionOpen && mentionAnchor && <MentionPanel anchor={mentionAnchor} items={mentionMatches} active={mentionIndex} generation={dataGenerationId} onPick={pickMention} />}
      {active && emojiOpen && <EmojiPanel id={emojiPanelId} anchor={formRef} trigger={emojiTrigger} onPick={insertText} onClose={closeEmoji} onEscape={dismissEmoji} />}
      <p id="composer-error" role={visibleError ? "alert" : undefined} className="composer-error">{visibleError ?? ""}</p>
    </form>
  )
}
