/**
 * 全局屏蔽 WebView2 / 浏览器自带的右键菜单。
 * 软件内任何位置的右键交互统一由应用内自定义菜单承接，不再弹出原生菜单。
 * 返回的函数用于移除监听（主要给测试用）。
 */
export function suppressNativeContextMenu(target: Window = window): () => void {
  const handler = (event: Event) => {
    // 应用内自定义右键菜单的触发元素（带 data-app-context-menu）自己接管右键：
    // 由 ContextMenu 组件负责 preventDefault 并弹出应用内菜单，这里不再拦截。
    const eventTarget = event.target
    if (eventTarget instanceof Element && eventTarget.closest("[data-app-context-menu]")) return
    event.preventDefault()
  }
  target.addEventListener("contextmenu", handler, { capture: true })
  return () => { target.removeEventListener("contextmenu", handler, { capture: true }) }
}
