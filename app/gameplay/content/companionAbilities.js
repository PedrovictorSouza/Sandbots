import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "../../story/sandbotsLexicon.js";

export const COMPANION_ABILITY_STATUS = Object.freeze({
  ACTIVE: "active",
  PARTIAL: "partial",
  PLANNED: "planned"
});

export const COMPANION_ABILITY_KIND = Object.freeze({
  FIELD_MOVE: "field-move",
  HELPER_EVENT: "helper-event"
});

export const COMPANION_ABILITY_DESIGN_FIELDS = Object.freeze([
  "benefit",
  "limit",
  "validTarget",
  "firstSafeUse",
  "feedback",
  "synergy"
]);

export const COMPANION_ABILITY_FIRST_USE_FIELDS = Object.freeze([
  "validTarget",
  "prompt",
  "firstSafeUse",
  "safeFailure",
  "feedback",
  "reward",
  "nextHook"
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const COMPANION_ABILITIES = deepFreeze([
  {
    id: "squirtle-water-gun",
    companionId: "squirtle",
    companionName: SANDBOTS_BOT_NAMES.hydro,
    element: "water",
    abilityId: "waterGun",
    moveId: "water-gun",
    label: SANDBOTS_ITEM_NAMES.hydroTool,
    status: COMPANION_ABILITY_STATUS.ACTIVE,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "pokedex-reward",
      storyBeatId: "squirtle-discovery",
      questEvent: {
        type: "UNLOCK",
        targetId: "waterGun"
      },
      when: `After ${SANDBOTS_BOT_NAMES.hydro} is discovered and the Colony Codex reward flow completes.`
    },
    runtime: {
      skillDefId: "waterGun",
      activeFieldMove: true
    },
    targets: [
      "dry-ground",
      "dry-tall-grass",
      "leppa-tree",
      "waterable-palm"
    ],
    worldEffects: [
      "revitalizes dried up plants",
      "revitalizes dried up terrain",
      "waters crops"
    ],
    design: {
      benefit: "Restores drought-damaged terrain and plants into usable colony ground.",
      limit: "Requires a valid dry target and visible Hydro Bot travel/prep time.",
      validTarget: "Dry ground, dry tall grass, thirsty trees, palms, and future crop targets.",
      prompt: "Aim Hydro Jet at dry ground or thirsty plants.",
      firstSafeUse: "A nearby dry patch in the opening field with clear target feedback.",
      safeFailure: "Already-restored or invalid targets keep the charge and show a short no-target hint.",
      feedback: "Water identity, helper movement, ground-state change, and restoration notice.",
      reward: "The dry tile visibly restores into usable colony ground.",
      nextHook: "Restored ground can support Grow Bot's Bio-Grow.",
      synergy: "Creates restored ground that Grow Bot can later turn into habitat."
    },
    notes: "First formal field tool. It teaches the player that bot tools can change terrain.",
    narrativePurpose: "Shows that care can reverse drought and make damaged ground useful again."
  },
  {
    id: "bulbasaur-leafage",
    companionId: "bulbasaur",
    companionName: SANDBOTS_BOT_NAMES.grow,
    element: "grass",
    abilityId: "leafage",
    moveId: "leafage",
    label: SANDBOTS_ITEM_NAMES.growTool,
    status: COMPANION_ABILITY_STATUS.ACTIVE,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "story-beat",
      storyBeatId: "bulbasaur-leafage-reward",
      questId: "inspect-rustling-grass",
      questEvent: {
        type: "TALK",
        targetId: "leaf-helper"
      },
      when: `After the player waters ${SANDBOTS_BOT_NAMES.grow}'s dry grass request and returns to it.`
    },
    runtime: {
      skillDefId: "leafage",
      activeFieldMove: true
    },
    targets: [
      "tall-grass-patch-area"
    ],
    worldEffects: [
      "creates patches of tall grass"
    ],
    design: {
      benefit: "Turns restored ground into habitat growth and colony-zone clues.",
      limit: "Only works on restored ground; dry or unstable terrain must be repaired first.",
      validTarget: "Restored ground patches that can support tall grass or small habitat growth.",
      prompt: "Use Bio-Grow on restored ground.",
      firstSafeUse: "A ground patch recently restored with Hydro Jet.",
      safeFailure: "Dry or unstable ground points back to Hydro Jet before growth is allowed.",
      feedback: "Green growth identity, tile outline, plant spawn, rustle, and habitat hint.",
      reward: "Tall grass grows as a visible habitat clue.",
      nextHook: "The new habitat growth points toward shelter and colony social progression.",
      synergy: "Uses Hydro Bot's restored soil to reveal social/habitat progression."
    },
    notes: "Second formal companion field move. It turns restored terrain into habitat.",
    narrativePurpose: "Turns restored ground into a social invitation for habitats and companions."
  },
  {
    id: "scyther-cut",
    companionId: "scyther",
    companionName: "Cutter Bot",
    element: "bug",
    abilityId: "cut",
    moveId: "cut",
    label: "Cut",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Cutter Bot teaches Cut when its quest chain is designed."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: true
    },
    targets: [
      "grass",
      "lumber",
      "wooden-material-source"
    ],
    worldEffects: [
      "cuts grass",
      "cuts lumber",
      "gathers materials"
    ],
    notes: "Planned material-gathering and route-clearing move.",
    narrativePurpose: "Turns overgrowth into building material without making cleanup feel like destruction."
  },
  {
    id: "hitmonchan-rock-smash",
    companionId: "hitmonchan",
    companionName: "Impact Bot",
    element: "fighting",
    abilityId: "rockSmash",
    moveId: "rock-smash",
    label: "Rock Smash",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Impact Bot teaches Rock Smash when its quest chain is designed."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: true
    },
    targets: [
      "terrain-block",
      "rock-material-source"
    ],
    worldEffects: [
      "destroys blocks of terrain",
      "gathers materials"
    ],
    notes: "Planned terrain destruction and stone/material collection move.",
    narrativePurpose: "Lets the ridge repair story transform blocked stone into useful community resources."
  },
  {
    id: "drilbur-rototiller",
    companionId: "drilbur",
    companionName: "Drill Bot",
    element: "ground",
    abilityId: "rototiller",
    moveId: "rototiller",
    label: "Rototiller",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Drill Bot teaches Rototiller when its farming quest chain is designed."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: true
    },
    targets: [
      "field",
      "flower-bed",
      "crop"
    ],
    worldEffects: [
      "tills fields into plantable soil",
      "moves flower beds",
      "moves crops"
    ],
    notes: "Planned farming and habitat-arrangement move.",
    narrativePurpose: "Makes cultivation and habitat arrangement part of long-term island care."
  },
  {
    id: "magikarp-jump",
    companionId: "magikarp",
    companionName: "Ferry Bot",
    element: "water",
    abilityId: "jump",
    moveId: "jump",
    label: "Jump",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Ferry Bot teaches Jump when island and mountain traversal is designed."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: true
    },
    targets: [
      "island-gap",
      "mountain-step",
      "vertical-traversal-point"
    ],
    worldEffects: [
      "springs upward",
      "traverses islands",
      "traverses mountains"
    ],
    notes: "Planned traversal move. The player can jump now, but this records the formal learned-move source.",
    narrativePurpose: "Frames vertical traversal as confidence earned from helping isolated places reconnect."
  },
  {
    id: "machoke-strength",
    companionId: "machoke",
    companionName: "Hauler Bot",
    element: "fighting",
    abilityId: "strength",
    moveId: "strength",
    label: "Strength",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Hauler Bot teaches Strength when heavy object puzzles are designed."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: true
    },
    targets: [
      "heavy-object",
      "route-blocker",
      "object-placement-target"
    ],
    worldEffects: [
      "pushes objects",
      "pulls objects",
      "moves heavy objects into specific locations"
    ],
    notes: "Planned puzzle and route-clearing move.",
    narrativePurpose: "Makes heavy repairs collaborative by turning blocked routes into placement puzzles."
  },
  {
    id: "paldean-wooper-suck",
    companionId: "paldean-wooper",
    companionName: "Mud Bot",
    element: "poison-ground",
    abilityId: "suck",
    moveId: "suck",
    label: "Suck",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Mud Bot teaches Suck when liquid relocation puzzles are designed."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: true
    },
    targets: [
      "liquid-source",
      "liquid-placement-target",
      "water-source-target"
    ],
    worldEffects: [
      "sucks up liquids",
      "carries liquids",
      "spits liquids elsewhere",
      "creates new water sources"
    ],
    notes: "Planned liquid relocation move.",
    narrativePurpose: "Lets water problems become routing choices instead of static blockers."
  },
  {
    id: "charmander-fire",
    companionId: "charmander",
    companionName: SANDBOTS_BOT_NAMES.thermal,
    element: "fire",
    abilityId: "fire",
    moveId: "fire",
    label: SANDBOTS_ITEM_NAMES.thermalTool,
    status: COMPANION_ABILITY_STATUS.PARTIAL,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "story-beat",
      storyBeatId: "charmander-discovery",
      questEvent: {
        type: "UNLOCK",
        targetId: "fire"
      },
      when: `${SANDBOTS_BOT_NAMES.thermal} is discovered in the ${SANDBOTS_ITEM_NAMES.growTool} tall grass habitat.`
    },
    currentRuntime: {
      storyBeatId: "charmander-campfire-lit",
      storyFlag: "charmanderCampfireLit",
      behavior: `${SANDBOTS_BOT_NAMES.thermal} can be selected as a field tool helper and can move into the ${SANDBOTS_ITEM_NAMES.thermalCabin}.`
    },
    runtime: {
      skillDefId: "fire",
      activeFieldMove: true
    },
    targets: [
      "train-house",
      "white-ground"
    ],
    worldEffects: [
      `turns the ${SANDBOTS_ITEM_NAMES.thermalCabin} into ${SANDBOTS_BOT_NAMES.thermal}'s home`,
      `turns white ground into dry ground for ${SANDBOTS_ITEM_NAMES.hydroTool} restoration`
    ],
    design: {
      benefit: "Adds heat, shelter, and terrain preparation to the restoration chain.",
      limit: "Needs Carbon charge and only affects heat-compatible targets.",
      validTarget: "Thermal Cabin, white ground, and future cold or heat-starved systems.",
      prompt: "Use Thermal Torch on a shelter or heat-starved ground.",
      firstSafeUse: "A clear shelter or white-ground target near the early restored route.",
      safeFailure: "Wet, healthy, or non-thermal targets keep the charge and explain they do not need heat.",
      feedback: "Warm light, ember/spark identity, target conversion, and comfort notice.",
      reward: "The target warms up or becomes ready for Hydro Jet restoration.",
      nextHook: "Heat can prepare terrain that water could not restore by itself.",
      synergy: "Prepares white ground so Hydro Jet can restore it instead of solving drought alone."
    },
    notes: `Field tool: selectable after ${SANDBOTS_BOT_NAMES.thermal} discovery; supports its home and terrain burn interactions.`,
    narrativePurpose: "Uses warmth to turn shelter and gathering places into emotional recovery beats."
  }
]);

