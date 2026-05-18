import { describe, expect, it } from "vitest";
import { listWorkbenchBuildables } from "../app/gameplay/buildableCatalog.js";
import { ROBOT_CATALOG } from "../app/gameplay/content/robotCatalog.js";
import {
  CONTENT_CATALOG_KIND,
  DIALOGUE_LINE_FUNCTION,
  getDialogueLineUtilityErrors,
  getObjectiveConsequenceCopyErrors,
  getContentCatalogValidationErrors,
  listContentCatalogEntries,
  validateContentCatalog
} from "../app/story/contentCatalogContracts.js";
import { SMALL_ISLAND_DIALOGUES } from "../app/dialogue/dialogueData.js";
import { listShortExpeditions } from "../app/story/shortExpeditionData.js";
import { FIELD_TASK_IDS, SMALL_ISLAND_FIELD_TASKS } from "../app/story/storyBeatData.js";
import { ITEM_DEFS, STORY_QUESTS } from "../gameplayContent.js";
import { POKEDEX_ENTRIES } from "../pokedexEntries.js";
import { POKEDEX_REQUESTS } from "../pokedexRequests.js";

describe("content catalog contracts", () => {
  it("validates current bot and buildable catalogs without runtime side effects", () => {
    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.BOTS,
      catalog: ROBOT_CATALOG
    })).toMatchObject({
      valid: true,
      entriesChecked: 1,
      errors: []
    });

    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.BUILDABLES,
      catalog: listWorkbenchBuildables()
    })).toMatchObject({
      valid: true,
      entriesChecked: 3,
      errors: []
    });
  });

  it("validates field task player-facing text while preserving legacy internal ids", () => {
    const result = validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.FIELD_TASKS,
      catalog: SMALL_ISLAND_FIELD_TASKS,
      evaluateTextFunctions: true,
      textFunctionContext: { flags: {} }
    });

    expect(result.valid).toBe(true);
    expect(result.entriesChecked).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
    expect(Object.keys(SMALL_ISLAND_FIELD_TASKS).some((id) => id.includes("bulbasaur"))).toBe(true);
  });

  it("validates short expedition content as a first-class catalog", () => {
    const result = validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.SHORT_EXPEDITIONS,
      catalog: listShortExpeditions()
    });

    expect(result).toMatchObject({
      valid: true,
      entriesChecked: 1,
      errors: []
    });
  });

  it("keeps main quest player-facing copy in Sandbots terminology", () => {
    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.FIELD_TASKS,
      catalog: STORY_QUESTS,
      requiredFields: ["id", "title", "body"],
      playerFacingFields: [
        "eyebrow",
        "act",
        "title",
        "body",
        "storyBeat",
        "onboarding",
        "reward",
        "actionLabel",
        "toolkitHint",
        "resolveLine"
      ]
    })).toMatchObject({
      valid: true,
      errors: []
    });
  });

  it("keeps structured dialogue lines in Sandbots terminology", () => {
    const dialogueLines = Object.values(SMALL_ISLAND_DIALOGUES).flatMap((dialogue) => {
      return (dialogue.lines || []).map((line, index) => ({
        id: `${dialogue.id}-line-${index}`,
        speaker: line.speaker || line.speakerId || dialogue.speakerId || "",
        text: line.text
      }));
    });

    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.FIELD_TASKS,
      catalog: dialogueLines,
      requiredFields: ["id", "text"],
      playerFacingFields: ["speaker", "text"]
    })).toMatchObject({
      valid: true,
      errors: []
    });
  });

  it("allows legacy dialogue without utility metadata until a dialogue set opts into the Jesse line-function contract", () => {
    expect(getDialogueLineUtilityErrors({
      dialogues: SMALL_ISLAND_DIALOGUES
    })).toEqual([]);
  });

  it("validates dialogue line functions when a dialogue set opts into the Jesse line-function contract", () => {
    expect(getDialogueLineUtilityErrors({
      requireLineFunction: true,
      dialogues: {
        opening: {
          id: "opening",
          lines: [
            {
              id: "good",
              text: "Hydro Bot is online. Water can move again.",
              functions: [
                DIALOGUE_LINE_FUNCTION.FEEDBACK,
                DIALOGUE_LINE_FUNCTION.WORLD
              ]
            },
            {
              id: "missing",
              text: "Well, that happened."
            },
            {
              id: "unknown",
              text: "A line with vague intent.",
              lineFunction: "vibes"
            },
            {
              id: "empty",
              text: " ",
              lineFunction: DIALOGUE_LINE_FUNCTION.JOKE
            }
          ]
        }
      }
    })).toEqual([
      {
        type: "dialogue-line-missing-function",
        dialogueId: "opening",
        lineId: "missing",
        lineIndex: 1
      },
      {
        type: "dialogue-line-unknown-function",
        dialogueId: "opening",
        lineId: "unknown",
        lineIndex: 2,
        lineFunction: "vibes"
      },
      {
        type: "dialogue-line-missing-text",
        dialogueId: "opening",
        lineId: "empty",
        lineIndex: 3
      }
    ]);
  });

  it("keeps Colony Codex entries and requests in Sandbots terminology", () => {
    const codexEntryFields = [
      "number",
      "name",
      "details.eyebrow",
      "details.species",
      "details.descriptionHtml",
      "details.stats",
      "whereToFind.eyebrow",
      "whereToFind.pin",
      "whereToFind.island",
      "whereToFind.count",
      "whereToFind.stats",
      "specialties.eyebrow",
      "specialties.specialtyTitle",
      "specialties.specialtyLabel",
      "specialties.favoritesTitle",
      "specialties.favorites",
      "specialties.habitatTitle",
      "specialties.habitatCopy",
      "artCard.title",
      "artCard.time",
      "artCard.rarity",
      "drawer.label",
      "drawer.count"
    ];

    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.CODEX_ENTRIES,
      catalog: POKEDEX_ENTRIES,
      playerFacingFields: codexEntryFields
    })).toMatchObject({
      valid: true,
      errors: []
    });

    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.CODEX_REQUESTS,
      catalog: POKEDEX_REQUESTS,
      playerFacingFields: ["status", "giver", "title", "description", "objective", "reward"]
    })).toMatchObject({
      valid: true,
      errors: []
    });
  });

  it("reports missing ids, duplicate ids, missing player-facing fields, and external terms", () => {
    const errors = getContentCatalogValidationErrors({
      kind: CONTENT_CATALOG_KIND.BUILDABLES,
      catalog: [
        { id: "solarStation", label: "Solar Station", group: "Power" },
        { id: "solarStation", label: "Bulbasaur kit", group: "Shelter" },
        { label: "", group: "Shelter" },
        {
          id: "html-safe",
          label: '<span class="pokedex-entry__accent">Colony Codex</span>',
          group: "Shelter"
        },
        {
          id: "html-forbidden",
          label: '<span class="codex-entry__accent">Bulbasaur kit</span>',
          group: "Shelter"
        }
      ]
    });

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "duplicate-entry-id",
        entryId: "solarStation"
      }),
      expect.objectContaining({
        type: "external-ip-player-facing-term",
        field: "label",
        term: "bulbasaur"
      }),
      expect.objectContaining({
        type: "external-ip-player-facing-term",
        entryId: "html-forbidden",
        field: "label",
        term: "bulbasaur"
      }),
      expect.objectContaining({
        type: "missing-entry-id"
      }),
      expect.objectContaining({
        type: "missing-required-field",
        field: "id"
      }),
      expect.objectContaining({
        type: "missing-required-field",
        field: "label"
      })
    ]));
    expect(errors).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        entryId: "html-safe",
        type: "external-ip-player-facing-term"
      })
    ]));
  });

  it("accepts object-map catalogs for content files that are keyed by id", () => {
    expect(listContentCatalogEntries({
      hydro: { id: "hydro", name: "Hydro Bot" },
      grow: { id: "grow", name: "Grow Bot" }
    })).toEqual([
      { id: "hydro", name: "Hydro Bot" },
      { id: "grow", name: "Grow Bot" }
    ]);
  });

  it("keeps item copy out of shop, buy, purchase, and currency language", () => {
    expect(validateContentCatalog({
      kind: CONTENT_CATALOG_KIND.ITEMS,
      catalog: ITEM_DEFS,
      playerFacingFields: ["label", "bagLabel", "shortLabel", "description"],
      prohibitedPlayerFacingTerms: ["life coins", "shop", "buy", "purchase", "currency"]
    })).toMatchObject({
      valid: true,
      errors: []
    });
  });

  it("keeps first-use objective copy tied to a consequence instead of a bare instruction", () => {
    const firstUseTasks = [
      FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST,
      FIELD_TASK_IDS.REVIVE_LEPPA_TREE,
      FIELD_TASK_IDS.WATER_DRY_TALL_GRASS,
      FIELD_TASK_IDS.BULBASAUR_LEAFAGE_REWARD,
      FIELD_TASK_IDS.BULBASAUR_GREEN_CORNER_PLAY_SEED
    ].map((taskId) => SMALL_ISLAND_FIELD_TASKS[taskId]);

    expect(getObjectiveConsequenceCopyErrors({
      catalog: firstUseTasks,
      evaluateTextFunctions: true,
      textFunctionContext: { flags: {} }
    })).toEqual([]);
  });

  it("flags objective copy that repeats the title or gives no colony consequence", () => {
    expect(getObjectiveConsequenceCopyErrors({
      catalog: [
        {
          id: "duplicate",
          title: "Collect wood",
          description: "Collect wood"
        },
        {
          id: "busywork",
          title: "Walk north",
          description: "Walk north and press the button."
        }
      ]
    })).toEqual([
      {
        type: "objective-copy-duplicates-title",
        entryId: "duplicate",
        index: 0,
        field: "description"
      },
      {
        type: "objective-copy-missing-consequence",
        entryId: "busywork",
        index: 1,
        field: "description"
      }
    ]);
  });
});
