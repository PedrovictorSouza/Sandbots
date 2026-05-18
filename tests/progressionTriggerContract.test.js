import { describe, expect, it } from "vitest";
import { QUEST_EVENT } from "../app/quest/questData.js";
import { AUTOSAVE_EVENT } from "../app/runtime/autosaveRuntime.js";
import {
  COLONY_MILESTONE,
  COLONY_PROGRESS_EVENT,
  emitColonyProgressQuestEvents,
  getNewColonyMilestoneIds,
  resolveColonyProgressTriggers,
  validateColonyProgressEvent
} from "../app/story/progressionTriggerContract.js";

describe("progression trigger contract", () => {
  it("maps tool unlocks to quest progress, milestones, and autosave events", () => {
    const resolved = resolveColonyProgressTriggers(COLONY_PROGRESS_EVENT.TOOL_UNLOCKED, {
      toolId: "waterGun"
    });

    expect(resolved.errors).toEqual([]);
    expect(resolved.triggers.map((trigger) => trigger.id)).toEqual(["hydro-tool-online"]);
    expect(resolved.questEvents).toEqual([
      {
        type: QUEST_EVENT.UNLOCK,
        targetId: "waterGun",
        amount: 1
      }
    ]);
    expect(resolved.milestoneIds).toEqual([
      COLONY_MILESTONE.HYDRO_BOT_REACTIVATED,
      COLONY_MILESTONE.WATER_TOOL_ONLINE
    ]);
    expect(resolved.autosaveEvents).toEqual([
      {
        type: AUTOSAVE_EVENT.NEW_ABILITY_LEARNED,
        payload: {
          triggerId: "hydro-tool-online",
          toolId: "waterGun"
        }
      }
    ]);
  });

  it("preserves event amount when restoration applies quest progress", () => {
    const resolved = resolveColonyProgressTriggers(COLONY_PROGRESS_EVENT.RESTORATION_APPLIED, {
      targetId: "dry-grass",
      toolId: "waterGun",
      amount: 4
    });

    expect(resolved.questEvents).toEqual([
      {
        type: QUEST_EVENT.BUILD,
        targetId: "revived-grass",
        amount: 4
      }
    ]);
    expect(resolved.milestoneIds).toEqual([
      COLONY_MILESTONE.SOIL_RESTORATION_PROGRESS
    ]);
  });

  it("emits quest progress through the trigger contract adapter", () => {
    const questSystem = {
      emit: (event) => ({
        changed: event.targetId === "revived-grass",
        completedQuestIds: []
      })
    };
    const resolved = emitColonyProgressQuestEvents({
      questSystem,
      eventType: COLONY_PROGRESS_EVENT.RESTORATION_APPLIED,
      payload: {
        targetId: "dry-grass",
        toolId: "waterGun",
        amount: 2
      }
    });

    expect(resolved.questEvents).toEqual([
      {
        type: QUEST_EVENT.BUILD,
        targetId: "revived-grass",
        amount: 2
      }
    ]);
    expect(resolved.questResults).toEqual([
      {
        changed: true,
        completedQuestIds: []
      }
    ]);
    expect(resolved.milestoneIds).toEqual([
      COLONY_MILESTONE.SOIL_RESTORATION_PROGRESS
    ]);
  });

  it("maps buildable placement to the first shelter site milestone", () => {
    const resolved = resolveColonyProgressTriggers(COLONY_PROGRESS_EVENT.BUILDABLE_PLACED, {
      buildableId: "leafDenKit"
    });

    expect(resolved.questEvents).toEqual([
      {
        type: QUEST_EVENT.PLACE,
        targetId: "leafy-home-patch",
        amount: 1
      }
    ]);
    expect(resolved.milestoneIds).toEqual([
      COLONY_MILESTONE.FIRST_SHELTER_SITE_MARKED
    ]);
    expect(resolved.autosaveEvents[0]).toMatchObject({
      type: AUTOSAVE_EVENT.TASK_COMPLETED
    });
  });

  it("allows non-quest terminal milestones to stay out of quest objectives", () => {
    const resolved = resolveColonyProgressTriggers(COLONY_PROGRESS_EVENT.TERMINAL_LOGGED, {
      reportId: "boulder-shaded-tall-grass"
    });

    expect(resolved.questEvents).toEqual([]);
    expect(resolved.milestoneIds).toEqual([COLONY_MILESTONE.VIABILITY_LOGGED]);
    expect(resolved.autosaveEvents).toEqual([
      {
        type: AUTOSAVE_EVENT.MAJOR_SYSTEM_UNLOCKED,
        payload: {
          triggerId: "viability-logged",
          reportId: "boulder-shaded-tall-grass"
        }
      }
    ]);
  });

  it("returns each new milestone only once", () => {
    const resolved = resolveColonyProgressTriggers(COLONY_PROGRESS_EVENT.TOOL_UNLOCKED, {
      toolId: "waterGun"
    });

    expect(getNewColonyMilestoneIds([
      COLONY_MILESTONE.HYDRO_BOT_REACTIVATED
    ], resolved)).toEqual([
      COLONY_MILESTONE.WATER_TOOL_ONLINE
    ]);
  });

  it("validates unknown progress events without throwing", () => {
    const validation = validateColonyProgressEvent("missing-event", {});
    const resolved = resolveColonyProgressTriggers("missing-event", {});

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual([
      expect.objectContaining({
        code: "unknown-progress-event"
      })
    ]);
    expect(resolved.triggers).toEqual([]);
    expect(resolved.questEvents).toEqual([]);
  });
});
