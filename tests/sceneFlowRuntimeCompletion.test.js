import { describe, expect, it, vi } from "vitest";
import { applyActTwoTutorialCompletionResult } from "../app/scene/createSceneFlowRuntime.js";

describe("applyActTwoTutorialCompletionResult", () => {
  it("reports confirmed player names after syncing tutorial memory", () => {
    const playerMemory = {};
    const onPlayerNameConfirmed = vi.fn();

    applyActTwoTutorialCompletionResult({
      humanClaim: "human",
      pokedexReaction: "really",
      pokedexChoice: "open",
      foundPokedex: true,
      trainerLookChoice: "ready",
      playerName: "Ada",
      nameConfirmation: "yes",
      worldQuestion: "where"
    }, {
      playerMemory,
      session: {},
      unlockPokedexUi: vi.fn(),
      pushNotice: vi.fn(),
      unlockPlayerSkill: vi.fn(),
      onPlayerNameConfirmed
    });

    expect(playerMemory).toMatchObject({
      humanClaim: "human",
      pokedexReaction: "really",
      pokedexChoice: "open",
      foundPokedex: true,
      trainerLookChoice: "ready",
      playerName: "Ada",
      nameConfirmation: "yes",
      worldQuestion: "where"
    });
    expect(onPlayerNameConfirmed).toHaveBeenCalledWith({
      playerName: "Ada",
      nameConfirmation: "yes"
    });
  });

  it("does not report player name confirmation when no name was confirmed", () => {
    const onPlayerNameConfirmed = vi.fn();

    applyActTwoTutorialCompletionResult({
      playerName: "",
      nameConfirmation: null
    }, {
      playerMemory: {},
      session: {},
      unlockPokedexUi: vi.fn(),
      pushNotice: vi.fn(),
      unlockPlayerSkill: vi.fn(),
      onPlayerNameConfirmed
    });

    expect(onPlayerNameConfirmed).not.toHaveBeenCalled();
  });
});
