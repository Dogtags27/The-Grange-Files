export const story = [
  "Mayor Lewis has called everyone together in a panic. Someone sabotaged the Grange Display on the night before the Fall Fair.",
  "One of the villagers is guilty. Mayor Lewis needs your help to work out who did it, where it happened, what item they used, and what they claimed as an alibi. The alibis might not make sense, but they stay consistent across suspects.",
]

export const groundRule =
  "Only use the clues. No outside knowledge about Stardew Valley will help you here."

export const homeTease =
  "Stuck? There is an Elder in the grid who sells advice by the minute."

export const panicStages = [
  {
    upTo: 0,
    lines: [
      "Rehearsing his speech to a wall. The wall has questions.",
      "Asked if anyone else could solve this instead. Nobody else could. Hurry.",
      "Counting the ceiling tiles of the Community Center. Twice.",
      "Forgot why he called the meeting, remembered, and panicked again.",
    ],
  },
  {
    upTo: 6,
    lines: [
      "Writing suspect names on his hand. The hand is nearly full.",
      "Staring at everyone's shoes for clues. The shoes are not talking.",
      "Asked Pierre if sabotage is covered by the fair insurance. It is not.",
      "Muttering 'the pumpkin was RIGHT THERE' at nobody.",
    ],
  },
  {
    upTo: 14,
    lines: [
      "Rearranged the same pie three times. The pie is confused.",
      "Said 'I always suspected them' about every single suspect.",
      "Whispering your name very loudly. Encouragingly. Mostly.",
      "Took a nap standing up, woke up in a panic, and is back to normal.",
    ],
  },
  {
    upTo: 22,
    lines: [
      "Found the snack drawer. Panic is now partly crumbs.",
      "Told the crowd you have a plan. You have a grid. Close enough.",
      "Said 'case closed' out loud to see how it feels.",
      "Sat down for the first time today. His knees sent a thank-you note.",
    ],
  },
  {
    upTo: 29,
    lines: [
      "Humming the Fall Fair tune. Slightly flat. Very hopeful.",
      "Practising his shocked face for the big reveal. It is not good.",
      "Promised the town pie after this. Pie was not in the budget.",
      "Changed into his good hat. The hat has high hopes.",
    ],
  },
  {
    upTo: 30,
    lines: [
      "Vibrating quietly. Please press the big button.",
      "Holding his breath. He cannot do that forever, so name the culprit.",
    ],
  },
]

export const accuseLines = [
  "{name}? Bold. I lent {name} my ladder last spring.",
  "Ah, {name}. I was hoping it would not be {name}. Or would I?",
  "{name}. Interesting. I will remember this at the next Fair.",
  "Hold still, {name}. We are only looking at you. For fun.",
  "Circle drawn. The marker is dry and so is my mouth.",
  "Are you sure about {name}? I need a chair.",
  "That is a very confident circle around {name}.",
]

export const revealBeats = [
  "Mayor Lewis picks up the sealed envelope.",
  "The whole Grange goes quiet. Somewhere, a chicken coughs.",
  "You point at {name}.",
  "{name} does not blink. A pumpkin rolls off a table.",
  "Mayor Lewis unfolds the paper. Very slowly. Slower than that.",
]

export const wrongLines = [
  "Mayor Lewis lowers the paper and sighs for a very long time.",
  "Mayor Lewis lowers the paper. A chair creaks. Someone sneezes in the back.",
  "Mayor Lewis folds the paper back up and asks for a moment.",
]

export const finaleLines = [
  "Mayor Lewis sat down, exhaled, and finally ate the pie.",
  "The Fall Fair went ahead. The pumpkin was never mentioned again.",
  "Mayor Lewis has named you Honorary Deputy of the Grange. The badge is a bottle cap.",
  "The chicken that coughed earlier has been cleared of all charges.",
  "Pierre already hung a sign reading 'Detective approved'. Nobody asked him to.",
  "Mayor Lewis wants you back for next year's Fair. Payment is pie.",
  "Elder Thistlewick insists he knew all along. He did not.",
]

