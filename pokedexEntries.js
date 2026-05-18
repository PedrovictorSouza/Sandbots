import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "./app/story/sandbotsLexicon.js";

export const SQUIRTLE_POKEDEX_ENTRY_ID = "squirtle";
export const BULBASAUR_POKEDEX_ENTRY_ID = "bulbasaur";
export const CHARMANDER_POKEDEX_ENTRY_ID = "charmander";
export const TIMBURR_POKEDEX_ENTRY_ID = "timburr";
export const FLOWER_BED_POKEDEX_ENTRY_ID = "prettyFlowerBed";
export const TALL_GRASS_POKEDEX_ENTRY_ID = "tallGrass";
export const THERMAL_GENERATOR_POKEDEX_ENTRY_ID = "thermalGeneratorDiagnostic";

function createPokedexToken(label, variant, glyph) {
  return `<span class="pokedex-entry__where-token pokedex-entry__where-token--${variant}" aria-label="${label}" title="${label}">${glyph}</span>`;
}

function createPokedexTokenRow(tokens) {
  return `<span class="pokedex-entry__where-token-row">${tokens.join("")}</span>`;
}

function createTallGrassWherePreview() {
  return `
    <span class="pokedex-entry__where-preview pokedex-entry__where-preview--tall-grass" aria-hidden="true">
      <span class="pokedex-entry__where-preview-cloud pokedex-entry__where-preview-cloud--one"></span>
      <span class="pokedex-entry__where-preview-cloud pokedex-entry__where-preview-cloud--two"></span>
      <span class="pokedex-entry__where-preview-hill"></span>
      <span class="pokedex-entry__where-preview-bed">
        <span class="pokedex-entry__where-preview-tuft pokedex-entry__where-preview-tuft--one"></span>
        <span class="pokedex-entry__where-preview-tuft pokedex-entry__where-preview-tuft--two"></span>
        <span class="pokedex-entry__where-preview-tuft pokedex-entry__where-preview-tuft--three"></span>
        <span class="pokedex-entry__where-preview-tuft pokedex-entry__where-preview-tuft--four"></span>
      </span>
    </span>
  `;
}

