import { describe, expect, it } from "vitest";
import {
  createProgressionDiagnostics,
  getProgressionDiagnosticWarningCodes,
  PROGRESSION_DIAGNOSTIC_WARNING,
} from "../app/story/progressionDiagnostics.js";
import { SMALL_ISLAND_QUESTS } from "../app/quest/questData.js";
import { FIELD_TASK_IDS } from "../app/story/storyBeatData.js";

function getQuest(questId) {
  return SMALL_ISLAND_QUESTS.find((quest) => quest.id === questId);
}

describe("progression diagnostics", () => {
  it("summarizes the current quest, legacy quest, field tasks, and unlocked skills", () => {
    const diagnostics = createProgressionDiagnostics({
      systemQuest: getQuest("gather-first-supplies"),
      storyState: {
        questIndex: 1,
        flags: {
          trackedTaskIds: [FIELD_TASK_IDS.WATER_DRY_TALL_GRASS],
        },
        restoredGrassCount: 2,
      },
      playerSkills: {
        leafage: false,
        waterGun: true,
      },
      runtimeAbilityCostKinds: {},
    });

    expect(diagnostics.systemQuest).toMatchObject({
      id: "gather-first-supplies",
      title: "Wake up Hydro Bot",
    });
    expect(diagnostics.legacyQuest).toMatchObject({
      id: "findPokemon",
      title: "Find the Stranded Bot",
      index: 1,
    });
    expect(diagnostics.activeFieldTasks).toEqual([
      expect.objectContaining({
        id: FIELD_TASK_IDS.WATER_DRY_TALL_GRASS,
        done: false,
      }),
    ]);
    expect(diagnostics.unlockedSkills).toEqual(["waterGun"]);
  });

  it("flags parallel Hydro chains and stale Wake Up Hydro copy that no longer matches its objective", () => {
    const hydroQuest = getQuest("gather-first-supplies");
    const staleHydroQuest = {
      ...hydroQuest,
      guidance: "Scan or collect warm wood before the heat signature disappears.",
      errandQuest: {
        ...hydroQuest.errandQuest,
        hudText: "Wake up Hydro Bot: scan warm wood before the heat signature disappears."
      }
    };
    const diagnostics = createProgressionDiagnostics({
      systemQuest: staleHydroQuest,
      storyState: { questIndex: 1, flags: {} },
      playerSkills: {},
      runtimeAbilityCostKinds: {},
    });

    expect(getProgressionDiagnosticWarningCodes(diagnostics)).toEqual(
      expect.arrayContaining([
        PROGRESSION_DIAGNOSTIC_WARNING.PARALLEL_HYDRO_QUESTS,
        PROGRESSION_DIAGNOSTIC_WARNING.QUEST_COPY_ACTION_MISMATCH,
      ]),
    );
  });

  it("flags stale Wake Up Hydro copy when the mismatch only appears in errand HUD text", () => {
    const hydroQuest = getQuest("gather-first-supplies");
    const staleHydroQuest = {
      ...hydroQuest,
      guidance: "Follow Chopper's marker to Hydro Bot, then interact when the prompt appears.",
      errandQuest: {
        ...hydroQuest.errandQuest,
        hudText: "Wake up Hydro Bot: scan warm wood before the heat signature disappears."
      }
    };
    const diagnostics = createProgressionDiagnostics({
      systemQuest: staleHydroQuest,
      storyState: { questIndex: 0, flags: {} },
      playerSkills: {},
      runtimeAbilityCostKinds: {},
    });

    expect(getProgressionDiagnosticWarningCodes(diagnostics)).toContain(
      PROGRESSION_DIAGNOSTIC_WARNING.QUEST_COPY_ACTION_MISMATCH,
    );
  });

  it("flags Wake Up Hydro if Water Gun is already unlocked", () => {
    const diagnostics = createProgressionDiagnostics({
      systemQuest: getQuest("gather-first-supplies"),
      storyState: { questIndex: 0, flags: {} },
      playerSkills: { waterGun: true },
      runtimeAbilityCostKinds: {},
    });

    expect(getProgressionDiagnosticWarningCodes(diagnostics)).toContain(
      PROGRESSION_DIAGNOSTIC_WARNING.WATERGUN_UNLOCKED_HYDRO_ACTIVE,
    );
  });

  it("flags detached quests when they become active", () => {
    const diagnostics = createProgressionDiagnostics({
      systemQuest: getQuest("open-the-water-route"),
      storyState: { questIndex: 0, flags: {} },
      playerSkills: {},
      runtimeAbilityCostKinds: {},
    });

    expect(getProgressionDiagnosticWarningCodes(diagnostics)).toContain(
      PROGRESSION_DIAGNOSTIC_WARNING.DETACHED_SYSTEM_QUEST_ACTIVE,
    );
  });

  it("flags dry grass tracking when the same beat is active in quest and field-task layers", () => {
    const diagnostics = createProgressionDiagnostics({
      systemQuest: getQuest("water-dry-grass"),
      storyState: {
        questIndex: 0,
        flags: {
          trackedTaskIds: [FIELD_TASK_IDS.WATER_DRY_TALL_GRASS],
        },
        restoredGrassCount: 4,
      },
      playerSkills: {},
      runtimeAbilityCostKinds: {},
    });

    expect(getProgressionDiagnosticWarningCodes(diagnostics)).toContain(
      PROGRESSION_DIAGNOSTIC_WARNING.DUPLICATE_DRY_GRASS_TRACKING,
    );
  });

  it("flags field ability costs that exist in data but are not used by runtime behavior", () => {
    const diagnostics = createProgressionDiagnostics({
      systemQuest: getQuest("learn-to-move"),
      storyState: { questIndex: 0, flags: {} },
      playerSkills: {},
    });

    expect(diagnostics.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PROGRESSION_DIAGNOSTIC_WARNING.FIELD_ABILITY_COST_DISCONNECTED,
          details: expect.objectContaining({
            abilityId: "leafage",
            declaredKind: "materialBundle",
            runtimeKind: "none",
          }),
        }),
        expect.objectContaining({
          code: PROGRESSION_DIAGNOSTIC_WARNING.FIELD_ABILITY_COST_DISCONNECTED,
          details: expect.objectContaining({
            abilityId: "waterGun",
            declaredKind: "materialBundle",
            runtimeKind: "stamina",
          }),
        }),
      ]),
    );
    expect(
      diagnostics.warnings.some(
        (warning) =>
          warning.code === PROGRESSION_DIAGNOSTIC_WARNING.FIELD_ABILITY_COST_DISCONNECTED &&
          warning.details.abilityId === "fire",
      ),
    ).toBe(false);
  });
});
