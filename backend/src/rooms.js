import crypto from "node:crypto"
import { applyClick, collectMarks, placeTick, removeMarks } from "../../frontend/src/logic.js"
import { pickDoubt } from "./doubt.js"
import { evaluateHint } from "./hints.js"
import { puzzle } from "./puzzle.js"
import { culpritDetails, culpritName, fullSolution, isSolved, suspectNames, truth } from "./solution.js"

export const MAX_SEATS = 5
export const MAX_ROOMS = 40
export const EMPTY_TTL_MS = 15 * 60 * 1000
export const SEAT_STALE_MS = 8 * 60 * 1000
export const REVEAL_MS = 22 * 1000
export const VOTE_MS = 20 * 1000
const CODE_RE = /^[a-z]{3,5}-[a-z]{3,5}$/
const COLORS = ["#3d6cb5", "#c36a22", "#7a4fad", "#2f8a8f", "#a8457a"]
const WORDS = ["hay", "pie", "goat", "mine", "fair", "cola", "dock", "barn", "lamp", "crow", "plum", "moss", "rust", "kiln", "reed", "pond", "cart", "wool", "pear", "salt", "mill", "coop", "gate", "vine", "cork", "loaf", "pail", "well", "boot", "drum"]
const REFUSALS = [
  "I cannot call a lineup on that sheet. One of those ticks is lying to us.",
  "Lineup denied. The villagers have suffered enough without being accused off a bad grid.",
  "Mayor Lewis holds your sheet at arm's length. Something is wrong here, and it is not the pie.",
]

const grids = new Map()
for (const band of puzzle.bands) {
  for (const grid of band.grids) grids.set(grid.id, grid)
}

const rooms = new Map()
const byToken = new Map()

const blankStats = () => ({
  elder: 0, wrong: 0, clicks: 0, crosses: 0, ticks: 0, clears: 0,
  undos: 0, redos: 0, blocked: 0, notes: 0, nudges: 0, refused: 0,
})

function blank(code) {
  return {
    code,
    rev: 1,
    createdAt: Date.now(),
    emptySince: null,
    startedAt: Date.now(),
    frozenAt: null,
    finalSeconds: 0,
    penalty: 0,
    cells: {},
    touched: {},
    delta: [],
    roster: {},
    nextNo: 0,
    notes: {},
    checked: {},
    history: [],
    future: [],
    members: new Map(),
    scene: null,
    sceneAt: 0,
    voteEndsAt: 0,
    votes: {},
    split: null,
    doubt: null,
    pendingDoubt: null,
    spotlight: [],
    toast: null,
    notice: null,
    elder: null,
    accused: null,
    verdict: null,
    stats: blankStats(),
    log: [{ t: 0, p: 0, kind: "start", text: "Opened a table", by: "", byId: "" }],
  }
}

