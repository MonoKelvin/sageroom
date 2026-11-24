/**
 * 全局阻止「拖入文件」的默认行为。
 *
 * 关闭 Tauri 的 dragDropEnabled 是为了让前端能使用 HTML5 拖放
 * （文本拖拽移动/插入）。副作用是把窗口变成普通浏览器：
 * 拖入文件时 WebView2 可能直接导航到该文件，覆盖当前界面。
 * 这里只拦文件拖放，文本拖拽完全不受影响。
 * 返回的函数用于移除监听（主要给测试用）。
 */
export function suppressFileDrop(target: Window = window): () => void {
  const isFileDrag = (event: DragEvent) =>
    Boolean(event.dataTransfer && Array.from(event.dataTransfer.types).includes("Files"))

  const onDragOver = (event: DragEvent) => {
    if (isFileDrag(event)) event.preventDefault()
  }
  const onDrop = (event: DragEvent) => {
    if (isFileDrag(event)) event.preventDefault()
  }

  target.addEventListener("dragover", onDragOver)
  target.addEventListener("drop", onDrop)
  return () => {
    target.removeEventListener("dragover", onDragOver)
    target.removeEventListener("drop", onDrop)
  }
}
