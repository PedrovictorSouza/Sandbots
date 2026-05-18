import { describe, expect, it } from "vitest";
import { AUTOSAVE_EVENT } from "../app/runtime/autosaveRuntime.js";
import {
  SHORT_EXPEDITION_RETURN_AID,
  getShortExpeditionById,
  listShortExpeditions,
  validateShortExpedition,
  validateShortExpeditions
} from "../app/story/shortExpeditionData.js";

describe("short expedition data", () => {
  it("defines a base-started water route expedition with two useful discoveries", () => {
    const expedition = getShortExpeditionById("water-route-scout");

    expect(expedition).toMatchObject({
      title: "Scout the Water Route",
      startLandmarkId: "colony-cache",
      startsFromBase: true,
      returnAid: {
        type: SHORT_EXPEDITION_RETURN_AID.RADIO_COMPLETION
      },
      reward: {
        visibleWorldChange: "Water route clue marked near the base.",
        autosaveType: AUTOSAVE_EVENT.TASK_COMPLETED
      }
    });
    expect(expedition.discoveries.map((discovery) => discovery.id)).toEqual([
      "dry-channel-edge",
      "pulse-tree-supply"
    ]);
    expect(validateShortExpeditions()).toEqual([]);
    expect(Object.isFrozen(listShortExpeditions())).toBe(true);
    expect(Object.isFrozen(expedition.discoveries)).toBe(true);
  });

  it("validates expeditions that would become empty travel", () => {
    expect(validateShortExpedition({
      id: "bad-route",
      title: "",
      startsFromBase: false,
      discoveries: [{ id: "one" }],
      returnAid: {},
      reward: {}
    })).toEqual([
      { type: "missing-title", expeditionId: "bad-route" },
      { type: "missing-base-start", expeditionId: "bad-route" },
      { type: "missing-two-discoveries", expeditionId: "bad-route" },
      { type: "missing-return-aid", expeditionId: "bad-route" },
      { type: "missing-visible-world-change", expeditionId: "bad-route" },
      { type: "missing-autosave", expeditionId: "bad-route" }
    ]);
  });

  it("rejects copied Minecraft mechanics in Sandbots expedition copy", () => {
    expect(validateShortExpedition({
      id: "copied-survival-loop",
      title: "Carry torches through a mining layer",
      startsFromBase: true,
      discoveries: [
        { id: "a", label: "A", payoff: "Useful route clue." },
        { id: "b", label: "B", payoff: "Useful resource clue." }
      ],
      returnAid: { type: SHORT_EXPEDITION_RETURN_AID.LANDMARK_RETURN },
      reward: {
        visibleWorldChange: "Route marked.",
        autosaveType: AUTOSAVE_EVENT.TASK_COMPLETED
      }
    })).toEqual([
      { type: "forbidden-source-mechanic", expeditionId: "copied-survival-loop", term: "mining layer" },
      { type: "forbidden-source-mechanic", expeditionId: "copied-survival-loop", term: "torch" }
    ]);
  });
});
