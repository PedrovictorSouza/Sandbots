const DUST_EMIT_INTERVAL = 0.055;
const DUST_PARTICLE_DURATION = 0.42;
const DUST_PARTICLE_LIMIT = 36;

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

  dustState.particles.push({
    age: 0,
    duration: DUST_PARTICLE_DURATION,
    position: [
      playerPosition[0] + side * (0.14 + Math.random() * 0.08),
      playerPosition[1] + 0.08,
      playerPosition[2] + 0.08 + Math.random() * 0.12
    ],
    drift: [
      side * (0.16 + Math.random() * 0.08),
      0.1 + Math.random() * 0.08,
      0.12 + Math.random() * 0.08
    ],
    size: 0.18 + Math.random() * 0.08
  });
}

export function createPlayerDustState() {
  return {
    emitTimer: 0,
    lastPlayerPosition: null,
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
