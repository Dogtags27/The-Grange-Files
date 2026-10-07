const keyOf = (id, r, c) => `${id}:${r}:${c}`
const SIZE = 5

function read(state, id, r, c) {
  return state[keyOf(id, r, c)] || null
}

function tickCell(state, gridId, r, c, size) {
  const key = keyOf(gridId, r, c)
  const next = { ...state, [key]: { mark: "yes", noBy: null } }
  for (let i = 0; i < size; i++) {
    if (i !== c) {
      const k = keyOf(gridId, r, i)
      if (!(state[k]?.mark === "no" && state[k].noBy === "user")) {
        next[k] = { mark: "no", noBy: key }
      }
    }
    if (i !== r) {
      const k = keyOf(gridId, i, c)
      if (!(state[k]?.mark === "no" && state[k].noBy === "user")) {
        next[k] = { mark: "no", noBy: key }
      }
    }
  }
  return next
}

function clearTick(state, gridId, r, c, size) {
  const key = keyOf(gridId, r, c)
  const next = { ...state }
  delete next[key]
  for (let i = 0; i < size; i++) {
    if (i !== c && next[keyOf(gridId, r, i)]?.noBy === key) {
      delete next[keyOf(gridId, r, i)]
    }
    if (i !== r && next[keyOf(gridId, i, c)]?.noBy === key) {
      delete next[keyOf(gridId, i, c)]
    }
  }
  return next
}

function parseKey(key) {
  const [id, r, c] = key.split(":")
  return { id, r: Number(r), c: Number(c) }
}

export function applyClick(state, gridId, r, c, size, rowLabels, colLabels) {
  const key = keyOf(gridId, r, c)
  const mark = read(state, gridId, r, c)?.mark ?? "empty"

  if (mark === "empty") {
    return {
      state: { ...state, [key]: { mark: "no", noBy: "user" } },
      toast: null,
      blockers: [],
    }
  }

  if (mark === "yes") {
    return { state: clearTick(state, gridId, r, c, size), toast: null, blockers: [] }
  }

  const found = []
  for (let i = 0; i < size; i++) {
    if (i !== c && read(state, gridId, r, i)?.mark === "yes") {
      found.push({ axis: "row", r, c: i })
    }
    if (i !== r && read(state, gridId, i, c)?.mark === "yes") {
      found.push({ axis: "column", r: i, c })
    }
  }

  if (found.length) {
    const toast = found
      .map((b) => {
        const pair = `${rowLabels[b.r]} and ${colLabels[b.c]}`
        return b.axis === "row"
          ? `This row already has a tick for ${pair}.`
          : `This column already has a tick for ${pair}.`
      })
      .join(" ")
    return {
      state,
      toast,
      blockers: found.map((b) => keyOf(gridId, b.r, b.c)),
    }
  }

  return { state: tickCell(state, gridId, r, c, size), toast: null, blockers: [] }
}

export function placeTick(state, key) {
  if (state[key]?.mark === "yes") return state
  const { id, r, c } = parseKey(key)
  return tickCell(state, id, r, c, SIZE)
}

export function removeMarks(state, tickKeys, crossKeys) {
  let next = state
  for (const key of tickKeys) {
    if (next[key]?.mark === "yes") {
      const { id, r, c } = parseKey(key)
      next = clearTick(next, id, r, c, SIZE)
    }
  }
  for (const key of crossKeys) {
    if (next[key]?.mark === "no" && next[key].noBy === "user") {
      if (next === state) next = { ...state }
      delete next[key]
    }
  }
  return next
}

export function collectMarks(state) {
  const ticks = []
  const crosses = []
  for (const key in state) {
    if (state[key].mark === "yes") ticks.push(key)
    else if (state[key].mark === "no" && state[key].noBy === "user") crosses.push(key)
  }
  return { ticks, crosses }
}

export function countTicks(state, gridId) {
  let total = 0
  const prefix = `${gridId}:`
  for (const key in state) {
    if (state[key].mark === "yes" && key.startsWith(prefix)) total += 1
  }
  return total
}

export function countAllTicks(state) {
  let total = 0
  for (const key in state) {
    if (state[key].mark === "yes") total += 1
  }
  return total
}

export function splitClue(text, values) {
  const lookup = new Map()
  values.forEach((value) => {
    lookup.set(value.replace(/\.$/, ""), value)
  })
  const keys = [...lookup.keys()].sort((a, b) => b.length - a.length)
  const escaped = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "g")
  return text
    .split(pattern)
    .map((part, index) =>
      index % 2 === 1
        ? { text: part, value: lookup.get(part) }
        : { text: part, value: null },
    )
    .filter((part) => part.text !== "")
}