export const tableRules = [
  "Up to five people share one sheet, one clock, and one Elder bill. His minutes come off everyone's time.",
  "Anyone can tick, cross, undo, redo, and pencil. A pencil note shows in that person's color.",
  "The lineup opens only when every tick is right. You get twenty seconds to circle a suspect. Skipping is fine, but at least one circle is required before the envelope opens. If you all vote early, it opens early. A tied vote waits for the bigger group to present.",
  "If you go quiet for five minutes you get a warning. Two more minutes without a reply and your seat is freed. Closing the tab drops you after about eight minutes. If everyone is gone, the table is thrown out 15 minutes later.",
  "A shared table does not touch the solo case saved in this browser.",
]

export const nudge = {
  title: "Elder Thistlewick is waving at you",
  lines: [
    "Ten minutes have gone by and the grid still has doubts. The Elder has a chair and some free time.",
    "The Elder noticed you staring at the same block. He offers to take a look, for a fee in minutes.",
    "The Elder cleared his throat very loudly from across the Grange. He may have a hint for you.",
    "Psst. A second pair of eyes spots a wrong tick fast. The Elder charges time, not coins.",
  ],
  ask: "Ask the Elder",
  dismiss: "Not now",
}

export const elder = {
  name: "Elder Thistlewick",
  confirmTitle: "Ask Elder Thistlewick?",
  confirmIntro:
    "He has attended sixty-one Fall Fairs and has opinions about every one of them. His advice costs nothing in coins and plenty on the clock.",
  fees: [
    ["A wrong tick wiped from your grid", "10 min"],
    ["A wrong cross wiped from your grid", "5 min"],
    ["The next correct tick, with the reasoning", "20 min"],
  ],
  confirmNote:
    "Each visit, he rubs out one mistake and says nothing else. Ask again for the next mistake, or for the next move once the grid is clean. The minutes are added to your time.",
  cleanLines: [
    "He holds your sheet up to the light, tuts, and rubs out {summary}. 'Mistakes,' he says. 'Fresh as milk.'",
    "Elder Thistlewick sighs through his moustache and wipes {summary} from your grid.",
    "'I have seen this before,' says the Elder, erasing {summary}. 'In 1987. It ended badly for the pumpkin.'",
    "The Elder squints, hums, and removes {summary}. He does not explain. He never explains the first time.",
  ],
  cleanAfter:
    "That is all for this visit. If another mistake is still on the sheet, ask again. Once the grid is clean, he will give you the next move.",
  stepLeads: [
    "The Elder pulls up a stool and taps his pipe.",
    "He clears his throat so loudly a hen leaves the room.",
    "The Elder leans in and lowers his voice, which makes it louder.",
    "He gazes at the horizon, then at your grid, then at the horizon again.",
  ],
  completeLines: [
    "The Elder looks at your sheet for a long time. 'Nothing left to tell you,' he says. 'Go and name the culprit.'",
  ],
  errorText: "The Elder could not be reached. The backend may be asleep, and you were not charged.",
}

