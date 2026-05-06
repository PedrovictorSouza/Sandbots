import { WORLD_REGIONS } from "../../gameplayContent.js";
import { MACRO_BIOME_IDS } from "./biomeProgressionData.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const CURRENT_REGION_MACRO_BIOME_BY_ID = deepFreeze({
  "hearth-hollow": {
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    reason: "Current central tutorial and first-home space."
  },
  "north-wool-ridge": {
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    reason: "Existing ridge label and northern raised terrain fit the crafting/ridge arc."
  },
  "east-palm-coast": {
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    reason: "Existing coast label fits the water and cleanup arc."
  },
  "south-marsh": {
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    reason: "Existing marsh terrain fits the water restoration arc."
  },
  "granite-ford": {
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    reason: "Existing granite label fits stone, tools and material mastery."
  },
  "willow-reach": {
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    reason: "Existing natural reach extends the starting restoration space."
  },
  "old-burrow-ruins": {
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    reason: "Existing ruins are reserved for later staged repair progression."
  },
  "outer-north-ridge": {
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    reason: "Outer ridge space extends the crafting/ridge arc."
  },
  "outer-east-steppe": {
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    reason: "Outer eastern expansion is reserved for late traversal and final repair."
  },
  "outer-south-marsh": {
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    reason: "Outer marsh extends the water and cleanup arc."
  },
  "outer-west-plateau": {
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    reason: "Outer plateau is reserved for elevated late-game traversal."
  }
});

const CURRENT_REGION_MACRO_BIOME_MAPPINGS = deepFreeze(WORLD_REGIONS.map((region) => {
  const mapping = CURRENT_REGION_MACRO_BIOME_BY_ID[region.id];

  return {
    id: region.id,
    label: region.label,
    macroBiomeId: mapping?.macroBiomeId || null,
    reason: mapping?.reason || "",
    isMacroBiome: false,
    mappingStatus: "provisional"
  };
}));

export function listInternalRegionMacroBiomeMappings() {
  return CURRENT_REGION_MACRO_BIOME_MAPPINGS;
}

export function getInternalRegionMacroBiomeMappingById(id) {
  return CURRENT_REGION_MACRO_BIOME_MAPPINGS.find((mapping) => mapping.id === id) || null;
}

export function getCurrentRegionMacroBiomeGaps() {
  const knownMacroBiomeIds = new Set(Object.values(MACRO_BIOME_IDS));

  return CURRENT_REGION_MACRO_BIOME_MAPPINGS
    .map((mapping) => {
      const missing = [];

      if (!mapping.macroBiomeId) {
        missing.push("macroBiomeId");
      } else if (!knownMacroBiomeIds.has(mapping.macroBiomeId)) {
        missing.push("known macroBiomeId");
      }

      if (mapping.isMacroBiome !== false) {
        missing.push("internal spatial region marker");
      }

      if (!mapping.reason) {
        missing.push("reason");
      }

      return {
        id: mapping.id,
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}
