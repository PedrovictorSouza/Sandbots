import { describe, expect, it } from "vitest";
import {
  createNatureRevivalEffectState,
  getNatureRevivalBillboards,
  getNatureRevivalScale,
  startNatureRevivalEffect,
  updateNatureRevivalEffects
} from "../app/session/natureRevivalEffects.js";

function createSequenceRandom(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

describe("natureRevivalEffects", () => {
  it("can use an injected random source for repeatable cosmetic sparks", () => {
    const randomValues = [0, 0, 0, 0, 0, 0];
    const state = createNatureRevivalEffectState({
      random: createSequenceRandom(randomValues)
    });

    startNatureRevivalEffect(state, {
      patch: {
        id: "patch-1",
        position: [10, 0.02, -4],
        size: [2, 1]
      },
      maxSparks: 1,
      emitInterval: 0.055
    });
    updateNatureRevivalEffects(state, 0.055);

    const [billboard] = getNatureRevivalBillboards(state, "spark");
    expect(billboard).toEqual({
      texture: "spark",
      position: [10.18, 0.1, -4],
      size: [0.12, 0.12],
      uvRect: [0, 0, 1, 1]
    });
  });

  it("keeps cosmetic randomness bounded by the effect spark cap", () => {
    const state = createNatureRevivalEffectState({
      random: createSequenceRandom([0.5])
    });

    startNatureRevivalEffect(state, {
      patch: {
        id: "patch-2",
        position: [0, 0, 0],
        size: [1, 1]
      },
      maxSparks: 2,
      emitInterval: 0.01
    });
    updateNatureRevivalEffects(state, 0.1);

    expect(getNatureRevivalBillboards(state, "spark")).toHaveLength(2);
  });

  it("clamps injected cosmetic randomness before it shapes sparks", () => {
    const state = createNatureRevivalEffectState({
      random: createSequenceRandom([-10, 2, Infinity, NaN, 0.5, 3])
    });

    startNatureRevivalEffect(state, {
      patch: {
        id: "patch-clamped",
        position: [0, 0, 0],
        size: [2, 2]
      },
      maxSparks: 1,
      emitInterval: 0.055
    });
    updateNatureRevivalEffects(state, 0.055);

    const [spark] = state.effects[0].sparks;
    expect(spark.duration).toBeGreaterThanOrEqual(0.675);
    expect(spark.duration).toBeLessThanOrEqual(0.99);
    expect(spark.size).toBeGreaterThanOrEqual(0.12);
    expect(spark.size).toBeLessThanOrEqual(0.2);
    expect(spark.position.every(Number.isFinite)).toBe(true);
    expect(spark.drift.every(Number.isFinite)).toBe(true);
  });

  it("can layer a small impact scale pulse over the normal revival pop", () => {
    const patch = {
      id: "patch-impact",
      position: [0, 0, 0],
      size: [1, 1]
    };
    const normalState = createNatureRevivalEffectState({
      random: createSequenceRandom([0.5])
    });
    const impactState = createNatureRevivalEffectState({
      random: createSequenceRandom([0.5])
    });

    startNatureRevivalEffect(normalState, { patch });
    startNatureRevivalEffect(impactState, {
      patch,
      scalePulse: 1.04
    });
    updateNatureRevivalEffects(normalState, 0.08);
    updateNatureRevivalEffects(impactState, 0.08);

    expect(getNatureRevivalScale(impactState, patch.id)).toBeGreaterThan(
      getNatureRevivalScale(normalState, patch.id)
    );
  });
});
