const DUST_EMIT_INTERVAL = 0.055;
const DUST_PARTICLE_DURATION = 0.42;
const DUST_PARTICLE_LIMIT = 36;
const DUST_CLOUD_MODEL_BASE_SCALE = 0.024;
const DUST_CLOUD_MODEL_SCALE_VARIANCE = 0.01;
const DUST_CLOUD_MODEL_GROWTH = 0.32;
const DUST_CLOUD_MODEL_ALPHA = 0.62;
const DUST_CLOUD_MODEL_TINT = [0.82, 0.62, 0.42];
const DUST_CLOUD_MODEL_TINT_STRENGTH = 0.58;

function clonePosition(position) {
  return position ? [position[0], position[1], position[2]] : null;
}

function hasMovedEnough(previousPosition, nextPosition) {
  if (!previousPosition || !nextPosition) {
    return false;
  }

  const dx = nextPosition[0] - previousPosition[0];
  const dz = nextPosition[2] - previousPosition[2];
  return Math.hypot(dx, dz) > 0.01;
}

function emitDustParticle(dustState, playerPosition) {
  if (dustState.particles.length >= DUST_PARTICLE_LIMIT) {
    dustState.particles.shift();
  }

  const side = dustState.nextSide;
  dustState.nextSide *= -1;
  const offset = [
    playerPosition[0] + side * (0.14 + Math.random() * 0.08),
    playerPosition[1] + 0.06,
    playerPosition[2] + 0.08 + Math.random() * 0.12
  ];
  const baseScale = DUST_CLOUD_MODEL_BASE_SCALE +
    Math.random() * DUST_CLOUD_MODEL_SCALE_VARIANCE;
  const basePitch = -0.08 + Math.random() * 0.16;
  const baseRoll = -0.08 + Math.random() * 0.16;

  dustState.particles.push({
    id: `player-dust-cloud-${dustState.nextParticleId}`,
    age: 0,
    duration: DUST_PARTICLE_DURATION,
    position: offset,
    offset,
    drift: [
      side * (0.16 + Math.random() * 0.08),
      0.1 + Math.random() * 0.08,
      0.12 + Math.random() * 0.08
    ],
    size: 0.18 + Math.random() * 0.08,
    baseScale,
    scale: baseScale,
    yaw: Math.random() * Math.PI * 2,
    basePitch,
    pitch: basePitch,
    baseRoll,
    roll: baseRoll,
    rotationSpeed: side * (1.8 + Math.random() * 1.2),
    alpha: 0,
    tint: DUST_CLOUD_MODEL_TINT,
    tintStrength: DUST_CLOUD_MODEL_TINT_STRENGTH,
    swayStrength: 0.006,
    active: true
  });
  dustState.nextParticleId += 1;
}

export function createPlayerDustState() {
  return {
    emitTimer: 0,
    lastPlayerPosition: null,
    nextParticleId: 0,
    nextSide: 1,
    particles: []
  };
}

export function updatePlayerDustParticles(dustState, {
  deltaTime = 0,
  playerPosition = null,
  active = false
} = {}) {
  if (!dustState) {
    return;
  }

  for (let index = dustState.particles.length - 1; index >= 0; index -= 1) {
    const particle = dustState.particles[index];
    particle.age += deltaTime;

    if (particle.age >= particle.duration) {
      dustState.particles.splice(index, 1);
      continue;
    }

    particle.position[0] += particle.drift[0] * deltaTime;
    particle.position[1] += particle.drift[1] * deltaTime;
    particle.position[2] += particle.drift[2] * deltaTime;

    const progress = Math.min(1, particle.age / particle.duration);
    const baseScale = particle.baseScale ?? DUST_CLOUD_MODEL_BASE_SCALE;
    const rotationSpeed = particle.rotationSpeed ?? 0;
    particle.scale = baseScale * (1 + progress * DUST_CLOUD_MODEL_GROWTH);
    particle.alpha = Math.sin(progress * Math.PI) * DUST_CLOUD_MODEL_ALPHA;
    particle.yaw += rotationSpeed * deltaTime;
    particle.pitch = (particle.basePitch ?? particle.pitch ?? 0) +
      Math.sin(progress * Math.PI) * 0.08;
    particle.roll = (particle.baseRoll ?? particle.roll ?? 0) -
      rotationSpeed * particle.age * 0.38;
  }

  const shouldEmit = active && hasMovedEnough(dustState.lastPlayerPosition, playerPosition);
  dustState.lastPlayerPosition = clonePosition(playerPosition);

  if (!shouldEmit) {
    dustState.emitTimer = 0;
    return;
  }

  dustState.emitTimer += deltaTime;
  while (dustState.emitTimer >= DUST_EMIT_INTERVAL) {
    dustState.emitTimer -= DUST_EMIT_INTERVAL;
    emitDustParticle(dustState, playerPosition);
  }
}

export function getPlayerDustBillboards(dustState, texture, uvRect = [0, 0, 1, 1]) {
  if (!dustState || !texture) {
    return [];
  }

  return dustState.particles.map((particle) => {
    const progress = Math.min(1, particle.age / particle.duration);
    const size = particle.size * (1 + progress * 0.65);

    return {
      texture,
      position: particle.position,
      size: [size * 1.45, size],
      uvRect
    };
  });
}
