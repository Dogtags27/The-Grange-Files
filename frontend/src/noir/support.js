let cached

export function canUse3d() {
  if (cached !== undefined) return cached
  try {
    if (typeof window === "undefined") return (cached = false)
    if (navigator.connection?.saveData) return (cached = false)
    const probe = document.createElement("canvas")
    cached = Boolean(probe.getContext("webgl2") || probe.getContext("webgl"))
  } catch {
    cached = false
  }
  return cached
}

export function prefersStill() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
