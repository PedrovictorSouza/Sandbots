import { describe, expect, it, vi } from "vitest";
import {
  createChopperNpcActor,
  startChopperNpcFlight,
  updateChopperNpcActor
} from "../app/session/chopperNpcActor.js";

function createNpcActor(position = [0, 0, 0]) {
  let currentPosition = [...position];

  return {
    id: "tangrowth",
    faceYaw: 0,
    character: {
      getPosition() {
        return [...currentPosition];
      },
      setPosition(nextPosition) {
        currentPosition = [...nextPosition];
      }
    }
  };
}

describe("chopperNpcActor", () => {
  it("keeps Chopper model yaw aligned with logical face yaw", () => {
    const npcActor = createNpcActor([0, 0, 0]);
    npcActor.faceYaw = Math.PI * 0.5;

    const chopperActor = createChopperNpcActor({ npcActor });

    expect(chopperActor.bodyInstance.yaw).toBeCloseTo(Math.PI * 0.5);
    expect(chopperActor.propellerInstance.yaw).toBeCloseTo(Math.PI * 0.5);
  });

  it("adds a secondary-axis turn pose when Chopper changes facing", () => {
    const steadyNpcActor = createNpcActor([0, 0, 0]);
    const steadyChopperActor = createChopperNpcActor({ npcActor: steadyNpcActor });
    const turningNpcActor = createNpcActor([0, 0, 0]);
    const turningChopperActor = createChopperNpcActor({ npcActor: turningNpcActor });

    turningNpcActor.faceYaw = Math.PI * 0.5;

    updateChopperNpcActor(steadyChopperActor, {
      deltaTime: 0.12,
      storyState: { flags: {} },
      isDialogueActive: true,
      isNpcActive: () => true
    });
    updateChopperNpcActor(turningChopperActor, {
      deltaTime: 0.12,
      storyState: { flags: {} },
      isDialogueActive: true,
      isNpcActive: () => true
    });

    expect(turningChopperActor.bodyInstance.yaw).toBeGreaterThan(0);
    expect(turningChopperActor.bodyInstance.yaw).toBeLessThan(Math.PI * 0.5);
    expect(Math.abs(turningChopperActor.bodyInstance.pitch - steadyChopperActor.bodyInstance.pitch)).toBeGreaterThan(0.005);
    expect(Math.abs(turningChopperActor.bodyInstance.roll - steadyChopperActor.bodyInstance.roll)).toBeGreaterThan(0.005);
    expect(turningChopperActor.propellerInstance.pitch).toBeCloseTo(turningChopperActor.bodyInstance.pitch);
    expect(turningChopperActor.propellerInstance.roll).toBeCloseTo(turningChopperActor.bodyInstance.roll);
  });

  it("flies the Chopper NPC to a target before completing the scripted approach", () => {
    const npcActor = createNpcActor([0, 0, 0]);
    const chopperActor = createChopperNpcActor({ npcActor });
    const onComplete = vi.fn();

    const started = startChopperNpcFlight(chopperActor, {
      targetPosition: [4, 0, 0],
      duration: 1,
      onComplete
    });

    expect(started).toBe(true);

    updateChopperNpcActor(chopperActor, {
      deltaTime: 0.5,
      storyState: { flags: {} },
      isNpcActive: () => true
    });

    expect(npcActor.character.getPosition()[0]).toBeGreaterThan(0);
    expect(npcActor.character.getPosition()[0]).toBeLessThan(4);
    expect(chopperActor.bodyInstance.offset[1]).toBeGreaterThan(1.35);
    expect(onComplete).not.toHaveBeenCalled();

    updateChopperNpcActor(chopperActor, {
      deltaTime: 0.5,
      storyState: { flags: {} },
      isNpcActive: () => true
    });

    expect(npcActor.character.getPosition()).toEqual([4, 0, 0]);
    expect(chopperActor.scriptedFlight).toBeNull();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("adds a low-gravity visual hop without changing Chopper's logical landing", () => {
    const npcActor = createNpcActor([0, 0, 0]);
    const chopperActor = createChopperNpcActor({ npcActor });

    startChopperNpcFlight(chopperActor, {
      targetPosition: [0, 0, 4],
      duration: 1
    });

    updateChopperNpcActor(chopperActor, {
      deltaTime: 0.25,
      storyState: { flags: {} },
      isNpcActive: () => true
    });

    expect(npcActor.character.getPosition()[1]).toBe(0);
    expect(chopperActor.flightLift).toBeGreaterThan(0.6);
    expect(chopperActor.flightLift).toBeLessThan(0.95);

    updateChopperNpcActor(chopperActor, {
      deltaTime: 0.75,
      storyState: { flags: {} },
      isNpcActive: () => true
    });

    expect(npcActor.character.getPosition()).toEqual([0, 0, 4]);
    expect(chopperActor.flightLift).toBe(0);
  });

  it("patrols within the early gameplay area after Bulbasaur is met", () => {
    const npcActor = createNpcActor([12.4, 0.02, -8.4]);
    const chopperActor = createChopperNpcActor({ npcActor });
    const storyState = {
      flags: {
        chopperPatrolEnabled: true
      }
    };

    for (let index = 0; index < 40; index += 1) {
      updateChopperNpcActor(chopperActor, {
        deltaTime: 0.5,
        storyState,
        isNpcActive: () => true
      });
      const position = npcActor.character.getPosition();

      expect(position[0]).toBeGreaterThanOrEqual(2.2);
      expect(position[0]).toBeLessThanOrEqual(25);
      expect(position[2]).toBeGreaterThanOrEqual(-15.2);
      expect(position[2]).toBeLessThanOrEqual(-1.1);
    }

    expect(npcActor.character.getPosition()).not.toEqual([12.4, 0.02, -8.4]);
  });

  it("moves toward the Pokemon Center guide position when the guide is active", () => {
    const npcActor = createNpcActor([0, 0, 0]);
    const chopperActor = createChopperNpcActor({ npcActor });
    const storyState = {
      flags: {
        pokemonCenterGuideStarted: true
      }
    };

    updateChopperNpcActor(chopperActor, {
      deltaTime: 0.5,
      storyState,
      guidePosition: [10, 0.02, 0],
      isNpcActive: () => true
    });

    expect(npcActor.character.getPosition()[0]).toBeGreaterThan(0);
    expect(npcActor.character.getPosition()[0]).toBeLessThan(10);
    expect(chopperActor.scriptedFlight).toBeNull();
  });

  it("moves to an investigation target before resuming patrol", () => {
    const npcActor = createNpcActor([12.4, 0.02, -8.4]);
    const chopperActor = createChopperNpcActor({ npcActor });
    const storyState = {
      flags: {
        chopperPatrolEnabled: true
      }
    };

    updateChopperNpcActor(chopperActor, {
      deltaTime: 0.5,
      storyState,
      investigationTarget: {
        position: [10, 0.02, -6],
        lookAtPosition: [11, 0.02, -6]
      },
      isNpcActive: () => true
    });

    const position = npcActor.character.getPosition();

    expect(position[0]).toBeLessThan(12.4);
    expect(position[2]).toBeGreaterThan(-8.4);
    expect(position[0]).toBeGreaterThan(10);
    expect(position[2]).toBeLessThan(-6);
  });

  it("hovers in place during dialogue before resuming patrol", () => {
    const npcActor = createNpcActor([12.4, 0.02, -8.4]);
    const chopperActor = createChopperNpcActor({ npcActor });
    const storyState = {
      flags: {
        chopperPatrolEnabled: true
      }
    };

    updateChopperNpcActor(chopperActor, {
      deltaTime: 1,
      storyState,
      isNpcActive: () => true,
      isDialogueActive: () => true
    });

    expect(npcActor.character.getPosition()).toEqual([12.4, 0.02, -8.4]);
    expect(chopperActor.bodyInstance.offset[1]).toBeGreaterThan(1.2);
    expect(chopperActor.propellerAngle).toBeGreaterThan(0);

    updateChopperNpcActor(chopperActor, {
      deltaTime: 1,
      storyState,
      isNpcActive: () => true,
      isDialogueActive: () => false
    });

    expect(npcActor.character.getPosition()).not.toEqual([12.4, 0.02, -8.4]);
  });

  it("settles into a quieter listening hover during dialogue", () => {
    const freeNpcActor = createNpcActor([0, 0.02, 0]);
    const freeChopperActor = createChopperNpcActor({ npcActor: freeNpcActor });
    const dialogueNpcActor = createNpcActor([0, 0.02, 0]);
    const dialogueChopperActor = createChopperNpcActor({ npcActor: dialogueNpcActor });

    updateChopperNpcActor(freeChopperActor, {
      deltaTime: 0.5,
      storyState: { flags: {} },
      isNpcActive: () => true,
      isDialogueActive: () => false
    });
    updateChopperNpcActor(dialogueChopperActor, {
      deltaTime: 0.5,
      storyState: { flags: {} },
      isNpcActive: () => true,
      isDialogueActive: () => true
    });

    const baseHoverY = 1.37;
    const freeLift = Math.abs(freeChopperActor.bodyInstance.offset[1] - baseHoverY);
    const dialogueLift = Math.abs(dialogueChopperActor.bodyInstance.offset[1] - baseHoverY);

    expect(dialogueLift).toBeLessThan(freeLift);
    expect(Math.abs(dialogueChopperActor.bodyInstance.offset[0])).toBeLessThan(
      Math.abs(freeChopperActor.bodyInstance.offset[0])
    );
    expect(Math.abs(dialogueChopperActor.bodyInstance.roll)).toBeLessThan(
      Math.abs(freeChopperActor.bodyInstance.roll)
    );
  });
});
