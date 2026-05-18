import { describe, expect, it } from "vitest";
import {
  createCinematicControlState,
  getCinematicControlViewState,
  handleCinematicControlKeydown,
  handleCinematicControlKeyup,
  updateCinematicControlState
} from "../app/scene/cinematicControlPolicy.js";

function keyEvent(code, key = code) {
  return {
    code,
    key,
    repeat: false
  };
}

describe("cinematicControlPolicy", () => {
  it("shows skip feedback for blocked actions without starting a skip hold", () => {
    const state = createCinematicControlState();

    expect(handleCinematicControlKeydown(state, keyEvent("KeyE", "e"), 2)).toEqual({
      handled: true,
      skipStarted: false
    });
    expect(getCinematicControlViewState(state, 2.1)).toMatchObject({
      promptVisible: true,
      skipProgress: 0
    });
    expect(updateCinematicControlState(state, 1)).toEqual({
      skipCompleted: false
    });
  });

  it("completes skip only after the hold duration", () => {
    const state = createCinematicControlState();

    expect(handleCinematicControlKeydown(state, keyEvent("Enter", "Enter"), 0)).toEqual({
      handled: true,
      skipStarted: true
    });
    expect(updateCinematicControlState(state, 0.2)).toEqual({
      skipCompleted: false
    });
    expect(getCinematicControlViewState(state, 0.2).skipProgress).toBeGreaterThan(0);
    expect(updateCinematicControlState(state, 0.45)).toEqual({
      skipCompleted: true
    });
  });

  it("cancels skip hold when the skip input is released early", () => {
    const state = createCinematicControlState();

    handleCinematicControlKeydown(state, keyEvent("KeyX", "x"), 0);
    updateCinematicControlState(state, 0.2);
    expect(handleCinematicControlKeyup(state, keyEvent("KeyX", "x"), 0.2)).toEqual({
      handled: true,
      skipCancelled: true
    });

    expect(updateCinematicControlState(state, 0.5)).toEqual({
      skipCompleted: false
    });
    expect(getCinematicControlViewState(state, 0.25)).toMatchObject({
      promptVisible: true,
      skipProgress: 0
    });
  });
});
