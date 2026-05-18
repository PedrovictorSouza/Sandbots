import { describe, expect, it } from "vitest";
import {
  getSandbotsTerminologyMigration,
  listSandbotsCanonicalTerms,
  listSandbotsTerminologyMigrations,
  SANDBOTS_NAMING_RULES,
  SANDBOTS_PREMISE,
  SANDBOTS_QUEST_WRITING_RULES,
  SANDBOTS_TERMINOLOGY_MAP,
  SANDBOTS_WORLD_RULES
} from "../app/story/sandbotsNarrativeBible.js";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "../app/story/sandbotsLexicon.js";

const EXTERNAL_IP_TERMS = [
  "Pokemon",
  "Pokedex",
  "Trainer",
  "Bulbasaur",
  "Squirtle",
  "Charmander",
  "Timburr",
  "Water Gun",
  "Leafage"
];

describe("sandbots narrative bible", () => {
  it("defines the original Sandbots premise and world rules", () => {
    expect(SANDBOTS_PREMISE.logline).toContain("pocket planet");
    expect(SANDBOTS_PREMISE.playerRole).toContain("Builder frame");
    expect(SANDBOTS_PREMISE.coreLoop).toContain("viability");
    expect(SANDBOTS_WORLD_RULES.power).toContain("Power radius");
    expect(SANDBOTS_WORLD_RULES.machines).toContain("diagnose");
    expect(SANDBOTS_QUEST_WRITING_RULES).toEqual(expect.arrayContaining([
      expect.stringContaining("what system is failing")
    ]));
  });

  it("maps external-IP-derived terms to original Sandbots replacements", () => {
    expect(listSandbotsTerminologyMigrations()).toHaveLength(SANDBOTS_TERMINOLOGY_MAP.length);
    expect(getSandbotsTerminologyMigration("Pokedex")).toMatchObject({
      newTerm: SANDBOTS_WORLD_TERMS.codex,
      userFacing: true,
      internalRename: "defer"
    });
    expect(getSandbotsTerminologyMigration("Bulbasaur")?.newTerm).toBe(SANDBOTS_BOT_NAMES.grow);
    expect(getSandbotsTerminologyMigration("Squirtle")?.newTerm).toBe(SANDBOTS_BOT_NAMES.hydro);
    expect(getSandbotsTerminologyMigration("Charmander")?.newTerm).toBe(SANDBOTS_BOT_NAMES.thermal);
    expect(getSandbotsTerminologyMigration("Water Gun")?.newTerm).toBe(SANDBOTS_ITEM_NAMES.hydroTool);
    expect(getSandbotsTerminologyMigration("Leafage")?.newTerm).toBe(SANDBOTS_ITEM_NAMES.growTool);
  });

  it("keeps canonical Sandbots terms free of external IP language", () => {
    const canonicalCopy = listSandbotsCanonicalTerms().join("\n");
    for (const term of EXTERNAL_IP_TERMS) {
      expect(canonicalCopy).not.toContain(term);
    }
  });

  it("declares naming boundaries for future content", () => {
    expect(SANDBOTS_NAMING_RULES.allowedPatterns.join("\n")).toContain("Role-first bot names");
    expect(SANDBOTS_NAMING_RULES.forbiddenPatterns.join("\n")).toContain("Pokemon species names");
  });
});