export function cleanName(value) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 16)
  if (!/^[\p{L}][\p{L}' -]{0,15}$/u.test(name)) return null
  return name
}

function makeCode() {
  const first = WORDS[crypto.randomInt(WORDS.length)]
  let second = WORDS[crypto.randomInt(WORDS.length)]
  if (second === first) second = WORDS[(WORDS.indexOf(first) + 1) % WORDS.length]
  return `${first}-${second}`
}

function label(value) {
  return value?.startsWith("I was") ? `"${value.replace(/\.$/, "")}"` : value
}

function describe(key) {
  const [id, rs, cs] = String(key).split(":")
  const grid = grids.get(id)
  if (!grid) return "a cell"
  return `${label(grid.rowValues[Number(rs)])} × ${label(grid.colValues[Number(cs)])}`
}

function record(room, member, kind, text, extra = {}) {
  const t = Math.max(0, Math.floor((Date.now() - room.startedAt) / 1000))
  room.log.push({
    t,
    p: room.penalty,
    kind,
    text,
    by: member?.name ?? "",
    byId: member?.id ?? "",
    key: extra.key ?? null,
  })
  if (room.log.length > 400) room.log.shift()
}

function tell(room, member, kind, key, text) {
  room.notice = {
    byId: member.id,
    by: member.name,
    color: member.color,
    kind,
    key: key ?? null,
    text,
  }
}

function stamp(room, before, who) {
  const t = Math.floor(Date.now() / 1000)
  const no = who ? who.no : -1
  const after = room.cells
  for (const key in after) {
    if (before[key]?.mark !== after[key].mark) {
      room.touched[key] = [no, t]
      room.delta.push([key, no, t])
    }
  }
  for (const key in before) {
    if (!after[key]) {
      delete room.touched[key]
      room.delta.push([key, 0, t])
    }
  }
}

function remember(room) {
  room.history.push(room.cells)
  if (room.history.length > 80) room.history.shift()
  room.future = []
}

export function view(room, memberId) {
  return {
    rev: room.rev,
    code: room.code,
    me: memberId,
    startedAt: room.startedAt,
    frozenAt: room.frozenAt,
    finalSeconds: room.finalSeconds,
    penalty: room.penalty,
    cells: Object.fromEntries(Object.entries(room.cells).map(([key, value]) => [key, value.mark === "yes" ? 1 : 0])),
    notes: room.notes,
    checked: room.checked,
    members: [...room.members.values()].map(({ id, no, name, color }) => ({ id, no, name, color })),
    touched: room.touched,
    roster: room.roster,
    serverNow: Math.floor(Date.now() / 1000),
    scene: room.scene,
    voteEndsAt: room.voteEndsAt || 0,
    votes: room.votes,
    split: room.split,
    doubt: room.doubt,
    spotlight: room.spotlight,
    toast: room.toast,
    notice: room.notice,
    elder: room.elder,
    accused: room.accused,
    verdict: room.verdict,
    stats: room.stats,
    log: room.log.slice(-40),
    canUndo: room.history.length > 0 && !room.scene,
    canRedo: room.future.length > 0 && !room.scene,
    pusherKey: process.env.PUSHER_KEY ?? null,
    cluster: process.env.PUSHER_CLUSTER || "us2",
  }
}

export function broadcastBody(room) {
  const body = view(room, null)
  delete body.pusherKey
  delete body.cluster
  delete body.touched
  delete body.roster
  body.touchDelta = room.delta
  return JSON.stringify(body).length > 9000 ? { rev: room.rev, refetch: true } : body
}

function linkOf(token, code) {
  const link = byToken.get(token)
  if (!link || (code && link.code !== code)) return null
  const room = rooms.get(link.code)
  const member = room?.members.get(link.id)
  if (!room || !member) return null
  member.seen = Date.now()
  return { room, member }
}

function sit(room, name) {
  if (room.members.size >= MAX_SEATS) return null
  const taken = new Set([...room.members.values()].map((member) => member.color))
  const color = COLORS.find((item) => !taken.has(item)) ?? COLORS[0]
  room.nextNo += 1
  const member = {
    id: crypto.randomBytes(6).toString("hex"),
    no: room.nextNo,
    name,
    color,
    token: crypto.randomBytes(18).toString("base64url"),
    seen: Date.now(),
  }
  room.roster[member.no] = { name, color }
  room.members.set(member.id, member)
  byToken.set(member.token, { code: room.code, id: member.id })
  room.emptySince = null
  room.rev += 1
  record(room, member, "join", `${name} sat down`)
  return member
}

export function peek(code) {
  const room = rooms.get(code)
  if (!room || !CODE_RE.test(code)) return null
  return {
    code,
    members: [...room.members.values()].map(({ name, color }) => ({ name, color })),
    seats: MAX_SEATS,
  }
}

export function createRoom(name) {
  const clean = cleanName(name)
  if (!clean) return { status: 400, error: "name" }
  if (rooms.size >= MAX_ROOMS) return { status: 503, error: "busy" }
  let code = makeCode()
  while (rooms.has(code)) code = makeCode()
  const room = blank(code)
  const member = sit(room, clean)
  rooms.set(code, room)
  return { status: 200, token: member.token, view: view(room, member.id) }
}

export function joinRoom(code, name) {
  const clean = cleanName(name)
  if (!clean) return { status: 400, error: "name" }
  const room = rooms.get(code)
  if (!room) return { status: 404, error: "table" }
  if (room.members.size >= MAX_SEATS) return { status: 409, error: "full" }
  const member = sit(room, clean)
  return { status: 200, token: member.token, view: view(room, member.id), room }
}

export function snapshot(token, code) {
  const link = linkOf(token, code)
  if (!link) return null
  return view(link.room, link.member.id)
}

export function touch(token, code) {
  return Boolean(linkOf(token, code))
}

export function leave(token, code) {
  const link = byToken.get(token)
  if (!link || (code && link.code !== code)) return null
  const room = rooms.get(link.code)
  byToken.delete(token)
  if (!room) return null
  const member = room.members.get(link.id)
  room.members.delete(link.id)
  delete room.votes[link.id]
  if (member) record(room, member, "leave", `${member.name} left the table`)
  if (room.members.size === 0) room.emptySince = Date.now()
  room.rev += 1
  return room
}

export function memberFor(token, code) {
  const link = linkOf(token, code)
  if (!link) return null
  return { id: link.member.id, name: link.member.name, color: link.member.color }
}

function finishReveal(room) {
  if (room.scene !== "reveal") return
  if (room.verdict?.correct) {
    room.scene = "solved"
  } else {
    room.scene = null
    room.frozenAt = null
    room.doubt = room.pendingDoubt
    room.spotlight = room.pendingDoubt ? [room.pendingDoubt.key] : []
    room.pendingDoubt = null
    room.verdict = null
    room.accused = null
  }
  room.rev += 1
}

function beginReveal(room, suspect, member) {
  const ticks = collectMarks(room.cells).ticks
  const correct = suspect === culpritName && isSolved(ticks)
  room.accused = suspect
  room.scene = "reveal"
  room.sceneAt = Date.now()
  room.frozenAt = room.sceneAt
  room.finalSeconds = Math.max(0, Math.floor((room.frozenAt - room.startedAt) / 1000)) + room.penalty * 60
  room.split = null
  if (correct) {
    room.verdict = { correct: true, culprit: culpritDetails(), solution: fullSolution() }
    record(room, member, "solved", `The table accused ${suspect}: guilty. Case closed`)
  } else {
    room.stats.wrong += 1
    room.pendingDoubt = pickDoubt(ticks)
    room.verdict = { correct: false, doubt: room.pendingDoubt }
    record(room, member, "wrong", `The table accused ${suspect}: not guilty`)
  }
}

function settleLineup(room, member) {
  const votes = Object.values(room.votes)
  if (!votes.length) return false
  const counts = {}
  for (const suspect of votes) counts[suspect] = (counts[suspect] ?? 0) + 1
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  if (ranked.length === 1 || ranked[0][1] > ranked[1][1]) {
    beginReveal(room, ranked[0][0], member)
    return true
  }
  room.split = Object.fromEntries(ranked)
  return true
}

function voteState(room, member) {
  const ids = [...room.members.keys()]
  const voted = ids.filter((id) => room.votes[id])
  room.split = null
  if (!voted.length) return
  if (voted.length === ids.length || (room.voteEndsAt && Date.now() >= room.voteEndsAt)) {
    settleLineup(room, member)
  }
}

function dueVote(room, now = Date.now()) {
  if (room.scene !== "lineup" || !room.voteEndsAt || now < room.voteEndsAt) return false
  if (!Object.keys(room.votes).length) return false
  const member = room.members.values().next().value ?? null
  return settleLineup(room, member)
}

function fail(status, error) {
  return { status, error }
}

export function applyOp(token, code, op) {
  const link = linkOf(token, code)
  if (!link) return fail(401, "seat")
  const { room, member } = link
  const type = op?.type
  room.delta = []
  if (type === "click") {
    const grid = grids.get(op.gridId)
    const r = op.r
    const c = op.c
    if (!grid || !Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r > 4 || c > 4) return fail(400, "cell")
    if (room.scene) return fail(409, "scene")
    const key = `${grid.id}:${r}:${c}`
    const before = room.cells[key]?.mark
    const result = applyClick(room.cells, grid.id, r, c, 5, grid.rowValues, grid.colValues)
    if (result.state !== room.cells) {
      remember(room)
      const prior = room.cells
      room.cells = result.state
      stamp(room, prior, member)
      const after = room.cells[key]?.mark
      room.stats.clicks += 1
      if (after === "no" && before !== "no") {
        room.stats.crosses += 1
        record(room, member, "cross", `${member.name} crossed ${describe(key)}`, { key })
        tell(room, member, "cross", key, `${member.name} put a cross`)
      } else if (after === "yes") {
        room.stats.ticks += 1
        record(room, member, "tick", `${member.name} ticked ${describe(key)}`, { key })
        tell(room, member, "tick", key, `${member.name} put a tick`)
      } else if (before === "yes" && !after) {
        room.stats.clears += 1
        record(room, member, "untick", `${member.name} cleared a tick on ${describe(key)}`, { key })
        tell(room, member, "clear", key, `${member.name} cleared a tick`)
      }
    } else {
      room.stats.blocked += 1
      room.notice = null
    }
    room.toast = result.toast ? { text: result.toast, blockers: result.blockers } : null
    room.spotlight = result.blockers ?? []
    room.doubt = null
  } else if (type === "note") {
    if (typeof op.key !== "string" || !grids.has(op.key.split(":")[0])) return fail(400, "cell")
    room.notice = null
    if (room.notes[op.key] === member.id) delete room.notes[op.key]
    else {
      room.notes[op.key] = member.id
      room.stats.notes += 1
    }
  } else if (type === "undo" || type === "redo") {
    if (room.scene) return fail(409, "scene")
    const from = type === "undo" ? room.history : room.future
    const to = type === "undo" ? room.future : room.history
    if (!from.length) return { status: 200, view: view(room, member.id), room }
    const prior = room.cells
    to.push(room.cells)
    room.cells = from.pop()
    stamp(room, prior, member)
    room.stats[type === "undo" ? "undos" : "redos"] += 1
    const line = type === "undo" ? `${member.name} undid a mark` : `${member.name} redid a mark`
    record(room, member, type, line)
    tell(room, member, type, null, line)
  } else if (type === "clue") {
    const index = op.index
    if (!Number.isInteger(index) || index < 0 || index >= puzzle.clues.length) return fail(400, "clue")
    room.notice = null
    room.checked[index] = !room.checked[index]
  } else if (type === "hint") {
    if (room.scene) return fail(409, "scene")
    const marks = collectMarks(room.cells)
    const result = evaluateHint(marks.ticks, marks.crosses)
    const prior = room.cells
    if (result.kind === "cleanup") room.cells = removeMarks(room.cells, result.wrongTicks, result.wrongCrosses)
    if (result.kind === "step") room.cells = placeTick(room.cells, result.key)
    stamp(room, prior, null)
    room.history = []
    room.future = []
    room.spotlight = result.kind === "step" ? [result.key] : []
    room.elder = { result }
    room.notice = null
    if (result.penalty > 0) {
      room.penalty += result.penalty
      room.stats.elder += 1
      const what = result.kind === "cleanup" ? "had mistakes wiped" : `heard: ${result.title}`
      record(room, member, "elder", `${member.name} asked the Elder and ${what} (+${result.penalty} min)`)
    }
  } else if (type === "check") {
    if (room.scene) return fail(409, "scene")
    room.notice = null
    const ticks = collectMarks(room.cells).ticks
    if (isSolved(ticks)) {
      room.scene = "lineup"
      room.sceneAt = Date.now()
      room.voteEndsAt = room.sceneAt + VOTE_MS
      room.votes = {}
      room.split = null
      room.doubt = null
      room.toast = null
    } else {
      const found = pickDoubt(ticks)
      room.stats.refused += 1
      room.spotlight = found ? [found.key] : []
      room.doubt = found ? { ...found, lead: REFUSALS[room.stats.refused % REFUSALS.length] } : null
      room.toast = found ? null : { text: "The sheet is not ready for a lineup.", blockers: [] }
      record(room, member, "refused", `${member.name} asked for the lineup. The sheet was not right.`)
    }
  } else if (type === "vote") {
    if (room.scene !== "lineup" || !suspectNames.includes(op.suspect)) return fail(400, "vote")
    room.votes[member.id] = op.suspect
    voteState(room, member)
  } else if (type === "tally") {
    if (room.scene !== "lineup") return fail(409, "scene")
    dueVote(room)
  } else if (type === "present") {
    if (room.scene !== "lineup" || !room.split) return fail(409, "split")
    const ranked = Object.entries(room.split).sort((a, b) => b[1] - a[1])
    if (ranked.length < 2 || ranked[0][1] === ranked[1][1]) return fail(409, "tie")
    beginReveal(room, ranked[0][0], member)
  } else if (type === "back") {
    if (room.scene !== "lineup") return fail(409, "scene")
    room.scene = null
    room.voteEndsAt = 0
    room.votes = {}
    room.split = null
  } else if (type === "finish") {
    finishReveal(room)
  } else if (type === "doubtClear") {
    if (!room.doubt) return fail(409, "doubt")
    remember(room)
    record(room, member, "doubtCleared", `${member.name} cleared ${describe(room.doubt.key)}`)
    const prior = room.cells
    room.cells = removeMarks(room.cells, [room.doubt.key], [])
    stamp(room, prior, member)
    room.doubt = null
    room.spotlight = []
  } else if (type === "doubtKeep") {
    if (room.doubt) record(room, member, "doubtKept", `${member.name} stood by ${describe(room.doubt.key)}`)
    room.doubt = null
    room.spotlight = []
  } else if (type === "elderClose") {
    room.elder = null
    room.spotlight = []
  } else if (type === "look") {
    if (room.scene === "solved") room.scene = null
  } else if (type === "start") {
    const fresh = blank(room.code)
    fresh.members = room.members
    fresh.createdAt = room.createdAt
    record(fresh, member, "start", `${member.name} cleared the sheet`)
    const rev = room.rev
    const { nextNo, roster } = room
    Object.assign(room, fresh, { members: room.members, log: fresh.log, rev, nextNo, roster })
    room.delta = [["*", 0, Math.floor(Date.now() / 1000)]]
  } else return fail(400, "op")
  room.rev += 1
  if (room.notice) room.notice = { ...room.notice, at: room.rev }
  return { status: 200, view: view(room, member.id), room }
}

export function sweep(now = Date.now()) {
  const expired = []
  const changed = []
  for (const [code, room] of rooms) {
    const before = room.rev
    if (room.scene === "reveal" && now - room.sceneAt >= REVEAL_MS) finishReveal(room)
    if (dueVote(room, now)) room.rev += 1
    for (const member of [...room.members.values()]) {
      if (now - member.seen > SEAT_STALE_MS) {
        room.members.delete(member.id)
        byToken.delete(member.token)
        delete room.votes[member.id]
        room.rev += 1
      }
    }
    if (room.members.size === 0) {
      if (!room.emptySince) room.emptySince = now
      if (now - room.emptySince >= EMPTY_TTL_MS) {
        rooms.delete(code)
        expired.push(code)
        continue
      }
    } else room.emptySince = null
    if (room.rev !== before) changed.push(room)
  }
  return { expired, changed }
}

export function resetRooms() {
  rooms.clear()
  byToken.clear()
}

export function fillSolvedForTest(code) {
  const room = rooms.get(code)
  if (!room) return
  for (const key of truth) room.cells = placeTick(room.cells, key)
}
