import { describe, expect, it } from "vitest";
import {
  ACTION_FEEDBACK_ACTION,
  ACTION_FEEDBACK_RESULT,
  getActionFeedbackContract,
  getActionFeedbackContractGaps,
  getActionFeedbackResponse,
  listActionFeedbackContracts
} from "../app/gameplay/actionFeedbackContracts.js";

describe("action feedback contracts", () => {
  it("covers required early actions with valid, blocked, and no-target responses", () => {
    expect(Object.values(ACTION_FEEDBACK_ACTION)).toEqual([
      "cancel",
      "confirm",
      "interact",
      "open-menu",
      "place-kit",
      "use-field-tool"
    ]);
    expect(getActionFeedbackContractGaps()).toEqual([]);
    expect(listActionFeedbackContracts()).toHaveLength(Object.values(ACTION_FEEDBACK_ACTION).length);
  });

  it("documents the no-target field tool hint before runtime string migration", () => {
    expect(getActionFeedbackResponse(
      ACTION_FEEDBACK_ACTION.USE_FIELD_TOOL,
      ACTION_FEEDBACK_RESULT.NO_TARGET
    )).toMatchObject({
      channels: ["notice", "worldPrompt"],
      message: "Still no target. Move until a tile outline or interaction marker appears, then press X / Enter."
    });
  });

  it("documents escalating no-target interaction help", () => {
    expect(getActionFeedbackResponse(
      ACTION_FEEDBACK_ACTION.INTERACT,
      ACTION_FEEDBACK_RESULT.NO_TARGET
    )).toMatchObject({
      channels: ["notice"],
      message: "Nothing to talk to nearby. Move closer to a marker or bot, then press E / X.",
      repeatMessage: "Still nothing nearby. Look for an interaction marker or move closer, then press A / E / X."
    });
  });

  it("keeps placement blocked feedback separate from missing selection feedback", () => {
    expect(getActionFeedbackResponse(
      ACTION_FEEDBACK_ACTION.PLACE_KIT,
      ACTION_FEEDBACK_RESULT.BLOCKED
    )?.message).toContain("Move away from objects");
    expect(getActionFeedbackResponse(
      ACTION_FEEDBACK_ACTION.PLACE_KIT,
      ACTION_FEEDBACK_RESULT.NO_TARGET
    )?.message).toBe("Select a build kit before placing.");
  });

  it("returns null for unknown actions or responses", () => {
    expect(getActionFeedbackContract("unknown")).toBeNull();
    expect(getActionFeedbackResponse(ACTION_FEEDBACK_ACTION.INTERACT, "unknown")).toBeNull();
  });
});
