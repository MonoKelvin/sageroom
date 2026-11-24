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
      <div className="titlebar-identity" />
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
