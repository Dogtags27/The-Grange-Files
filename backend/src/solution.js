import { puzzle } from "./puzzle.js"

const names = Object.fromEntries(puzzle.categories.map((category) => [category.id, category.values]))

const aliases = {
  fishing: "I was fishing.",
  arcade: "I was playing arcade games.",
  painting: "I was painting.",
  mending: "I was mending tools.",
  hay: "I was stacking hay.",
}

function indexOf(category, value) {
  const found = names[category].indexOf(aliases[value] ?? value)
  if (found < 0) throw new Error(`unknown ${category} value ${value}`)
  return found
}

const table = [
  ["Abigail", "Pierre's Shop", "Slingshot", "hay"],
  ["Shane", "Mines", "Rusty Sword", "fishing"],
  ["Leah", "Beach", "Pickaxe", "painting"],
  ["Sam", "Saloon", "Broken Fishing Rod", "arcade"],
  ["Elliott", "Community Center", "Poisoned Joja Cola", "mending"],
]

export const rows = table.map(([suspect, location, item, alibi]) => ({
  suspects: indexOf("suspects", suspect),
  locations: indexOf("locations", location),
  items: indexOf("items", item),
  alibis: indexOf("alibis", alibi),
}))

export const gridIds = puzzle.bands.flatMap((band) => band.grids.map((grid) => grid.id))

export const truth = new Set(
  gridIds.flatMap((id) => {
    const [rowCategory, colCategory] = id.split("__")
    return rows.map((row) => `${id}:${row[rowCategory]}:${row[colCategory]}`)
  }),
)

export function tickKey(gridId, rowValue, colValue) {
  const [rowCategory, colCategory] = gridId.split("__")
  return `${gridId}:${indexOf(rowCategory, rowValue)}:${indexOf(colCategory, colValue)}`
}

export function isCellKey(key) {
  const [id, r, c] = String(key).split(":")
  return gridIds.includes(id) && /^[0-4]$/.test(r) && /^[0-4]$/.test(c)
}

export function describeKey(key) {
  const [id, r, c] = key.split(":")
  const [rowCategory, colCategory] = id.split("__")
  return {
    gridId: id,
    rowCategory,
    colCategory,
    rowValue: names[rowCategory][Number(r)],
    colValue: names[colCategory][Number(c)],
  }
}

const culpritRow = rows.find((row) => names.items[row.items] === "Poisoned Joja Cola")
export const culpritName = names.suspects[culpritRow.suspects]

export function fullSolution() {
  return rows.map((row) => ({
    suspect: names.suspects[row.suspects],
    location: names.locations[row.locations],
    item: names.items[row.items],
    alibi: names.alibis[row.alibis],
  }))
}

export function culpritDetails() {
  return fullSolution().find((entry) => entry.suspect === culpritName)
}

export const suspectNames = names.suspects

export function isSolved(ticks) {
  return ticks.length === truth.size && ticks.every((key) => truth.has(key))
}
