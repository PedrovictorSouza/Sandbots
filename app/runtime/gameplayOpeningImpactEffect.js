const DEFAULT_CANVAS_WIDTH = 426;
const DEFAULT_CANVAS_HEIGHT = 240;
const DEFAULT_DURATION_MS = 920;
const DEFAULT_PARTICLE_COUNT = 170;
const TAU = Math.PI * 2;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function hashUnit(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createImpactParticle(index, total, seed) {
  const spread = index / Math.max(1, total);
  const jitter = (hashUnit(seed + index * 17.21) - 0.5) * 0.36;
  const angle = spread * TAU + jitter;

  return {
    angle,
    bend: 4 + hashUnit(seed + index * 5.7) * 17,
    innerRadius: hashUnit(seed + index * 11.3) * 7,
    length: 38 + hashUnit(seed + index * 23.6) * 120,
    noiseScale: 0.035 + hashUnit(seed + index * 31.8) * 0.045,
    phase: hashUnit(seed + index * 41.2) * TAU,
    speed: 0.82 + hashUnit(seed + index * 3.4) * 0.54,
    strokeWidth: 1.8 + hashUnit(seed + index * 9.9) * 6.8,
    tint: hashUnit(seed + index * 13.1)
  };
}

function createImpactParticles(count, seed) {
  return Array.from({ length: count }, (_, index) => (
    createImpactParticle(index, count, seed)
  ));
}

function getParticleStroke(tint, alpha) {
  if (tint > 0.9) {
    return `rgba(255, 80, 36, ${alpha})`;
  }

  if (tint > 0.78) {
    return `rgba(90, 255, 62, ${alpha})`;
  }

  if (tint > 0.58) {
    return `rgba(184, 228, 255, ${alpha})`;
  }

  return `rgba(2, 48, 255, ${alpha})`;
}

function drawImpactFlash(ctx, originX, originY, progress, width, height) {
  const flashAlpha = Math.max(0, 1 - progress * 4) * 0.42;
  if (flashAlpha > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(230, 245, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const ringProgress = easeOutCubic(progress);
  const ringRadius = 14 + ringProgress * Math.max(width, height) * 0.52;
  const ringAlpha = Math.max(0, 1 - progress * 1.35);

  if (ringAlpha <= 0.01) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
    const radius = ringRadius * (0.52 + ringIndex * 0.31);
    const lineWidth = Math.max(1, (7 - ringIndex * 1.7) * (1 - progress * 0.55));
    ctx.beginPath();
    ctx.strokeStyle = ringIndex === 1 ?
      `rgba(255, 78, 42, ${ringAlpha * 0.45})` :
      `rgba(32, 92, 255, ${ringAlpha * 0.58})`;
    ctx.lineWidth = lineWidth;
    ctx.arc(originX, originY, radius, 0, TAU);
    ctx.stroke();
  }

  ctx.restore();
}

function drawImpactParticle(ctx, particle, originX, originY, progress, elapsedMs) {
  const travelProgress = easeOutCubic(clamp01(progress * particle.speed));
  const visibleProgress = clamp01(progress * 1.08);
  const alpha = Math.max(0, 1 - visibleProgress) * (0.38 + particle.tint * 0.4);

  if (alpha <= 0.01) {
    return;
  }

  const cos = Math.cos(particle.angle);
  const sin = Math.sin(particle.angle);
  const perpendicularX = -sin;
  const perpendicularY = cos;
  const lineLength = particle.length * travelProgress;
  const segments = 8;

  ctx.beginPath();
  for (let segment = 0; segment <= segments; segment += 1) {
    const segmentProgress = segment / segments;
    const distance = particle.innerRadius + lineLength * segmentProgress;
    const turbulence =
      Math.sin(distance * particle.noiseScale + particle.phase + elapsedMs * 0.018) *
      particle.bend *
      (1 - segmentProgress * 0.55);
    const taper = 1 - segmentProgress * 0.24;
    const x = originX + cos * distance + perpendicularX * turbulence * taper;
    const y = originY + sin * distance + perpendicularY * turbulence * taper;

    if (segment === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = getParticleStroke(particle.tint, alpha);
  ctx.lineWidth = Math.max(0.65, particle.strokeWidth * (1 - progress * 0.72));
  ctx.stroke();
}

export function createGameplayOpeningImpactEffect({
  mount,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  durationMs = DEFAULT_DURATION_MS,
  particleCount = DEFAULT_PARTICLE_COUNT
} = {}) {
  const documentRef = mount?.ownerDocument || (typeof document !== "undefined" ? document : null);
  const windowRef = documentRef?.defaultView || globalThis;
  let canvas = null;
  let ctx = null;
  let frameId = null;
  let startedAt = 0;
  let origin = [canvasWidth * 0.5, canvasHeight * 0.56];
  let particles = [];

  function canRender() {
    return Boolean(
      documentRef &&
      typeof HTMLElement !== "undefined" &&
      mount instanceof HTMLElement &&
      typeof windowRef.requestAnimationFrame === "function"
    );
  }

  function syncCanvasSize(width, height) {
    if (!canvas) {
      return;
    }

    const nextWidth = Math.max(1, Math.floor(width || DEFAULT_CANVAS_WIDTH));
    const nextHeight = Math.max(1, Math.floor(height || DEFAULT_CANVAS_HEIGHT));

    if (canvas.width !== nextWidth) {
      canvas.width = nextWidth;
    }
    if (canvas.height !== nextHeight) {
      canvas.height = nextHeight;
    }
  }

  function ensureCanvas(width, height) {
    if (!canRender()) {
      return null;
    }

    if (canvas) {
      syncCanvasSize(width, height);
      return canvas;
    }

    canvas = documentRef.createElement("canvas");
    canvas.dataset.gameplayOpeningImpactEffect = "true";
    canvas.style.cssText = [
      "position:absolute",
      "left:50%",
      "top:50%",
      "width:var(--game-stage-width)",
      "height:var(--game-stage-height)",
      "transform:translate(-50%, -50%) scale(var(--render-frame-scale))",
      "transform-origin:center center",
      "z-index:2",
      "opacity:1",
      "pointer-events:none",
      "mix-blend-mode:screen",
      "image-rendering:pixelated",
      "image-rendering:crisp-edges",
      "will-change:opacity"
    ].join(";");
    syncCanvasSize(width, height);
    ctx = canvas.getContext("2d");
    mount.append(canvas);
    return canvas;
  }

  function stop() {
    if (frameId !== null) {
      windowRef.cancelAnimationFrame?.(frameId);
      frameId = null;
    }

    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    particles = [];
    canvas?.remove?.();
    canvas = null;
    ctx = null;
  }

  function render(now) {
    if (!canvas || !ctx) {
      stop();
      return;
    }

    const elapsedMs = now - startedAt;
    const progress = clamp01(elapsedMs / durationMs);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    drawImpactFlash(ctx, origin[0], origin[1], progress, canvas.width, canvas.height);
    for (const particle of particles) {
      drawImpactParticle(ctx, particle, origin[0], origin[1], progress, elapsedMs);
    }

    ctx.restore();

    if (progress >= 1) {
      stop();
      return;
    }

    frameId = windowRef.requestAnimationFrame(render);
  }

  function trigger({
    origin: nextOrigin = null,
    width = canvasWidth,
    height = canvasHeight,
    now = windowRef.performance?.now?.() || Date.now()
  } = {}) {
    const effectCanvas = ensureCanvas(width, height);
    if (!effectCanvas || !ctx) {
      return false;
    }

    if (frameId !== null) {
      windowRef.cancelAnimationFrame?.(frameId);
      frameId = null;
    }

    const safeOrigin = Array.isArray(nextOrigin) ?
      nextOrigin :
      [effectCanvas.width * 0.5, effectCanvas.height * 0.56];
    origin = [
      Math.max(0, Math.min(effectCanvas.width, Number(safeOrigin[0]) || effectCanvas.width * 0.5)),
      Math.max(0, Math.min(effectCanvas.height, Number(safeOrigin[1]) || effectCanvas.height * 0.56))
    ];
    startedAt = now;
    particles = createImpactParticles(particleCount, now * 0.001);
    frameId = windowRef.requestAnimationFrame(render);
    return true;
  }

  return {
    destroy: stop,
    trigger
  };
}
