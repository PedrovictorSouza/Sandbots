const REVIVAL_DURATION = 1.5;
const SPARK_DURATION = 0.9;
const SPARK_EMIT_INTERVAL = 0.055;
const MAX_SPARKS_PER_EFFECT = 42;

function easeOutBack(value) {
  const clamped = Math.max(0, Math.min(1, value));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
}

function createSpark(position, radius) {
  const angle = Math.random() * Math.PI * 2;
  const distance = radius * (0.18 + Math.random() * 0.72);

  return {
    age: 0,
    duration: SPARK_DURATION * (0.75 + Math.random() * 0.35),
    position: [
      position[0] + Math.cos(angle) * distance,
      position[1] + 0.08 + Math.random() * 0.1,
      position[2] + Math.sin(angle) * distance
    ],
    drift: [
      Math.cos(angle) * 0.08,
      0.48 + Math.random() * 0.26,
      Math.sin(angle) * 0.08
    ],
    size: 0.12 + Math.random() * 0.08
  };
}

export function createNatureRevivalEffectState() {
  return {
    effects: []
  };
}

export function startNatureRevivalEffect(effectState, {
  patch,
  type = "grass"
} = {}) {
  if (!effectState || !patch) {
    return;
  }

  const radius = Math.max(Number(patch.size?.[0]) || 1, Number(patch.size?.[1]) || 1) * 0.5;
  effectState.effects = effectState.effects.filter((effect) => effect.patchId !== patch.id);
  effectState.effects.push({
    patchId: patch.id,
    type,
    age: 0,
    emitTimer: 0,
    duration: REVIVAL_DURATION,
    radius,
    position: [...patch.position],
    sparks: []
  });
}

export function updateNatureRevivalEffects(effectState, deltaTime = 0) {
  if (!effectState) {
    return;
  }

  for (let effectIndex = effectState.effects.length - 1; effectIndex >= 0; effectIndex -= 1) {
    const effect = effectState.effects[effectIndex];
    effect.age += deltaTime;

    for (let sparkIndex = effect.sparks.length - 1; sparkIndex >= 0; sparkIndex -= 1) {
      const spark = effect.sparks[sparkIndex];
      spark.age += deltaTime;

      if (spark.age >= spark.duration) {
        effect.sparks.splice(sparkIndex, 1);
        continue;
      }

      spark.position[0] += spark.drift[0] * deltaTime;
      spark.position[1] += spark.drift[1] * deltaTime;
      spark.position[2] += spark.drift[2] * deltaTime;
    }

    if (effect.age <= REVIVAL_DURATION) {
      effect.emitTimer += deltaTime;

      while (effect.emitTimer >= SPARK_EMIT_INTERVAL && effect.sparks.length < MAX_SPARKS_PER_EFFECT) {
        effect.emitTimer -= SPARK_EMIT_INTERVAL;
        effect.sparks.push(createSpark(effect.position, effect.radius));
      }
    }

    if (effect.age >= effect.duration && effect.sparks.length === 0) {
      effectState.effects.splice(effectIndex, 1);
    }
  }
}

export function getNatureRevivalScale(effectState, patchId) {
  const effect = effectState?.effects?.find((entry) => entry.patchId === patchId);

  if (!effect || effect.age >= effect.duration) {
    return 1;
  }

  return Math.max(0.08, easeOutBack(effect.age / effect.duration));
}

export function getNatureRevivalBillboards(effectState, texture, uvRect = [0, 0, 1, 1]) {
  if (!effectState || !texture) {
    return [];
  }

  return effectState.effects.flatMap((effect) => {
    return effect.sparks.map((spark) => {
      const progress = Math.min(1, spark.age / spark.duration);
      const size = spark.size * (1 - progress * 0.42);

      return {
        texture,
        position: spark.position,
        size: [size, size],
        uvRect
      };
    });
  });
}
