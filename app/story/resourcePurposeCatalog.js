import {
  CAMPFIRE_ITEM_ID,
  CARBON_ITEM_ID,
  DITTO_FLAG_ITEM_ID,
  ITEM_DEFS,
  LEAF_DEN_KIT_ITEM_ID,
  LEAVES_ITEM_ID,
  LEPPA_BERRY_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  NITROGEN_ITEM_ID,
  PHOSPHORUS_ITEM_ID,
  POTASSIUM_ITEM_ID,
  SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID,
  STRAW_BED_ITEM_ID,
  STRAW_BED_RECIPE_ITEM_ID,
  WATER_GUN_POWER_ITEM_ID
} from "../../gameplayContent.js";

export const RESOURCE_PURPOSE = Object.freeze({
  BUILD: "build",
  COMFORT: "comfort",
  FUEL: "fuel",
  RECIPE: "recipe",
  RESTORATION: "restoration",
  SHELTER: "shelter",
  STORY: "story",
  TOOL: "tool"
});

const VALID_RESOURCE_PURPOSES = new Set(Object.values(RESOURCE_PURPOSE));
const DEFAULT_PURPOSE_COPY_MIN_WORDS = 4;
const RESOURCE_PURPOSE_CONSEQUENCE_TERMS = Object.freeze([
  "bot",
  "build",
  "colony",
  "construction",
  "dry ground",
  "furniture",
  "grass",
  "habitat",
  "home",
  "recovery",
  "restore",
  "restored",
  "shelter",
  "soil",
  "tool",
  "viability",
  "water"
]);

function normalizePurposeCopy(value) {
  return String(value || "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLocaleLowerCase();
}

function hasPurposeConsequenceCopy(value, terms = RESOURCE_PURPOSE_CONSEQUENCE_TERMS) {
  const normalized = normalizePurposeCopy(value);
  return terms.some((term) => normalized.includes(normalizePurposeCopy(term)));
}

function countPurposeWords(value) {
  const normalized = normalizePurposeCopy(value);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function freezeEntry(entry) {
  return Object.freeze({
    ...entry,
    purposes: Object.freeze([...entry.purposes])
  });
}

export const EARLY_RESOURCE_PURPOSE_ITEM_IDS = Object.freeze([
  WATER_GUN_POWER_ITEM_ID,
  "wood",
  LEPPA_BERRY_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID,
  CAMPFIRE_ITEM_ID,
  LEAVES_ITEM_ID,
  CARBON_ITEM_ID,
  NITROGEN_ITEM_ID,
  PHOSPHORUS_ITEM_ID,
  POTASSIUM_ITEM_ID,
  STRAW_BED_RECIPE_ITEM_ID,
  STRAW_BED_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  DITTO_FLAG_ITEM_ID
]);

const EARLY_RESOURCE_PURPOSES = Object.freeze([
  freezeEntry({
    itemId: WATER_GUN_POWER_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.TOOL, RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Powers Hydro Jet so dry ground can be restored."
  }),
  freezeEntry({
    itemId: "wood",
    purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.COMFORT],
    playerFacingPurpose: "Turns local debris into the first shelter and furniture projects."
  }),
  freezeEntry({
    itemId: LEPPA_BERRY_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.STORY, RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Creates a small bot relationship beat tied to plant recovery."
  }),
  freezeEntry({
    itemId: LOG_CHAIR_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.COMFORT],
    playerFacingPurpose: "Makes habitats feel usable instead of empty."
  }),
  freezeEntry({
    itemId: SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.RECIPE, RESOURCE_PURPOSE.STORY],
    playerFacingPurpose: "Explains why local wood can become colony hardware."
  }),
  freezeEntry({
    itemId: CAMPFIRE_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.SHELTER, RESOURCE_PURPOSE.COMFORT],
    playerFacingPurpose: "Creates the first stable gathering module for a bot."
  }),
  freezeEntry({
    itemId: LEAVES_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Connects restored grass to later habitat construction."
  }),
  freezeEntry({
    itemId: CARBON_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.FUEL],
    playerFacingPurpose: "Feeds Thermal Bot's tool loop."
  }),
  freezeEntry({
    itemId: NITROGEN_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Acts as one nutrient charge for soil and water recovery."
  }),
  freezeEntry({
    itemId: PHOSPHORUS_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Acts as one nutrient charge for soil and water recovery."
  }),
  freezeEntry({
    itemId: POTASSIUM_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Acts as one nutrient charge for soil and water recovery."
  }),
  freezeEntry({
    itemId: STRAW_BED_RECIPE_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.RECIPE, RESOURCE_PURPOSE.STORY],
    playerFacingPurpose: "Turns Grow Bot's notes into a Solar Station protocol."
  }),
  freezeEntry({
    itemId: STRAW_BED_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.RESTORATION],
    playerFacingPurpose: "Marks the first powered habitat support point."
  }),
  freezeEntry({
    itemId: LEAF_DEN_KIT_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.SHELTER],
    playerFacingPurpose: "Turns viability into the first human-ready home site."
  }),
  freezeEntry({
    itemId: DITTO_FLAG_ITEM_ID,
    purposes: [RESOURCE_PURPOSE.STORY, RESOURCE_PURPOSE.COMFORT],
    playerFacingPurpose: "Marks a visible colony milestone."
  })
]);

