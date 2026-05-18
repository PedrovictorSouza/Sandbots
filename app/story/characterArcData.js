import { MACRO_BIOME_IDS } from "./biomeProgressionData.js";

export const CHARACTER_ARC_IDS = Object.freeze({
  SHAPER: "shaper",
  CHOPPER: "chopper",
  AUNTY: "aunty",
  SPRIG: "sprig",
  NAMI: "nami",
  KELP: "kelp",
  MICA: "mica",
  RIFF: "riff",
  AERO: "aero",
  TOVA: "tova"
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const SMALL_ISLAND_CHARACTER_ARCS = deepFreeze([
  {
    id: CHARACTER_ARC_IDS.SHAPER,
    targetName: "The Shaper",
    macroBiomeId: "global",
    required: true,
    role: "Customizable protagonist.",
    progressionContribution: "Restores terrain, learns companion actions and rebuilds homes.",
    completionPayoff: "Becomes the island's ongoing caretaker after credits."
  },
  {
    id: CHARACTER_ARC_IDS.CHOPPER,
    targetName: "Chopper",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    required: true,
    role: "Mentor.",
    progressionContribution: "Guides early restoration and frames required goals.",
    completionPayoff: "Confirms the island-wide route network can reconnect."
  },
  {
    id: CHARACTER_ARC_IDS.AUNTY,
    targetName: "Core Keeper Bot",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    required: true,
    role: "Habitat core keeper.",
    progressionContribution: "Anchors the first safe work loop, construction protocols and hub repair.",
    completionPayoff: "Turns the repaired starting hub into proof that humans could survive there."
  },
  {
    id: CHARACTER_ARC_IDS.SPRIG,
    targetName: "Sprig",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    required: true,
    role: "First companion.",
    progressionContribution: "Proves restored habitats attract help.",
    completionPayoff: "Establishes habitat restoration as the game's social loop."
  },
  {
    id: CHARACTER_ARC_IDS.NAMI,
    targetName: "Nami",
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    required: true,
    role: "Water guide.",
    progressionContribution: "Leads cleanup, water routing and light restoration.",
    completionPayoff: "Restores the coast signal for the final biome."
  },
  {
    id: CHARACTER_ARC_IDS.KELP,
    targetName: "Kelp",
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    required: true,
    role: "Coast conflict character.",
    progressionContribution: "Makes flooded homes and blocked infrastructure personal.",
    completionPayoff: "Shows that cleanup restores livable community space."
  },
  {
    id: CHARACTER_ARC_IDS.MICA,
    targetName: "Mica",
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    required: true,
    role: "Ridge specialist.",
    progressionContribution: "Opens material, crafting and rescue loops.",
    completionPayoff: "Turns heavy terrain into useful repair knowledge."
  },
  {
    id: CHARACTER_ARC_IDS.RIFF,
    targetName: "Riff",
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    required: true,
    role: "Celebration lead.",
    progressionContribution: "Turns tools and food into community morale.",
    completionPayoff: "Proves repair can become culture, not only survival."
  },
  {
    id: CHARACTER_ARC_IDS.AERO,
    targetName: "Aero",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    required: true,
    role: "Sky traversal mentor.",
    progressionContribution: "Tests elevated traversal and route planning.",
    completionPayoff: "Confirms the player can navigate the final repair space."
  },
  {
    id: CHARACTER_ARC_IDS.TOVA,
    targetName: "Tova",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    required: true,
    role: "Final builder.",
    progressionContribution: "Owns staged Skyforge repair and beacon readiness.",
    completionPayoff: "Turns every macro-biome signal into the final beacon."
  }
]);

export function listCharacterArcs() {
  return SMALL_ISLAND_CHARACTER_ARCS;
}

export function getCharacterArcById(id) {
  return SMALL_ISLAND_CHARACTER_ARCS.find((arc) => arc.id === id) || null;
}

export function getRequiredCharacterArcGaps(arcs = SMALL_ISLAND_CHARACTER_ARCS) {
  return arcs
    .filter((arc) => arc.required)
    .map((arc) => {
      const missing = [];

      for (const field of ["macroBiomeId", "progressionContribution", "completionPayoff"]) {
        if (!arc[field]) {
          missing.push(field);
        }
      }

      return {
        id: arc.id,
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}
