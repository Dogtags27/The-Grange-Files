export const CARD_W = 360
export const CARD_H = 500

const INK = "#241910"
const PAPER = "#efe4d0"
const WALL = "#cdbfa3"
const HUSKY = "#c8102e"
const SERIF = '"Fraunces Variable", Georgia, serif'

const rulers = [
  { label: `6'0"`, y: 118 },
  { label: `5'6"`, y: 188 },
  { label: `5'0"`, y: 258 },
]

export function drawMugshot(canvas, { name, no, voters = "", image = null }) {
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, CARD_W, CARD_H)
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 5
  ctx.strokeRect(8, 8, CARD_W - 16, CARD_H - 16)

  ctx.fillStyle = INK
  ctx.textBaseline = "middle"
  ctx.font = `700 21px ${SERIF}`
  ctx.textAlign = "left"
  ctx.fillText("THE GRANGE", 30, 38)
  ctx.textAlign = "right"
  ctx.fillText(`No. ${no}`, CARD_W - 30, 38)

  const px = 28
  const py = 62
  const pw = CARD_W - 56
  const ph = 326
  ctx.fillStyle = WALL
  ctx.fillRect(px, py, pw, ph)
  ctx.save()
  ctx.beginPath()
  ctx.rect(px, py, pw, ph)
  ctx.clip()

  ctx.strokeStyle = "rgba(36,25,16,0.45)"
  ctx.fillStyle = "rgba(36,25,16,0.7)"
  ctx.lineWidth = 2
  ctx.font = `600 15px ${SERIF}`
  ctx.textAlign = "left"
  for (const mark of rulers) {
    ctx.beginPath()
    ctx.moveTo(px, mark.y)
    ctx.lineTo(px + pw, mark.y)
    ctx.stroke()
    ctx.fillText(mark.label, px + 8, mark.y - 10)
  }

  if (image && image.naturalWidth) {
    const w = pw * 1.02
    const h = (image.naturalHeight / image.naturalWidth) * w
    ctx.drawImage(image, px + (pw - w) / 2, py + ph - h + 6, w, h)
  }
  ctx.restore()
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.strokeRect(px, py, pw, ph)

  ctx.fillStyle = INK
  ctx.fillRect(px, 396, pw, 80)
  ctx.fillStyle = PAPER
  ctx.textAlign = "center"
  ctx.font = `700 44px ${SERIF}`
  ctx.fillText(name.toUpperCase(), CARD_W / 2, voters ? 424 : 436)
  if (voters) {
    ctx.font = `600 20px ${SERIF}`
    ctx.fillStyle = "rgba(239,228,208,0.78)"
    ctx.fillText(voters.length > 26 ? `${voters.slice(0, 25)}â€¦` : voters, CARD_W / 2, 458)
  }
}

export function drawMarker(canvas, progress) {
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h * 0.375
  const rx = w * 0.44
  const ry = h * 0.4
  const turns = 1.12 * Math.min(1, Math.max(0, progress))
  const steps = Math.max(2, Math.floor(120 * turns))
  ctx.strokeStyle = HUSKY
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = w * 0.032
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = (i / 120) * Math.PI * 2 - Math.PI * 0.65
    const wobble = 1 + 0.035 * Math.sin(t * 3 + 0.8) + (i / 120) * 0.05
    const x = cx + Math.cos(t) * rx * wobble
    const y = cy + Math.sin(t) * ry * wobble
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}
