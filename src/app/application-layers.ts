export function applicationLayerContainer(): HTMLElement | undefined {
  return document.getElementById("application-layers") ?? undefined
}

export function applicationFrame(): HTMLElement | undefined {
  return applicationLayerContainer()?.closest<HTMLElement>(".canvas") ?? undefined
}

export function applicationBounds() {
  return applicationFrame()?.getBoundingClientRect() ?? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight }
}
