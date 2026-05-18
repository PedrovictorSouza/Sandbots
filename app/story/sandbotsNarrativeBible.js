import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_GAME_TITLE,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "./sandbotsLexicon.js";

export const SANDBOTS_PREMISE = Object.freeze({
  title: SANDBOTS_GAME_TITLE,
  logline:
    "Utility bots restore a damaged pocket planet into a viable colony outpost for future human settlement.",
  playerRole:
    "The player is a Builder frame: a field-capable colony bot that repairs terrain, places kits, routes power and coordinates helper bots.",
  setting:
    "A small devastated planet with broken colony infrastructure, dry soil, unstable water, dead machines and scattered helper bots.",
  coreLoop:
    "Restore a world system, log viability, authorize a construction protocol, place useful infrastructure, then unlock the next colony need.",
  tone:
    "Cozy, strange, dry, lightly nihilistic and practical. Jokes are allowed only when the objective remains clear."
});

export const SANDBOTS_WORLD_RULES = Object.freeze({
  power:
    "Energy comes from repaired machines and local stations. Power radius should explain why some construction is valid or blocked.",
  water:
    "Water is a restoration tool, not magic. It should connect to tanks, moisture, irrigation, ice processing, pumps or damaged soil.",
  soil:
    "Dead ground becomes viable when moisture, nutrients and structure return. Restored soil can support habitat clues and plant systems.",
  machines:
    "Machines do not sell items. They diagnose, validate, authorize and issue protocols when the planet can support the next step.",
  bots:
    "Bots are workers with roles, not pets or collectible creatures. They can follow, help, scan, build, water, grow, burn, carry or repair.",
  resources:
    "Resources are logistics for survival and construction. Required resources must be visible, introduced and semantically tied to the task.",
  construction:
    "Construction proves viability. Kits should be issued by protocol and consumed only when placed successfully."
});

export const SANDBOTS_NAMING_RULES = Object.freeze({
  allowedPatterns: Object.freeze([
    "Role-first bot names: Hydro Bot, Grow Bot, Thermal Bot, Builder Bot.",
    "Colony infrastructure: Terminal, Codex, Core, Station, Habitat, Relay.",
    "Practical bot functions: Hydro Jet, Bio-Grow, Thermal Torch.",
    "Materials and ecology terms that explain the colony problem."
  ]),
  forbiddenPatterns: Object.freeze([
    "Pokemon species names in visible text.",
    "Pokedex, trainer, Pokemon Center or other franchise-derived UI labels.",
    "Creature-collection framing for helper bots.",
    "Quest hooks that introduce random concepts unrelated to colony viability."
  ])
});

export const SANDBOTS_QUEST_WRITING_RULES = Object.freeze([
  "Every required task must answer: what system is failing, what object proves it, and why this action helps the colony.",
  "Use visible machines, resources, terrain, bots or UI systems as objective anchors.",
  "Teach one mechanic at a time through a playable action.",
  "Prefer viability, diagnostics, authorization and repair language over buying, catching or collecting-for-its-own-sake.",
  "Humor can color a line, but the actionable instruction must stay obvious."
]);

export const SANDBOTS_TERMINOLOGY_MAP = Object.freeze([
  Object.freeze({
    oldTerm: "Pokemon",
    newTerm: "helper bot",
    category: "character-framing",
    userFacing: true,
    internalRename: "defer",
    reason: "The game is about colony machines and worker bots, not collectible creatures."
  }),
  Object.freeze({
    oldTerm: "Pokedex",
    newTerm: SANDBOTS_WORLD_TERMS.codex,
    category: "ui-device",
    userFacing: true,
    internalRename: "defer",
    reason: "The device should read as a colony diagnostic and tutorial archive."
  }),
  Object.freeze({
    oldTerm: "Pokemon Center",
    newTerm: SANDBOTS_WORLD_TERMS.terminal,
    category: "machine",
    userFacing: true,
    internalRename: "defer",
    reason: "The hub validates planetary viability and construction protocols."
  }),
  Object.freeze({
    oldTerm: "Bulbasaur",
    newTerm: SANDBOTS_BOT_NAMES.grow,
    category: "bot-name",
    userFacing: true,
    internalRename: "defer",
    reason: "Plant restoration is a worker role, not a species identity."
  }),
  Object.freeze({
    oldTerm: "Squirtle",
    newTerm: SANDBOTS_BOT_NAMES.hydro,
    category: "bot-name",
    userFacing: true,
    internalRename: "defer",
    reason: "Water restoration belongs to a hydro utility bot."
  }),
  Object.freeze({
    oldTerm: "Charmander",
    newTerm: SANDBOTS_BOT_NAMES.thermal,
    category: "bot-name",
    userFacing: true,
    internalRename: "defer",
    reason: "Fire and heat work should be framed as thermal maintenance."
  }),
  Object.freeze({
    oldTerm: "Timburr",
    newTerm: SANDBOTS_BOT_NAMES.builder,
    category: "bot-name",
    userFacing: true,
    internalRename: "defer",
    reason: "Construction support should be a builder bot role."
  }),
  Object.freeze({
    oldTerm: "Water Gun",
    newTerm: SANDBOTS_ITEM_NAMES.hydroTool,
    category: "bot-function",
    userFacing: true,
    internalRename: "defer",
    reason: "The function should sound like colony equipment."
  }),
  Object.freeze({
    oldTerm: "Leafage",
    newTerm: SANDBOTS_ITEM_NAMES.growTool,
    category: "bot-function",
    userFacing: true,
    internalRename: "defer",
    reason: "Plant growth should read as a bot-assisted ecological protocol."
  }),
  Object.freeze({
    oldTerm: "Trainer",
    newTerm: "Builder frame",
    category: "player-role",
    userFacing: true,
    internalRename: "defer",
    reason: "The player pilots/builds as a colony restoration unit."
  })
]);

export function listSandbotsTerminologyMigrations() {
  return [...SANDBOTS_TERMINOLOGY_MAP];
}

export function getSandbotsTerminologyMigration(oldTerm) {
  return SANDBOTS_TERMINOLOGY_MAP.find((entry) => entry.oldTerm === oldTerm) || null;
}

export function listSandbotsCanonicalTerms() {
  return [
    SANDBOTS_PREMISE.title,
    SANDBOTS_PREMISE.playerRole,
    SANDBOTS_WORLD_TERMS.codex,
    SANDBOTS_WORLD_TERMS.terminal,
    SANDBOTS_WORLD_TERMS.core,
    ...Object.values(SANDBOTS_BOT_NAMES),
    ...Object.values(SANDBOTS_ITEM_NAMES),
    ...SANDBOTS_TERMINOLOGY_MAP.map((entry) => entry.newTerm)
  ];
}
