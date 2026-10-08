const THEME = "/audio/opening-theme.mp3"
const WIND = "/audio/interior-wind.mp3"
const CREAKS = ["/audio/floorboard-creak.mp3", "/audio/floorboard-creak-soft.mp3"]

const THEME_ROOM = 0.38
const THEME_UNDER = 0.16
const THEME_SOLVE = 0.065
const THEME_REVEAL = 0.3
const THEME_REVEAL_RATE = 1.28
const WIND_LEVEL = 0.42

const STEPS = [
  { at: 0.2, file: 0, rate: 0.92, level: 0.48 },
  { at: 1.15, file: 1, rate: 1.06, level: 0.32 },
  { at: 2.15, file: 0, rate: 1.0, level: 0.42 },
  { at: 3.35, file: 1, rate: 0.88, level: 0.36 },
  { at: 4.5, file: 0, rate: 1.1, level: 0.28 },
  { at: 5.65, file: 1, rate: 0.96, level: 0.44 },
  { at: 6.9, file: 0, rate: 0.9, level: 0.34 },
  { at: 8.15, file: 1, rate: 1.04, level: 0.38 },
  { at: 9.2, file: 0, rate: 0.94, level: 0.24 },
]

function ramp(gain, to, seconds) {
  const now = gain.context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(Math.max(0, to), now + seconds)
}

function silenceSources(sources) {
  sources.forEach((src) => {
    try {
      src.stop()
    } catch {
      return
    }
  })
}

