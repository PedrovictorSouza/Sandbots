import { describe, expect, it, vi } from "vitest";
import {
  AUTOSAVE_EVENT,
  createAutosaveEvent,
  createAutosaveRuntime,
  shouldAutosaveForEvent
} from "../app/runtime/autosaveRuntime.js";

describe("autosaveRuntime", () => {
  it("defines the early-game autosave event names", () => {
    expect(AUTOSAVE_EVENT).toEqual({
      TASK_COMPLETED: "task-completed",
      NEW_ABILITY_LEARNED: "new-ability-learned",
      ROBOT_REACTIVATED: "robot-reactivated",
      FIRST_REQUIRED_ABILITY_USE: "first-required-ability-use",
      PLAYER_NAME_CONFIRMED: "player-name-confirmed",
      MAJOR_SYSTEM_UNLOCKED: "major-system-unlocked",
      STORY_STEP_ADVANCED: "story-step-advanced"
    });
  });

  it("clones payloads and rejects unknown event names", () => {
    const payload = { completedQuestIds: ["first-task"] };
    const event = createAutosaveEvent(AUTOSAVE_EVENT.TASK_COMPLETED, payload);

    payload.completedQuestIds.push("mutated");

    expect(event).toEqual({
      type: AUTOSAVE_EVENT.TASK_COMPLETED,
      payload: {
        completedQuestIds: ["first-task"]
      }
    });
    expect(createAutosaveEvent("unknown-event")).toBeNull();
    expect(shouldAutosaveForEvent(event)).toBe(true);
    expect(shouldAutosaveForEvent({ type: "unknown-event" })).toBe(false);
  });

  it("runs save hooks only for supported events", () => {
    const save = vi.fn(() => true);
    const onSaving = vi.fn();
    const onSaved = vi.fn();
    const runtime = createAutosaveRuntime({
      save,
      onSaving,
      onSaved
    });

    expect(runtime.trigger(AUTOSAVE_EVENT.ROBOT_REACTIVATED, { robotId: "squirtle" })).toBe(true);
    expect(runtime.trigger("unknown-event")).toBe(false);

    expect(save).toHaveBeenCalledTimes(1);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
      type: AUTOSAVE_EVENT.ROBOT_REACTIVATED,
      payload: { robotId: "squirtle" }
    }), true);
  });
});
