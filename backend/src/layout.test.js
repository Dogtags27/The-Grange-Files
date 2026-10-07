import assert from "node:assert/strict"
import test from "node:test"
import { buildBands } from "./layout.js"

const columns = [
  { id: "suspects", name: "Suspects", values: ["A"] },
  { id: "locations", name: "Locations", values: ["B"] },
  { id: "items", name: "Sabotage Items", values: ["C"] },
]

const rows = [
  { id: "alibis", name: "Alibis", values: ["D"] },
  { id: "items", name: "Sabotage Items", values: ["C"] },
  { id: "locations", name: "Locations", values: ["B"] },
]

test("bands place six unique grids under the requested headers", () => {
  const bands = buildBands(columns, rows)
  const placed = bands.flatMap((band) =>
    band.grids.map((grid) => `${band.row.id}:${grid.colIndex}:${grid.id}`),
  )
  assert.deepEqual(placed, [
    "alibis:0:alibis__suspects",
    "alibis:1:alibis__locations",
    "alibis:2:alibis__items",
    "items:0:items__suspects",
    "items:1:items__locations",
    "locations:0:locations__suspects",
  ])
})
