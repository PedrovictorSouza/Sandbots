export const COMPANION_ABILITY_STATUS = Object.freeze({
  ACTIVE: "active",
  PARTIAL: "partial",
  PLANNED: "planned"
});

export const COMPANION_ABILITY_KIND = Object.freeze({
  FIELD_MOVE: "field-move",
  HELPER_EVENT: "helper-event"
});

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
    companionName: "Squirtle",
    element: "water",
    abilityId: "waterGun",
    moveId: "water-gun",
    label: "Water Gun",
    status: COMPANION_ABILITY_STATUS.ACTIVE,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "pokedex-reward",
      storyBeatId: "squirtle-discovery",
      questEvent: {
        type: "UNLOCK",
        targetId: "waterGun"
      },
      when: "After Squirtle is discovered and the Pokedex reward flow completes."
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
    notes: "First formal companion field move. It teaches the player that Pokemon powers change terrain."
  },
  {
    id: "bulbasaur-leafage",
    companionId: "bulbasaur",
    companionName: "Bulbasaur",
    element: "grass",
    abilityId: "leafage",
    moveId: "leafage",
    label: "Leafage",
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
      when: "After the player waters Bulbasaur's dry grass request and returns to Bulbasaur."
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
    notes: "Second formal companion field move. It turns restored terrain into habitat."
  },
  {
    id: "scyther-cut",
    companionId: "scyther",
    companionName: "Scyther",
    element: "bug",
    abilityId: "cut",
    moveId: "cut",
    label: "Cut",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Scyther teaches Cut when its quest chain is designed."
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
    notes: "Planned material-gathering and route-clearing move."
  },
  {
    id: "hitmonchan-rock-smash",
    companionId: "hitmonchan",
    companionName: "Hitmonchan",
    element: "fighting",
    abilityId: "rockSmash",
    moveId: "rock-smash",
    label: "Rock Smash",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Hitmonchan teaches Rock Smash when its quest chain is designed."
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
    notes: "Planned terrain destruction and stone/material collection move."
  },
  {
    id: "drilbur-rototiller",
    companionId: "drilbur",
    companionName: "Drilbur",
    element: "ground",
    abilityId: "rototiller",
    moveId: "rototiller",
    label: "Rototiller",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Drilbur teaches Rototiller when its farming quest chain is designed."
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
    notes: "Planned farming and habitat-arrangement move."
  },
  {
    id: "magikarp-jump",
    companionId: "magikarp",
    companionName: "Magikarp",
    element: "water",
    abilityId: "jump",
    moveId: "jump",
    label: "Jump",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Magikarp teaches Jump when island and mountain traversal is designed."
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
    notes: "Planned traversal move. The player can jump now, but this records the formal learned-move source."
  },
  {
    id: "machoke-strength",
    companionId: "machoke",
    companionName: "Machoke",
    element: "fighting",
    abilityId: "strength",
    moveId: "strength",
    label: "Strength",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Machoke teaches Strength when heavy object puzzles are designed."
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
    notes: "Planned puzzle and route-clearing move."
  },
  {
    id: "paldean-wooper-suck",
    companionId: "paldean-wooper",
    companionName: "Paldean Wooper",
    element: "poison-ground",
    abilityId: "suck",
    moveId: "suck",
    label: "Suck",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
    unlock: {
      source: "planned-skill",
      when: "Paldean Wooper teaches Suck when liquid relocation puzzles are designed."
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
    notes: "Planned liquid relocation move."
  },
  {
    id: "charmander-ember",
    companionId: "charmander",
    companionName: "Charmander",
    element: "fire",
    abilityId: "ember",
    moveId: "ember",
    label: "Ember",
    status: COMPANION_ABILITY_STATUS.PLANNED,
    kind: COMPANION_ABILITY_KIND.HELPER_EVENT,
    unlock: {
      source: "planned-skill",
      storyBeatId: "charmander-discovery",
      when: "Charmander is discovered in the Leafage tall grass habitat. The formal player skill still needs design."
    },
    currentRuntime: {
      storyBeatId: "charmander-campfire-lit",
      storyFlag: "charmanderCampfireLit",
      behavior: "Charmander currently follows the player and lights the Campfire as a companion event."
    },
    runtime: {
      skillDefId: null,
      activeFieldMove: false
    },
    targets: [
      "campfire",
      "future-fire-target"
    ],
    worldEffects: [
      "lights campfires",
      "enables fire-based habitat interactions"
    ],
    notes: "This captures the intended fire ability slot before it becomes a formal player field move."
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
