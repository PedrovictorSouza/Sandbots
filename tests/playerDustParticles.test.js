import { describe, expect, it } from "vitest";

import {
  createPlayerDustState,
  updatePlayerDustParticles
} from "../app/session/playerDustParticles.js";

function createSequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("player dust particles", () => {
  it("accepts a deterministic random source for reproducible visual effects", () => {
    const dustState = createPlayerDustState({ random: () => 0 });

    updatePlayerDustParticles(dustState, {
      active: true,
      deltaTime: 0.02,
      playerPosition: [0, 0, 0]
    });
    updatePlayerDustParticles(dustState, {
      active: true,
      deltaTime: 0.055,
      playerPosition: [1, 0, 0]
    });

    expect(dustState.particles).toHaveLength(1);
    expect(dustState.particles[0]).toMatchObject({
      id: "player-dust-cloud-0",
      baseScale: 0.024,
      yaw: 0,
      rotationSpeed: 1.8
    });
    expect(dustState.particles[0].position[0]).toBeCloseTo(1.14);
    expect(dustState.particles[0].position[1]).toBeCloseTo(0.06);
    expect(dustState.particles[0].position[2]).toBeCloseTo(0.08);
  });

  it("clamps injected cosmetic randomness before it shapes dust", () => {
    const dustState = createPlayerDustState({
      random: createSequenceRandom([-5, 2, Infinity, NaN, 0.5, 3, -1, 4, 0.25, 2, 10])
    });

    updatePlayerDustParticles(dustState, {
      active: true,
      deltaTime: 0.02,
      playerPosition: [0, 0, 0]
    });
    updatePlayerDustParticles(dustState, {
      active: true,
      deltaTime: 0.055,
      playerPosition: [1, 0, 0]
    });

    expect(dustState.particles).toHaveLength(1);
    const [particle] = dustState.particles;

    expect(particle.position.every(Number.isFinite)).toBe(true);
    expect(particle.drift.every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(particle.baseScale)).toBe(true);
    expect(Number.isFinite(particle.yaw)).toBe(true);
    expect(Number.isFinite(particle.rotationSpeed)).toBe(true);

    expect(particle.position[0]).toBeCloseTo(1.14);
    expect(particle.position[2]).toBeCloseTo(0.2);
    expect(particle.baseScale).toBeCloseTo(0.024);
    expect(particle.basePitch).toBeCloseTo(-0.08);
    expect(particle.baseRoll).toBeCloseTo(0);
    expect(particle.drift[0]).toBeCloseTo(0.24);
    expect(particle.drift[1]).toBeCloseTo(0.1);
    expect(particle.drift[2]).toBeCloseTo(0.2);
    expect(particle.size).toBeCloseTo(0.2);
    expect(particle.yaw).toBeCloseTo(Math.PI * 2);
    expect(particle.rotationSpeed).toBeCloseTo(3);
  });
});
