import {
  COMPANION_ABILITY_KIND,
  listCompanionAbilities
} from "../gameplay/content/companionAbilities.js";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "../story/sandbotsLexicon.js";

export const MOVE_STATUS = Object.freeze({
  ACTIVE: "active",
  PARTIAL: "partial",
  PLANNED: "planned"
});

export const MOVE_CATEGORY = Object.freeze({
  REGULAR: "regular",
  TRANSFORMATION: "transformation"
});

const FIELD_MOVE_PRESENTATION = Object.freeze({
  "water-gun": {
    learnedFromNpcId: "stranded-helper",
    effects: ["restore-dry-plants", "restore-dry-terrain", "water-crops"],
    inputHint: "RT / Enter near target",
    design: {
      benefit: "Restores dry ground, dry plants, and future crop targets.",
      limit: `Requires a marked valid target and ${SANDBOTS_BOT_NAMES.hydro} travel time.`,
      feedback: `Target prompt, ${SANDBOTS_BOT_NAMES.hydro} movement, restored tile state, and restoration notice.`,
      firstSafeUse: "A nearby dry grass or dry ground patch in the opening field."
    },
    activeGuidance: `${SANDBOTS_ITEM_NAMES.hydroTool}: mark dry ground for ${SANDBOTS_BOT_NAMES.hydro}.`,
    firstUseGuidance: `${SANDBOTS_ITEM_NAMES.hydroTool}: mark dry ground; ${SANDBOTS_BOT_NAMES.hydro} will move over and restore it.`,
    firstUseCompleteFlags: ["firstGrassRestored"],
    targetPrompts: {
      ground: `[Enter] Mark dry ground for ${SANDBOTS_BOT_NAMES.hydro}`
    }
  },
  leafage: {
    learnedFromNpcId: "leaf-helper",
    effects: ["create-tall-grass", "create-leafy-home-patch"],
    inputHint: "RT / Enter near target",
    design: {
      benefit: "Creates tall grass patches for colony zones and bot gathering.",
      limit: "Only works on restored ground, never on still-dry terrain.",
      feedback: `Tile outline, ${SANDBOTS_BOT_NAMES.grow} action, tall grass spawn, and habitat rustle.`,
      firstSafeUse: `A restored ground patch created with ${SANDBOTS_ITEM_NAMES.hydroTool}.`
    },
    activeGuidance: `${SANDBOTS_ITEM_NAMES.growTool}: grow tall grass on restored ground.`,
    firstUseGuidance: `${SANDBOTS_ITEM_NAMES.growTool}: use it on restored ground to grow tall grass.`,
    firstUseCompleteFlags: ["leafageTallGrassCount", "leafageTallGrassHabitatCreated"],
    targetPrompts: {
      ground: `[Enter] Use ${SANDBOTS_ITEM_NAMES.growTool} to grow tall grass`
    }
  },
  fire: {
    learnedFromNpcId: "charmander",
    effects: ["burn-white-ground", "prepare-dry-ground"],
    inputHint: "RT / Enter near target",
    design: {
      benefit: `Turns white ground into dry ground so ${SANDBOTS_ITEM_NAMES.hydroTool} can restore it later.`,
      limit: "Only works on white ground, and still needs the terrain action wiring.",
      feedback: `${SANDBOTS_BOT_NAMES.thermal} selection and target prompt first; terrain conversion feedback comes with the action implementation.`,
      firstSafeUse: "A white ground tile near the restored habitat route."
    },
    activeGuidance: `${SANDBOTS_ITEM_NAMES.thermalTool}: burn white ground into dry ground.`,
    firstUseGuidance: `${SANDBOTS_ITEM_NAMES.thermalTool}: use it on white ground, then swap to ${SANDBOTS_ITEM_NAMES.hydroTool}.`,
    firstUseCompleteFlags: ["fireWhiteGroundBurned"],
    targetPrompts: {
      ground: `[Enter] Use ${SANDBOTS_ITEM_NAMES.thermalTool} on white ground`
    }
  },
  cut: {
    learnedFromNpcId: "woodcutter-helper",
    effects: ["cut-grass", "cut-vines", "cut-wooden-objects", "gather-wood-materials"],
    inputHint: "TBD"
  },
  "rock-smash": {
    learnedFromNpcId: "stone-helper",
    effects: ["break-rocks", "break-terrain-blocks", "gather-stone-materials"],
    inputHint: "TBD"
  },
  rototiller: {
    learnedFromNpcId: "field-helper",
    effects: ["till-soil", "prepare-crop-fields", "move-flower-beds", "move-crops"],
    inputHint: "TBD"
  },
  jump: {
    learnedFromNpcId: "spring-helper",
    effects: ["traverse-ledges", "reach-low-platforms"],
    inputHint: "Space / B"
  },
  strength: {
    learnedFromNpcId: "builder-helper",
    effects: ["push-heavy-objects", "pull-heavy-objects", "move-route-blockers"],
    inputHint: "TBD"
  },
  suck: {
    learnedFromNpcId: "mud-helper",
    effects: ["collect-liquid", "place-liquid", "create-water-source"],
    inputHint: "TBD"
  }
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function buildRegularMoveFromAbility(ability) {
  const presentation = FIELD_MOVE_PRESENTATION[ability.moveId] || {};

  return {
    id: ability.moveId,
    abilityId: ability.abilityId,
    label: ability.label,
    category: MOVE_CATEGORY.REGULAR,
    status: ability.status,
    learnedFromNpcId: presentation.learnedFromNpcId || ability.companionId,
    unlockId: ability.runtime?.skillDefId || ability.abilityId,
    requiredBot: ability.companionName,
    requiredBotId: ability.companionId,
    requiredPokemon: ability.companionName,
    requiredPokemonId: ability.companionId,
    effects: presentation.effects || [],
    worldEffects: ability.worldEffects,
    inputHint: presentation.inputHint || "TBD",
    design: presentation.design || null,
    activeGuidance: presentation.activeGuidance || null,
    firstUseGuidance: presentation.firstUseGuidance || null,
    firstUseCompleteFlags: presentation.firstUseCompleteFlags || [],
    targetPrompts: presentation.targetPrompts || {},
    notes: ability.notes
  };
}

const REGULAR_MOVES = listCompanionAbilities()
  .filter((ability) => ability.kind === COMPANION_ABILITY_KIND.FIELD_MOVE)
  .map(buildRegularMoveFromAbility);

const TRANSFORMATION_MOVES = [
  {
    id: "surf",
    label: "Surf",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    abilityId: "surf",
    requiredBot: null,
    requiredBotId: null,
    requiredPokemon: null,
    requiredPokemonId: null,
    learnedFromNpcId: "ferry-helper",
    effects: ["travel-across-water"],
    worldEffects: ["travels across water"],
    inputHint: "Contextual",
    notes: "Future water traversal transformation."
  },
  {
    id: "waterfall",
    label: "Waterfall",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    abilityId: "waterfall",
    requiredBot: null,
    requiredBotId: null,
    requiredPokemon: null,
    requiredPokemonId: null,
    learnedFromNpcId: "cascade-helper",
    effects: ["climb-waterfalls"],
    worldEffects: ["climbs waterfalls"],
    inputHint: "Contextual",
    notes: "Future vertical water traversal."
  },
  {
    id: "camouflage",
    label: "Camouflage",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    abilityId: "camouflage",
    requiredBot: null,
    requiredBotId: null,
    requiredPokemon: null,
    requiredPokemonId: null,
    learnedFromNpcId: "mimic-helper",
    effects: ["transform-into-nearby-object"],
    worldEffects: ["transforms into nearby objects"],
    inputHint: "Contextual",
    notes: "Future stealth/puzzle transformation."
  },
  {
    id: "rollout",
    label: "Rollout",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    abilityId: "rollout",
    requiredBot: null,
    requiredBotId: null,
    requiredPokemon: null,
    requiredPokemonId: null,
    learnedFromNpcId: "rolling-stone-helper",
    effects: ["move-faster", "cross-rough-ground"],
    worldEffects: ["moves faster", "crosses rough ground"],
    inputHint: "Contextual",
    notes: "Future speed traversal transformation."
  },
  {
    id: "glide",
    label: "Glide",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    abilityId: "glide",
    requiredBot: null,
    requiredBotId: null,
    requiredPokemon: null,
    requiredPokemonId: null,
    learnedFromNpcId: "sky-helper",
    effects: ["glide-from-high-places"],
    worldEffects: ["glides from high places"],
    inputHint: "Contextual",
    notes: "Future highland/skyland traversal."
  },
  {
    id: "magnet-rise",
    label: "Magnet Rise",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    abilityId: "magnetRise",
    requiredBot: null,
    requiredBotId: null,
    requiredPokemon: null,
    requiredPokemonId: null,
    learnedFromNpcId: "magnet-helper",
    effects: ["hover", "fly-over-terrain"],
    worldEffects: ["hovers", "flies over terrain"],
    inputHint: "Contextual",
    notes: "Late/post-game traversal candidate."
  }
];

export const SMALL_ISLAND_MOVES = deepFreeze([
  ...REGULAR_MOVES,
  ...TRANSFORMATION_MOVES
]);

export function listSmallIslandMoves() {
  return SMALL_ISLAND_MOVES;
}

export function getSmallIslandMoveById(id) {
  return SMALL_ISLAND_MOVES.find((move) => move.id === id) || null;
}

export function getSmallIslandMoveByAbilityId(abilityId) {
  return SMALL_ISLAND_MOVES.find((move) => move.abilityId === abilityId) || null;
}

function isMoveFirstUseComplete(move, storyFlags) {
  return move.firstUseCompleteFlags.some((flag) => Boolean(storyFlags?.[flag]));
}

export function formatActiveMoveGuidanceByAbilityId(abilityId, {
  pendingWaterGunCount = 0,
  storyFlags = null
} = {}) {
  const move = getSmallIslandMoveByAbilityId(abilityId);

  if (!move) {
    return null;
  }

  if (abilityId === "waterGun" && pendingWaterGunCount > 0) {
    return `${move.label}: ${move.requiredBot || move.requiredPokemon} has ${pendingWaterGunCount} tile${pendingWaterGunCount === 1 ? "" : "s"} queued.`;
  }

  if (
    move.firstUseGuidance &&
    storyFlags &&
    !isMoveFirstUseComplete(move, storyFlags)
  ) {
    return move.firstUseGuidance;
  }

  return move.activeGuidance;
}

export function formatMoveTargetPromptByAbilityId(abilityId, targetKind, {
  pendingWaterGunCount = 0
} = {}) {
  const move = getSmallIslandMoveByAbilityId(abilityId);
  const prompt = move?.targetPrompts?.[targetKind] || null;

  if (!prompt) {
    return null;
  }

  if (abilityId === "waterGun" && targetKind === "ground" && pendingWaterGunCount > 0) {
    return `${prompt} • ${pendingWaterGunCount} queued`;
  }

  return prompt;
}

export function getPlayableMovePresentationGaps(moves = SMALL_ISLAND_MOVES) {
  return moves
    .filter((move) => {
      return move.category === MOVE_CATEGORY.REGULAR && move.status === MOVE_STATUS.ACTIVE;
    })
    .map((move) => {
      const missing = [];

      if (!move.activeGuidance) {
        missing.push("activeGuidance");
      }
      if (!move.firstUseGuidance) {
        missing.push("firstUseGuidance");
      }
      if (!move.firstUseCompleteFlags || move.firstUseCompleteFlags.length === 0) {
        missing.push("firstUseCompleteFlags");
      }
      if (!move.targetPrompts || Object.keys(move.targetPrompts).length === 0) {
        missing.push("targetPrompts");
      }

      return {
        id: move.id,
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}

export function getPlayableMoveDesignGaps(moves = SMALL_ISLAND_MOVES) {
  return moves
    .filter((move) => {
      return move.category === MOVE_CATEGORY.REGULAR && move.status === MOVE_STATUS.ACTIVE;
    })
    .map((move) => {
      const missing = [];
      const design = move.design || {};

      for (const field of ["benefit", "limit", "feedback", "firstSafeUse"]) {
        if (!design[field]) {
          missing.push(field);
        }
      }

      return {
        id: move.id,
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}
