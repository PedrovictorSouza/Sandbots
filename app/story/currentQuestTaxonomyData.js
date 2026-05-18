import { SMALL_ISLAND_QUESTS } from "../quest/questData.js";
import { CHARACTER_ARC_IDS } from "./characterArcData.js";
import { MACRO_BIOME_IDS } from "./biomeProgressionData.js";
import {
  getRequestTaxonomyValidationErrors,
  REQUEST_ARCHETYPE,
  REQUEST_KIND
} from "./requestTaxonomyData.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const CURRENT_QUEST_TAXONOMY_BY_ID = deepFreeze({
  "learn-to-move": {
    kind: REQUEST_KIND.TUTORIAL,
    archetype: REQUEST_ARCHETYPE.INITIATION_CHALLENGE,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: "system",
    placeholderState: "final",
    blocksCredits: false
  },
  "wake-guide": {
    kind: REQUEST_KIND.TUTORIAL,
    archetype: REQUEST_ARCHETYPE.ESCORT_FOLLOW,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.CHOPPER,
    placeholderState: "final",
    blocksCredits: false
  },
  "gather-first-supplies": {
    kind: REQUEST_KIND.TUTORIAL,
    archetype: REQUEST_ARCHETYPE.ABILITY_UNLOCK,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.CHOPPER,
    placeholderState: "final",
    blocksCredits: false
  },
  "shape-a-living-patch": {
    kind: REQUEST_KIND.TUTORIAL,
    archetype: REQUEST_ARCHETYPE.ENVIRONMENTAL_RESTORATION,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.CHOPPER,
    placeholderState: "final",
    blocksCredits: false
  },
  "record-a-memory": {
    kind: REQUEST_KIND.OPTIONAL,
    archetype: REQUEST_ARCHETYPE.COLLECTION,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: "system",
    placeholderState: "final",
    blocksCredits: false
  },
  "open-the-water-route": {
    kind: REQUEST_KIND.TUTORIAL,
    archetype: REQUEST_ARCHETYPE.ABILITY_UNLOCK,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.CHOPPER,
    placeholderState: "final",
    blocksCredits: false
  },
  "water-dry-grass": {
    kind: REQUEST_KIND.GENERAL,
    archetype: REQUEST_ARCHETYPE.ENVIRONMENTAL_RESTORATION,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.SPRIG,
    placeholderState: "final",
    blocksCredits: false
  },
  "inspect-rustling-grass": {
    kind: REQUEST_KIND.GENERAL,
    archetype: REQUEST_ARCHETYPE.ABILITY_UNLOCK,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.SPRIG,
    placeholderState: "final",
    blocksCredits: false
  },
  "grow-a-home-patch": {
    kind: REQUEST_KIND.GENERAL,
    archetype: REQUEST_ARCHETYPE.HABITAT_HOME,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.SPRIG,
    placeholderState: "final",
    blocksCredits: false
  },
  "chopper-first-habitat-report": {
    kind: REQUEST_KIND.GENERAL,
    archetype: REQUEST_ARCHETYPE.ESCORT_FOLLOW,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    characterArcId: CHARACTER_ARC_IDS.CHOPPER,
    placeholderState: "final",
    blocksCredits: false
  }
});

const CURRENT_QUEST_TAXONOMY = deepFreeze(SMALL_ISLAND_QUESTS.map((quest) => ({
  id: quest.id,
  ...CURRENT_QUEST_TAXONOMY_BY_ID[quest.id]
})));

export function listCurrentQuestTaxonomy() {
  return CURRENT_QUEST_TAXONOMY;
}

export function getCurrentQuestTaxonomyById(id) {
  return CURRENT_QUEST_TAXONOMY.find((entry) => entry.id === id) || null;
}

export function getCurrentQuestTaxonomyGaps() {
  return listCurrentQuestTaxonomy()
    .map((entry) => {
      const missing = [];

      if (!CURRENT_QUEST_TAXONOMY_BY_ID[entry.id]) {
        missing.push("taxonomy");
      }

      missing.push(...getRequestTaxonomyValidationErrors(entry));

      return {
        id: entry.id,
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}
