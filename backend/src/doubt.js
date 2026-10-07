import { describeKey, truth } from "./solution.js"

const alibiPhrase = {
  "I was fishing.": "fishing",
  "I was playing arcade games.": "playing arcade games",
  "I was painting.": "painting",
  "I was mending tools.": "mending tools",
  "I was stacking hay.": "stacking hay",
}

const locationPhrase = {
  Saloon: "at the Saloon",
  "Community Center": "at the Community Center",
  "Pierre's Shop": "at Pierre's Shop",
  Beach: "at the Beach",
  Mines: "in the Mines",
}

const itemPhrase = {
  "Rusty Sword": "the Rusty Sword",
  Pickaxe: "the Pickaxe",
  "Poisoned Joja Cola": "the Poisoned Joja Cola",
  Slingshot: "the Slingshot",
  "Broken Fishing Rod": "the Broken Fishing Rod",
}

const personTemplates = {
  alibis: [
    "Do you really think {p} was {x}?",
    "{p} was {x}? Is that what you are telling me?",
    "Can you honestly picture {p} {x} while all this was happening?",
    "Be honest. Does {p} strike you as someone who was {x}?",
    "Your sheet says {p} was {x}. Did you check that twice?",
  ],
  locations: [
    "Would {p} really be {x}?",
    "{p} {x}? That is your story?",
    "Do you honestly see {p} {x} that night?",
    "I find it hard to believe {p} was {x}. Do you?",
    "Pop quiz: is {p} really {x}?",
  ],
  items: [
    "Is {p} really the type to grab {x}?",
    "{p} with {x}. Are you quite sure about that?",
    "Would {p} reach for {x} of all things?",
    "You gave {x} to {p}. Hold that thought. Does it hold up?",
    "Can you see {p} carrying {x} across the Grange?",
  ],
}

const pairTemplates = {
  "alibis|locations": [
    "Would anyone really be {a} {l}?",
    "{A} {l}? Does that sound right to you?",
    "Is {a} {l} what you would call a believable evening?",
  ],
  "alibis|items": [
    "Does \"{q}\" really go with {i}?",
    "Someone {a} while holding {i}. Are you sure?",
    "Would anyone be {a} with {i} in their hands?",
  ],
  "items|locations": [
    "Is {i} really something you would find {l}?",
    "{I} {l}. Are you certain about that one?",
    "Does {i} belong {l}? Think again.",
  ],
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)]
}

function cap(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function phrase(category, value) {
  if (category === "alibis") return alibiPhrase[value]
  if (category === "locations") return locationPhrase[value]
  if (category === "items") return itemPhrase[value]
  return value
}

function ask(key, rng) {
  const info = describeKey(key)
  const people = info.rowCategory === "suspects" ? "row" : info.colCategory === "suspects" ? "col" : null

  if (people) {
    const person = people === "row" ? info.rowValue : info.colValue
    const otherCategory = people === "row" ? info.colCategory : info.rowCategory
    const otherValue = people === "row" ? info.colValue : info.rowValue
    return pick(personTemplates[otherCategory], rng)
      .replaceAll("{p}", person)
      .replaceAll("{x}", phrase(otherCategory, otherValue))
  }

  const pair = [info.rowCategory, info.colCategory].sort().join("|")
  const values = { [info.rowCategory]: info.rowValue, [info.colCategory]: info.colValue }
  const a = phrase("alibis", values.alibis ?? "")
  const l = phrase("locations", values.locations ?? "")
  const i = phrase("items", values.items ?? "")
  return pick(pairTemplates[pair], rng)
    .replaceAll("{a}", a ?? "")
    .replaceAll("{A}", cap(a ?? ""))
    .replaceAll("{l}", l ?? "")
    .replaceAll("{i}", i ?? "")
    .replaceAll("{I}", cap(i ?? ""))
    .replaceAll("{q}", values.alibis ?? "")
}

export function pickDoubt(ticks, rng = Math.random) {
  const wrong = ticks.filter((key) => !truth.has(key))
  if (!wrong.length) return null
  const aboutPeople = wrong.filter((key) => key.split(":")[0].includes("suspects"))
  const key = pick(aboutPeople.length ? aboutPeople : wrong, rng)
  const [gridId, r, c] = key.split(":")
  return { key, gridId, r: Number(r), c: Number(c), question: ask(key, rng) }
}
