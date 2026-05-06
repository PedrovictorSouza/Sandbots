import {
  MACRO_BIOME_COMPLETION_TOKENS,
  MACRO_BIOME_IDS
} from "./biomeProgressionData.js";
import { CHARACTER_ARC_IDS } from "./characterArcData.js";

export const SKYFORGE_REPAIR_STAGE_IDS = Object.freeze({
  FOUNDATION_LIFT: "foundation-lift",
  SPIRE_FRAME: "spire-frame",
  BEACON_CORE: "beacon-core"
});

export const SKYFORGE_FINAL_RANK_ID = "skyforge-beacon-restorer";
export const SKYFORGE_RETURN_GATE_ID = "skyforge-return-gate";

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const SKYFORGE_REPAIR_STAGES = deepFreeze([
  {
    id: SKYFORGE_REPAIR_STAGE_IDS.FOUNDATION_LIFT,
    order: 1,
    title: "Restore the Lift Footing",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    ownerSystem: "Quest State Machine / Scenario System",
    helperArcIds: [
      CHARACTER_ARC_IDS.AERO
    ],
    requiredEntryTokenIds: [
      MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
      MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL
    ],
    recipeFamilies: [
      "lift-platform-pieces",
      "concrete-processing"
    ],
    unlocks: [
      "platform-lift-access"
    ]
  },
  {
    id: SKYFORGE_REPAIR_STAGE_IDS.SPIRE_FRAME,
    order: 2,
    title: "Rebuild the Spire Frame",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    ownerSystem: "Quest State Machine",
    helperArcIds: [
      CHARACTER_ARC_IDS.TOVA
    ],
    requiredPreviousStageId: SKYFORGE_REPAIR_STAGE_IDS.FOUNDATION_LIFT,
    recipeFamilies: [
      "advanced-utility-items",
      "large-building-parts",
      "final-region-decor"
    ],
    unlocks: [
      "upper-platform-route"
    ]
  },
  {
    id: SKYFORGE_REPAIR_STAGE_IDS.BEACON_CORE,
    order: 3,
    title: "Complete the Beacon Core",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    ownerSystem: "Quest State Machine / Final Readiness",
    helperArcIds: [
      CHARACTER_ARC_IDS.AERO,
      CHARACTER_ARC_IDS.TOVA
    ],
    requiredPreviousStageId: SKYFORGE_REPAIR_STAGE_IDS.SPIRE_FRAME,
    recipeFamilies: [
      "rare-machine-parts",
      "final-token-materials"
    ],
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
    finalRankId: SKYFORGE_FINAL_RANK_ID,
    unlocks: [
      SKYFORGE_RETURN_GATE_ID
    ]
  }
]);

const SKYFORGE_RETURN_GATE = deepFreeze({
  id: SKYFORGE_RETURN_GATE_ID,
  macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
  ownerSystem: "Scenario System",
  unlocksWhenStageId: SKYFORGE_REPAIR_STAGE_IDS.BEACON_CORE,
  requiresCompletionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
  destination: "post-story-sandbox"
});

export function listSkyforgeRepairStages() {
  return SKYFORGE_REPAIR_STAGES;
}

export function getSkyforgeRepairStageById(stageId) {
  return SKYFORGE_REPAIR_STAGES.find((stage) => stage.id === stageId) || null;
}

export function getSkyforgeReturnGate() {
  return SKYFORGE_RETURN_GATE;
}
