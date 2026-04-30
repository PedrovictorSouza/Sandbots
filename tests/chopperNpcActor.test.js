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

      expect(position[0]).toBeGreaterThanOrEqual(8.9);
      expect(position[0]).toBeLessThanOrEqual(17.1);
      expect(position[2]).toBeGreaterThanOrEqual(-10.7);
      expect(position[2]).toBeLessThanOrEqual(-5.6);
    }

    expect(npcActor.character.getPosition()).not.toEqual([12.4, 0.02, -8.4]);
  });
});
