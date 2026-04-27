import {
  ACT_TWO_MONSTER_POSITION,
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "./actTwoSceneConfig.js";

const ACT_TWO_TITLE = "Act 2";
const ACT_TWO_SUBTITLE = "The island starts breathing again.";

const CINEMATIC_KEYFRAMES = [
  {
    target: [4, 1.35, -6],
    direction: [1.7, 1.05, 0.12],
    zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    distance: 9.2,
  },
  {
    target: [16, 1.35, 36],
    direction: [1.18, 1.12, -0.58],
    zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    distance: 9.6,
    duration: 3.2,
  },
  {
    target: [-46, 1.35, 24],
    direction: [1.48, 1.08, 0.42],
    zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    distance: 9.3,
    duration: 3.8,
  },
  {
    target: [44, 1.35, 10],
    direction: [0.92, 1.08, -0.74],
    zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    distance: 9.8,
    duration: 3.9,
  },
  {
    target: [ACT_TWO_MONSTER_POSITION[0], 1.35, ACT_TWO_MONSTER_POSITION[2]],
    direction: [1.12, 1.02, 1.06],
    zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    distance: 7.8,
    duration: 2.9,
  },
];

const TITLE_VISIBLE_FOR = 2.8;
const REVEAL_DURATION = 1.15;
const END_HOLD = 0.55;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeInOut(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function lerpVec3(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

function getTotalDuration() {
  return CINEMATIC_KEYFRAMES.slice(1).reduce((total, frame) => total + (frame.duration || 0), 0) + END_HOLD;
}

function getPoseAtTime(elapsed) {
  let cursor = 0;

  for (let index = 1; index < CINEMATIC_KEYFRAMES.length; index += 1) {
    const from = CINEMATIC_KEYFRAMES[index - 1];
    const to = CINEMATIC_KEYFRAMES[index];
    const duration = to.duration || 0;

    if (elapsed <= cursor + duration || index === CINEMATIC_KEYFRAMES.length - 1) {
      const t = duration <= 0 ? 1 : easeInOut((elapsed - cursor) / duration);
      return {
        target: lerpVec3(from.target, to.target, t),
        direction: lerpVec3(from.direction, to.direction, t),
        zoom: lerp(from.zoom, to.zoom, t),
        distance: lerp(from.distance, to.distance, t),
      };
    }

    cursor += duration;
  }

  const finalFrame = CINEMATIC_KEYFRAMES[CINEMATIC_KEYFRAMES.length - 1];
  return {
    target: [...finalFrame.target],
    direction: [...finalFrame.direction],
    zoom: finalFrame.zoom,
    distance: finalFrame.distance,
  };
}

function getRevealOpacity(elapsed) {
  return elapsed < REVEAL_DURATION ? 1 - clamp01(elapsed / REVEAL_DURATION) : 0;
}

function getTitleOpacity(elapsed) {
  const fadeIn = clamp01(elapsed / 0.45);
  const fadeOutStart = TITLE_VISIBLE_FOR - 0.75;
  const fadeOut = elapsed > fadeOutStart
    ? 1 - clamp01((elapsed - fadeOutStart) / 0.75)
    : 1;
  return clamp01(Math.min(fadeIn, fadeOut));
}

export function createActTwoSequence({ root, uiLayer, camera, onComplete = () => {} } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Act two root invalido.");
  }

  const state = {
    active: false,
    elapsed: 0,
    totalDuration: getTotalDuration(),
  };

  let refs = null;

  function syncUiMode() {
    if (uiLayer instanceof HTMLElement) {
      uiLayer.dataset.mode = state.active ? "cinematic" : "game";
    }
  }

  function mount() {
    root.hidden = false;
    root.innerHTML = `
      <div class="cinematic-shell">
        <div class="cinematic-shell__veil"></div>
        <div class="cinematic-shell__vignette"></div>
        <div class="cinematic-shell__title">
          <span>${ACT_TWO_TITLE}</span>
          <strong>${ACT_TWO_SUBTITLE}</strong>
        </div>
      </div>
    `;

    refs = {
      veil: root.querySelector(".cinematic-shell__veil"),
      title: root.querySelector(".cinematic-shell__title"),
    };
  }

  function unmount() {
    refs = null;
    root.hidden = true;
    root.innerHTML = "";
  }

  function applyVisuals() {
    if (!refs) {
      return;
    }

    refs.veil.style.opacity = `${getRevealOpacity(state.elapsed)}`;
    refs.title.style.opacity = `${getTitleOpacity(state.elapsed)}`;
  }

  function finish() {
    state.active = false;
    syncUiMode();
    unmount();
    onComplete();
  }

  function start() {
    state.active = true;
    state.elapsed = 0;
    syncUiMode();
    mount();
    camera.setPose(CINEMATIC_KEYFRAMES[0]);
    applyVisuals();
  }

  function update(deltaTime) {
    if (!state.active) {
      return;
    }

    state.elapsed = Math.min(state.totalDuration, state.elapsed + deltaTime);
    camera.setPose(getPoseAtTime(state.elapsed));
    applyVisuals();

    if (state.elapsed >= state.totalDuration) {
      finish();
    }
  }

  return {
    isActive() {
      return state.active;
    },
    start,
    update,
    handleKeydown(event) {
      if (!state.active) {
        return false;
      }

      if (
        event.code === "Space" ||
        event.code === "KeyE" ||
        event.code === "KeyM" ||
        event.code === "Escape" ||
        ["w", "a", "s", "d"].includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
        return true;
      }

      return false;
    },
    handleKeyup(event) {
      if (!state.active) {
        return false;
      }

      if (["w", "a", "s", "d"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        return true;
      }

      return false;
    },
  };
}
