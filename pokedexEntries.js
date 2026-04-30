export const SQUIRTLE_POKEDEX_ENTRY_ID = "squirtle";
export const BULBASAUR_POKEDEX_ENTRY_ID = "bulbasaur";
export const CHARMANDER_POKEDEX_ENTRY_ID = "charmander";
export const TIMBURR_POKEDEX_ENTRY_ID = "timburr";
export const FLOWER_BED_POKEDEX_ENTRY_ID = "prettyFlowerBed";
export const TALL_GRASS_POKEDEX_ENTRY_ID = "tallGrass";

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
    number: "No. 007",
    name: "Squirtle",
    theme: "water",
    artVariant: "squirtle",
    details: {
      eyebrow: "Details",
      species: "Tiny Turtle Pokemon",
      descriptionHtml:
        "Shoots water at prey while in the water. Withdraws into its shell when in danger.",
      stats: [
        { label: "Height", value: "1'8\"" },
        { label: "Weight", value: "19.8 lbs." },
        { label: "Type", badgeIcon: "\u{1F4A7}", badgeLabel: "Water" }
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
      eyebrow: "Specialties & Likes",
      specialtyTitle: "Specialties",
      specialtyIcon: "\u{1F4A7}",
      specialtyLabel: "Water",
      favoritesTitle: "Favorites",
      favorites: [
        "Lots of water",
        "Cleanliness",
        "Healing",
        "Cute stuff",
        "Group activities",
        "Sweet flavors"
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
    number: "No. 001",
    name: "Bulbasaur",
    theme: "forest",
    artVariant: "bulbasaur",
    details: {
      eyebrow: "Details",
      species: "Seed Pokemon",
      descriptionHtml:
        "It carries a seed on its back right from birth. As its body grows larger, the seed does too.",
      stats: [
        { label: "Height", value: "2'4\"" },
        { label: "Weight", value: "15.2 lbs." },
        { label: "Type", badgeIcon: "\u273F", badgeLabel: "Grass / Poison" }
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
      eyebrow: "Specialties & Likes",
      specialtyTitle: "Specialties",
      specialtyIcon: "\uD83C\uDF31",
      specialtyLabel: "Grow",
      favoritesTitle: "Favorites",
      favorites: [
        "Lots of nature",
        "Soft stuff",
        "Cute stuff",
        "Lots of water",
        "Group activities",
        "Sweet flavors"
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
    number: "No. 004",
    name: "Charmander",
    theme: "ember",
    artVariant: "charmander",
    details: {
      eyebrow: "Details",
      species: "Lizard Pokemon",
      descriptionHtml:
        "The flame on its tail shows the strength of its life-force. It helps bring warmth back to restored habitats.",
      stats: [
        { label: "Height", value: "2'0\"" },
        { label: "Weight", value: "18.7 lbs." },
        { label: "Type", badgeIcon: "\u{1F525}", badgeLabel: "Fire" }
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
      eyebrow: "Specialties & Likes",
      specialtyTitle: "Specialties",
      specialtyIcon: "\u{1F525}",
      specialtyLabel: "Fire",
      favoritesTitle: "Favorites",
      favorites: [
        "Campfires",
        "Warm places",
        "Fresh tall grass",
        "Dry wood",
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
    number: "No. 532",
    name: "Timburr",
    theme: "stone",
    artVariant: "timburr",
    details: {
      eyebrow: "Details",
      species: "Muscular Pokemon",
      descriptionHtml:
        "It loves sturdy places and trains by carrying heavy timber. Boulder shade and tall grass make it feel ready to help.",
      stats: [
        { label: "Height", value: "2'0\"" },
        { label: "Weight", value: "27.6 lbs." },
        { label: "Type", badgeIcon: "\u25C6", badgeLabel: "Fighting" }
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
      eyebrow: "Specialties & Likes",
      specialtyTitle: "Specialties",
      specialtyIcon: "\u25C6",
      specialtyLabel: "Build",
      favoritesTitle: "Favorites",
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
      eyebrow: "Specialties & Likes",
      specialtyTitle: "Specialties",
      specialtyIcon: "\u273F",
      specialtyLabel: "Bloom",
      favoritesTitle: "Favors",
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
        "Four tufts of tall grass bunched together in a plot.<br />A perfect hiding place for small Pok\u00e9mon.",
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
      eyebrow: "Specialties & Likes",
      specialtyTitle: "Specialties",
      specialtyIcon: "\u273F",
      specialtyLabel: "Cover",
      favoritesTitle: "Favors",
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
  }
};

export function getPokedexEntry(entryId) {
  return POKEDEX_ENTRIES[entryId] || POKEDEX_ENTRIES[SQUIRTLE_POKEDEX_ENTRY_ID];
}
