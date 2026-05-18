import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "./sandbotsLexicon.js";

export function normalizeSandbotsVisibleText(value) {
  return String(value || "")
    .replaceAll("Pokemon Center PC", SANDBOTS_WORLD_TERMS.terminal)
    .replaceAll("Ruined Pokemon Center", SANDBOTS_WORLD_TERMS.terminalRuins)
    .replaceAll("Pokedex", SANDBOTS_WORLD_TERMS.codex)
    .replaceAll("Bulbasaur", SANDBOTS_BOT_NAMES.grow)
    .replaceAll("Charmander", SANDBOTS_BOT_NAMES.thermal)
    .replaceAll("Squirtle", SANDBOTS_BOT_NAMES.hydro)
    .replaceAll("Timburr", SANDBOTS_BOT_NAMES.builder)
    .replaceAll("Ditto Flag", SANDBOTS_ITEM_NAMES.colonyFlag)
    .replaceAll("Water Gun", SANDBOTS_ITEM_NAMES.hydroTool)
    .replaceAll("Leafage", SANDBOTS_ITEM_NAMES.growTool)
    .replaceAll("Fire", SANDBOTS_ITEM_NAMES.thermalTool);
}
