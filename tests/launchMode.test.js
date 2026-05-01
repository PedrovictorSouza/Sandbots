import { describe, expect, it } from "vitest";
import {
  applyLaunchModeRuntime,
  getInitialGameFlowForLaunchMode,
  LAUNCH_MODE,
  LAUNCH_MODE_STORAGE_KEY,
  resolveLaunchMode,
  shouldStartInGameplayForLaunchMode,
  shouldUseNoopWebGlForLaunchMode
} from "../app/runtime/launchMode.js";
import { GAME_FLOW } from "../gameFlow.js";

describe("launchMode", () => {
  it("keeps unknown boot params on the safe default", () => {
    const launchMode = resolveLaunchMode({
      searchParams: new URLSearchParams("boot=unknown")
    }, {
      isDev: true
    });

    expect(launchMode).toBe(LAUNCH_MODE.DEFAULT);
  });

  it("only enables gameplay-dev in development", () => {
    expect(
      resolveLaunchMode({
        searchParams: new URLSearchParams("boot=gameplay-dev")
      }, { isDev: true })
    ).toBe(LAUNCH_MODE.GAMEPLAY_DEV);

    expect(
      resolveLaunchMode({
        searchParams: new URLSearchParams("boot=gameplay-dev")
      }, { isDev: false })
    ).toBe(LAUNCH_MODE.DEFAULT);
  });

  it("accepts gameplay boot from hash or stored preference", () => {
    expect(
      resolveLaunchMode({
        hash: "#boot=gameplay"
      }, { isDev: false })
    ).toBe(LAUNCH_MODE.GAMEPLAY);

    expect(
      resolveLaunchMode({
        storedLaunchMode: LAUNCH_MODE.GAMEPLAY
      }, { isDev: false })
    ).toBe(LAUNCH_MODE.GAMEPLAY);

    expect(LAUNCH_MODE_STORAGE_KEY).toBe("small-island:boot-mode");
  });

  it("maps direct gameplay profiles to the gameplay flow", () => {
    expect(getInitialGameFlowForLaunchMode(LAUNCH_MODE.DEFAULT)).toBe(GAME_FLOW.START);
    expect(getInitialGameFlowForLaunchMode(LAUNCH_MODE.HANDBOOK)).toBe(GAME_FLOW.GAMEPLAY);
    expect(getInitialGameFlowForLaunchMode(LAUNCH_MODE.GAMEPLAY)).toBe(GAME_FLOW.GAMEPLAY);
    expect(getInitialGameFlowForLaunchMode(LAUNCH_MODE.GAMEPLAY_DEV)).toBe(GAME_FLOW.GAMEPLAY);
    expect(shouldStartInGameplayForLaunchMode(LAUNCH_MODE.GAMEPLAY)).toBe(true);
    expect(shouldStartInGameplayForLaunchMode(LAUNCH_MODE.GAMEPLAY_DEV)).toBe(true);
    expect(shouldUseNoopWebGlForLaunchMode(LAUNCH_MODE.HANDBOOK)).toBe(true);
  });

  it("applies the gameplay-dev bootstrap payload", () => {
    const session = {
      spawnActTwoPlayer: () => {},
      actTwoRepairPlant: { fixed: false },
      actTwoSquirtle: { recovered: false }
    };
    const startScreen = { dismiss: () => {} };
    const introSequence = { dismiss: () => {} };
    const playerMemory = { foundPokedex: false };
    const calls = [];

    applyLaunchModeRuntime(LAUNCH_MODE.GAMEPLAY_DEV, {
      session,
      startScreen,
      introSequence,
      clearGameFlowInput: () => calls.push("clear"),
      unlockPlayerSkill: (skillId) => calls.push(`skill:${skillId}`),
      unlockPokedexUi: () => calls.push("pokedex"),
      setPokedexSeen: (seen) => calls.push(`seen:${seen}`),
      playerMemory
    });

    expect(calls).toEqual([
      "clear",
      "skill:transform",
      "skill:waterGun",
      "pokedex",
      "seen:true"
    ]);
    expect(playerMemory.foundPokedex).toBe(true);
    expect(session.gameplayOpeningRequested).toBe(true);
    expect(session.actTwoRepairPlant.fixed).toBe(true);
    expect(session.actTwoSquirtle.recovered).toBe(true);
  });
});
