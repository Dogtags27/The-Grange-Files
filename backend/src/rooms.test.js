import assert from "node:assert/strict"
import test from "node:test"
import {
  EMPTY_TTL_MS,
  MAX_ROOMS,
  MAX_SEATS,
  SEAT_STALE_MS,
  VOTE_MS,
  applyOp,
  broadcastBody,
  createRoom,
  fillSolvedForTest,
  joinRoom,
  leave,
  peek,
  resetRooms,
  snapshot,
  sweep,
} from "./rooms.js"
import { culpritName } from "./solution.js"

test.beforeEach(() => resetRooms())

function seat(result) {
  assert.equal(result.status, 200)
  return { token: result.token, id: result.view.me, code: result.view.code }
}

test("a table seats five, shares a click, and undoes it", () => {
  const host = seat(createRoom("Ada"))
  const guest = seat(joinRoom(host.code, "Grace"))
  assert.equal(peek(host.code).members.length, 2)
  const clicked = applyOp(guest.token, host.code, { type: "click", gridId: "alibis__suspects", r: 0, c: 0 })
  assert.equal(clicked.status, 200)
  assert.equal(snapshot(host.token, host.code).cells["alibis__suspects:0:0"], 0)
  assert.equal(clicked.view.notice.kind, "cross")
  assert.equal(clicked.view.notice.by, "Grace")
  assert.match(clicked.view.log.at(-1).text, /Grace crossed/)
  const undone = applyOp(host.token, host.code, { type: "undo" })
  assert.equal(undone.view.cells["alibis__suspects:0:0"], undefined)
  assert.equal(snapshot(guest.token, host.code).canRedo, true)
  assert.match(undone.view.log.at(-1).text, /Ada undid a mark/)
})

test("each cell remembers who last changed it, and live updates carry only the change", () => {
  const host = seat(createRoom("Ada"))
  const guest = seat(joinRoom(host.code, "Grace"))
  const first = applyOp(host.token, host.code, { type: "click", gridId: "alibis__suspects", r: 0, c: 0 })
  const hostNo = first.view.members.find((member) => member.id === host.id).no
  const guestNo = first.view.members.find((member) => member.id === guest.id).no
  assert.equal(first.view.touched["alibis__suspects:0:0"][0], hostNo)
  const second = applyOp(guest.token, host.code, { type: "click", gridId: "alibis__suspects", r: 0, c: 0 })
  assert.equal(second.view.touched["alibis__suspects:0:0"][0], guestNo)
  const body = broadcastBody(second.room)
  assert.equal(body.touched, undefined)
  assert.ok(body.touchDelta.some(([key, no]) => key === "alibis__suspects:0:0" && no === guestNo))
  const cleared = applyOp(host.token, host.code, { type: "start" })
  assert.deepEqual(cleared.view.touched, {})
  assert.equal(broadcastBody(cleared.room).touchDelta[0][0], "*")
})

test("the lineup stays shut until the sheet is right", () => {
  const host = seat(createRoom("Ada"))
  const checked = applyOp(host.token, host.code, { type: "check" })
  assert.equal(checked.view.scene, null)
  assert.equal(checked.view.stats.refused, 1)
})

test("the room stops opening tables at the cap", () => {
  for (let i = 0; i < MAX_ROOMS; i += 1) assert.equal(createRoom("Ada").status, 200)
  assert.equal(createRoom("Ada").status, 503)
  assert.equal(createRoom("Ada").error, "busy")
})

test("a full table refuses a sixth person", () => {
  const host = seat(createRoom("Ada"))
  for (const name of ["Bea", "Cal", "Dee", "Eve"]) seat(joinRoom(host.code, name))
  assert.equal(joinRoom(host.code, "Extra").status, 409)
})

test("an empty table lasts fifteen minutes, then goes", () => {
  const host = seat(createRoom("Ada"))
  leave(host.token, host.code)
  assert.ok(peek(host.code))
  assert.deepEqual(sweep(Date.now() + EMPTY_TTL_MS - 1000).expired, [])
  assert.ok(peek(host.code))
  assert.deepEqual(sweep(Date.now() + EMPTY_TTL_MS + 1000).expired, [host.code])
  assert.equal(peek(host.code), null)
})

test("a quiet seat is dropped and the empty table is kept", () => {
  const host = seat(createRoom("Ada"))
  sweep(Date.now() + SEAT_STALE_MS + 5)
  const left = peek(host.code)
  assert.ok(left)
  assert.equal(left.members.length, 0)
})

test("the lineup timer settles with one vote after twenty seconds", () => {
  const host = seat(createRoom("Ada"))
  const guest = seat(joinRoom(host.code, "Grace"))
  fillSolvedForTest(host.code)
  const opened = applyOp(host.token, host.code, { type: "check" })
  assert.equal(opened.view.scene, "lineup")
  assert.ok(opened.view.voteEndsAt > Date.now())
  applyOp(host.token, host.code, { type: "vote", suspect: culpritName })
  assert.equal(snapshot(guest.token, host.code).scene, "lineup")
  const after = sweep(opened.view.voteEndsAt + 1)
  assert.equal(after.changed.length, 1)
  const view = snapshot(guest.token, host.code)
  assert.equal(view.scene, "reveal")
  assert.equal(view.accused, culpritName)
})

test("everyone voting early opens the envelope before the timer", () => {
  const host = seat(createRoom("Ada"))
  const guest = seat(joinRoom(host.code, "Grace"))
  fillSolvedForTest(host.code)
  applyOp(host.token, host.code, { type: "check" })
  applyOp(host.token, host.code, { type: "vote", suspect: culpritName })
  const done = applyOp(guest.token, host.code, { type: "vote", suspect: culpritName })
  assert.equal(done.view.scene, "reveal")
  assert.equal(done.view.accused, culpritName)
})

test("a zero-vote timer does not open the envelope", () => {
  const host = seat(createRoom("Ada"))
  fillSolvedForTest(host.code)
  const opened = applyOp(host.token, host.code, { type: "check" })
  sweep(opened.view.voteEndsAt + VOTE_MS)
  assert.equal(snapshot(host.token, host.code).scene, "lineup")
  const late = applyOp(host.token, host.code, { type: "vote", suspect: culpritName })
  assert.equal(late.view.scene, "reveal")
})
