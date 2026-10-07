import { buildBands } from "./layout.js"

const suspects = {
  id: "suspects",
  name: "Suspects",
  values: ["Abigail", "Shane", "Leah", "Sam", "Elliott"],
}

const locations = {
  id: "locations",
  name: "Locations",
  values: ["Saloon", "Community Center", "Pierre's Shop", "Beach", "Mines"],
}

const items = {
  id: "items",
  name: "Sabotage Items",
  values: [
    "Rusty Sword",
    "Pickaxe",
    "Poisoned Joja Cola",
    "Slingshot",
    "Broken Fishing Rod",
  ],
}

const alibis = {
  id: "alibis",
  name: "Alibis",
  values: [
    "I was fishing.",
    "I was playing arcade games.",
    "I was painting.",
    "I was mending tools.",
    "I was stacking hay.",
  ],
}

const columns = [suspects, locations, items]
const rows = [alibis, items, locations]

export const puzzle = {
  categories: [suspects, locations, items, alibis],
  columns,
  bands: buildBands(columns, rows),
  clues: [
    "The person at Pierre's Shop had the Slingshot.",
    "The person at the Beach had the Pickaxe.",
    "Shane was in the Mines, and he did not have the Poisoned Joja Cola.",
    'Of Abigail and the person whose alibi was "I was playing arcade games," one was at Pierre\'s Shop and the other had the Broken Fishing Rod.',
    'Leah\'s alibi was "I was painting."',
    "Of Abigail and the person in the Saloon, one had the Slingshot and the other had the Broken Fishing Rod.",
    'Of the Mines-person and Elliott, one had the Rusty Sword and the other claimed "I was mending tools."',
    'Sam did not claim "I was stacking hay."',
    "The saboteur used the Poisoned Joja Cola.",
    "Elliott was not at the Beach.",
    'Shane\'s alibi was "I was fishing."',
    'The person who claimed "I was mending tools" was not at Pierre\'s Shop or the Beach.',
    "Of the person who had the Poisoned Joja Cola and the person who had the Rusty Sword, one was at the Community Center and the other was in the Mines.",
    'The person in the Saloon did not claim "I was fishing" and did not claim "I was painting."',
  ],
}
