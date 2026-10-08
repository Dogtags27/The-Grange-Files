import { ranks, reportJokes } from "./content"
import { clock } from "./hooks"

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }
const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ENTITIES[char])
const label = (value) => (value.startsWith("I was") ? `"${value.replace(/\.$/, "")}"` : value)

export const emptyStats = {
  elder: 0,
  wrong: 0,
  clicks: 0,
  crosses: 0,
  ticks: 0,
  clears: 0,
  undos: 0,
  redos: 0,
  blocked: 0,
  notes: 0,
  nudges: 0,
  refused: 0,
}

export const rankFor = (stats) => ranks.find((rank) => rank.test(stats))

export function describeCell(puzzle, key) {
  const [gridId, r, c] = key.split(":")
  const grid = puzzle.bands.flatMap((band) => band.grids).find((item) => item.id === gridId)
  return `${label(grid.rowValues[r])} with ${label(grid.colValues[c])}`
}

export function textReport({ result, seconds, penalty, stats }) {
  const { culprit } = result
  const rank = rankFor(stats)
  const rule = "=".repeat(44)
  return [
    "THE GRANGE DISPLAY CASE  |  File CS5002-1",
    rule,
    `CASE CLOSED. Rank earned: ${rank.title}`,
    "",
    `Culprit: ${culprit.suspect}, at the ${culprit.location}, holding the ${culprit.item}.`,
    `Alibi: ${label(culprit.alibi)} (Mayor Lewis was not convinced.)`,
    "",
    `Time on the case: ${clock(seconds)}${penalty ? ` (includes ${penalty} min of Elder fees)` : ""}`,
    `Visits to the Elder: ${stats.elder}`,
    `Wrong accusations: ${stats.wrong}`,
    `Ticks placed: ${stats.ticks} | Crosses: ${stats.crosses} | Undos: ${stats.undos}`,
    "",
    rank.joke,
    rule,
    "Northeastern MSCS Align, CS5002. Built by friends, saved by nobody.",
  ].join("\n")
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.style.cssText = "position:fixed;opacity:0"
    document.body.append(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

function blockMarkup(grid, cells) {
  const out = []
  grid.rowValues.forEach((_, r) =>
    grid.colValues.forEach((__, c) => {
      const mark = cells[`${grid.id}:${r}:${c}`]?.mark
      const glyph = mark === "yes" ? "&#10003;" : mark === "no" ? "&times;" : ""
      out.push(`<i class="c ${mark ?? ""}">${glyph}</i>`)
    }),
  )
  return `<div class="blk">${out.join("")}</div>`
}

function sheetMarkup(puzzle, cells) {
  const head = puzzle.columns
    .map(
      (column) =>
        `<div class="ch"><p>${esc(column.name)}</p><div class="vl">${column.values
          .map((value) => `<span>${esc(value)}</span>`)
          .join("")}</div></div>`,
    )
    .join("")
  const bands = puzzle.bands
    .map((band) => {
      const names = band.row.values.map((value) => `<span>${esc(value)}</span>`).join("")
      const blocks = [0, 1, 2]
        .map((index) => {
          const grid = band.grids.find((item) => item.colIndex === index)
          return grid ? blockMarkup(grid, cells) : "<div></div>"
        })
        .join("")
      return `<p class="bt">${esc(band.row.name)}</p><div class="rl">${names}</div>${blocks}`
    })
    .join("")
  return `<div class="sheet"><div></div>${head}${bands}</div>`
}

function cluesMarkup(puzzle) {
  return `<ol class="clues">${puzzle.clues.map((clue) => `<li>${esc(clue)}</li>`).join("")}</ol>`
}

const styles = `
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#efe4d0;color:#241910;font:14px/1.45 "Segoe UI",Tahoma,sans-serif}
main{max-width:760px;margin:0 auto;padding:28px 24px 48px}
h1,h2{font-family:Georgia,"Times New Roman",serif;margin:0 0 6px}
h1{font-size:34px;line-height:1.05}
h2{font-size:21px;border-bottom:2px solid #241910;padding-bottom:4px;margin-top:24px}
.mast{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin:-28px -24px 22px;padding:26px 24px 22px;background:#241910;color:#efe4d0}
.mast h1{color:#efe4d0}
.kicker{margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.mast .sub{color:#e2d3b8}
.seal{flex:none;width:92px;height:92px;border:3px solid #c8102e;display:grid;place-items:center}
.seal span{font:700 13px Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:#c8102e;border-top:2px solid #c8102e;border-bottom:2px solid #c8102e;padding:4px 0}
.sub{margin:0 0 4px;color:#6b5d4e}
.verdict{margin:14px 0 0;padding:10px 14px;background:#c8102e;color:#f3ead8}
.verdict p{margin:0}
.verdict .big{font:700 22px Georgia,serif}
table{border-collapse:collapse;width:100%}
td,th{padding:5px 8px;border-bottom:1px solid #a08c76;text-align:left;vertical-align:top}
th{font-family:Georgia,serif}
td.n{font:700 17px Georgia,serif;white-space:nowrap}
td.q,.quip{color:#6b5d4e;font-style:italic}
td.t{white-space:nowrap;font-variant-numeric:tabular-nums;width:64px}
.sheet{display:grid;grid-template-columns:150px repeat(3,132px);column-gap:8px;margin-top:8px}
.ch p{margin:0 0 3px;font:700 12px Georgia,serif;text-align:center;border-bottom:1px solid #241910}
.vl{display:grid;grid-template-columns:repeat(5,26px)}
.vl span{writing-mode:vertical-rl;transform:rotate(180deg);height:92px;line-height:26px;font-size:10.5px;white-space:nowrap}
.bt{grid-column:1/-1;margin:10px 0 3px;font:700 11px Georgia,serif;letter-spacing:.08em;text-transform:uppercase;color:#6b5d4e}
.rl{display:grid;grid-auto-rows:26px;padding-top:1px}
.rl span{font-size:10.5px;line-height:26px;text-align:right;white-space:nowrap;padding-right:6px;overflow:hidden}
.blk{display:grid;grid-template-columns:repeat(5,26px);width:132px;border:1px solid #241910;background:#f6f0e4}
.c{height:26px;width:26px;border-right:1px solid #a08c76;border-bottom:1px solid #a08c76;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:15px}
.c:nth-child(5n){border-right:0}
.c:nth-last-child(-n+5){border-bottom:0}
.c.yes{background:#1e6b3c;color:#f3ead8}
.c.no{background:#e7b2a8;color:#8d2b24}
.clues{columns:2;column-gap:24px;font-size:12px;margin:6px 0 0;padding-left:20px}
.clues li{break-inside:avoid;margin-bottom:3px}
footer{margin-top:28px;font-size:12px;color:#6b5d4e}
@page{size:letter;margin:12mm}
@media print{body{background:none}main{max-width:none;padding:0}.pb{break-before:page}}
`

const page = (title, body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${styles}</style></head><body><main>${body}</main></body></html>`

const pick = (kind, index) => {
  const pool = reportJokes[kind] ?? []
  return pool.length ? pool[index % pool.length] : ""
}

function quietestStretch(log, endSeconds) {
  const times = [...log.map((entry) => entry.t), endSeconds].sort((a, b) => a - b)
  return times.slice(1).reduce((best, t, i) => Math.max(best, t - times[i]), 0)
}

function timelineMarkup(log) {
  const seen = {}
  const rows = log.map((entry) => {
    seen[entry.kind] = (seen[entry.kind] ?? 0) + 1
    const turn = seen[entry.kind] - 1
    const quip = entry.kind === "tick" && turn % 4 !== 0 ? "" : pick(entry.kind, turn)
    return `<tr><td class="t">${clock(entry.t + entry.p * 60)}</td><td>${esc(entry.text)}</td><td class="q">${esc(quip)}</td></tr>`
  })
  return `<table><tr><th>When</th><th>What you did</th><th>Mayor Lewis noted</th></tr>${rows.join("")}</table>`
}

function numbersMarkup({ seconds, penalty, stats, log }) {
  const quiet = quietestStretch(log, Math.max(0, seconds - penalty * 60))
  const rows = [
    ["Time on the case", clock(seconds), penalty ? `${penalty} of those minutes were Elder fees. He does not accept pie.` : "Not a minute of Elder fees. He is taking it personally."],
    ["Visits to the Elder", stats.elder, stats.elder ? "He remembers every one of them." : "He waved a lot and got nothing."],
    ["Wrong accusations", stats.wrong, stats.wrong ? "The envelope was not kind." : "A clean record. Mayor Lewis finds it suspicious."],
    ["Cells clicked", stats.clicks, "Your mouse has filed a complaint."],
    ["Crosses placed", stats.crosses, "Mayor Lewis crossed his fingers for the rest."],
    ["Ticks placed", stats.ticks, "Some of them even stayed."],
    ["Ticks taken back", stats.clears, stats.clears ? "Retreat is also a strategy." : "Never wavered. Or never noticed."],
    ["Undo / Redo", `${stats.undos} / ${stats.redos}`, stats.undos ? "Regret is just editing with feelings." : "No regrets. Allegedly."],
    ["Stopped by a rule", stats.blocked, "The grid said no, politely."],
    ["Pencil notes", stats.notes, stats.notes ? "Evidence of excellent overthinking." : "A mind like a steel trap, or a goldfish."],
    ["Elder nudges", stats.nudges, "He waves every ten minutes. Rain or shine."],
    ["Lineup refused", stats.refused, stats.refused ? "The Mayor was right to be careful." : "Your sheet was ready first time."],
    ["Longest quiet stretch", clock(quiet), "Mayor Lewis used it to rehearse his speech."],
  ]
  return `<table>${rows.map(([name, value, joke]) => `<tr><td>${esc(name)}</td><td class="n">${esc(value)}</td><td class="q">${esc(joke)}</td></tr>`).join("")}</table>`
}

export function reportDocument({ puzzle, result, cells, seconds, penalty, stats, log }) {
  const { culprit } = result
  const rank = rankFor(stats)
  const body = `
<header class="mast">
  <div>
    <p class="kicker">Northeastern University, MSCS Align, CS5002</p>
    <h1>The Grange Display Case</h1>
    <p class="sub">File CS5002-1, closed ${esc(new Date().toLocaleString())}</p>
  </div>
  <div class="seal" aria-hidden="true"><span>Closed</span></div>
</header>
<div class="verdict"><p class="big">${esc(culprit.suspect)} did it.</p><p>${esc(culprit.location)}, ${esc(culprit.item)}, claiming ${esc(label(culprit.alibi))}</p></div>
<h2>Your rank: ${esc(rank.title)}</h2>
<p>${esc(rank.joke)}</p>
<h2>The numbers</h2>${numbersMarkup({ seconds, penalty, stats, log })}
<h2>What you did, and when</h2>${timelineMarkup(log)}
<div class="pb"></div>
<h2>The final sheet</h2>${sheetMarkup(puzzle, cells)}
<h2>The clues</h2>${cluesMarkup(puzzle)}
<footer>Made in your browser. Nothing was uploaded, nothing was saved, and Mayor Lewis was not consulted.</footer>`
  return page("The Grange Display Case, full case file", body)
}

export function downloadHtml(name, html) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function printSheet(puzzle, cells) {
  const body = `
<h1>The Grange Display Case</h1>
<p class="sub">File CS5002-1 | Northeastern MSCS Align | Green ticks mean matched, red crosses mean ruled out.</p>
${sheetMarkup(puzzle, cells)}
<h2>The clues</h2>${cluesMarkup(puzzle)}`
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"
  frame.onload = () => {
    const view = frame.contentWindow
    view.onafterprint = () => frame.remove()
    view.focus()
    view.print()
  }
  frame.srcdoc = page("The Grange Display Case, sheet", body)
  document.body.append(frame)
}
