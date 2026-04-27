const ingredient = (amount, name) => ({ amount, name });

export const GUIDE_NAV = [
  { id: "home", label: "Home" },
  { id: "guides", label: "Guides" },
  { id: "articles", label: "Articles" },
  { id: "map", label: "Map" },
  { id: "cooking", label: "Cooking" },
  { id: "crafting", label: "Crafting" },
  { id: "knitting", label: "Knitting" },
  { id: "database", label: "Database" },
];

export const GUIDE_SECTIONS = {
  home: {
    overline: "Winter Burrow Toolkit",
    title: "Field Archive",
    description:
      "Guides, walkthroughs, recipe indexes, and island notes are now bundled into the in-game handbook.",
    bullets: [
      "Search recipes by name, category, ingredient, unlock source, or bonus.",
      "Browse a toolkit-style article archive with quest routing, pro tips, and related guides.",
      "Track any recipe to pin its ingredient list in the bottom status bar.",
      "Use Map for a quick read on the current island layout and resource nodes.",
    ],
  },
  guides: {
    overline: "Winter Burrow Toolkit",
    title: "Winter Burrow Guides",
    description:
      "Tactical playbooks for warmth, food, route planning, and burrow restoration, backed by quick-launch planning hooks.",
    bullets: [
      "Use the planner hook before long loops or storm travel.",
      "Jump straight from guide cards into the matching article when needed.",
      "Treat this as the fast-access lane while the deeper article view handles long reads.",
    ],
  },
  articles: {
    overline: "Winter Burrow Articles",
    title: "Walkthroughs & Survival Reads",
    description:
      "A toolkit-style article shelf centered on the full story walkthrough, with related survival references and route notes.",
    bullets: [
      "The featured walkthrough strings the main quest beats into one path.",
      "Related survival articles stay one click away for granite, warmth, map reading, Moss, and pickaxe routes.",
      "Internal link cards mirror the source article's quick jumps without leaving the handbook.",
    ],
  },
  map: {
    overline: "Winter Burrow World Map",
    title: "Open World Layout",
    description:
      "A large open-world read of the current sandbox, covering home routes, marsh corridors, granite fords, western ruins, and the old burrow frontier.",
    bullets: [
      "Hearth Hollow is the safe center: Aunty, the Workbench, and the Stove define the opening loop.",
      "The south bridge stretches into a full marsh lane with berries, loose granite, and Bufo's outpost.",
      "Granite Ford and Willow Reach turn the west into a real mid-game expedition once the gate breaks.",
    ],
  },
  crafting: {
    overline: "Winter Burrow Crafting Guide",
    title: "All Recipes & Blueprints",
    description:
      "Master every crafting recipe in Winter Burrow, from starter tools and planks to furniture, storage, and planters.",
    searchPlaceholder: "Search by name, type, or ingredient...",
    categoryBlurb: {
      "Planks and Tools":
        "Core conversions and gathering tools that unlock the first survival loop.",
      "Twig Furniture":
        "Early shelter pieces built from common wood, twigs, and flax materials.",
      "Pine Furniture":
        "Heavier furniture upgrades that push storage and bed quality forward.",
      "Pebble Furniture":
        "Stone-accented decor using granite, flint, and fibre support materials.",
      Planters:
        "Garden-ready buildables that blend processed planks with granite and fibre.",
    },
    whyItMatters: [
      "Build better tools and equipment to lower gathering costs and increase resource throughput.",
      "Warmth, hunger management, and stamina recovery items raise survival odds in harsh climates.",
      "Advanced items and facilities require specific recipes or workbench upgrades, advancing exploration.",
      "Structured crafting routes often connect to achievements and quest progress.",
    ],
    tips: [
      "Prioritize first-loop tools, camp setup, and storage before decorative furniture.",
      "Treat plank and rope conversions as throughput upgrades, not filler recipes.",
      "When resources are tight, invest in warmth, tool damage, and shelter first.",
      "Keep an eye on recipes found in the wild because they gate later progression routes.",
    ],
    faq: [
      {
        question: "What is Winter Burrow crafting?",
        answer:
          "Crafting turns gathered resources into tools, shelter pieces, fire sources, clothing support items, and other upgrades that improve survival.",
      },
      {
        question: "Why is crafting important?",
        answer:
          "It underpins exploration and progression by unlocking better gathering loops, stronger equipment, and safer shelter options.",
      },
      {
        question: "What should players craft first?",
        answer:
          "Early focus should stay on basic tools, warmth support, and storage before spending materials on comfort pieces.",
      },
    ],
  },
  cooking: {
    overline: "Winter Burrow Cooking Recipes",
    title: "Seasonal Meals & Buff Routes",
    description:
      "Explore Winter Burrow cooking recipes across roasting, baking, beverages and tea, plus full pie routes for long buffs.",
    searchPlaceholder: "Search by recipe name, ingredient, or buff...",
    categoryBlurb: {
      "Roasting & Grilling":
        "High-heat processing of meats and mushrooms for fast hunger recovery and combat support.",
      "Baking Recipes":
        "Biscuits and jams using seeds, nuts, sugar-style inputs, and fruit for stable warmth-focused food.",
      "Beverages & Tea Recipes":
        "Hot drinks built around berry infusions that reinforce cold resistance, speed, and stamina.",
      "Pie Recipes":
        "Long-duration reserve foods that combine earlier recipes into higher-value all-round meals.",
    },
    whyItMatters: [
      "Food restores hunger while also adding cold resistance, stamina, health, or speed buffs.",
      "Night travel and freezing routes become much safer with a planned food rotation.",
      "Pies combine earlier dishes into high-value reserves for longer outings.",
      "Cooking lets scarce ingredients work harder by chaining smaller recipes into stronger meals.",
    ],
    tips: [
      "Start with roasted mushrooms and meat when you need immediate survival recovery.",
      "Use biscuits and tea to stabilize cold resistance before long trips.",
      "Batch jams early because they unlock stronger pie routes later.",
      "Reserve long-duration pies for night, boss routes, or multi-objective trips.",
    ],
    faq: [
      {
        question: "How do cooking recipes help in Winter Burrow?",
        answer:
          "They keep hunger in check and add survival buffs that matter when cold, combat, or long exploration routes stack up.",
      },
      {
        question: "Where are all buffs listed?",
        answer:
          "Every imported recipe entry includes its ingredient list, stat boosts, and duration in the detail pane.",
      },
      {
        question: "What should a new player cook first?",
        answer:
          "Roasting basics and tea are the safest first step, then move into biscuits, jam, and finally pies.",
      },
    ],
  },
  knitting: {
    overline: "Winter Burrow Knitting Guide",
    title: "Pattern Board Ready",
    description:
      "This section is wired into the handbook, but the imported brief did not include knitting pattern data yet.",
    bullets: [
      "The lane is ready for yarn, warmth, unlock, and equipment pattern records.",
      "Once pattern data lands, it can reuse the same search, category, and detail components.",
      "For now, use Database, Cooking, and Crafting as the fully populated sections.",
    ],
  },
  database: {
    overline: "Winter Burrow Database",
    title: "Unified Recipe Index",
    description:
      "A combined table for crafting and cooking entries so players can scan the whole imported archive at once.",
    searchPlaceholder: "Search everything by recipe, ingredient, category, or effect...",
    bullets: [
      "Use the section filter to jump between crafting-only and cooking-only views.",
      "Click any row to open the full detail panel and pin the recipe to the HUD.",
      "This index mirrors the imported summary tables but keeps interaction inside the game.",
    ],
  },
};

