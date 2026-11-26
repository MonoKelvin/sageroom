/** 把光标在 textarea 里的第 index 个字符位置换算成相对文本框左上角的坐标。 */
export function caretPoint(textarea: HTMLTextAreaElement, index: number): { top: number; left: number } {
  const styles = getComputedStyle(textarea)
  const mirror = document.createElement("div")
  const properties = [
    "box-sizing", "width", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
    "font-family", "font-size", "font-weight", "font-style", "letter-spacing", "line-height",
    "text-transform", "word-spacing", "text-indent",
  ]
  for (const property of properties) mirror.style.setProperty(property, styles.getPropertyValue(property))
  mirror.style.position = "absolute"
  mirror.style.top = "0"
  mirror.style.left = "0"
  mirror.style.visibility = "hidden"
  mirror.style.whiteSpace = "pre-wrap"
  mirror.style.overflowWrap = "anywhere"
  mirror.textContent = textarea.value.slice(0, index)
  const marker = document.createElement("span")
  marker.textContent = "\u200b"
  mirror.appendChild(marker)
  document.body.appendChild(mirror)
  const top = marker.offsetTop
  const left = marker.offsetLeft
  mirror.remove()

  const lineHeight = Number.parseFloat(styles.lineHeight) || Number.parseFloat(styles.fontSize) * 1.5 || 20
  const visible = top - textarea.scrollTop
  return {
    // 滚出可视区时贴到底部，避免面板飘到输入框外面。
    top: Math.min(visible, Math.max(0, textarea.clientHeight - lineHeight)),
    left,
  }
}
