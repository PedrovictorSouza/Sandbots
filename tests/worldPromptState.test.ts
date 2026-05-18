import { describe, expect, it } from "vitest";
import {
  getWorldPromptLegacyText,
  toLegacyWorldPrompt,
  type WorldPromptState,
} from "../app/runtime/worldPromptState.ts";

describe("world prompt state", () => {
  it("maps hidden prompts to the current invisible frame shape", () => {
    const prompt = { kind: "hidden" } satisfies WorldPromptState;

    expect(toLegacyWorldPrompt(prompt)).toEqual({
      visible: false,
      text: "",
      worldPosition: null,
    });
  });

  it("keeps placement context while preserving the existing prompt text", () => {
    const prompt = {
      kind: "placement",
      target: "houseKit",
      valid: false,
      text: "Needs power",
      worldPosition: [8, 0, 4],
    } satisfies WorldPromptState;

    expect(toLegacyWorldPrompt(prompt)).toEqual({
      visible: true,
      text: "Needs power",
      worldPosition: [8, 0, 4],
    });
  });

  it("maps field move switch cards through their html payload", () => {
    const prompt = {
      kind: "fieldMoveSwitch",
      html: "<strong>Squirtle</strong>",
      worldPosition: [1, 0, 2],
    } satisfies WorldPromptState;

    expect(getWorldPromptLegacyText(prompt)).toBe("<strong>Hydro Bot</strong>");
    expect(toLegacyWorldPrompt(prompt).text).toBe("<strong>Hydro Bot</strong>");
  });

  it("keeps Hydro Bot charging semantic state behind the legacy charging text", () => {
    const prompt = {
      kind: "charging",
      companionId: "squirtle",
      abilityId: "waterGun",
      worldPosition: [12, 0, -3],
    } satisfies WorldPromptState;

    expect(toLegacyWorldPrompt(prompt)).toEqual({
      visible: true,
      text: "charging",
      worldPosition: [12, 0, -3],
    });
  });

  it("keeps invalid move target ownership explicit", () => {
    const prompt = {
      kind: "invalidMoveTarget",
      abilityId: "leafage",
      message: "Leafage needs restored ground.",
      worldPosition: [3, 0, 9],
    } satisfies WorldPromptState;

    expect(toLegacyWorldPrompt(prompt)).toEqual({
      visible: true,
      text: "Bio-Grow needs restored ground.",
      worldPosition: [3, 0, 9],
    });
  });

  it("normalizes legacy world prompt text at the runtime boundary", () => {
    const prompt = {
      kind: "text",
      text: "Talk to Bulbasaur with Water Gun near the Pokemon Center PC",
      worldPosition: [2, 0, 5],
    } satisfies WorldPromptState;

    expect(toLegacyWorldPrompt(prompt).text).toBe(
      "Talk to Grow Bot with Hydro Jet near the Colony Terminal"
    );
  });

  it("maps simple text-backed variants through their text payload", () => {
    const position: [number, number, number] = [2, 0, 5];
    const prompts = [
      {
        kind: "workbenchRotation",
        text: "X Confirm  LB/RB Rotate  B Cancel",
        worldPosition: position,
      },
      {
        kind: "counter",
        text: "Wood 3/5",
        worldPosition: position,
      },
      {
        kind: "transientNotice",
        text: "Need more Wood",
        worldPosition: position,
      },
      {
        kind: "repairBox",
        text: "Inspect",
        worldPosition: position,
      },
      {
        kind: "firstUse",
        abilityId: "waterGun",
        text: "Use Water Gun",
        expectedText: "Use Hydro Jet",
        worldPosition: position,
      },
      {
        kind: "text",
        text: "Generic prompt",
        worldPosition: position,
      },
    ] satisfies WorldPromptState[];

    prompts.forEach((prompt) => {
      expect(toLegacyWorldPrompt(prompt)).toEqual({
        visible: true,
        text: "expectedText" in prompt ? prompt.expectedText : prompt.text,
        worldPosition: position,
      });
    });
  });
});
