import { describe, expect, it } from "vitest";
import {
  isHelperRobotReactivated,
  markHelperRobotDetected,
  reactivateHelperRobot
} from "../app/story/robotReactivation.js";

describe("robot reactivation", () => {
  it("records detection and explicit reactivation flags before following", () => {
    const storyState = { flags: {} };

    expect(markHelperRobotDetected(storyState, "bulbasaur", {
      source: "repair-pod"
    })).toBe(true);
    expect(reactivateHelperRobot(storyState, "bulbasaur", {
      source: "repair-pod"
    })).toBe(true);

    expect(storyState.flags).toMatchObject({
      bulbasaurRobotDetected: true,
      bulbasaurRobotDiscoverySource: "repair-pod",
      bulbasaurRobotReactivated: true,
      bulbasaurRobotReactivationSource: "repair-pod",
      bulbasaurFollowing: true,
      reactivatedHelperRobotIds: ["bulbasaur"]
    });
    expect(isHelperRobotReactivated(storyState, "bulbasaur")).toBe(true);
  });

  it("ignores unknown robot ids", () => {
    const storyState = { flags: {} };

    expect(reactivateHelperRobot(storyState, "unknown")).toBe(false);
    expect(storyState.flags).toEqual({});
  });
});
