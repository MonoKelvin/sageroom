import type { MouseEvent } from "react"
import { IconMinus, IconSquare, IconSquares, IconX } from "@tabler/icons-react"
import type { WindowAction } from "./useWindowState"

export function Titlebar({ maximized, onAction }: { maximized: boolean; onAction: (action: WindowAction) => Promise<void> }) {
  function isControl(event: MouseEvent<HTMLElement>) {
    return event.target instanceof Element && Boolean(event.target.closest("button, a, input, [data-no-drag]"))
  }

  function drag(event: MouseEvent<HTMLElement>) {
    if (event.button === 0 && event.detail < 2 && !isControl(event)) void onAction("drag")
  }

  return (
    <header className="application-titlebar" onMouseDown={drag} onDoubleClick={(event) => { if (!isControl(event)) void onAction("maximize") }}>
      <div className="titlebar-identity">
        <svg className="titlebar-mark" viewBox="0 0 28 28" aria-hidden="true">
          <rect x="1" y="1" width="26" height="26" rx="8" fill="currentColor" />
          <path d="M8 9h12v8a3 3 0 0 1-3 3h-5l-3 2v-2H8V9Z" fill="var(--primary-foreground)" />
          <path d="M11 12h6M11 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="titlebar-wordmark">Sageroom</span>
      </div>
      <div className="titlebar-controls">
        <button type="button" className="titlebar-control" aria-label="最小化窗口" title="最小化" onClick={() => void onAction("minimize")}>
          <IconMinus size={17} stroke={1.5} aria-hidden="true" />
        </button>
        <button type="button" className="titlebar-control" aria-label={maximized ? "还原窗口" : "最大化窗口"} title={maximized ? "还原" : "最大化"} onClick={() => void onAction("maximize")}>
          {maximized ? <IconSquares size={17} stroke={1.5} aria-hidden="true" /> : <IconSquare size={16} stroke={1.5} aria-hidden="true" />}
        </button>
        <button type="button" className="titlebar-control titlebar-control-close" aria-label="关闭到托盘" title="关闭到托盘" onClick={() => void onAction("close")}>
          <IconX size={18} stroke={1.5} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
