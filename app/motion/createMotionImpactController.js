import { getMotionImpactPreset } from "./motionImpactPresets.js";

const IDLE_FRAME = Object.freeze({
  targetId: null,
  presetId: null,
  phase: "idle",
  progress: 1,
  strength: 0,
  positionOffset: Object.freeze([0, 0, 0]),
  rotationOffset: Object.freeze([0, 0, 0]),
  scale: 1,
  blend: null,
  silhouetteBias: null
});

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function resolveTargetId({ targetId, target }) {
  return targetId || target?.id || null;
}

function resolveStrength(preset, ageMs) {
  if (ageMs <= preset.freezeMs) {
    return 1;
  }

  const recoverSpanMs = Math.max(1, preset.durationMs - preset.freezeMs);
  const recoverProgress = clamp01((ageMs - preset.freezeMs) / recoverSpanMs);
  const linearStrength = 1 - recoverProgress;

  if (preset.blend === "sharp") {
    return linearStrength * linearStrength;
  }

  return linearStrength;
}

function vectorFromJolt(jolt, strength) {
  return [
    (jolt?.x || 0) * strength,
    (jolt?.y || 0) * strength,
    (jolt?.z || 0) * strength
  ];
}

function createIdleFrame(targetId = null, presetId = null) {
  return {
    ...IDLE_FRAME,
    targetId,
    presetId,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0]
  };
}

function createFrame(reaction) {
  const { targetId, preset, ageMs } = reaction;

  if (ageMs >= preset.durationMs) {
    return createIdleFrame(targetId, preset.id);
  }

  const strength = resolveStrength(preset, ageMs);
  return {
    targetId,
    presetId: preset.id,
    phase: ageMs <= preset.freezeMs ? "impact-freeze" : "recover",
    progress: clamp01(ageMs / Math.max(1, preset.durationMs)),
    strength,
    positionOffset: vectorFromJolt(preset.positionJolt, strength),
    rotationOffset: vectorFromJolt(preset.rotationJolt, strength),
    scale: 1 + ((preset.scalePulse || 1) - 1) * strength,
    blend: preset.blend,
    silhouetteBias: preset.silhouetteBias
  };
}

function applyFrame(reaction, frame) {
  reaction.target?.applyMotionImpact?.(frame);
}

export function createMotionImpactController() {
  const reactions = new Map();

  function trigger({ targetId = null, target = null, presetId } = {}) {
    const preset = getMotionImpactPreset(presetId);
    const resolvedTargetId = resolveTargetId({ targetId, target });

    if (!preset || !resolvedTargetId) {
      return null;
    }

    const reaction = {
      targetId: resolvedTargetId,
      target,
      preset,
      ageMs: 0
    };
    reactions.set(resolvedTargetId, reaction);

    const frame = createFrame(reaction);
    applyFrame(reaction, frame);
    return frame;
  }

  function update(deltaMs = 0) {
    const safeDeltaMs = Math.max(0, deltaMs);

    for (const [targetId, reaction] of reactions.entries()) {
      reaction.ageMs += safeDeltaMs;

      if (reaction.ageMs >= reaction.preset.durationMs) {
        const idleFrame = createIdleFrame(targetId, reaction.preset.id);
        applyFrame(reaction, idleFrame);
        reactions.delete(targetId);
        continue;
      }

      applyFrame(reaction, createFrame(reaction));
    }

    return api;
  }

  function getFrame(targetId) {
    const reaction = reactions.get(targetId);
    if (!reaction) {
      return createIdleFrame(targetId);
    }
    return createFrame(reaction);
  }

  function clear(targetId) {
    const reaction = reactions.get(targetId);
    if (!reaction) {
      return false;
    }
    applyFrame(reaction, createIdleFrame(targetId, reaction.preset.id));
    reactions.delete(targetId);
    return true;
  }

  const api = {
    trigger,
    update,
    getFrame,
    clear
  };

  return api;
}
