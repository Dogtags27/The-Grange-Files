const PENCIL = "/audio/pencil-scratch.mp3"
const ELDER = "/audio/elder-laugh.mp3"
const ACCUSE = "/audio/accuse-sting.mp3"

const CLIPS = {
  cross: { url: PENCIL, offset: 5.68, dur: 0.18, gain: 12, rate: 1.05 },
  tick: { url: PENCIL, offset: 7.84, dur: 0.16, gain: 14, rate: 0.92 },
  clear: { url: PENCIL, offset: 8.08, dur: 0.26, gain: 12, rate: 0.78 },
  pencil: { url: PENCIL, offset: 5.76, dur: 0.14, gain: 11, rate: 1.15 },
  block: { url: PENCIL, offset: 8.24, dur: 0.1, gain: 9, rate: 0.7 },
  elder: { url: ELDER, offset: 3.4, dur: 1.25, gain: 0.4, rate: 0.92 },
  accuse: { url: ACCUSE, offset: 0, dur: 1.9, gain: 0.62, rate: 1 },
}

let ctx
let pending

function context() {
  if (ctx) return ctx
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  ctx = new AudioContext()
  return ctx
}

function load() {
  const audio = context()
  if (!audio) return Promise.resolve({})
  if (!pending) {
    const urls = [...new Set(Object.values(CLIPS).map((clip) => clip.url))]
    pending = Promise.all(
      urls.map(async (url) => {
        const res = await fetch(url)
        return [url, await audio.decodeAudioData(await res.arrayBuffer())]
      }),
    ).then((pairs) => Object.fromEntries(pairs))
  }
  return pending
}

export function warmSfx() {
  load().catch(() => {})
}

function playClip(name) {
  const clip = CLIPS[name]
  const audio = context()
  if (!clip || !audio) return
  audio.resume().catch(() => {})
  load()
    .then((buffers) => {
      const buffer = buffers[clip.url]
      if (!buffer) return
      const length = Math.min(clip.dur, Math.max(0.04, buffer.duration - 0.02))
      const offset = Math.min(clip.offset, Math.max(0, buffer.duration - length))
      const src = audio.createBufferSource()
      src.buffer = buffer
      src.playbackRate.value = clip.rate
      const gain = audio.createGain()
      const now = audio.currentTime
      const end = now + length / clip.rate
      const hold = Math.max(now + 0.02, end - 0.03)
      gain.gain.setValueAtTime(clip.gain, now)
      gain.gain.setValueAtTime(clip.gain, hold)
      gain.gain.linearRampToValueAtTime(0.0001, end)
      src.connect(gain).connect(audio.destination)
      src.start(now, offset, length)
      src.stop(end + 0.03)
    })
    .catch(() => {})
}

export function playSheetClick(before, after, blocked) {
  if (blocked) playClip("block")
  else if (after === "yes") playClip("tick")
  else if (before === "yes") playClip("clear")
  else if (after === "no") playClip("cross")
}

export function playPencil() {
  playClip("pencil")
}

export function playElder() {
  playClip("elder")
}

export function playAccuse() {
  playClip("accuse")
}
