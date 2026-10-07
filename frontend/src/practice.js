export const GRID = "practice"
export const rows = ["Abigail", "Shane", "Leah"]
export const cols = ["Saloon", "Beach", "Mines"]
export const clues = ["Shane was in the Mines.", "Leah was not at the Beach."]
export const answer = [`${GRID}:0:1`, `${GRID}:1:2`, `${GRID}:2:0`]

const mark = (state, key) => state[key]?.mark

export const steps = [
  {
    kind: "task",
    clue: 0,
    target: `${GRID}:1:2`,
    title: "Start with a clue that says it outright",
    text: "Clue 1 says Shane was in the Mines. Find Shane's row and the Mines column, then click where they meet. One click draws a red cross, which means ruled out. A second click turns it into a green tick, which means this is true.",
    praise: "Your first tick.",
    done: (state) => mark(state, `${GRID}:1:2`) === "yes",
  },
  {
    kind: "read",
    title: "See what the tick did on its own",
    text: "The rest of Shane's row and the rest of the Mines column crossed themselves out. Shane cannot be anywhere else, and nobody else can be in the Mines. Every tick does this for you, so you only mark what the clues prove.",
    show: (state) => Object.keys(state).filter((key) => state[key].noBy === `${GRID}:1:2`),
    button: "Got it",
  },
  {
    kind: "task",
    clue: 1,
    target: `${GRID}:2:1`,
    title: "A 'not' clue is a cross",
    text: "Clue 2 says Leah was not at the Beach. That rules a cell out without proving anything else. Click the cell where Leah's row meets the Beach column once, and leave it red.",
    praise: "Crossed. Ruling things out is half the game.",
    done: (state) => mark(state, `${GRID}:2:1`) === "no",
  },
  {
    kind: "task",
    clue: 1,
    target: `${GRID}:2:0`,
    title: "Leah has one place left",
    text: "Leah's row already has crosses for the Mines and the Beach. The Saloon is the only open cell, so it has to be true. Click it twice: first the cross, then the tick.",
    praise: "Leah is in the Saloon. You found that by elimination, not from a clue.",
    done: (state) => mark(state, `${GRID}:2:0`) === "yes",
  },
  {
    kind: "task",
    target: `${GRID}:0:0`,
    title: "One tick per row and per column",
    text: "The Saloon now belongs to Leah. Try to tick Abigail in the Saloon anyway and watch the sheet push back. It tells you which tick is in the way, and that is how you catch your own mistakes.",
    praise: "Refused, and it told you why. The outlined cell is the tick in the way.",
    done: (state, flags) => flags.blocked,
  },
  {
    kind: "task",
    target: `${GRID}:0:1`,
    title: "Finish the case",
    text: "Abigail is the only suspect without a place, and the Beach is the only place without a suspect. Click that cell twice to tick it.",
    praise: "All three matched. Case closed.",
    done: (state) => mark(state, `${GRID}:0:1`) === "yes",
  },
  {
    kind: "end",
    title: "You solved a case",
    text: "The real one has five suspects, five places, five items, five alibis and 14 clues, but it runs on these same three moves. A few things help once the grid gets big:",
    list: [
      ["Undo and Redo", "Ctrl+Z and Ctrl+Y. Nothing you mark is final."],
      ["Pencil", "Right-click a cell, or press N on it, to leave a faint maybe that does not count."],
      ["Arrow keys", "Move between cells, and press Enter to cycle blank, cross, tick."],
      ["The Elder", "Ask when you are stuck. Every hint adds minutes to your time."],
      ["A table", "Up to five people can share one sheet. Open one from the home page."],
    ],
  },
]
