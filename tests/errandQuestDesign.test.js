import { describe, expect, it, vi } from "vitest";
import {
  ERRAND_QUEST_ELEMENT,
  getErrandQuestElements,
  getErrandQuestHudText,
  getErrandQuestPokedeskReward,
  getErrandQuestProgressFeedback,
  unlockErrandQuestPokedeskReward,
  validateErrandQuestDesign,
  warnInvalidErrandQuestDesign
} from "../app/quest/errandQuestDesign.js";
import { SMALL_ISLAND_QUESTS } from "../app/quest/questData.js";
import {
  getPokedexEntry,
  THERMAL_GENERATOR_POKEDEX_ENTRY_ID
} from "../pokedexEntries.js";

describe("errand quest design", () => {
  it("converts the first material collection task into a non-empty errand quest", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "gather-first-supplies");

    expect(quest).toMatchObject({
      title: "Wake up Hydro Bot",
      errandQuest: {
        hook: expect.objectContaining({
          short: expect.stringContaining("Hydro Bot")
        }),
        fastResolution: expect.objectContaining({
          type: "radio-completion"
        }),
        visibleReward: expect.objectContaining({
          type: "base-function",
          pokedeskEntryId: THERMAL_GENERATOR_POKEDEX_ENTRY_ID
        })
      }
    });
    expect(quest.description).toContain("water");
    expect(quest.guidance).toContain("interact");
    expect(quest.errandQuest.approachChoices).toHaveLength(2);
    expect(quest.errandQuest.microEvents).toHaveLength(2);
    expect(getErrandQuestHudText(quest)).toContain("Wake up Hydro Bot");
    expect(getErrandQuestPokedeskReward(quest)).toEqual({
      entryId: THERMAL_GENERATOR_POKEDEX_ENTRY_ID,
      label: "Hydro Wake Diagnostic"
    });
    expect(getPokedexEntry(THERMAL_GENERATOR_POKEDEX_ENTRY_ID).name).toBe("Hydro Wake Diagnostic");
    expect(getPokedexEntry(THERMAL_GENERATOR_POKEDEX_ENTRY_ID).details.descriptionHtml).toContain("Hydro Bot answered");
    expect(getPokedexEntry(THERMAL_GENERATOR_POKEDEX_ENTRY_ID).details.descriptionHtml).not.toContain("Dead wood");
    expect(getPokedexEntry(THERMAL_GENERATOR_POKEDEX_ENTRY_ID).whereToFind.stats[0]).toEqual({
      label: "Trigger",
      value: "Hydro contact"
    });
    expect(getErrandQuestElements(quest.errandQuest)).toEqual(expect.arrayContaining([
      ERRAND_QUEST_ELEMENT.HOOK,
      ERRAND_QUEST_ELEMENT.VISIBLE_REWARD,
      ERRAND_QUEST_ELEMENT.MICRO_EVENTS,
      ERRAND_QUEST_ELEMENT.PLAYER_CHOICE,
      ERRAND_QUEST_ELEMENT.FAST_RESOLUTION
    ]));
    expect(validateErrandQuestDesign(quest)).toEqual([]);
  });

  it("resolves micro-feedback and fast-resolution feedback from collection progress", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "gather-first-supplies");

    expect(getErrandQuestProgressFeedback(quest, {
      previousProgress: 0,
      nextProgress: 1
    })).toEqual(expect.arrayContaining([
      "Colony Codex: wake pulse confirmed. Hydro Bot's water core is responding.",
      "Chopper: good. The island can be watered one patch at a time now. Grim, but measurable."
    ]));

    const completionFeedback = getErrandQuestProgressFeedback(quest, {
      previousProgress: 0,
      nextProgress: 1,
      completed: true
    });

    expect(completionFeedback).toEqual(expect.arrayContaining([
      "Chopper confirms Hydro Bot's wake sequence by radio, so the task resolves immediately when the tool comes online.",
      "Hydro Bot comes online and unlocks Hydro Jet for the first restoration route.",
      "Colony Codex entry unlocked: Hydro Wake Diagnostic.",
      "If water can move again, the dry tall grass may show where the colony can safely expand."
    ]));
  });

  it("unlocks the Pokedesk reward only when the errand completes", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "gather-first-supplies");
    const pokedexRuntime = {
      unlock: vi.fn(),
      setSeen: vi.fn()
    };

    expect(unlockErrandQuestPokedeskReward({
      quest,
      completed: false,
      pokedexRuntime
    })).toBeNull();
    expect(pokedexRuntime.unlock).not.toHaveBeenCalled();

    expect(unlockErrandQuestPokedeskReward({
      quest,
      completed: true,
      pokedexRuntime
    })).toEqual({
      entryId: THERMAL_GENERATOR_POKEDEX_ENTRY_ID,
      label: "Hydro Wake Diagnostic"
    });
    expect(pokedexRuntime.unlock).toHaveBeenCalledTimes(1);
    expect(pokedexRuntime.setSeen).toHaveBeenCalledWith(false);
  });

  it("warns when an errand quest lacks anti-busywork elements", () => {
    const warnings = validateErrandQuestDesign({
      id: "bad-fetch",
      errandQuest: {}
    });

    expect(warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "missing-hook",
      "missing-visible-reward",
      "missing-micro-event",
      "missing-choice",
      "missing-fast-resolution",
      "too-few-errand-elements"
    ]));
  });

  it("warns when travel errands have no route beat", () => {
    const warnings = validateErrandQuestDesign({
      id: "empty-walk",
      title: "Reach the cracked pump",
      description: "Go to the pump and return to base.",
      errandQuest: {
        taskType: "travel",
        hook: {
          short: "The pump is ticking with no water inside."
        },
        visibleReward: {
          description: "The pump valve becomes readable on the colony map."
        },
        fastResolution: {
          type: "radio-completion",
          description: "Chopper closes the task by radio."
        }
      }
    });

    expect(warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "missing-micro-event",
      "travel-without-micro-event"
    ]));
    expect(warnings.find((warning) => warning.code === "travel-without-micro-event")?.message)
      .toContain("route beat");
  });

  it("warns when errand support copy repeats the objective instead of adding orientation", () => {
    const warnings = validateErrandQuestDesign({
      id: "duplicated-copy",
      title: "Wake up Hydro Bot",
      description: "Wake up Hydro Bot",
      guidance: "Wake up Hydro Bot",
      errandQuest: {
        hudText: "Wake up Hydro Bot: scan warm wood before the heat signature disappears.",
        instructionText: "Wake up Hydro Bot",
        hook: {
          short: "Hydro Bot is offline."
        },
        visibleReward: {
          description: "Hydro Bot comes online."
        },
        microEvents: [
          {
            feedback: "Hydro Bot responds."
          }
        ],
        approachChoices: [
          {
            label: "Follow the signal",
            tradeoff: "Direct route."
          }
        ],
        fastResolution: {
          type: "radio-completion",
          description: "Chopper confirms the wake sequence by radio."
        }
      }
    });

    expect(warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "quest-copy-duplicates-title",
      "hud-text-contains-guidance"
    ]));
    expect(warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "quest-copy-duplicates-title",
        field: "description"
      }),
      expect.objectContaining({
        code: "quest-copy-duplicates-title",
        field: "guidance"
      }),
      expect.objectContaining({
        code: "quest-copy-duplicates-title",
        field: "instructionText"
      })
    ]));
  });

  it("logs validator warnings only when enabled", () => {
    const consoleRef = {
      warn: vi.fn()
    };
    const badQuest = {
      id: "bad-fetch",
      errandQuest: {}
    };

    expect(warnInvalidErrandQuestDesign({
      quests: [badQuest],
      enabled: false,
      consoleRef
    })).not.toEqual([]);
    expect(consoleRef.warn).not.toHaveBeenCalled();

    warnInvalidErrandQuestDesign({
      quests: [badQuest],
      enabled: true,
      consoleRef
    });

    expect(consoleRef.warn).toHaveBeenCalled();
    expect(consoleRef.warn.mock.calls[0][0]).toContain("[errand-quest-design] bad-fetch");
  });
});
