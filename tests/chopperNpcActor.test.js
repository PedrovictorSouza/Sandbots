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
  it("applies the Chopper model forward offset to logical face yaw", () => {
    const npcActor = createNpcActor([0, 0, 0]);
    npcActor.faceYaw = Math.PI * 0.5;

    const chopperActor = createChopperNpcActor({ npcActor });

    expect(chopperActor.bodyInstance.yaw).toBeCloseTo(Math.PI * 1.5);
    expect(chopperActor.propellerInstance.yaw).toBeCloseTo(Math.PI * 1.5);
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
});
