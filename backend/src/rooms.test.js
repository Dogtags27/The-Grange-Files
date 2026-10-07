import assert from "node:assert/strict"
import test from "node:test"
import {
  EMPTY_TTL_MS,
  MAX_ROOMS,
  MAX_SEATS,
  SEAT_STALE_MS,
  applyOp,
  createRoom,
  joinRoom,
  leave,
  peek,
  resetRooms,
  snapshot,
  sweep,
} from "./rooms.js"

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
  const undone = applyOp(host.token, host.code, { type: "undo" })
  assert.equal(undone.view.cells["alibis__suspects:0:0"], undefined)
  assert.equal(snapshot(guest.token, host.code).canRedo, true)
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