export const legal = {
  terms: {
    title: "Terms of use",
    items: [
      "This is a personal project for MSCS Align, CS5002. There is no fee, and the puzzle is a class challenge.",
      "Use it for fun. The puzzle is meant to be solved with the clues alone, and the page only checks the final accusation.",
      "No warranty. If something breaks, tell one of us and we will fix it when homework allows.",
      "We can change or remove the puzzle at any time. Stardew Valley belongs to its creators and is only borrowed here for a story.",
    ],
  },
  privacy: {
    title: "Privacy",
    items: [
      "We do not collect your data. There are no accounts, cookies, trackers, or analytics.",
      "Your solo marks, ticks, and timer stay in this browser so a refresh can pick up the sheet. Nothing is uploaded. Clear the sheet or finish the case and that local copy goes away.",
      "Fonts are served from this site, so no third party sees you visit.",
      "Nothing is sold or shared. Shared tables live only in memory on the server for as long as people stay seated.",
    ],
  },
  credits: {
    title: "Credits",
    items: [
      "This is a personal project for MSCS Align, CS5002. There is no fee, no ad, and no payment to anyone for playing it.",
      "The logic problem is a class challenge. I did not write it. I wrapped it so the same work would be something people wanted to sit with.",
      "Stardew Valley, its villagers, and its place names belong to their creators. They are a story frame here. I claim no ownership of that world, and I make no money from it.",
      "The office models are the Detective Office LowPoly Pack by Tarasov, used under that pack's license. The portraits are Open Peeps by Pablo Stanley, through DiceBear. The type is Fraunces and Atkinson Hyperlegible, with Noto for Cyrillic.",
      "Classmates were leaving the challenge problems alone. The logic was sound. It was not wrapped as something you would want to open. A desk, a lamp, and a case file were the attempt to change that.",
      "Careful use of AI, and other new ways of teaching, can carry a hard idea to more people and make them want to try it. That is the reason this page exists.",
    ],
  },
}

export const refuseLines = [
  "I cannot call a lineup on that sheet. One of those ticks is lying to us.",
  "Lineup denied. The villagers have suffered enough without being accused off a bad grid.",
  "Mayor Lewis holds your sheet at arm's length. 'No. Something is wrong here, and it is not the pie.'",
  "I would love to start the lineup, but one of your ticks just made the chicken nervous.",
]

export const ranks = [
  {
    test: (s) => s.elder === 0 && s.wrong === 0,
    title: "Grand Detective of the Grange",
    joke: "No Elder, no wrong guesses, no excuses. Mayor Lewis wants to frame your sheet.",
  },
  {
    test: (s) => s.elder === 0,
    title: "Stubborn Genius",
    joke: "You skipped the Elder entirely. He is pretending not to be offended.",
  },
  {
    test: (s) => s.wrong === 0 && s.elder <= 2,
    title: "The Elder's Favourite Student",
    joke: "One accusation, zero drama. The Elder is taking partial credit.",
  },
  {
    test: (s) => s.elder >= 3,
    title: "Regular on the Elder's Porch",
    joke: "He knows your order and has started saving you the good chair.",
  },
  {
    test: () => true,
    title: "Deputy of the Grange, Bottle Cap Division",
    joke: "Mistakes were made. Then they were corrected. Then someone ate the pie.",
  },
]

export const reportJokes = {
  start: ["The case file opened. The pumpkin remained unaware."],
  tick: [
    "A tick. Bold. The grid did not flinch.",
    "Placed with the confidence of someone who has read clue 9.",
    "Somewhere, a pumpkin nodded.",
    "Mayor Lewis wrote this on his sleeve.",
    "Decisive. Nobody asked you to be, but here we are.",
  ],
  untick: ["A change of heart. The grid respects it.", "Backing away slowly, as one does.", "Retreat is also a strategy."],
  elder: [
    "The Elder accepted payment in minutes and left a smug silence.",
    "He nodded as if he had planned this all along.",
    "The Elder will bring this up at the next Fair.",
  ],
  nudge: ["The Elder waved. You pretended not to see.", "A gentle nudge, delivered with a very loud cough."],
  refused: ["Mayor Lewis folded his arms. The lineup stayed in storage.", "The chicken was relieved."],
  doubtCleared: ["You folded. The sheet is better for it.", "Wise. The Mayor pretended he never doubted you."],
  doubtKept: ["Stubborn. We respect it, quietly."],
  wrong: ["The envelope was not kind.", "Mayor Lewis sighed for what felt like a season."],
  solved: ["Case closed. Pie was served, at last."],
}
