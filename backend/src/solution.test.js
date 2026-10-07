import assert from "node:assert/strict"
import test from "node:test"
import { pickDoubt } from "./doubt.js"
import { evaluateHint, steps } from "./hints.js"
import { culpritName, tickKey, truth } from "./solution.js"

const allTicks = [...truth]

test("the solution has thirty ticks and the culprit holds the Cola", () => {
  assert.equal(truth.size, 30)
  assert.equal(culpritName, "Elliott")
})

test("hint steps cover every true tick exactly once", () => {
  assert.equal(steps.length, 30)
  assert.equal(new Set(steps.map((step) => step.key)).size, 30)
  assert.ok(steps.every((step) => truth.has(step.key)))
})

test("an empty grid gets the first step for twenty minutes", () => {
  const hint = evaluateHint([], [])
  assert.equal(hint.kind, "step")
  assert.equal(hint.key, steps[0].key)
  assert.equal(hint.penalty, 20)
})

test("a visit names one wrong mark and leaves the rest off the reply", () => {
  const wrongTick = tickKey("locations__suspects", "Saloon", "Abigail")
  const secondTick = tickKey("locations__suspects", "Beach", "Abigail")
  const wrongCross = [...truth][0]
  const hint = evaluateHint([wrongTick, secondTick], [wrongCross])
  assert.equal(hint.kind, "cleanup")
  assert.deepEqual(hint.wrongTicks, [wrongTick])
  assert.deepEqual(hint.wrongCrosses, [])
  assert.equal(hint.penalty, 10)
})

test("the next step skips ticks the player already has", () => {
  const hint = evaluateHint([steps[0].key, steps[1].key], [])
  assert.equal(hint.key, steps[2].key)
})

test("a finished correct grid has nothing left to hint", () => {
  assert.equal(evaluateHint(allTicks, []).kind, "complete")
})

test("doubt picks a wrong tick and prefers ones that involve a person", () => {
  const personWrong = tickKey("locations__suspects", "Saloon", "Abigail")
  const otherWrong = tickKey("items__locations", "Pickaxe", "Saloon")
  const doubt = pickDoubt([...allTicks, personWrong, otherWrong], () => 0)
  assert.equal(doubt.key, personWrong)
  assert.match(doubt.question, /Abigail/)
})

test("doubt falls back to non-person ticks and is null for a clean grid", () => {
  const otherWrong = tickKey("items__locations", "Pickaxe", "Saloon")
  assert.equal(pickDoubt([otherWrong], () => 0).key, otherWrong)
  assert.equal(pickDoubt(allTicks), null)
})

test("a grid only counts as solved when all thirty ticks are right", async () => {
  const { isSolved } = await import("./solution.js")
  const all = [...truth]
  assert.equal(isSolved(all), true)
  assert.equal(isSolved(all.slice(1)), false)
  assert.equal(isSolved([...all.slice(1), "alibis__suspects:0:0"]), false)
})
