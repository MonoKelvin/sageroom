import { useEffect } from "react"
import type { Appearance } from "@/contracts/generated"

export function useAppearance(appearance: Appearance | undefined) {
  const theme = appearance?.theme ?? "system"
  const reduced = appearance?.reduce_motion ?? false
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches))
      document.documentElement.dataset.reducedMotion = String(reduced)
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme, reduced])
}