export const SMALL_ISLAND_MAP_POINTS = [
  {
    id: "house",
    label: "Hearth Hollow",
    kind: "Shelter",
    position: { x: 0, z: 0 },
    description: "Home region and starting basin. All early loops radiate from this warm center.",
  },
  {
    id: "aunty",
    label: "Aunty",
    kind: "Quest",
    position: { x: 6.5, z: -4.5 },
    description: "Narrative anchor of the campaign and the voice behind the island's restoration rhythm.",
  },
  {
    id: "workbench",
    label: "Workbench",
    kind: "Station",
    position: { x: 9.2, z: 4.8 },
    description: "Bridge kits, pickaxes, and the final repair bundle are crafted here.",
  },
  {
    id: "stove",
    label: "Stove",
    kind: "Station",
    position: { x: -6.4, z: 4.4 },
    description: "Bufo's Marsh Pie placeholder recipe is cooked at this station.",
  },
  {
    id: "north-ridge",
    label: "North Wool Ridge",
    kind: "Resource",
    position: { x: -20, z: -32 },
    description: "Long northern line holding wool nests, extra palms, and the first hint that the world is larger than home.",
  },
  {
    id: "bufo",
    label: "Bufo",
    kind: "Quest",
    position: { x: 10.5, z: 47.5 },
    description: "Marsh broker deep in the south corridor. He turns cooking into the gate for mid-game tools.",
  },
  {
    id: "south-bridge",
    label: "South Bridge",
    kind: "Quest",
    position: { x: 4.5, z: 27.5 },
    description: "First expansion threshold. Once repaired, the quiet home loop becomes a true expedition route.",
  },
  {
    id: "berry-steppe",
    label: "Berry Steppe",
    kind: "Resource",
    position: { x: 12, z: 41 },
    description: "Long southern food route mixing blackberry, rowanberry, and elderberry nodes for Bufo's pie.",
  },
  {
    id: "granite-ford",
    label: "Granite Ford",
    kind: "Route",
    position: { x: -22, z: 16 },
    description: "The western approach. Stone walls and tighter routes teach that tools define territory.",
  },
  {
    id: "granite-gate",
    label: "Granite Gate",
    kind: "Route",
    position: { x: -27.5, z: 14.5 },
    description: "Hard west barrier. Until the Granite Pickaxe exists, Willow Reach stays sealed off.",
  },
  {
    id: "willow",
    label: "Willow Reach",
    kind: "Quest",
    position: { x: -48.5, z: 21.5 },
    description: "Western ruin region watched by Willow. The island feels like a frontier once this area opens.",
  },
  {
    id: "silk-hollow",
    label: "Silk Hollow",
    kind: "Resource",
    position: { x: -58, z: 14 },
    description: "Late-game silk lane tucked behind the western ruins and used for the final repair kit.",
  },
  {
    id: "old-burrow",
    label: "Old Burrow",
    kind: "Quest",
    position: { x: -58.5, z: 38.5 },
    description: "Final restoration site and the physical climax of the campaign.",
  },
  {
    id: "east-coast",
    label: "East Palm Coast",
    kind: "Resource",
    position: { x: 48, z: 8 },
    description: "Wide palm corridor on the east, built to make the world feel open even outside the critical path.",
  },
];

