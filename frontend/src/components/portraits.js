import { createAvatar } from "@dicebear/core"
import * as openPeeps from "@dicebear/open-peeps"

export const suspectNames = ["Abigail", "Shane", "Leah", "Sam", "Elliott"]

const looks = {
  Abigail: {
    head: ["long"],
    face: ["calm"],
    skinColor: ["ecc29a"],
    headContrastColor: ["2c1b18"],
    clothingColor: ["6b3a2e"],
    scale: 0.96,
  },
  Shane: {
    head: ["afro"],
    face: ["serious"],
    facialHair: ["moustache1"],
    skinColor: ["9a6440"],
    headContrastColor: ["2c1b18"],
    clothingColor: ["3f4a3a"],
    scale: 1.04,
  },
  Leah: {
    head: ["longCurly"],
    face: ["smile"],
    skinColor: ["d9a273"],
    headContrastColor: ["4a312c"],
    clothingColor: ["8a6a4a"],
    scale: 0.98,
  },
  Sam: {
    head: ["short3"],
    face: ["cheeky"],
    facialHair: ["chin"],
    skinColor: ["c68a5b"],
    headContrastColor: ["2c1b18"],
    clothingColor: ["4a5a6b"],
    scale: 1,
  },
  Elliott: {
    head: ["medium2"],
    face: ["driven"],
    facialHair: ["goatee1"],
    skinColor: ["f3d2b4"],
    headContrastColor: ["a55728"],
    clothingColor: ["5a3d3d"],
    scale: 1.02,
  },
}

const cache = new Map()

export function portrait(name) {
  if (!cache.has(name)) {
    const { scale, ...options } = looks[name] ?? looks.Sam
    const uri = createAvatar(openPeeps, {
      ...options,
      facialHairProbability: options.facialHair ? 100 : 0,
      accessoriesProbability: 0,
      maskProbability: 0,
      backgroundColor: ["transparent"],
    }).toDataUri()
    cache.set(name, { uri, scale: scale ?? 1 })
  }
  return cache.get(name)
}
