import { WORLD_LIMIT } from "../../gameplayContent.js";

export const SNOWSTORM_REGION = Object.freeze({
  center: Object.freeze([-112, 0.02, 84]),
  radius: 118,
  activationMargin: 20
});

const SNOWSTORM_PARTICLE_LIMIT = 420;
const SNOWSTORM_EMITTER_RADIUS = 26;
const SNOWSTORM_MIN_HEIGHT = 0.32;
const SNOWSTORM_MAX_HEIGHT = 6.4;
const SNOWSTORM_MIN_FALL_SPEED = 2.1;
const SNOWSTORM_MAX_FALL_SPEED = 4.4;
const SNOWSTORM_WIND_X = 1.45;
const SNOWSTORM_WIND_Z = -0.48;
const SNOWSTORM_SWIRL_STRENGTH = 1.05;
const SNOWSTORM_SWIRL_SPEED = 1.65;
const SNOWSTORM_MIN_SIZE = 0.085;
const SNOWSTORM_MAX_SIZE = 0.28;
const SNOWSTORM_MIN_ALPHA = 0.42;
const SNOWSTORM_MAX_ALPHA = 0.96;
const SNOWSTORM_SEED_DEFAULT = 439041101;
const SNOWSTORM_FOG_FULL_RADIUS_RATIO = 0.82;

function createSeededRandom(seed = SNOWSTORM_SEED_DEFAULT) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function wrapDelta(value, reference, limit = WORLD_LIMIT) {
  const period = limit * 2;
  let delta = value - reference;

  if (delta > limit) {
    delta -= period;
  } else if (delta < -limit) {
    delta += period;
  }

  return delta;
}

function wrappedDistanceXZ(left, right) {
  if (!left || !right) {
    return Infinity;
  }

  const dx = wrapDelta(left[0], right[0]);
  const dz = wrapDelta(left[2], right[2]);
  return Math.hypot(dx, dz);
}

function randomPointInRegion(random, center, radius) {
  const angle = random() * Math.PI * 2;
  const distance = Math.sqrt(random()) * radius;

  return [
    center[0] + Math.cos(angle) * distance,
    center[2] + Math.sin(angle) * distance
  ];
}

function getParticleEmitterCenter(state) {
  return state.emitterCenter || state.region.center;
}

function seedParticle(state, index, { atTop = false } = {}) {
  const random = state.random;
  const [x, z] = randomPointInRegion(
    random,
    getParticleEmitterCenter(state),
    state.emitterRadius
  );
  const y = atTop ?
    SNOWSTORM_MAX_HEIGHT + random() * 1.2 :
    SNOWSTORM_MIN_HEIGHT + random() * (SNOWSTORM_MAX_HEIGHT - SNOWSTORM_MIN_HEIGHT);

  state.x[index] = x;
  state.y[index] = y;
  state.z[index] = z;
  state.fallSpeed[index] =
    SNOWSTORM_MIN_FALL_SPEED + random() * (SNOWSTORM_MAX_FALL_SPEED - SNOWSTORM_MIN_FALL_SPEED);
  state.phase[index] = random() * Math.PI * 2;
  state.size[index] = SNOWSTORM_MIN_SIZE + random() * (SNOWSTORM_MAX_SIZE - SNOWSTORM_MIN_SIZE);
  state.alpha[index] = SNOWSTORM_MIN_ALPHA + random() * (SNOWSTORM_MAX_ALPHA - SNOWSTORM_MIN_ALPHA);
  state.rotation[index] = random() * Math.PI * 2;
  state.rotationSpeed[index] = (random() < 0.5 ? -1 : 1) * (0.5 + random() * 1.35);
}

function updateBillboardFromParticle(state, index, texture, uvRect) {
  const billboard = state.billboards[index];
  const size = state.size[index];

  billboard.texture = texture;
  billboard.position[0] = state.x[index];
  billboard.position[1] = state.y[index];
  billboard.position[2] = state.z[index];
  billboard.size[0] = size;
  billboard.size[1] = size;
  billboard.uvRect = uvRect;
  billboard.alpha = state.alpha[index];
  billboard.rotation = state.rotation[index];
  return billboard;
}

