import assert from "node:assert/strict"
import test from "node:test"
import {
  applyClick,
  collectMarks,
  countAllTicks,
  countTicks,
  placeTick,
  removeMarks,
  splitClue,
} from "./logic.js"

const rows = ["R0", "R1", "R2", "R3", "R4"]
const cols = ["C0", "C1", "C2", "C3", "C4"]

function click(state, id, r, c) {
  return applyClick(state, id, r, c, 5, rows, cols)
}

test("blank becomes a cross and leaves the rest of the block alone", () => {
  const result = click({}, "g", 1, 2)
  assert.deepEqual(result.state, { "g:1:2": { mark: "no", noBy: "user" } })
  assert.equal(result.toast, null)
})

test("a cross becomes a tick and crosses the other cells in its row and column", () => {
  const crossed = click({}, "g", 0, 0)
  const ticked = click(crossed.state, "g", 0, 0)
  assert.equal(ticked.state["g:0:0"].mark, "yes")
  for (let i = 1; i < 5; i++) {
    assert.deepEqual(ticked.state[`g:0:${i}`], { mark: "no", noBy: "g:0:0" })
    assert.deepEqual(ticked.state[`g:${i}:0`], { mark: "no", noBy: "g:0:0" })
  }
  assert.equal(ticked.state["g:1:1"], undefined)
})

test("a second tick in the same row is refused and names the blocking cell", () => {
  let state = click({}, "g", 0, 0).state
  state = click(state, "g", 0, 0).state
  state = click(state, "g", 0, 3).state
  const blocked = click(state, "g", 0, 3)
  assert.equal(blocked.state, state)
  assert.match(blocked.toast, /This row already has a tick for R0 and C0/)
  assert.deepEqual(blocked.blockers, ["g:0:0"])
})

test("a second tick in the same column is refused", () => {
  let state = click({}, "g", 0, 1).state
  state = click(state, "g", 0, 1).state
  state = click(state, "g", 4, 1).state
  const blocked = click(state, "g", 4, 1)
  assert.match(blocked.toast, /This column already has a tick for R0 and C1/)
  assert.deepEqual(blocked.blockers, ["g:0:1"])
})

test("clearing a tick removes only the crosses that tick created", () => {
  let state = click({}, "g", 2, 0).state
  state = click(state, "g", 2, 2).state
  state = click(state, "g", 2, 2).state
  const cleared = click(state, "g", 2, 2)
  assert.equal(cleared.state["g:2:2"], undefined)
  assert.equal(cleared.state["g:2:1"], undefined)
  assert.deepEqual(cleared.state["g:2:0"], { mark: "no", noBy: "user" })
})

test("blocks do not share ticks", () => {
  let state = click({}, "a", 0, 0).state
  state = click(state, "a", 0, 0).state
  const other = click(state, "b", 0, 0)
  assert.equal(other.state["b:0:0"].mark, "no")
  assert.equal(other.toast, null)
})

test("ticks are counted per block and overall", () => {
  let state = click({}, "a", 0, 0).state
  state = click(state, "a", 0, 0).state
  state = click(state, "b", 1, 1).state
  state = click(state, "b", 1, 1).state
  assert.equal(countTicks(state, "a"), 1)
  assert.equal(countTicks(state, "b"), 1)
  assert.equal(countAllTicks(state), 2)
})

test("clue text splits around known values, ignoring a trailing full stop", () => {
  const values = ["Shane", "Mines", "I was fishing.", "Pierre's Shop"]
  const parts = splitClue('Shane was in the Mines, and said "I was fishing".', values)
  assert.deepEqual(
    parts.filter((part) => part.value).map((part) => part.value),
    ["Shane", "Mines", "I was fishing."],
  )
  assert.equal(parts.map((part) => part.text).join(""), 'Shane was in the Mines, and said "I was fishing".')
})

test("collectMarks sends ticks and the player's own crosses, not derived ones", () => {
  let state = click({}, "g", 0, 0).state
  state = click(state, "g", 0, 0).state
  state = click(state, "g", 3, 3).state
  const marks = collectMarks(state)
  assert.deepEqual(marks.ticks, ["g:0:0"])
  assert.deepEqual(marks.crosses, ["g:3:3"])
})

test("placeTick ticks a blank cell and crosses its row and column", () => {
  const next = placeTick({}, "g:2:2")
  assert.equal(next["g:2:2"].mark, "yes")
  assert.equal(next["g:2:0"].noBy, "g:2:2")
  assert.equal(next["g:0:2"].noBy, "g:2:2")
  assert.equal(placeTick(next, "g:2:2"), next)
})

test("removeMarks clears a wrong tick with its crosses and a wrong user cross", () => {
  let state = click({}, "g", 1, 1).state
  state = click(state, "g", 1, 1).state
  state = click(state, "g", 4, 4).state
  const cleaned = removeMarks(state, ["g:1:1"], ["g:4:4"])
  assert.deepEqual(cleaned, {})
})