export function listCompanionAbilities() {
  return COMPANION_ABILITIES;
}

export function getCompanionAbilityByCompanion(companionId) {
  return COMPANION_ABILITIES.find((ability) => ability.companionId === companionId) || null;
}

export function getCompanionAbilityByAbilityId(abilityId) {
  return COMPANION_ABILITIES.find((ability) => ability.abilityId === abilityId) || null;
}

export function getCompanionAbilityDesignGaps(abilities = COMPANION_ABILITIES) {
  return abilities
    .filter((ability) => ability.kind === COMPANION_ABILITY_KIND.FIELD_MOVE)
    .filter((ability) => ability.status !== COMPANION_ABILITY_STATUS.PLANNED)
    .map((ability) => ({
      abilityId: ability.abilityId,
      companionName: ability.companionName,
      missing: COMPANION_ABILITY_DESIGN_FIELDS.filter((field) => !ability.design?.[field])
    }))
    .filter((entry) => entry.missing.length > 0);
}

export function getCompanionAbilityFirstUseGaps(abilities = COMPANION_ABILITIES) {
  return abilities
    .filter((ability) => ability.kind === COMPANION_ABILITY_KIND.FIELD_MOVE)
    .filter((ability) => ability.status !== COMPANION_ABILITY_STATUS.PLANNED)
    .map((ability) => ({
      abilityId: ability.abilityId,
      companionName: ability.companionName,
      missing: COMPANION_ABILITY_FIRST_USE_FIELDS.filter((field) => !ability.design?.[field])
    }))
    .filter((entry) => entry.missing.length > 0);
}