export function createIntroBed() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return { enterRoom() {}, approach() {}, hold() {}, duck() {}, lift() {}, hush() {}, release() {}, stop() {} }

  const ctx = new AudioContext()
  const theme = new Audio(THEME)
  const wind = new Audio(WIND)
  theme.loop = true
  theme.preload = "auto"
  wind.loop = true
  wind.preload = "none"

  const themeGain = ctx.createGain()
  const windGain = ctx.createGain()
  const creakGain = ctx.createGain()
  themeGain.gain.value = 0
  windGain.gain.value = 0
  creakGain.gain.value = 1
  themeGain.connect(ctx.destination)
  windGain.connect(ctx.destination)
  creakGain.connect(ctx.destination)
  ctx.createMediaElementSource(theme).connect(themeGain)
  ctx.createMediaElementSource(wind).connect(windGain)

  let mode = "idle"
  let approachAt = 0
  let creakBuffers = null
  let sources = []
  let unlock = null

  function dropUnlock() {
    if (!unlock) return
    window.removeEventListener("pointerdown", unlock, true)
    window.removeEventListener("keydown", unlock, true)
    unlock = null
  }

  function armUnlock() {
    if (unlock) return
    unlock = () => {
      ctx.resume()
      if (mode !== "gone" && theme.paused) theme.play().catch(() => {})
    }
    window.addEventListener("pointerdown", unlock, true)
    window.addEventListener("keydown", unlock, true)
  }

  function loadCreaks() {
    if (!creakBuffers) {
      creakBuffers = Promise.all(
        CREAKS.map(async (url) => {
          const res = await fetch(url)
          return ctx.decodeAudioData(await res.arrayBuffer())
        }),
      )
    }
    return creakBuffers
  }

  function playSteps(buffers) {
    if (mode !== "desk") return
    const elapsed = ctx.currentTime - approachAt
    sources.forEach((src) => {
      try {
        src.stop()
      } catch {
        return
      }
    })
    sources = []
    for (const step of STEPS) {
      const delay = step.at - elapsed
      if (delay < -0.08) continue
      const src = ctx.createBufferSource()
      src.buffer = buffers[step.file]
      src.playbackRate.value = step.rate
      const gain = ctx.createGain()
      gain.gain.value = step.level
      src.connect(gain).connect(creakGain)
      src.start(ctx.currentTime + Math.max(0, delay))
      sources.push(src)
    }
  }

  const bed = {
    enterRoom() {
      if (mode !== "idle") return
      mode = "room"
      armUnlock()
      loadCreaks().catch(() => {})
      ctx.resume().catch(() => {})
      theme.currentTime = 0
      theme.play().then(() => {
        if (mode === "room") ramp(themeGain, THEME_ROOM, 1.6)
      }).catch(() => {})
    },
    approach() {
      if (mode === "desk" || mode === "gone") return
      const fresh = mode !== "room"
      mode = "desk"
      dropUnlock()
      approachAt = ctx.currentTime
      ctx.resume().catch(() => {})
      if (theme.paused) {
        theme.play().catch(() => {})
        themeGain.gain.value = fresh ? THEME_UNDER : themeGain.gain.value
      }
      ramp(themeGain, THEME_UNDER, fresh ? 0.4 : 2.8)
      wind.currentTime = 0
      windGain.gain.value = 0
      wind.play().then(() => {
        if (mode === "desk") ramp(windGain, WIND_LEVEL, 1.5)
      }).catch(() => {})
      loadCreaks().then(playSteps).catch(() => {})
    },
    duck() {
      if (mode === "gone" || mode === "solving") return
      const fromIdle = mode === "idle"
      mode = "solving"
      armUnlock()
      ctx.resume().catch(() => {})
      ramp(windGain, 0, 0.45)
      ramp(creakGain, 0, 0.35)
      if (fromIdle || theme.paused) {
        theme.play().then(() => {
          if (mode === "solving") ramp(themeGain, THEME_SOLVE, 1.1)
        }).catch(() => {})
        return
      }
      ramp(themeGain, THEME_SOLVE, 0.9)
    },
    lift() {
      if (mode !== "solving" && mode !== "hushed" && mode !== "reveal") return
      theme.playbackRate = 1
      mode = "holding"
      if (theme.paused) theme.play().catch(() => {})
      ramp(themeGain, THEME_ROOM, 0.8)
    },
    hush() {
      if (mode === "gone" || mode === "reveal") return
      mode = "reveal"
      theme.playbackRate = THEME_REVEAL_RATE
      armUnlock()
      ctx.resume().catch(() => {})
      if (theme.paused) {
        theme.play().then(() => {
          if (mode === "reveal") ramp(themeGain, THEME_REVEAL, 0.8)
        }).catch(() => {})
        return
      }
      ramp(themeGain, THEME_REVEAL, 0.6)
    },
    release() {
      if (mode !== "hushed" && mode !== "reveal") return
      theme.playbackRate = 1
      mode = "solving"
      ramp(themeGain, THEME_SOLVE, 0.8)
    },
    hold() {
      if (mode === "gone" || mode === "holding") return
      if (mode === "idle") {
        bed.enterRoom()
        return
      }
      if (mode === "room") return
      mode = "holding"
      ramp(themeGain, THEME_ROOM, 1.6)
      ramp(windGain, 0, 1.6)
      ramp(creakGain, 0, 1.1)
      window.setTimeout(() => {
        if (mode !== "holding") return
        wind.pause()
        silenceSources(sources)
        sources = []
        creakGain.gain.value = 1
      }, 1700)
    },
    stop() {
      if (mode === "gone") return
      const seconds = mode === "idle" ? 0 : 0.55
      mode = "gone"
      dropUnlock()
      ramp(themeGain, 0, seconds)
      ramp(windGain, 0, seconds)
      ramp(creakGain, 0, seconds)
      window.setTimeout(() => {
        theme.pause()
        wind.pause()
        silenceSources(sources)
        sources = []
        ctx.close().catch(() => {})
      }, seconds * 1000 + 80)
    },
  }
  return bed
}

let active = null

export function introBed() {
  if (!active) active = createIntroBed()
  return active
}

export function duckIntroBed() {
  introBed().duck()
}

export function liftIntroBed() {
  if (!active) return
  active.lift()
}

export function hushIntroBed() {
  introBed().hush()
}

export function releaseIntroBed() {
  introBed().release()
}

export function stopIntroBed() {
  if (!active) return
  const current = active
  active = null
  current.stop()
}
