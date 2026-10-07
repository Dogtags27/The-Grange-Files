import { clock } from "./hooks"
import { rankFor } from "./report"

const W = 1080
const H = 1350

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function paintMark(ctx, x, y, size) {
  ctx.strokeStyle = "#c8102e"
  ctx.lineWidth = size * 0.14
  ctx.lineCap = "square"
  ctx.beginPath()
  ctx.moveTo(x + size * 0.22, y + size * 0.22)
  ctx.lineTo(x + size * 0.78, y + size * 0.78)
  ctx.moveTo(x + size * 0.78, y + size * 0.22)
  ctx.lineTo(x + size * 0.22, y + size * 0.78)
  ctx.stroke()
}

export function drawEndCard({ result, seconds, penalty, stats }) {
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  const { culprit } = result
  const rank = rankFor(stats)

  ctx.fillStyle = "#efe4d0"
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = "#241910"
  ctx.lineWidth = 8
  ctx.strokeRect(36, 36, W - 72, H - 72)
  ctx.lineWidth = 2
  ctx.strokeRect(56, 56, W - 112, H - 112)

  ctx.fillStyle = "#c8102e"
  ctx.fillRect(96, 96, 280, 64)
  ctx.fillStyle = "#efe4d0"
  ctx.font = "700 28px Georgia, 'Times New Roman', serif"
  ctx.textAlign = "center"
  ctx.fillText("FILE CS5002-1", 236, 138)

  ctx.fillStyle = "#241910"
  ctx.textAlign = "left"
  ctx.font = "700 64px Georgia, 'Times New Roman', serif"
  ctx.fillText("Case closed", 96, 260)

  ctx.font = "28px Georgia, 'Times New Roman', serif"
  ctx.fillStyle = "rgba(36,25,16,0.72)"
  ctx.fillText("The Grange Display", 96, 310)

  paintMark(ctx, 820, 110, 160)
  ctx.strokeStyle = "#241910"
  ctx.lineWidth = 5
  roundRect(ctx, 820, 110, 160, 160, 18)
  ctx.stroke()

  ctx.fillStyle = "#241910"
  ctx.font = "700 72px Georgia, 'Times New Roman', serif"
  const name = culprit.suspect
  ctx.fillText(name, 96, 460)
  ctx.font = "36px Georgia, 'Times New Roman', serif"
  ctx.fillText("did it.", 96, 520)

  ctx.font = "30px Georgia, 'Times New Roman', serif"
  ctx.fillStyle = "rgba(36,25,16,0.85)"
  const story = [
    `At the ${culprit.location},`,
    `holding the ${culprit.item},`,
    `claiming “${String(culprit.alibi).replace(/\.$/, "")}.”`,
  ]
  story.forEach((line, i) => ctx.fillText(line, 96, 600 + i * 48))

  ctx.fillStyle = "#241910"
  ctx.fillRect(96, 780, W - 192, 3)

  ctx.font = "700 34px Georgia, 'Times New Roman', serif"
  ctx.fillText(`Rank: ${rank.title}`, 96, 850)

  const rows = [
    ["Time on the case", clock(seconds) + (penalty ? ` (+${penalty} min Elder)` : "")],
    ["Visits to the Elder", String(stats.elder)],
    ["Wrong accusations", String(stats.wrong)],
  ]
  ctx.font = "28px Georgia, 'Times New Roman', serif"
  rows.forEach(([label, value], i) => {
    const y = 920 + i * 52
    ctx.fillStyle = "rgba(36,25,16,0.65)"
    ctx.fillText(label, 96, y)
    ctx.fillStyle = "#241910"
    ctx.textAlign = "right"
    ctx.fillText(value, W - 96, y)
    ctx.textAlign = "left"
  })

  ctx.fillStyle = "rgba(36,25,16,0.55)"
  ctx.font = "24px Georgia, 'Times New Roman', serif"
  ctx.fillText("MSCS Align · CS5002 · bottle-cap badge division", 96, H - 96)

  return canvas
}

export async function shareEndCard(data) {
  const canvas = drawEndCard(data)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) return "no"
  const file = new File([blob], "grange-case-closed.png", { type: "image/png" })
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try {
      await navigator.share({
        files: [file],
        title: "The Grange Files",
        text: `${data.result.culprit.suspect} did it. Rank: ${rankFor(data.stats).title}`,
      })
      return "shared"
    } catch (error) {
      if (error?.name === "AbortError") return "cancel"
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "grange-case-closed.png"
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return "saved"
}
