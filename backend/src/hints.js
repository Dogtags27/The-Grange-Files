import { tickKey, truth } from "./solution.js"

const t = tickKey

export const FEES = { wrongTick: 10, wrongCross: 5, nextMove: 20 }

export const steps = [
  {
    key: t("locations__suspects", "Mines", "Shane"),
    title: "Shane is in the Mines",
    text: "Clue 3 says it outright: Shane was in the Mines. Tick Shane against the Mines.",
  },
  {
    key: t("alibis__suspects", "fishing", "Shane"),
    title: "Shane was fishing",
    text: "Clue 11 hands you his alibi for free. Shane says he was fishing.",
  },
  {
    key: t("alibis__locations", "fishing", "Mines"),
    title: "Fishing belongs to the Mines",
    text: "Shane is in the Mines and Shane was fishing, so the fishing alibi sits in the Mines too. Same man, different columns.",
  },
  {
    key: t("alibis__suspects", "painting", "Leah"),
    title: "Leah was painting",
    text: "Clue 5. Leah says she was painting. Nobody argues with Leah about paint.",
  },
  {
    key: t("items__locations", "Slingshot", "Pierre's Shop"),
    title: "The Slingshot is at Pierre's Shop",
    text: "Clue 1: whoever is at Pierre's Shop had the Slingshot. This one lives in the Sabotage Items against Locations block.",
  },
  {
    key: t("items__locations", "Pickaxe", "Beach"),
    title: "The Pickaxe is at the Beach",
    text: "Clue 2: the person at the Beach had the Pickaxe. Tick it before I forget which hat I am wearing.",
  },
  {
    key: t("items__suspects", "Rusty Sword", "Shane"),
    title: "Shane has the Rusty Sword",
    text: "Clue 7 splits two things between the Mines-person and Elliott: the Rusty Sword and the 'mending tools' alibi. Shane is the Mines-person, and his alibi is fishing, so he cannot be the mender. The Sword is his.",
  },
  {
    key: t("items__locations", "Rusty Sword", "Mines"),
    title: "The Rusty Sword is in the Mines",
    text: "Shane has the Sword and Shane is in the Mines. So the Sword lives in the Mines.",
  },
  {
    key: t("alibis__items", "fishing", "Rusty Sword"),
    title: "Fishing goes with the Sword",
    text: "Shane claims fishing and Shane holds the Rusty Sword. The story and the weapon belong together.",
  },
  {
    key: t("alibis__suspects", "mending", "Elliott"),
    title: "Elliott was mending tools",
    text: "Back to clue 7. The Sword went to Shane, so the other half is Elliott, who claims 'I was mending tools.'",
  },
  {
    key: t("items__locations", "Poisoned Joja Cola", "Community Center"),
    title: "The Cola is at the Community Center",
    text: "Clue 13 puts the Poisoned Joja Cola and the Rusty Sword one each in the Community Center and the Mines. The Sword is in the Mines, so the Cola is at the Community Center.",
  },
  {
    key: t("items__suspects", "Slingshot", "Abigail"),
    title: "Abigail has the Slingshot",
    text: "Clue 6: of Abigail and the Saloon person, one has the Slingshot and the other the Broken Fishing Rod. But clue 1 keeps the Slingshot at Pierre's Shop, not the Saloon. So Abigail holds the Slingshot.",
  },
  {
    key: t("locations__suspects", "Pierre's Shop", "Abigail"),
    title: "Abigail is at Pierre's Shop",
    text: "Abigail has the Slingshot, and the Slingshot is at Pierre's Shop. That is where she is standing.",
  },
  {
    key: t("items__locations", "Broken Fishing Rod", "Saloon"),
    title: "The Broken Fishing Rod is in the Saloon",
    text: "Clue 6 again. Abigail has the Slingshot, so the Saloon person has the Broken Fishing Rod.",
  },
  {
    key: t("alibis__items", "arcade", "Broken Fishing Rod"),
    title: "The arcade player has the Rod",
    text: "Clue 4: of Abigail and the arcade player, one is at Pierre's Shop and the other has the Broken Fishing Rod. Abigail is at Pierre's Shop, so the arcade player has the Rod.",
  },
  {
    key: t("alibis__locations", "arcade", "Saloon"),
    title: "The arcade player is in the Saloon",
    text: "The Rod is in the Saloon and the arcade player has the Rod. So the arcade alibi is the Saloon's. Clue 14 is happy with that too.",
  },
  {
    key: t("locations__suspects", "Community Center", "Elliott"),
    title: "Elliott is at the Community Center",
    text: "Elliott claims mending. Clue 12 keeps the mender away from Pierre's Shop and the Beach. The Saloon belongs to the arcade player and the Mines to Shane. That leaves the Community Center.",
  },
  {
    key: t("items__suspects", "Poisoned Joja Cola", "Elliott"),
    title: "Elliott has the Poisoned Joja Cola",
    text: "Elliott is at the Community Center and the Cola is at the Community Center. Clue 9 says the saboteur used the Cola. I did not say a name. The grid did.",
  },
  {
    key: t("alibis__locations", "mending", "Community Center"),
    title: "Mending is the Community Center's alibi",
    text: "Elliott mends and Elliott is at the Community Center. The alibi follows him there.",
  },
  {
    key: t("locations__suspects", "Beach", "Leah"),
    title: "Leah is at the Beach",
    text: "Leah paints. The Saloon person is the arcade player, so Leah is not there. Every other spot is spoken for, so she is at the Beach.",
  },
  {
    key: t("locations__suspects", "Saloon", "Sam"),
    title: "Sam is in the Saloon",
    text: "Sam is the only one without a location. The Saloon is the only one without a person.",
  },
  {
    key: t("alibis__locations", "painting", "Beach"),
    title: "Painting happened at the Beach",
    text: "Leah paints and Leah is at the Beach. The painting alibi goes there.",
  },
  {
    key: t("items__suspects", "Pickaxe", "Leah"),
    title: "Leah has the Pickaxe",
    text: "Clue 2 gives the Beach the Pickaxe. Leah is at the Beach. The Pickaxe is hers.",
  },
  {
    key: t("alibis__items", "painting", "Pickaxe"),
    title: "Painting goes with the Pickaxe",
    text: "Leah paints and carries the Pickaxe. Alibi and item match.",
  },
  {
    key: t("items__suspects", "Broken Fishing Rod", "Sam"),
    title: "Sam has the Broken Fishing Rod",
    text: "Sam is in the Saloon and the Saloon person has the Broken Fishing Rod.",
  },
  {
    key: t("alibis__suspects", "arcade", "Sam"),
    title: "Sam was playing arcade games",
    text: "The arcade player is the Saloon person, and the Saloon person is Sam.",
  },
  {
    key: t("alibis__suspects", "hay", "Abigail"),
    title: "Abigail was stacking hay",
    text: "Fishing, arcade, painting and mending are all taken. Hay is the only alibi left, and Abigail is the only one left without one. Clue 8 keeps Sam off the hay anyway.",
  },
  {
    key: t("alibis__locations", "hay", "Pierre's Shop"),
    title: "Hay is stacked at Pierre's Shop",
    text: "Abigail is at Pierre's Shop and she stacks hay.",
  },
  {
    key: t("alibis__items", "hay", "Slingshot"),
    title: "Hay goes with the Slingshot",
    text: "Abigail has the Slingshot and the hay. Easy one. I saved it for you.",
  },
  {
    key: t("alibis__items", "mending", "Poisoned Joja Cola"),
    title: "Mending goes with the Cola",
    text: "The last tick. Elliott mends tools and holds the Poisoned Joja Cola.",
  },
]

export function evaluateHint(ticks, crosses) {
  const wrongTicks = ticks.filter((key) => !truth.has(key))
  const wrongCrosses = crosses.filter((key) => truth.has(key))

  if (wrongTicks.length || wrongCrosses.length) {
    const shownTicks = wrongTicks.length ? [wrongTicks[0]] : []
    const shownCrosses = shownTicks.length ? [] : [wrongCrosses[0]]
    return {
      kind: "cleanup",
      wrongTicks: shownTicks,
      wrongCrosses: shownCrosses,
      penalty: shownTicks.length * FEES.wrongTick + shownCrosses.length * FEES.wrongCross,
    }
  }

  const have = new Set(ticks)
  const index = steps.findIndex((step) => !have.has(step.key))
  if (index < 0) return { kind: "complete", penalty: 0 }

  const step = steps[index]
  return {
    kind: "step",
    key: step.key,
    title: step.title,
    text: step.text,
    number: index + 1,
    total: steps.length,
    penalty: FEES.nextMove,
  }
}
