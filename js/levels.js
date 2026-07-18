import { parseLevel } from "./engine.js";
import { RELIEF_ROUTES_RAW } from "./packs/relief-routes.js";
import { THREE_BANNERS_RAW } from "./packs/three-banners.js";
import { SECOND_WIND_RAW } from "./packs/second-wind.js";
import { FORMATION_MUSTER_RAW } from "./packs/formation-muster.js";

const RAW_LEVELS = [
  {
    id: 1,
    name: "First Muster",
    difficulty: 1,
    mechanic: "Recruit → rally",
    briefing: "Start alone. Draw through the soldier, then clear the goblin watch and reach the banner.",
    tip: "A goblin exhausts one ready soldier. Order matters.",
    map: [
      "#########",
      "#########",
      "#S.r.g.G#",
      "#########",
      "#########",
    ],
  },
  {
    id: 2,
    name: "Two for Trouble",
    difficulty: 2,
    mechanic: "Count your company",
    briefing: "The goblin duo needs two soldiers. Choose the branch that rallies enough help.",
    tip: "The number badge on an enemy is exactly how many soldiers become tired.",
    map: [
      "#########",
      "#..r..###",
      "#S###.oG#",
      "#..R..###",
      "#########",
    ],
  },
  {
    id: 3,
    name: "Bridge Duty",
    difficulty: 3,
    mechanic: "Builders & rivers",
    briefing: "Water breaks an ordinary route. Rally a builder before you cross the river.",
    tip: "Each builder lays one bridge, then stays behind to finish the job.",
    map: [
      "#########",
      "#..b..###",
      "#S###.~G#",
      "#.....###",
      "#########",
    ],
  },
  {
    id: 4,
    name: "Spark in the Hills",
    difficulty: 4,
    mechanic: "Mages & dragons",
    briefing: "Steel cannot calm a dragon. Find the mage before entering its fiery square.",
    tip: "Each mage can enchant one dragon encounter.",
    map: [
      "#########",
      "#..m..###",
      "#S###.dG#",
      "#.....###",
      "#########",
    ],
  },
  {
    id: 5,
    name: "The Split Levy",
    difficulty: 5,
    mechanic: "Choices change choices",
    briefing: "Two forks, two histories. Your first recruit determines which second branch can be crossed.",
    tip: "Both second branches can work — but only after the matching first recruit.",
    map: [
      "###########",
      "#.b..gb.###",
      "#S##.##.gG#",
      "#.r..~r.###",
      "###########",
    ],
  },
  {
    id: 6,
    name: "Twin Embers",
    difficulty: 6,
    mechanic: "Exact specialists",
    briefing: "A builder and a mage each unlock one later fork. Only one history survives the final dragon.",
    tip: "Each specialist stays at one duty, so plan who must still be with you at the end.",
    map: [
      "###########",
      "#.b..db.###",
      "#S##.##.dG#",
      "#.m..~m.###",
      "###########",
    ],
  },
  {
    id: 7,
    name: "The Sun Seal",
    difficulty: 6.5,
    mechanic: "Switches remember",
    briefing: "The Sun seal and the soldiers pull in opposite directions. Chain both forks in the right order.",
    tip: "Matching symbols connect a switch to its gate; an open seal stays open for the whole route.",
    map: [
      "###########",
      "#.y..gy.###",
      "#S##.##.gG#",
      "#.r..Yr.###",
      "###########",
    ],
  },
  {
    id: 8,
    name: "Sun & Moon",
    difficulty: 7.5,
    mechanic: "Chained seals",
    briefing: "Each first choice opens the opposite second path. Only one leaves a soldier for the final watch.",
    tip: "Trace both seals and the last goblin backward before committing to the first fork.",
    map: [
      "############",
      "#.yr.Qy.####",
      "#S##.##.QgG#",
      "#.q..Yq.####",
      "############",
    ],
  },
  {
    id: 9,
    name: "Quartermaster's Test",
    difficulty: 8.5,
    mechanic: "Plan the final supply",
    briefing: "Three forks feed one gauntlet. Arrive with a mage, a builder, and exactly enough soldiers.",
    tip: "Read the final tiles backward, then choose the supplies that satisfy all three costs.",
    map: [
      "################",
      "#.R..rm.b..#####",
      "#S##.##.##.d~tG#",
      "#.b..R..r..#####",
      "################",
    ],
  },
  {
    id: 10,
    name: "Commander's Gauntlet",
    difficulty: 10,
    mechanic: "The whole campaign",
    briefing: "Four decisions. Two seals. Three specialist duties. One route worthy of a commander.",
    tip: "Work backward from the banner: three soldiers, builder, mage, Moon, then Sun.",
    map: [
      "#####################",
      "#.yr.q..m..bR.#######",
      "#S##.##.##.##.YQd~tG#",
      "#.R..m..b..yR.#######",
      "#####################",
    ],
  },
];

const GREEN_MARCH_LEVELS = RAW_LEVELS.map((level) => parseLevel({ ...level, mode: "campaign" }));
const RELIEF_ROUTE_LEVELS = RELIEF_ROUTES_RAW.map(parseLevel);
const THREE_BANNER_LEVELS = THREE_BANNERS_RAW.map(parseLevel);
const SECOND_WIND_LEVELS = SECOND_WIND_RAW.map((level) => parseLevel({ ...level, mode: "campaign" }));
const FORMATION_MUSTER_LEVELS = FORMATION_MUSTER_RAW.map((level) => parseLevel({ ...level, mode: "campaign" }));

export const PACKS = Object.freeze([
  {
    id: "green-march",
    number: 1,
    name: "The Green March",
    shortName: "Green March",
    eyebrow: "CLASSIC CAMPAIGN",
    description: "Recruit specialists, pay every obstacle cost, and reach the royal banner.",
    accent: "gold",
    levels: GREEN_MARCH_LEVELS,
  },
  {
    id: "relief-routes",
    number: 2,
    name: "Relief Routes",
    shortName: "Relief Routes",
    eyebrow: "ADJACENT DELIVERY",
    description: "Feed every friendly monster beside your trail, then reach camp within the movement budget.",
    accent: "mint",
    levels: RELIEF_ROUTE_LEVELS,
  },
  {
    id: "three-banners",
    number: 3,
    name: "The Three Banners",
    shortName: "Three Banners",
    eyebrow: "MULTI-COMMAND",
    description: "Choose any specialist whenever you like. Saved trails cannot cross, and every beacon must be claimed.",
    accent: "violet",
    levels: THREE_BANNER_LEVELS,
  },
  {
    id: "second-wind",
    number: 4,
    name: "The Second Wind",
    shortName: "Second Wind",
    eyebrow: "ARMY RECOVERY",
    description: "Begin alone, spend the company wisely, and time each healer's rally to reuse tired soldiers.",
    accent: "coral",
    levels: SECOND_WIND_LEVELS,
  },
  {
    id: "formation-muster",
    number: 5,
    name: "The Exacting Muster",
    shortName: "Exacting Muster",
    eyebrow: "EXACT FORMATIONS",
    description: "Match exact ready-soldier formations, then turn recruits, battles, specialists, seals, and recovery into one precise campaign.",
    accent: "water",
    levels: FORMATION_MUSTER_LEVELS,
  },
]);

export const LEVELS = PACKS[0].levels;
export const ALL_LEVELS = PACKS.flatMap((pack) => pack.levels);

export function levelKey(pack, level) {
  return `${pack.id}:${level.id}`;
}
