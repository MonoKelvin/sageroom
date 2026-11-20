import { useState } from "react"

export function usePageActivation(active: boolean, generation: string | null) {
  const [activatedGeneration, setActivatedGeneration] = useState(active ? generation : null)
  if (active && generation && activatedGeneration !== generation) setActivatedGeneration(generation)
  return Boolean(generation && activatedGeneration === generation)
}
