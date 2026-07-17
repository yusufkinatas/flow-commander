import { BANNER_LEVEL_4 } from "./banner-level-4.js";
import { BANNER_LEVEL_5 } from "./banner-level-5.js";

const TWO_COMMANDERS = [
  { id: "captain", name: "Captain Alder", startTile: "A", goalTile: "X", maxMoves: 5, initial: { soldiers: 1 } },
  { id: "warden", name: "Warden Bramble", startTile: "B", goalTile: "Z", maxMoves: 5, initial: { builders: 1 } },
];

const THREE_COMMANDERS = [
  { id: "captain", name: "Captain Alder", startTile: "A", goalTile: "X", maxMoves: 7, initial: { soldiers: 1 } },
  { id: "warden", name: "Warden Bramble", startTile: "B", goalTile: "Z", maxMoves: 7, initial: { builders: 1 } },
  { id: "sage", name: "Sage Cinder", startTile: "C", goalTile: "V", maxMoves: 7, initial: { mages: 1 } },
];

export const THREE_BANNERS_RAW = [
  {
    id: 1,
    mode: "convoy",
    name: "Two Standards",
    difficulty: 3,
    mechanic: "Lock two non-crossing routes",
    briefing: "Captain Alder handles the goblin road; Warden Bramble lays the bridge. Finish both colored routes.",
    tip: "Each commander has a matching standard and starts with the specialist shown in their card.",
    commanders: TWO_COMMANDERS,
    map: [
      "########",
      "#A.g..X#",
      "#B.~..Z#",
      "########",
    ],
  },
  {
    id: 2,
    mode: "convoy",
    name: "Three Duties",
    difficulty: 5.5,
    mechanic: "Three specialist commanders",
    briefing: "Add Sage Cinder to calm the dragon road. Every saved trail becomes a wall for the other commanders.",
    tip: "Alder brings soldiers, Bramble brings a builder, and Cinder brings a mage.",
    commanders: THREE_COMMANDERS,
    map: [
      "##########",
      "#A..g...X#",
      "#B..~...Z#",
      "#C..d...V#",
      "##########",
    ],
  },
  {
    id: 3,
    mode: "convoy",
    name: "Beacon Exchange",
    difficulty: 7,
    mechanic: "Shared rally beacons",
    briefing: "The three routes share one mission: every glowing beacon must belong to somebody's trail.",
    tip: "A beacon is a global objective, so give it to the route that reaches it with the fewest bends.",
    commanders: [
      { ...THREE_COMMANDERS[0], maxMoves: 9 },
      { ...THREE_COMMANDERS[1], maxMoves: 9 },
      { ...THREE_COMMANDERS[2], maxMoves: 9 },
    ],
    map: [
      "############",
      "#A..g.*...X#",
      "#...##.....#",
      "#B..~....Z.#",
      "#...##.....#",
      "#C..d.*...V#",
      "############",
    ],
  },
  BANNER_LEVEL_4,
  BANNER_LEVEL_5,
];