export function createSnowstormParticleField({
  region = SNOWSTORM_REGION,
  particleLimit = SNOWSTORM_PARTICLE_LIMIT,
  seed = SNOWSTORM_SEED_DEFAULT
} = {}) {
  const particleCount = Math.max(0, Math.floor(particleLimit));
  const state = {
    region,
    particleCount,
    active: false,
    fogIntensity: 0,
    elapsed: 0,
    emitterCenter: [...region.center],
    emitterRadius: Math.min(region.radius, SNOWSTORM_EMITTER_RADIUS),
    random: createSeededRandom(seed),
    x: new Float32Array(particleCount),
    y: new Float32Array(particleCount),
    z: new Float32Array(particleCount),
    fallSpeed: new Float32Array(particleCount),
    phase: new Float32Array(particleCount),
    size: new Float32Array(particleCount),
    alpha: new Float32Array(particleCount),
    rotation: new Float32Array(particleCount),
    rotationSpeed: new Float32Array(particleCount),
    billboards: Array.from({ length: particleCount }, () => ({
      texture: null,
      position: [0, 0, 0],
      size: [0, 0],
      uvRect: [0, 0, 1, 1],
      alpha: 1,
      rotation: 0
    }))
  };

  for (let index = 0; index < particleCount; index += 1) {
    seedParticle(state, index);
  }

  return state;
}

export function isInsideSnowstormActivationRange(state, playerPosition) {
  return getSnowstormFogIntensity(state, playerPosition) > 0;
}

export function isInsideSnowstormGroundRegion(position, region = SNOWSTORM_REGION) {
  if (!Array.isArray(position)) {
    return false;
  }

  return wrappedDistanceXZ(position, region.center) <= region.radius;
}

export function getSnowstormFogIntensity(state, playerPosition) {
  if (!state || !playerPosition) {
    return 0;
  }

  const distance = wrappedDistanceXZ(playerPosition, state.region.center);
  const activationRadius = state.region.radius + state.region.activationMargin;
  if (distance >= activationRadius) {
    return 0;
  }

  const fullFogRadius = state.region.radius * SNOWSTORM_FOG_FULL_RADIUS_RATIO;
  if (distance <= fullFogRadius) {
    return 1;
  }

  return clamp01((activationRadius - distance) / (activationRadius - fullFogRadius));
}

export function updateSnowstormParticleField(state, {
  deltaTime = 0,
  playerPosition = null
} = {}) {
  if (!state) {
    return false;
  }

  state.fogIntensity = getSnowstormFogIntensity(state, playerPosition);
  state.active = state.fogIntensity > 0;
  if (!state.active) {
    return false;
  }

  if (Array.isArray(playerPosition)) {
    state.emitterCenter[0] = playerPosition[0];
    state.emitterCenter[1] = state.region.center[1];
    state.emitterCenter[2] = playerPosition[2];
  }

  const dt = Math.min(Math.max(deltaTime, 0), 0.05);
  state.elapsed += dt;
  const emitterCenter = getParticleEmitterCenter(state);

  for (let index = 0; index < state.particleCount; index += 1) {
    const phase = state.phase[index];
    const swirl = Math.sin(state.elapsed * SNOWSTORM_SWIRL_SPEED + phase) * SNOWSTORM_SWIRL_STRENGTH;

    state.x[index] += (SNOWSTORM_WIND_X + swirl) * dt;
    state.z[index] += (SNOWSTORM_WIND_Z + Math.cos(state.elapsed + phase) * 0.18) * dt;
    state.y[index] -= state.fallSpeed[index] * dt;
    state.rotation[index] += state.rotationSpeed[index] * dt;

    const dx = wrapDelta(state.x[index], emitterCenter[0]);
    const dz = wrapDelta(state.z[index], emitterCenter[2]);
    const outsideRegion = Math.hypot(dx, dz) > state.emitterRadius;

    if (state.y[index] < SNOWSTORM_MIN_HEIGHT || outsideRegion) {
      seedParticle(state, index, { atTop: true });
    }
  }

  return true;
}

export function getSnowstormBillboards(state, texture, uvRect = [0, 0, 1, 1]) {
  if (!state?.active || !texture) {
    return [];
  }

  for (let index = 0; index < state.particleCount; index += 1) {
    updateBillboardFromParticle(state, index, texture, uvRect);
  }

  return state.billboards;
}

export function createSnowflakeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 255, 255, 0.95)";
  context.fillRect(7, 3, 2, 10);
  context.fillRect(3, 7, 10, 2);
  context.fillStyle = "rgba(192, 232, 255, 0.84)";
  context.fillRect(5, 5, 2, 2);
  context.fillRect(9, 9, 2, 2);

  return canvas;
}