export const CRAFTING_RECIPES = [
  {
    id: "oak-plank",
    section: "crafting",
    category: "Planks and Tools",
    name: "Oak Plank",
    ingredients: [ingredient(2, "Oak Wood")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "beech-plank",
    section: "crafting",
    category: "Planks and Tools",
    name: "Beech Plank",
    ingredients: [ingredient(2, "Beech Wood")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "pine-plank",
    section: "crafting",
    category: "Planks and Tools",
    name: "Pine Plank",
    ingredients: [ingredient(2, "Pine Wood")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "birch-plank",
    section: "crafting",
    category: "Planks and Tools",
    name: "Birch Plank",
    ingredients: [ingredient(2, "Birch Wood")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "flax-rope",
    section: "crafting",
    category: "Planks and Tools",
    name: "Flax Rope",
    ingredients: [ingredient(2, "Flax Fiber")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "campfire-kit",
    section: "crafting",
    category: "Planks and Tools",
    name: "Campfire Kit",
    ingredients: [
      ingredient(10, "Pebble"),
      ingredient(3, "Beech Wood"),
      ingredient(1, "Flax Rope"),
    ],
    attack: null,
    obtainedFrom: "Recipe in Wild",
  },
  {
    id: "basic-kindling",
    section: "crafting",
    category: "Planks and Tools",
    name: "Basic Kindling",
    ingredients: [
      ingredient(1, "Beech Plank"),
      ingredient(1, "Twig"),
      ingredient(3, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "axe-sandstone",
    section: "crafting",
    category: "Planks and Tools",
    name: "Axe Sandstone",
    ingredients: [
      ingredient(1, "Twig"),
      ingredient(1, "Pebble"),
      ingredient(1, "Flax Fiber"),
    ],
    attack: 6,
    obtainedFrom: null,
  },
  {
    id: "axe-granite",
    section: "crafting",
    category: "Planks and Tools",
    name: "Axe Granite",
    ingredients: [
      ingredient(2, "Oak Wood"),
      ingredient(1, "Pine Wood"),
      ingredient(1, "Granite"),
      ingredient(1, "Wool Yarn"),
    ],
    attack: 8,
    obtainedFrom: null,
  },
  {
    id: "pickaxe-granite",
    section: "crafting",
    category: "Planks and Tools",
    name: "Pickaxe Granite",
    ingredients: [
      ingredient(2, "Oak Wood"),
      ingredient(1, "Pine Wood"),
      ingredient(1, "Granite"),
      ingredient(1, "Wool Yarn"),
    ],
    attack: 8,
    obtainedFrom: "Bufo",
  },
  {
    id: "shovel-sandstone",
    section: "crafting",
    category: "Planks and Tools",
    name: "Shovel Sandstone",
    ingredients: [
      ingredient(2, "Twig"),
      ingredient(3, "Pebble"),
      ingredient(1, "Flax Fiber"),
    ],
    attack: 10,
    obtainedFrom: "Gnawtusk",
  },
  {
    id: "shovel-granite",
    section: "crafting",
    category: "Planks and Tools",
    name: "Shovel Granite",
    ingredients: [
      ingredient(2, "Oak Wood"),
      ingredient(1, "Pine Wood"),
      ingredient(1, "Granite"),
      ingredient(1, "Wool Yarn"),
    ],
    attack: 10,
    obtainedFrom: "Gnawtusk",
  },
  {
    id: "shovel-flint",
    section: "crafting",
    category: "Planks and Tools",
    name: "Shovel Flint",
    ingredients: [
      ingredient(1, "Pine Plank"),
      ingredient(2, "Birch Wood"),
      ingredient(2, "Flint"),
      ingredient(1, "Silk Yarn"),
    ],
    attack: 10,
    obtainedFrom: "Willow",
  },
  {
    id: "axe-flint",
    section: "crafting",
    category: "Planks and Tools",
    name: "Axe Flint",
    ingredients: [
      ingredient(1, "Pine Plank"),
      ingredient(2, "Birch Wood"),
      ingredient(2, "Flint"),
      ingredient(1, "Silk Yarn"),
    ],
    attack: 10,
    obtainedFrom: "Aunty",
  },
  {
    id: "twig-chair",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Chair",
    ingredients: [
      ingredient(4, "Twig"),
      ingredient(1, "Beech Wood"),
      ingredient(1, "Beech Plank"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "twig-stool",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Stool",
    ingredients: [ingredient(3, "Twig"), ingredient(1, "Beech Wood")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "simple-bed",
    section: "crafting",
    category: "Twig Furniture",
    name: "Simple Bed",
    ingredients: [
      ingredient(4, "Twig"),
      ingredient(3, "Flax Fiber"),
      ingredient(2, "Beech Wood"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "twig-table",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Table",
    ingredients: [ingredient(8, "Twig"), ingredient(4, "Beech Plank")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "twig-side-table",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Side Table",
    ingredients: [ingredient(5, "Beech Wood")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "twig-sofa",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Sofa",
    ingredients: [
      ingredient(4, "Twig"),
      ingredient(5, "Beech Wood"),
      ingredient(2, "Beech Plank"),
      ingredient(5, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "twig-bed",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Bed",
    ingredients: [
      ingredient(5, "Twig"),
      ingredient(1, "Beech Plank"),
      ingredient(5, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "twig-storage",
    section: "crafting",
    category: "Twig Furniture",
    name: "Twig Storage",
    ingredients: [ingredient(4, "Beech Wood"), ingredient(1, "Beech Plank")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "fibre-bed",
    section: "crafting",
    category: "Twig Furniture",
    name: "Fibre Bed",
    ingredients: [ingredient(5, "Flax Yarn"), ingredient(4, "Flax Fiber")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "fibre-storage",
    section: "crafting",
    category: "Twig Furniture",
    name: "Fibre Storage",
    ingredients: [
      ingredient(2, "Flax Rope"),
      ingredient(2, "Twig"),
      ingredient(4, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: "Recipe in Wild",
  },
  {
    id: "pine-cupboard",
    section: "crafting",
    category: "Pine Furniture",
    name: "Pine Cupboard",
    ingredients: [ingredient(2, "Pine Wood"), ingredient(6, "Pine Plank")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "painted-pine-cupboard",
    section: "crafting",
    category: "Pine Furniture",
    name: "Painted Pine Cupboard",
    ingredients: [
      ingredient(2, "Pine Wood"),
      ingredient(6, "Pine Plank"),
      ingredient(1, "Forest Jam"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "pine-shelf",
    section: "crafting",
    category: "Pine Furniture",
    name: "Pine Shelf",
    ingredients: [ingredient(2, "Pine Wood"), ingredient(4, "Pine Plank")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "pine-bed",
    section: "crafting",
    category: "Pine Furniture",
    name: "Pine Bed",
    ingredients: [
      ingredient(4, "Pine Wood"),
      ingredient(8, "Pine Plank"),
      ingredient(10, "Wool Yarn"),
    ],
    attack: null,
    obtainedFrom: "Recipe in Wild",
  },
  {
    id: "pebble-chair",
    section: "crafting",
    category: "Pebble Furniture",
    name: "Pebble Chair",
    ingredients: [
      ingredient(1, "Flint"),
      ingredient(2, "Pebble"),
      ingredient(1, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "pebble-stool",
    section: "crafting",
    category: "Pebble Furniture",
    name: "Pebble Stool",
    ingredients: [ingredient(2, "Pebble"), ingredient(1, "Flax Fiber")],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "pebble-table",
    section: "crafting",
    category: "Pebble Furniture",
    name: "Pebble Table",
    ingredients: [
      ingredient(1, "Flint"),
      ingredient(4, "Granite"),
      ingredient(6, "Pebble"),
      ingredient(1, "Flax Yarn"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "pebble-round-table",
    section: "crafting",
    category: "Pebble Furniture",
    name: "Pebble Round Table",
    ingredients: [
      ingredient(2, "Granite"),
      ingredient(4, "Pebble"),
      ingredient(1, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "planter-box",
    section: "crafting",
    category: "Planters",
    name: "Planter Box",
    ingredients: [
      ingredient(2, "Granite"),
      ingredient(4, "Oak Plank"),
      ingredient(4, "Beech Plank"),
      ingredient(5, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
  {
    id: "round-planter-box",
    section: "crafting",
    category: "Planters",
    name: "Round Planter Box",
    ingredients: [
      ingredient(2, "Granite"),
      ingredient(2, "Pine Plank"),
      ingredient(4, "Beech Plank"),
      ingredient(5, "Flax Fiber"),
    ],
    attack: null,
    obtainedFrom: null,
  },
];

export const COOKING_RECIPES = [
  {
    id: "roasted-chanterelle",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Chanterelle",
    ingredients: [ingredient(1, "Twig"), ingredient(2, "Chanterelle Piece")],
    statBoosts: ["+15 Health", "+15 Hunger", "10% Health"],
    duration: "1 hour",
  },
  {
    id: "roasted-garlic-mushroom",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Garlic Mushroom",
    ingredients: [ingredient(1, "Twig"), ingredient(2, "Garlic Parachute Mushroom")],
    statBoosts: ["+20 Health", "+20 Hunger", "10% Health"],
    duration: "1 hour",
  },
  {
    id: "roasted-shrimp-mushroom",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Shrimp Mushroom",
    ingredients: [ingredient(1, "Twig"), ingredient(2, "Shrimp Mushroom")],
    statBoosts: ["+25 Health", "+25 Hunger", "20% Health"],
    duration: "2 hours",
  },
  {
    id: "roasted-yellow-brittlegill-mushroom",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Yellow Brittlegill Mushroom",
    ingredients: [ingredient(1, "Twig"), ingredient(2, "Yellow Brittlegill Mushroom")],
    statBoosts: ["+30 Health", "+30 Hunger", "20% Health"],
    duration: "2 hours",
  },
  {
    id: "roasted-leaf-beetle",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Leaf Beetle",
    ingredients: [ingredient(2, "Meat Beetle")],
    statBoosts: ["+15 Health", "+15 Hunger", "+10% Attack"],
    duration: "1 hour",
  },
  {
    id: "roasted-wood-beetle",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Wood Beetle",
    ingredients: [ingredient(1, "Twig"), ingredient(1, "Wood Beetle Meat")],
    statBoosts: ["+20 Health", "+20 Hunger", "+10% Attack"],
    duration: "1 hour",
  },
  {
    id: "roasted-ant",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Ant",
    ingredients: [ingredient(1, "Meat Ant")],
    statBoosts: ["+25 Health", "+25 Hunger", "+20% Attack"],
    duration: "2 hours",
  },
  {
    id: "roasted-spider",
    section: "cooking",
    category: "Roasting & Grilling",
    name: "Roasted Spider",
    ingredients: [ingredient(1, "Meat Spider")],
    statBoosts: ["+30 Health", "+30 Hunger", "+20% Attack"],
    duration: "2 hours",
  },
  {
    id: "biscuit-beechnut",
    section: "cooking",
    category: "Baking Recipes",
    name: "Biscuit Beechnut",
    ingredients: [ingredient(3, "Beech Nut")],
    statBoosts: ["+15 Cold Resistance", "+15 Hunger", "10% Cold Resistance"],
    duration: "1 hour",
  },
  {
    id: "biscuit-acorn",
    section: "cooking",
    category: "Baking Recipes",
    name: "Biscuit Acorn",
    ingredients: [ingredient(3, "Acorn")],
    statBoosts: ["+20 Cold Resistance", "+20 Hunger", "10% Cold Resistance"],
    duration: "1 hour",
  },
  {
    id: "biscuit-pinenut",
    section: "cooking",
    category: "Baking Recipes",
    name: "Biscuit Pinenut",
    ingredients: [ingredient(3, "Pine Seed")],
    statBoosts: ["+25 Cold Resistance", "+25 Hunger", "20% Cold Resistance"],
    duration: "2 hours",
  },
  {
    id: "biscuit-hazelnut",
    section: "cooking",
    category: "Baking Recipes",
    name: "Biscuit Hazelnut",
    ingredients: [ingredient(3, "Hazelnut")],
    statBoosts: ["+30 Cold Resistance", "+30 Hunger", "20% Cold Resistance"],
    duration: "2 hours",
  },
  {
    id: "forest-jam",
    section: "cooking",
    category: "Baking Recipes",
    name: "Forest Jam",
    ingredients: [ingredient(5, "Elderberry"), ingredient(5, "Blackberry")],
    statBoosts: ["+30 Cold Resistance", "+30 Hunger", "20% Stamina"],
    duration: "4 hours",
  },
  {
    id: "wild-jam",
    section: "cooking",
    category: "Baking Recipes",
    name: "Wild Jam",
    ingredients: [ingredient(5, "Blueberry"), ingredient(5, "Rowanberry")],
    statBoosts: ["+20% Speed", "+50 Hunger"],
    duration: "4 hours",
  },
  {
    id: "elder-tea",
    section: "cooking",
    category: "Beverages & Tea Recipes",
    name: "Elder Tea",
    ingredients: [ingredient(2, "Elderberry")],
    statBoosts: ["+10 Cold Resistance", "+5 Hunger", "10% Stamina"],
    duration: "1 hour",
  },
  {
    id: "black-tea",
    section: "cooking",
    category: "Beverages & Tea Recipes",
    name: "Black Tea",
    ingredients: [ingredient(2, "Blackberry")],
    statBoosts: ["+10 Cold Resistance", "+5 Hunger", "10% Stamina"],
    duration: "2 hours",
  },
  {
    id: "blue-tea",
    section: "cooking",
    category: "Beverages & Tea Recipes",
    name: "Blue Tea",
    ingredients: [ingredient(2, "Blueberry")],
    statBoosts: ["+10 Cold Resistance", "+5 Hunger", "+10% Speed"],
    duration: "2 hours",
  },
  {
    id: "rowan-tea",
    section: "cooking",
    category: "Beverages & Tea Recipes",
    name: "Rowan Tea",
    ingredients: [ingredient(2, "Rowanberry")],
    statBoosts: ["+10 Cold Resistance", "+5 Hunger", "+10% Speed"],
    duration: "2 hours",
  },
  {
    id: "blackberry-pie",
    section: "cooking",
    category: "Pie Recipes",
    name: "Blackberry Pie",
    ingredients: [
      ingredient(2, "Biscuit Beechnut"),
      ingredient(1, "Forest Jam"),
      ingredient(5, "Blackberry"),
    ],
    statBoosts: [
      "+50 Cold Resistance",
      "+100 Hunger",
      "20% Cold Resistance",
      "30% Stamina",
      "+20% Speed",
    ],
    duration: "8 hours",
  },
  {
    id: "blueberry-pie",
    section: "cooking",
    category: "Pie Recipes",
    name: "Blueberry Pie",
    ingredients: [
      ingredient(2, "Biscuit Pinenut"),
      ingredient(1, "Wild Jam"),
      ingredient(2, "Blueberry"),
    ],
    statBoosts: [
      "+50 Cold Resistance",
      "+100 Hunger",
      "20% Cold Resistance",
      "20% Stamina",
      "+30% Speed",
    ],
    duration: "8 hours",
  },
  {
    id: "rowanberry-pie",
    section: "cooking",
    category: "Pie Recipes",
    name: "Rowanberry Pie",
    ingredients: [
      ingredient(3, "Biscuit Hazelnut"),
      ingredient(1, "Wild Jam"),
      ingredient(5, "Rowanberry"),
    ],
    statBoosts: [
      "+100 Cold Resistance",
      "+100 Hunger",
      "30% Cold Resistance",
      "20% Stamina",
      "+20% Speed",
    ],
    duration: "8 hours",
  },
  {
    id: "meaty-pie",
    section: "cooking",
    category: "Pie Recipes",
    name: "Meaty Pie",
    ingredients: [
      ingredient(1, "Roasted Spider"),
      ingredient(2, "Roasted Ant"),
      ingredient(3, "Roasted Wood Beetle"),
      ingredient(2, "Biscuit Acorn"),
    ],
    statBoosts: [
      "+50 Cold Resistance",
      "+100 Hunger",
      "20% Cold Resistance",
      "+100 Health",
      "+30% Attack",
    ],
    duration: "8 hours",
  },
];

export const ALL_RECIPES = [...CRAFTING_RECIPES, ...COOKING_RECIPES];

export const FEATURED_ARTICLE_ID = "complete-story-guide";

export const TOOLKIT_GUIDES = [
  {
    id: "expedition-planner",
    kind: "Tool",
    title: "Optimal Expedition Planner",
    summary: "Validate warmth, food, and route pacing before long quest loops.",
    bullets: [
      "Use it before south-west or late-night story pushes.",
      "Treat tea, pie, and campfire counts as route budget, not afterthoughts.",
      "Pair it with the walkthrough when multiple quest beats stack into one run.",
    ],
    ctaLabel: "Planner Notes",
    action: { type: "article", targetId: FEATURED_ARTICLE_ID },
  },
  {
    id: "map-navigation-hook",
    kind: "Guide",
    title: "Map & Navigation Guide",
    summary: "Landmark-first map reading to keep your bearings without a minimap.",
    bullets: [
      "Read shoreline rails, grass seams, hollow logs, and gate types as route grammar.",
      "Open this before unfamiliar north or south-west detours.",
      "Use it with the local island map and the walkthrough's anchor callouts.",
    ],
    ctaLabel: "Open Article",
    action: { type: "article", targetId: "map-navigation-guide" },
  },
  {
    id: "pickaxe-hook",
    kind: "Guide",
    title: "Pickaxe Guide",
    summary: "Tool progression to break granite gates after Bufo's chain opens the route.",
    bullets: [
      "Useful when granite gates begin to block the next story path.",
      "Sync it with Bufo, Pollywog, and backtracking routes in the walkthrough.",
      "Carry it as the mechanical reference while the article handles the story beat.",
    ],
    ctaLabel: "Open Article",
    action: { type: "article", targetId: "pickaxe-guide" },
  },
  {
    id: "warmth-budget-matrix",
    kind: "Tool",
    title: "Warmth Budget Matrix",
    summary: "Plug in target area, time, and weather to validate minimum gear warmth.",
    bullets: [
      "Use it before night routes or whenever storms change the cold factor.",
      "Helps turn clothing warmth, drink heat, and campfire spacing into one departure check.",
      "Best opened from the stay-warm article or any storm-prep route.",
    ],
    ctaLabel: "Open Article",
    action: { type: "article", targetId: "stay-warm-guide" },
  },
  {
    id: "supply-planner",
    kind: "Tool",
    title: "Supply Planner",
    summary: "Balance tea and stew quantities so hunger and warmth stay in the green.",
    bullets: [
      "Useful when a route needs both warmth buffer and hunger stability.",
      "Pairs especially well with mushroom stew, tea batches, and long storm pushes.",
      "Treat it as the logistics companion to the warmth article.",
    ],
    ctaLabel: "Open Article",
    action: { type: "article", targetId: "stay-warm-guide" },
  },
  {
    id: "burrow-restoration-checklist",
    kind: "Guide",
    title: "Burrow Restoration Checklist",
    summary: "Material checklists, NPC quest dependencies, and upgrade sequencing for each major burrow repair.",
    bullets: [
      "Use it to plan armchair, stove, bridge, basement, and second-floor milestones.",
      "Helps separate urgent repairs from cosmetic upgrades and storage goals.",
      "Best paired with the main walkthrough because Aunty and later quest beats affect restoration timing.",
    ],
    ctaLabel: "Open Article",
    action: { type: "article", targetId: FEATURED_ARTICLE_ID },
  },
];

export const GUIDE_PAGE_BUNDLES = [
  {
    id: "survival-warmth",
    title: "Survival & Warmth",
    summary: "Layering strategies, campfire timing, and forecast prep.",
  },
  {
    id: "cooking-supplies",
    title: "Cooking & Supplies",
    summary: "Pie and tea rotations synced with hunger and heat decay formulas.",
  },
  {
    id: "route-planning",
    title: "Route Planning",
    summary: "Destination loops aligned with Warmth Budget thresholds.",
  },
  {
    id: "burrow-restoration",
    title: "Burrow Restoration",
    summary: "Material checklists, NPC quests, and upgrade sequences.",
  },
];

export const GUIDE_PLAYBOOKS = [
  {
    id: "surviving-the-cold",
    title: "Surviving the Cold",
    items: [
      {
        title: "Craft or Find Warm Clothing",
        body:
          "Your first priority should be knitting a sweater as soon as possible. Repairing the burrow's armchair unlocks knitting, and even a simple Wool Scarf adds meaningful warmth.",
      },
      {
        title: "Stay Near Heat Sources",
        body:
          "While exploring, keep campfire spots in mind or carry a campfire kit. A wilderness fire lets you thaw out and effectively reset the warmth timer.",
      },
      {
        title: "Use Warm Consumables",
        body:
          "Hot foods and drinks can save a run. Brewing Hot Tea or cooking a Hearty Stew gives immediate warmth, so always pack at least one warm beverage for long trips.",
      },
      {
        title: "Watch the Weather & Time",
        body:
          "Storms and nightfall worsen conditions. If a blizzard is setting in, postpone non-urgent trips because nighttime is both colder and harder to read.",
      },
      {
        title: "Know When to Turn Back",
        body:
          "Watch for frost creeping in from the screen edges. If you cannot warm up quickly, head home early rather than collapsing in the snow.",
      },
    ],
  },
  {
    id: "staying-fed",
    title: "Staying Fed",
    items: [
      {
        title: "Cook Early, Cook Often",
        body:
          "Raw berries and mushrooms restore only a little hunger. Cook them whenever possible because cooked meals refill more hunger and often grant bonus effects.",
      },
      {
        title: "Learn Key Recipes",
        body:
          "Focus on versatile staples like Berry Pie for big restoration and buffs, plus Mushroom Stew for hunger refill and health regeneration.",
      },
      {
        title: "Carry Snacks for Emergencies",
        body:
          "Keep one or two quick snacks in the inventory during every outing. A small emergency bite can buy enough time to get home safely.",
      },
      {
        title: "Optimize Resource Use",
        body:
          "Save advanced recipes with rare ingredients for heavy routes. Routine outings should lean on efficient recipes like Fruit Muffins or Veggie Soup using common materials.",
      },
      {
        title: "Water and Tea",
        body:
          "Hot Tea only needs water plus herbs and is a warmth lifesaver. It also tops up hunger enough that brewing tea can be better than baking a second pie.",
      },
    ],
  },
  {
    id: "rebuilding-your-home",
    title: "Rebuilding Your Home",
    items: [
      {
        title: "Armchair (Knitting Corner)",
        body:
          "Usually the first big goal. Fixing it unlocks knitting, which is crucial for warmth, and it only asks for basic materials like Twigs and Plant Fibers.",
      },
      {
        title: "Stove (Kitchen Repair)",
        body:
          "A working kitchen opens pies and complex recipes. Expect repairs to need Stones, Clay Bricks, and Metal Scraps before cooking fully expands.",
      },
      {
        title: "Bridge and Expansion",
        body:
          "Repairing the bridge opens a new region with richer resources. It is material-heavy, but the payoff in progression is huge.",
      },
      {
        title: "Basement & Second Floor",
        body:
          "Later expansions often need special quest items such as a Rusty Key. They add space and can open room for food growth or friendly characters.",
      },
      {
        title: "Resource Stockpiling",
        body:
          "Set an outing goal for each renovation and stockpile ahead. Bit by bit, the wrecked burrow turns into a warm winter home.",
      },
    ],
  },
  {
    id: "crafting-warm-clothes",
    title: "Crafting Warm Clothes",
    items: [
      {
        title: "Unlocking Knitting",
        body:
          "Repair the armchair first. Once fixed, you can sit down and access the knitting interface for starter patterns like a simple sweater and hat.",
      },
      {
        title: "Gathering Materials for Yarn",
        body:
          "Yarn is the core ingredient. Flax yarn comes from plant fibers for early play, while Wool yarn uses fur tufts or animal hair for stronger clothing later.",
      },
      {
        title: "Knitting Process",
        body:
          "Interact with the armchair and choose the item to make. Knitting consumes yarn and sometimes buttons or dye, and it also costs in-game time, so do it when safe at home.",
      },
      {
        title: "Clothing Options",
        body:
          "Prioritize Sweater first, then Hat, Mittens, and Scarf. Each slot stacks into a safer warmth baseline.",
      },
      {
        title: "Upgrade When Possible",
        body:
          "The first sweater is a huge step, but better tiers matter. Move from Patchwork to Wool to Arctic pieces as materials improve so routes get longer and safer.",
      },
    ],
  },
];

export const TOOLKIT_ARTICLES = [
  {
    id: FEATURED_ARTICLE_ID,
    category: "Survival",
    title: "Winter Burrow Walkthrough - Complete Story Guide & Key Quests",
    summary:
      "String every major beat into one path: Aunty, Bufo, Pollywog, Moss/Pinesap, Willow's artifact, and the grand dinner - with map anchor and FAQs.",
    readTime: "10 min read",
    date: "Nov 16, 2025",
    tags: ["walkthrough", "quests", "aunty"],
    heroMapTitle: "World anchor map with BUFO, SHADOW PINES, BIG VALLEY, AUNTIE'S, POLLYWOG",
    heroMapCaption: "World anchor (community map). Open local file for full size.",
    mapAnchors: ["BUFO", "SHADOW PINES", "BIG VALLEY", "AUNTIE'S", "POLLYWOG"],
    actions: [
      { label: "Open Expedition Planner", type: "guide", targetId: "expedition-planner" },
      { label: "Back to Articles", type: "view", targetId: "articles" },
    ],
    sections: [
      {
        label: "Section 01",
        title: "Getting Started: Find Aunty & Repair Your Burrow",
        body:
          "Patch the hearth and core stations at home first, then push the Find Aunty route. Repair the bridge with 2 Beech Planks and 1 Flax Rope so you can reunite and unlock more hints and recipes.",
        bullets: [
          "Repair hearth, then stove, then workbench.",
          "Gather Beech, Oak, and Flax near home before roaming wide.",
          "Build planters and talk to Aunty again for the next push.",
          "Explore north and south until Moss and Bufo landmarks appear.",
        ],
      },
      {
        label: "Section 02",
        title: "Bufo's Questline - Pies, Key, and Pollywog",
        body:
          "Meet Bufo in the marsh to the south. Bake Blackberry and Rowanberry pies, hand over the small key to Pollywog, then return to Bufo for the Granite Pickaxe blueprint that opens the broader world.",
        bullets: [
          "Run the south corridor as shoreline, stone gate, grass, granite-blocked log, broken logs, then campfire.",
          "Backtrack to every granite gate you passed once the upgrade is ready.",
          "Keep routes short until the main marsh and shoreline landmarks click.",
        ],
      },
      {
        label: "Section 03",
        title: "Moss's Questline - Snow Fur, Heavy Key, and Pinesap",
        body:
          "Find Moss north of home after Aunty's planter step. Snow Fur Tuft leads to Gnawtusk, the Heavy Key hides in the dark thicket east of home, and Aunty's illness eventually drives the Healing Stew and Pinesap thread.",
        bullets: [
          "Cut vines and check near the skull when hunting the Heavy Key.",
          "Deliver Pinesap's Shawl to Moss once the illness thread starts moving.",
          "Sweep the northern pocket for the Fine Woolen Hood and later the Pendant.",
        ],
        callout: "End-state burrow: your reward is comfort and friends.",
      },
      {
        label: "Section 04",
        title: "Willow's Questline - Notebooks, Tunnels, and the Mole Artifact",
        body:
          "Willow sits south-west behind granite gates. Return her notebook, unlock the Better Shovel route, dig out the hidden tunnel near home, then later retrieve the Mole Artifact from the spidered thicket east of Willow.",
        bullets: [
          "The notebook near home is the gate to Willow's early progress.",
          "Bring Aunty's pie back to Willow after the tunnel step opens.",
          "For the Mole Artifact, cut vines, sweep the center, grab it, and leave fast.",
          "Hazelnuts close out the last leg of her story.",
        ],
      },
      {
        label: "Section 05",
        title: "Finale - Fix Aunty's Burrow & Host the Dinner",
        body:
          "Gather Birch and Oak planks, Granite, and Silk Yarn to repair Aunty's old burrow. Deliver invitations to Bufo, Moss, Willow, Pollywog, Gnawtusk, and the rest, then trigger the dinner scene.",
        bullets: [
          "Craft top-tier tools before the clean-up phase.",
          "Stock warmth foods for any long-haul invitation route.",
          "Screenshot the finished home once the friends are gathered.",
        ],
      },
      {
        label: "Section 06",
        title: "Pro Tips",
        body: "Practical comfort and routing tips for a cleaner first clear.",
        bullets: [
          "Practice loops in daylight first because storms flatten contrast.",
          "Travel light and stash decor until after the finale.",
          "Use campfires as breadcrumbs near forks and awkward tunnels.",
          "Enable Arachnophobia Mode temporarily if the spider routes slow you down.",
          "Read shorelines, grass seams, log tunnels, and stone versus granite gates like map grammar.",
        ],
      },
    ],
    supplyTips: [
      "Daylight first; 1 tea and 1 pie is the baseline, then add a campfire for storms.",
      "Carry Granite Pickaxe and Flint Axe before committing to south-west routes.",
      "Travel light and stash decor until after the finale.",
    ],
    faq: [
      {
        question: "How long is a first run?",
        answer: "Expect roughly 8 to 12 hours casually, and longer if you decorate or push toward full completion.",
      },
      {
        question: "Can I free-roam after credits?",
        answer: "Reloading places you before the finale so you can finish side content afterward.",
      },
      {
        question: "Missed Willow or Moss?",
        answer: "Re-scan north for Moss and south-west for Willow after the relevant tool upgrades land.",
      },
      {
        question: "Stuck on the Heavy Key?",
        answer: "Check the dark thicket east of home, cut vines, and inspect the area near the skull.",
      },
      {
        question: "Best beginner loadout?",
        answer: "Start with 1 tea and 1 pie in clear weather, then add extra tea or a campfire during storms.",
      },
      {
        question: "Are there missables?",
        answer: "No missable endings. The story stays linear enough that you can enjoy the moments and still wrap up side content.",
      },
    ],
    internalLinks: [
      { label: "Map & Navigation Guide", targetId: "map-navigation-guide" },
      { label: "Granite Guide", targetId: "granite-guide" },
      { label: "Pickaxe Guide", targetId: "pickaxe-guide" },
    ],
    calculatorHooks: [
      { label: "Optimal Expedition Planner", targetId: "expedition-planner", type: "guide" },
      { label: "Map & Navigation Guide", targetId: "map-navigation-guide", type: "article" },
      { label: "Pickaxe Guide", targetId: "pickaxe-guide", type: "article" },
    ],
    relatedIds: [
      "stay-warm-guide",
      "granite-guide",
      "moss-quest-guide",
      "pickaxe-guide",
      "map-navigation-guide",
    ],
  },
  {
    id: "stay-warm-guide",
    category: "Survival",
    title: "How to Stay Warm in Winter Burrow - Clothing, Hot Drinks & Fire Grid",
    summary:
      "Never freeze again: target warmth thresholds, layer clothing, chain fires every ~60 m, and use hot tea plus camp kits for night and storm routes.",
    readTime: "8 min read",
    date: "Nov 15, 2024",
    tags: ["warmth", "clothing", "survival"],
    actions: [
      { label: "Open Warmth Budget", type: "guide", targetId: "warmth-budget-matrix" },
      { label: "Back to Articles", type: "view", targetId: "articles" },
    ],
    sections: [
      {
        label: "Section 01",
        title: "Establish a base warmth floor",
        body:
          "Calculate minimum warmth before you even pour tea. Aim for 35 warmth on daytime routes and 45 or more for stormy nights so decay never drags you below 40 mid-run.",
        bullets: [
          "Reserve one clothing slot for weather-flex gear such as Arctic Coat or Thick Sweater.",
          "Night expeditions carry a 1.3x cold factor, so treat 5 warmth as missing before departure.",
          "Track warmth per slot to avoid over-investing in hats while neglecting gloves.",
        ],
        formula:
          "finalWarmth = 100 - (25 x t x coldPenalty - gearWarmth x t x 0.5) + drinkHeat + campfire",
      },
      {
        label: "Section 02",
        title: "Template daytime loadout + emergency protocol",
        body:
          "Use a stable daytime baseline and know exactly when to stop and reheat instead of gambling through a ridge or storm edge.",
        bullets: [
          "Template daytime loadout: Wool Sweater, Fur-Lined Hood, Thick Scarf, Warm Gloves, plus 1 Hot Tea.",
          "Aim for a 35 warmth baseline before weather bonuses or emergency heat.",
          "At 20 warmth or lower, stop and brew tea or light a campfire immediately.",
          "Never cross a ridge unless a heat source is already marked on your route.",
        ],
      },
      {
        label: "Section 03",
        title: "Chain heat sources along the route",
        body:
          "Build a triangle of braziers, log piles, and debris fires so you can hopscotch heat without wasting premium fuel. Drop embers at 20-minute marks to keep coverage overlapping cleanly.",
        bullets: [
          "Carry three fuel grades: sticks for spark, hardwood for stability, and resin for bursts.",
          "Space fires about 60 in-game meters apart to maximize buff duration without overlap waste.",
          "Use Stone Rings to cut wind penalty by 20 percent.",
          "Pre-mark refill spots inside Expedition Console notes.",
          "Sharing camps with NPC patrols later can reduce barter prices.",
        ],
      },
      {
        label: "Section 04",
        title: "Hot drink emergency kit",
        body:
          "Teas and soups create immediate warmth spikes while also covering hunger decay. Keep two thermos slots free and prep them before sleeping when a storm front is coming in.",
        bullets: [
          "2x Hot Tea gives roughly an 80 warmth buffer total.",
          "1x Mushroom Stew adds 30 warmth plus regeneration.",
          "1x Herbal Brew adds 35 warmth and a clarity-style support buff.",
          "Queue batches during storm warnings because they stay hot for about 6 in-game hours.",
        ],
      },
      {
        label: "Section 05",
        title: "Retreat thresholds and recovery",
        body:
          "Treat 40 warmth as yellow alert and 20 as a hard stop. Cancel the run once the forecast flips or when both warmth and hunger fall under 50 at the same time.",
        bullets: [
          "Swap to an emergency scarf to slow decay by about 10 percent.",
          "Use campsite cots for an instant 15 warmth bump.",
          "Radio the burrow for pickup once wind spikes above 1.4x.",
        ],
      },
    ],
    supplyTips: [
      "Carry at least two Hot Teas whenever the forecast is storm or worse.",
      "Pre-cut birch logs before sunrise to guarantee about 30 minutes of fire time.",
      "Store Mushroom Stew near the exit so you can top up before committing to a loop.",
    ],
    calculatorHooks: [
      { label: "Warmth Budget Matrix", targetId: "warmth-budget-matrix", type: "guide" },
      { label: "Supply Planner", targetId: "supply-planner", type: "guide" },
    ],
    media: [
      {
        title: "Steam screenshot",
        caption: "Preheating a campfire grid before a storm push.",
      },
      {
        title: "Steam screenshot",
        caption: "Preheating a campfire grid before a storm push.",
      },
    ],
    faq: [
      {
        question: "What's a safe warmth buffer?",
        answer: "Keep effective warmth at 40 or above so decay never drops you into danger mid-run.",
      },
      {
        question: "Do hot drinks stack with clothing?",
        answer: "Yes. Drinks add temporary heat on top of your clothing baseline.",
      },
      {
        question: "How far apart should I place fires?",
        answer: "About 60 in-game meters so heat overlaps without wasting fuel.",
      },
    ],
    footerActions: [
      { label: "Return to Articles", type: "view", targetId: "articles" },
      { label: "Open Warmth Budget", type: "guide", targetId: "warmth-budget-matrix" },
      { label: "Explore Guides", type: "view", targetId: "guides" },
    ],
    relatedIds: ["campfire-fuel-math", "seasonal-events-forecast"],
  },
  {
    id: "campfire-fuel-math",
    category: "Survival",
    title: "Winter Burrow Campfire Kit & Fuel Math - Burn Times, Brazier vs Campfire",
    summary:
      "Track campfire kit burn windows, fuel combos, and heat overlap so storm expeditions never freeze out.",
    readTime: "Guide",
    date: null,
    tags: ["campfire", "fuel", "heat"],
    sections: [
      {
        label: "Overview",
        title: "Heat coverage without waste",
        body:
          "Use this as the fuel-side companion to the warmth guide when you need to choose between campfire kits, braziers, and staged refill piles.",
        bullets: [
          "Center routes around burn time instead of only raw warmth spikes.",
          "Track overlap so nearby fires do not consume premium fuel for no gain.",
          "Best paired with storm prep, night travel, and return routes through exposed ridges.",
        ],
      },
    ],
  },
  {
    id: "seasonal-events-forecast",
    category: "Survival",
    title: "Seasonal Events & Forecast Prep",
    summary:
      "Plan for storms, festivals, and resource booms by reading the forecast board and staging supplies before the weather turns.",
    readTime: "Guide",
    date: null,
    tags: ["forecast", "storms", "planning"],
    sections: [
      {
        label: "Overview",
        title: "Forecast-first supply staging",
        body:
          "This article exists to keep your runs proactive instead of reactive. Read the forecast board early, then decide whether the route is a food run, warmth run, or full expedition push.",
        bullets: [
          "Storms raise the value of tea, stew, and pre-lit fire grids dramatically.",
          "Festivals and booms are best handled by staging supplies before the event starts.",
          "Use it with the warmth article whenever weather shifts the whole route budget.",
        ],
      },
    ],
  },
  {
    id: "granite-guide",
    category: "Survival",
    title: "Winter Burrow Granite Guide - Get Granite Fast & Avoid the Softlock (Exact Route + Map Anchor)",
    summary:
      "Granite is mid-game by design. Anchor on the map, run a short south corridor from Bufo, and the first granite pockets open right after the granite-blocked log.",
    readTime: "8 min read",
    date: "Nov 16, 2025",
    tags: ["granite", "softlock", "resources"],
    actions: [
      { label: "Open Expedition Planner", type: "guide", targetId: "expedition-planner" },
      { label: "Back to Articles", type: "view", targetId: "articles" },
    ],
    heroMapTitle: "Granite route anchor from BUFO through stone gate, grass band, and granite log",
    heroMapCaption: "Short first-loop route anchor. Use the map before pushing the first granite run.",
    mapAnchors: ["BUFO", "STONE GATE", "GRASS BAND", "GRANITE LOG"],
    sections: [
      {
        label: "Section 01",
        title: "Why It Feels Like a Softlock - And When to Go",
        body:
          "Early UI mentions Granite before the world really wants you to mine it. Finish Bufo's tool chain first, then the south corridor flips from blocked to productive and the first granite pockets open just after the granite-blocked log.",
      },
      {
        label: "Section 02",
        title: "Fast First Loop (4 Landmarks)",
        body: "Four cues are enough to run the first Granite loop safely and reverse it before night closes in.",
        bullets: [
          "P1: Follow the shoreline south from Bufo until the path blocks.",
          "P2: Break the stone gate and step south.",
          "P3: Cross the grass band, angle down-right to the granite-blocked log, and clear it.",
          "P4: Mine the first granite pockets, then reverse the route before night.",
        ],
      },
      {
        label: "Section 03",
        title: "Loadout & Mistakes to Avoid",
        body:
          "The most common mistakes are forcing basement repairs too early, spending your last Granite on decor, and running the route at night without anchors.",
        bullets: [
          "Carry 1 tea and 1 pie for day loops, or 2 teas for storms and night.",
          "A campfire at the broken-logs screen is optional but stabilizes risky runs.",
          "Empty your bag first because Granite is heavy and short loops are better than greedy ones.",
        ],
      },
      {
        label: "Section 04",
        title: "Frequently Asked Questions",
        body: "Quick Granite answers for the first few runs.",
        bullets: [
          "Am I truly softlocked? No. You are early. Finish Bufo's tool chain, then return.",
          "Where is the first reliable Granite? Just beyond the granite-blocked log south of Bufo.",
          "How many runs for 15 Granite? Small bag means roughly 2 to 3 loops, depending on tea and campfire support.",
          "Do nodes respawn? Yes, over time. Rotate tasks between loops.",
          "Is night OK? Possible, but colder and flatter. Plan a campfire if you must.",
        ],
      },
      {
        label: "Section 05",
        title: "Internal Links",
        body:
          "Use the planner before departure, keep the map guide open for corridor reading, and fall back to the pickaxe guide if the route still feels closed.",
        bullets: [
          "Plan safely with the Expedition Planner.",
          "Learn corridor reading in the Map Guide.",
          "Review tool steps in the Pickaxe Guide.",
        ],
      },
    ],
    supplyTips: [
      "Use the planner and add tea or campfire support if the route shows Danger.",
      "Keep at least 1 Granite reserved for tool crafting instead of decor.",
      "Run short loops first and save night attempts for anchored routes only.",
    ],
    calculatorHooks: [
      { label: "Optimal Expedition Planner", targetId: "expedition-planner", type: "guide" },
      { label: "Pickaxe Guide", targetId: "pickaxe-guide", type: "article" },
      { label: "Map Guide", targetId: "map-navigation-guide", type: "article" },
    ],
    faq: [
      {
        question: "Where is my first safe Granite?",
        answer: "Loose pieces appear near Bufo's larger area, and once the Granite Pickaxe is ready the boulders behind the granite log open reliable nodes.",
      },
      {
        question: "Did I softlock my save?",
        answer: "Extremely unlikely. Progress Bufo's quests, craft the Granite Pickaxe, break granite gates, and Granite starts flowing.",
      },
      {
        question: "How many runs for 15 Granite?",
        answer: "With a small bag, expect 2 to 3 loops. If the planner shows Danger, add tea support or place a campfire mid-route.",
      },
    ],
    internalLinks: [
      { label: "Expedition Planner", targetId: "expedition-planner", type: "guide" },
      { label: "Map Guide", targetId: "map-navigation-guide", type: "article" },
      { label: "Pickaxe Guide", targetId: "pickaxe-guide", type: "article" },
    ],
    footerActions: [
      { label: "Return to Articles", type: "view", targetId: "articles" },
      { label: "Open Expedition Planner", type: "guide", targetId: "expedition-planner" },
      { label: "Explore Guides", type: "view", targetId: "guides" },
    ],
    relatedIds: ["stay-warm-guide", "pickaxe-guide", "map-navigation-guide"],
  },
  {
    id: "moss-quest-guide",
    category: "Survival",
    title: "Winter Burrow Moss Quest Guide - Snow Fur, Heavy Key, and Finding Pinesap",
    summary:
      "A step-by-step Moss walkthrough covering the meeting point, Snow Fur delivery, Heavy Key location, Healing Stew, and Pinesap's hood and pendant.",
    readTime: "Guide",
    date: null,
    tags: ["moss", "pinesap", "quests"],
    sections: [
      {
        label: "Overview",
        title: "North route clarity",
        body:
          "This is the focused version of the Moss path. Open it when the north-side quest chain stalls and you need a cleaner sequence.",
        bullets: [
          "Snow Fur, Heavy Key, and Healing Stew are the core beats.",
          "Pairs well with the main walkthrough if you only want the Moss branch expanded.",
          "Especially useful when Pinesap items start splitting the route into multiple errands.",
        ],
      },
    ],
  },
  {
    id: "pickaxe-guide",
    category: "Survival",
    title: "Winter Burrow Pickaxe Guide - Unlock Bufo's Upgrade & Break Granite Gates",
    summary:
      "How to progress Bufo's chain to the upgraded pickaxe, where it changes the world, and a safe first route anchored to a labeled community map.",
    readTime: "Guide",
    date: null,
    tags: ["pickaxe", "bufo", "tools"],
    sections: [
      {
        label: "Overview",
        title: "The upgrade that changes route planning",
        body:
          "The Granite Pickaxe is the cleanest world-opener in the provided notes. Use this guide when you want the mechanical route without rereading the full story walkthrough.",
        bullets: [
          "Centered on Bufo and the first granite backtracks.",
          "Helps identify which gates are worth revisiting immediately.",
          "Best used with a travel-light loadout and a short warm-food route.",
        ],
      },
    ],
  },
  {
    id: "map-navigation-guide",
    category: "Survival",
    title: "Winter Burrow Map & Navigation Guide - Landmark Routing Without a Minimap",
    summary:
      "Use a labeled community map and landmark grammar like shorelines, grass bands, hollow logs, and gate types to navigate confidently.",
    readTime: "Guide",
    date: null,
    tags: ["map", "navigation"],
    sections: [
      {
        label: "Overview",
        title: "Landmark grammar over minimap dependence",
        body:
          "This is the navigation companion piece for the toolkit. It turns environmental reads into route logic so the world stays legible even without a minimap.",
        bullets: [
          "Prioritize shoreline rails, grass seams, and hollow logs.",
          "Distinguish stone gates from granite gates before committing to a loop.",
          "Use it as the navigation primer before longer story or resource runs.",
        ],
      },
    ],
  },
];