const EARLY_RESOURCE_PURPOSE_BY_ITEM_ID = Object.freeze(Object.fromEntries(
  EARLY_RESOURCE_PURPOSES.map((entry) => [entry.itemId, entry])
));

export function listEarlyResourcePurposes() {
  return EARLY_RESOURCE_PURPOSES;
}

export function getResourcePurposeByItemId(itemId) {
  return EARLY_RESOURCE_PURPOSE_BY_ITEM_ID[itemId] || null;
}

export function validateResourcePurposeCatalog({
  catalog = EARLY_RESOURCE_PURPOSES,
  requiredItemIds = EARLY_RESOURCE_PURPOSE_ITEM_IDS,
  itemDefs = ITEM_DEFS,
  minimumPurposeCopyWords = DEFAULT_PURPOSE_COPY_MIN_WORDS,
  consequenceTerms = RESOURCE_PURPOSE_CONSEQUENCE_TERMS
} = {}) {
  const errors = [];
  const ids = new Set();

  catalog.forEach((entry, index) => {
    if (!entry?.itemId) {
      errors.push({ type: "missing-item-id", index });
      return;
    }

    if (ids.has(entry.itemId)) {
      errors.push({ type: "duplicate-item-id", itemId: entry.itemId, index });
    }
    ids.add(entry.itemId);

    if (!itemDefs[entry.itemId]) {
      errors.push({ type: "missing-item-def", itemId: entry.itemId, index });
    }

    if (!Array.isArray(entry.purposes) || entry.purposes.length === 0) {
      errors.push({ type: "missing-purpose", itemId: entry.itemId, index });
    } else {
      entry.purposes.forEach((purpose) => {
        if (!VALID_RESOURCE_PURPOSES.has(purpose)) {
          errors.push({ type: "unknown-purpose", itemId: entry.itemId, purpose, index });
        }
      });
    }

    if (!entry.playerFacingPurpose || !String(entry.playerFacingPurpose).trim()) {
      errors.push({ type: "missing-player-facing-purpose", itemId: entry.itemId, index });
    } else {
      if (countPurposeWords(entry.playerFacingPurpose) < minimumPurposeCopyWords) {
        errors.push({ type: "player-facing-purpose-too-vague", itemId: entry.itemId, index });
      }

      if (!hasPurposeConsequenceCopy(entry.playerFacingPurpose, consequenceTerms)) {
        errors.push({
          type: "player-facing-purpose-missing-colony-consequence",
          itemId: entry.itemId,
          index
        });
      }
    }
  });

  requiredItemIds.forEach((itemId) => {
    if (!ids.has(itemId)) {
      errors.push({ type: "missing-required-resource-purpose", itemId });
    }
  });

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}
