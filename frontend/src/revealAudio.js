import { hushIntroBed, releaseIntroBed } from "./introBed"

const CROWD = "/audio/reveal-crowd.mp3"
const SHOCK = "/audio/verdict-shock.mp3"
const CHUCKLE = "/audio/verdict-chuckle-mix.mp3"

let graph
let announced = false

function ramp(gain, to, seconds) {
  const now = gain.context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(Math.max(0, to), now + seconds)
}

function chain(ctx, url, { loop, lowpass, rate }) {
  const el = new Audio(url)
  el.loop = loop
  el.preload = "auto"
  el.playbackRate = rate
  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = lowpass
  const gain = ctx.createGain()
  gain.gain.value = 0
  ctx.createMediaElementSource(el).connect(filter).connect(gain).connect(ctx.destination)
  return { el, gain }
}

function bed() {
  if (graph) return graph
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  const ctx = new AudioContext()
  graph = {
    ctx,
    crowd: chain(ctx, CROWD, { loop: true, lowpass: 9000, rate: 1 }),
    shock: chain(ctx, SHOCK, { loop: false, lowpass: 14000, rate: 1 }),
    chuckle: chain(ctx, CHUCKLE, { loop: false, lowpass: 14000, rate: 1 }),
  }
  return graph
}

function fadeVoice(node) {
  ramp(node.gain, 0, 0.45)
  window.setTimeout(() => node.el.pause(), 500)
}

export function beginReveal() {
  const audio = bed()
  if (!audio) return
  announced = false
  hushIntroBed()
  audio.ctx.resume().catch(() => {})
  audio.crowd.el.currentTime = 0
  audio.crowd.el.play().then(() => ramp(audio.crowd.gain, 0.34, 1.1)).catch(() => {})
}

export function announceVerdict(kind) {
  const audio = bed()
  if (!audio || announced) return
  announced = true
  releaseIntroBed()
  ramp(audio.crowd.gain, 0, 0.4)
  window.setTimeout(() => audio.crowd.el.pause(), 450)
  const voice = kind === "guilty" ? audio.shock : audio.chuckle
  const level = kind === "guilty" ? 0.9 : 0.72
  voice.el.currentTime = 0
  voice.el.play().then(() => ramp(voice.gain, level, 0.12)).catch(() => {})
  const hold = kind === "guilty" ? 5200 : 3200
  window.setTimeout(() => fadeVoice(voice), hold)
}

export function leaveReveal() {
  const audio = graph
  if (!audio) return
  ramp(audio.crowd.gain, 0, 0.35)
  window.setTimeout(() => audio.crowd.el.pause(), 400)
  if (announced) return
  fadeVoice(audio.shock)
  fadeVoice(audio.chuckle)
  releaseIntroBed()
}

export function finishReveal() {
  const audio = graph
  announced = false
  if (audio) {
    ramp(audio.crowd.gain, 0, 0.35)
    fadeVoice(audio.shock)
    fadeVoice(audio.chuckle)
    window.setTimeout(() => audio.crowd.el.pause(), 400)
  }
  releaseIntroBed()
}