export const POKEDEX_ENTRIES = {
  [SQUIRTLE_POKEDEX_ENTRY_ID]: {
    id: SQUIRTLE_POKEDEX_ENTRY_ID,
    number: "Bot H-01",
    name: SANDBOTS_BOT_NAMES.hydro,
      theme: "water",
      artVariant: "squirtle",
      details: {
        eyebrow: "Details",
        species: "Hydro Utility Bot",
        descriptionHtml:
        `Compact field helper calibrated for ${SANDBOTS_ITEM_NAMES.hydroTool} pressure, tree revival, and emergency hydration work.`,
      stats: [
        { label: "Build", value: "Compact" },
        { label: "Mass", value: "Light" },
        { label: "Role", badgeIcon: "\u{1F4A7}", badgeLabel: "Hydro" }
      ]
    },
    whereToFind: {
      eyebrow: "Where to Find",
      pin: "???",
      island: "?",
      count: "1/2",
      stats: [
        { label: "Time", value: "???" },
        { label: "Weather", value: "???" }
      ]
    },
    specialties: {
      eyebrow: "Functions & Care",
      specialtyTitle: "Function",
      specialtyIcon: "\u{1F4A7}",
      specialtyLabel: "Hydro recovery",
      favoritesTitle: "Care Notes",
      favorites: [
        "Clean tanks",
        "Clear channels",
        "Hydrated soil",
        "Light maintenance",
        "Group routines",
        "Low grit intake"
      ],
      habitatTitle: "Ideal Habitat",
      habitatCopy: "Humid"
    },
    artCard: {
      title: "Scout Log",
      time: "Humid",
      rarity: "Partner"
    },
    drawer: null
  },
  [BULBASAUR_POKEDEX_ENTRY_ID]: {
    id: BULBASAUR_POKEDEX_ENTRY_ID,
    number: "Bot G-01",
    name: SANDBOTS_BOT_NAMES.grow,
    theme: "forest",
    artVariant: "bulbasaur",
    details: {
      eyebrow: "Details",
      species: "Bio-Growth Utility Bot",
      descriptionHtml:
        `Maintains seed tanks, soil routines, and ${SANDBOTS_ITEM_NAMES.growTool} patterns for early habitat recovery.`,
      stats: [
        { label: "Build", value: "Field" },
        { label: "Mass", value: "Medium" },
        { label: "Role", badgeIcon: "\u273F", badgeLabel: "Growth" }
      ]
    },
    whereToFind: {
      eyebrow: "Where to Find",
      pin: "Tall grass",
      island: "",
      islandHtml: createTallGrassWherePreview(),
      count: "1/2",
      stats: [
        {
          label: "Time",
          value: "Morning / Day / Sunset / Night",
          valueHtml: createPokedexTokenRow([
            createPokedexToken("Morning", "morning", "\u25D0"),
            createPokedexToken("Day", "day", "\u2600"),
            createPokedexToken("Sunset", "sunset", "\u25D1"),
            createPokedexToken("Night", "night", "\u263E")
          ])
        },
        {
          label: "Weather",
          value: "Sunny / Cloudy / Rainy",
          valueHtml: createPokedexTokenRow([
            createPokedexToken("Sunny", "sunny", "\u2600"),
            createPokedexToken("Cloudy", "cloudy", "\u2601"),
            createPokedexToken("Rainy", "rainy", "\u2614")
          ])
        }
      ]
    },
    specialties: {
      eyebrow: "Functions & Care",
      specialtyTitle: "Function",
      specialtyIcon: "\uD83C\uDF31",
      specialtyLabel: "Habitat growth",
      favoritesTitle: "Care Notes",
      favorites: [
        "Restored soil",
        "Soft ground",
        "Seed trays",
        "Steady water",
        "Group routines",
        "Morning light"
      ],
      habitatTitle: "Ideal Habitat",
      habitatCopy: "Bright"
    },
    artCard: {
      title: "Details",
      time: "Day",
      rarity: "Common"
    },
    drawer: null
  },
  [CHARMANDER_POKEDEX_ENTRY_ID]: {
    id: CHARMANDER_POKEDEX_ENTRY_ID,
    number: "Bot T-01",
    name: SANDBOTS_BOT_NAMES.thermal,
    theme: "ember",
    artVariant: "charmander",
      details: {
        eyebrow: "Details",
        species: "Thermal Utility Bot",
        descriptionHtml:
        "A recovered thermal helper that keeps small shelters warm and marks cold zones that still need power.",
      stats: [
        { label: "Build", value: "Thermal" },
        { label: "Mass", value: "Light" },
        { label: "Role", badgeIcon: "\u{1F525}", badgeLabel: "Heat" }
      ]
    },
    whereToFind: {
      eyebrow: "Where to Find",
      pin: "Tall grass",
      island: "",
      islandHtml: createTallGrassWherePreview(),
      count: "1/2",
      stats: [
        { label: "Time", value: "Day / Sunset" },
        { label: "Weather", value: "Clear" }
      ]
    },
    specialties: {
      eyebrow: "Functions & Care",
      specialtyTitle: "Function",
      specialtyIcon: "\u{1F525}",
      specialtyLabel: "Shelter stability",
      favoritesTitle: "Care Notes",
      favorites: [
        "Thermal cabins",
        "Warm shelters",
        "Fresh tall grass",
        "Dry fuel",
        "Brave helpers",
        "Cozy habitats"
      ],
      habitatTitle: "Ideal Habitat",
      habitatCopy: "Warm"
    },
    artCard: {
      title: "Details",
      time: "Sunset",
      rarity: "Common"
    },
    drawer: null
  },
  [TIMBURR_POKEDEX_ENTRY_ID]: {
    id: TIMBURR_POKEDEX_ENTRY_ID,
    number: "Bot B-01",
    name: SANDBOTS_BOT_NAMES.builder,
    theme: "stone",
    artVariant: "timburr",
      details: {
        eyebrow: "Details",
        species: "Builder Utility Bot",
        descriptionHtml:
        "A heavy-materials helper. Boulder shade and tall grass make it steady enough to wake.",
      stats: [
        { label: "Build", value: "Carrier" },
        { label: "Mass", value: "Heavy" },
        { label: "Role", badgeIcon: "\u25C6", badgeLabel: "Build" }
      ]
    },
    whereToFind: {
      eyebrow: "Where to Find",
      pin: "Boulder shade",
      island: "",
      islandHtml: createTallGrassWherePreview(),
      count: "1/2",
      stats: [
        { label: "Time", value: "Day" },
        { label: "Weather", value: "Clear / Cloudy" }
      ]
    },
    specialties: {
      eyebrow: "Functions & Care",
      specialtyTitle: "Function",
      specialtyIcon: "\u25C6",
      specialtyLabel: "Heavy construction",
      favoritesTitle: "Care Notes",
      favorites: [
        "Boulders",
        "Tall grass",
        "Training spots",
        "Timber",
        "Sturdy furniture",
        "Helping with work"
      ],
      habitatTitle: "Ideal Habitat",
      habitatCopy: "Boulder shade"
    },
    artCard: {
      title: "Details",
      time: "Day",
      rarity: "Challenge"
    },
    drawer: null
  },
  [FLOWER_BED_POKEDEX_ENTRY_ID]: {
    id: FLOWER_BED_POKEDEX_ENTRY_ID,
    number: "No. 008",
    name: "Pretty flower bed",
    theme: "blossom",
    artVariant: "flower-bed",
    details: {
      eyebrow: "Details",
      species: "Restored Flora Patch",
      descriptionHtml:
        'A beautiful bed of <span class="pokedex-entry__description-accent">wildflowers</span>.<br />A faint, sweet aroma wafts about it.',
      stats: [
        { label: "Patch Size", value: "4 flowers" },
        { label: "Rarity", value: "Common" },
        { label: "Type", badgeIcon: "\u273F", badgeLabel: "Grass" }
      ]
    },
    whereToFind: {
      eyebrow: "Where to Find",
      pin: "???",
      island: "\u273F",
      count: "1/8",
      stats: [
        { label: "Time", value: "Day" },
        { label: "Weather", value: "Clear" }
      ]
    },
    specialties: {
      eyebrow: "Habitat Notes",
      specialtyTitle: "Function",
      specialtyIcon: "\u273F",
      specialtyLabel: "Bloom",
      favoritesTitle: "Care Inputs",
      favorites: [
        "Purified soil",
        "Morning light",
        "Open meadows",
        "Gentle rainfall",
        "Soft wind",
        "Quiet corners"
      ],
      habitatTitle: "Ideal Habitat",
      habitatCopy: "Restored ground"
    },
    artCard: {
      title: "???",
      time: "Day",
      rarity: "Common"
    },
    drawer: {
      icon: "\u273F",
      label: "Grass",
      count: "x2"
    }
  },
  [TALL_GRASS_POKEDEX_ENTRY_ID]: {
    id: TALL_GRASS_POKEDEX_ENTRY_ID,
    number: "No. 001",
    name: "Tall grass",
    theme: "blossom",
    artVariant: "tall-grass",
    details: {
      eyebrow: "Details",
      species: "Restored Habitat Plot",
      descriptionHtml:
        "Four tufts of tall grass bunched together in a plot.<br />A useful shelter marker for small maintenance bots.",
      stats: [
        { label: "Patch Size", value: "4 tufts" },
        { label: "Rarity", value: "Common" },
        { label: "Type", badgeIcon: "\u273F", badgeLabel: "Grass" }
      ]
    },
    whereToFind: {
      eyebrow: "Where to Find",
      pin: "???",
      island: "\u273F",
      count: "4/8",
      stats: [
        { label: "Time", value: "Day" },
        { label: "Weather", value: "Clear" }
      ]
    },
    specialties: {
      eyebrow: "Habitat Notes",
      specialtyTitle: "Function",
      specialtyIcon: "\u273F",
      specialtyLabel: "Cover",
      favoritesTitle: "Care Inputs",
      favorites: [
        "Purified soil",
        "Clustered growth",
        "Open meadows",
        "Hiding space",
        "Calm weather",
        "Nearby flowers"
      ],
      habitatTitle: "Ideal Habitat",
      habitatCopy: "Layered grass plots"
    },
    artCard: {
      title: "???",
      time: "Day",
      rarity: "Common"
    },
    drawer: null
  },
  [THERMAL_GENERATOR_POKEDEX_ENTRY_ID]: {
    id: THERMAL_GENERATOR_POKEDEX_ENTRY_ID,
    number: "Diag. 001",
    name: "Hydro Wake Diagnostic",
    theme: "water",
    artVariant: "tall-grass",
    details: {
      eyebrow: "Diagnostic",
      species: "Colony System Log",
      descriptionHtml:
        "Hydro Bot answered a weak wake pulse near the starter grove. Direct field contact brought water circulation back online.",
      stats: [
        { label: "Status", value: "Wake sequence" },
        { label: "Signal", value: "Wake pulse" },
        { label: "Type", badgeIcon: "\u{1F4A7}", badgeLabel: "Hydro" }
      ]
    },
    whereToFind: {
      eyebrow: "Logged At",
      pin: "Starter Base",
      island: "GEN",
      count: "1/1",
      stats: [
        { label: "Trigger", value: "Hydro contact" },
        { label: "Outcome", value: "Hydro Jet unlocked" }
      ]
    },
    specialties: {
      eyebrow: "Colony Use",
      specialtyTitle: "Function",
      specialtyIcon: "\u{1F525}",
      specialtyLabel: "Power",
      favoritesTitle: "Care Notes",
      favorites: [
        "Stable fuel",
        "Low heat spikes",
        "Short radio checks",
        "Dry storage",
        `${SANDBOTS_BOT_NAMES.scout} supervision`,
        "Do not ignore humming"
      ],
      habitatTitle: "Next Question",
      habitatCopy: "Why did the water loop fail?"
    },
    artCard: {
      title: "System Log",
      time: "Emergency",
      rarity: "Diagnostic"
    },
    drawer: null
  }
};

export function getPokedexEntry(entryId) {
  return POKEDEX_ENTRIES[entryId] || POKEDEX_ENTRIES[SQUIRTLE_POKEDEX_ENTRY_ID];
}
