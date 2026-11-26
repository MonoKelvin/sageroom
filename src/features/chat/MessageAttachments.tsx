import { IconFile, IconPaperclip } from "@tabler/icons-react"
import type { AttachmentObject } from "@/contracts/generated"
import { cn } from "@/lib/utils"
import { formatAttachmentSize, openAttachment, useAttachmentSource } from "./attachment-sources"

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".")
  return index > 0 && index < name.length - 1 ? name.slice(index + 1).toUpperCase().slice(0, 4) : "FILE"
}

function AttachmentImage({ generation, attachment }: { generation: string | null; attachment: AttachmentObject }) {
  const source = useAttachmentSource(generation, attachment.id)
  // 先按原始宽高占位，图片到位时不会把整个列表顶上去。
  const ratio = attachment.width && attachment.height ? `${attachment.width} / ${attachment.height}` : undefined
  return <button
    type="button"
    className={cn("chat-attachment-image", !source && "chat-attachment-image-loading")}
    style={{ aspectRatio: source ? undefined : ratio }}
    aria-label={`查看图片 ${attachment.file_name}`}
    onClick={() => void openAttachment(generation, attachment)}
  >
    {source ? <img src={source} alt={attachment.file_name} loading="lazy" draggable={false} /> : <span className="chat-attachment-placeholder" />}
  </button>
}

function AttachmentFile({ generation, attachment }: { generation: string | null; attachment: AttachmentObject }) {
  return <button type="button" className="chat-attachment-file" aria-label={`打开文件 ${attachment.file_name}`} onClick={() => void openAttachment(generation, attachment)}>
    <span className="chat-attachment-file-icon" aria-hidden="true"><IconFile size={18} stroke={1.6} /></span>
    <span className="chat-attachment-file-main">
      <span className="chat-attachment-file-name">{attachment.file_name}</span>
      <span className="chat-attachment-file-meta">{extensionOf(attachment.file_name)} · {formatAttachmentSize(attachment.byte_size)}</span>
    </span>
    <span className="chat-attachment-file-action" aria-hidden="true"><IconPaperclip size={15} stroke={1.6} /></span>
  </button>
}

/** 一条消息里的附件区：图片按九宫格排，其他类型按文件卡片竖排。 */
export function MessageAttachments({ generation, attachments }: { generation: string | null; attachments: readonly AttachmentObject[] }) {
  if (!attachments.length) return null
  const images = attachments.filter((attachment) => attachment.kind === "image")
  const files = attachments.filter((attachment) => attachment.kind !== "image")
  return <div className="chat-attachments">
    {images.length > 0 && <div className="chat-attachment-grid" data-count={Math.min(images.length, 9)}>
      {images.map((attachment) => <AttachmentImage key={attachment.id} generation={generation} attachment={attachment} />)}
    </div>}
    {files.map((attachment) => <AttachmentFile key={attachment.id} generation={generation} attachment={attachment} />)}
  </div>
}
