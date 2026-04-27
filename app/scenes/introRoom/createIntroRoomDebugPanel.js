function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function formatNumber(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const FIELD_SLIDER_RANGES = Object.freeze({
  "position-x": { min: -8, max: 8 },
  "position-y": { min: -4, max: 8 },
  "position-z": { min: -8, max: 8 },
  yaw: { min: -3.14, max: 3.14 },
  pitch: { min: -3.14, max: 3.14 },
  roll: { min: -3.14, max: 3.14 },
  scale: { min: 0.1, max: 4 },
  "camera-distance": { min: 2.5, max: 20 },
  "camera-zoom": { min: 1.8, max: 16 },
  "camera-direction-x": { min: -2, max: 2 },
  "camera-direction-y": { min: -2, max: 2 },
  "camera-direction-z": { min: -2, max: 2 },
  "camera-target-x": { min: -8, max: 8 },
  "camera-target-y": { min: -2, max: 8 },
  "camera-target-z": { min: -8, max: 8 }
});

function createField({ key, label, value, step = 0.05 }) {
  const range = FIELD_SLIDER_RANGES[key] || { min: -8, max: 8 };

  return `
    <label class="intro-room-debug__field intro-room-debug__field--slider">
      <span>${label}</span>
      <input
        type="number"
        step="${step}"
        data-intro-room-debug-field="${key}"
        value="${formatNumber(value)}"
      />
      <input
        type="range"
        min="${range.min}"
        max="${range.max}"
        step="${step}"
        data-intro-room-debug-slider="${key}"
        value="${formatNumber(value)}"
      />
    </label>
  `;
}

function buildAnimationPrompt(snapshots) {
  return [
    "Create a smooth Chopper intro animation using these keyframes.",
    "Interpolate position, yaw, scale, and camera values with gentle easing.",
    "Keep pitch and roll available for future renderer support, but do not require them if unsupported.",
    "",
    JSON.stringify(snapshots, null, 2)
  ].join("\n");
}

function writeClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return Promise.resolve();
}

export function createIntroRoomDebugPanel({
  root,
  introRoomScene,
  camera,
  cameraOrbit
}) {
  const state = {
    introRoomScene,
    snapshots: [],
    note: "",
    label: ""
  };

  function getScene() {
    return state.introRoomScene;
  }

  function getCurrentSnapshotPayload() {
    const scene = getScene();
    const chopperPose = scene.getChopperPose();
    const cameraPose = scene.getCameraPose({ camera });

    return {
      position: [...chopperPose.position],
      rotation: { ...chopperPose.rotation },
      scale: chopperPose.scale,
      camera: {
        target: [...cameraPose.target],
        direction: [...cameraPose.direction],
        zoom: cameraPose.zoom,
        distance: cameraPose.distance
      }
    };
  }

  function renderSnapshots() {
    const list = root.querySelector("[data-intro-room-debug-snapshots]");
    if (!list) {
      return;
    }

    list.innerHTML = state.snapshots.map((snapshot) => `
      <article class="intro-room-debug__snapshot" data-intro-room-debug-snapshot="${snapshot.id}">
        <strong>${escapeHtml(snapshot.label)}</strong>
        <span>${formatNumber(snapshot.time)}s ${snapshot.note ? `- ${escapeHtml(snapshot.note)}` : ""}</span>
        <div class="intro-room-debug__snapshot-actions">
          <button type="button" data-intro-room-debug-action="apply" data-id="${snapshot.id}">Apply</button>
          <button type="button" data-intro-room-debug-action="copy" data-id="${snapshot.id}">Copy JSON</button>
          <button type="button" data-intro-room-debug-action="delete" data-id="${snapshot.id}">Delete</button>
        </div>
      </article>
    `).join("");
  }

  function syncFieldsFromScene() {
    const payload = getCurrentSnapshotPayload();
    const values = {
      "position-x": payload.position[0],
      "position-y": payload.position[1],
      "position-z": payload.position[2],
      yaw: payload.rotation.yaw,
      pitch: payload.rotation.pitch,
      roll: payload.rotation.roll,
      scale: payload.scale,
      "camera-target-x": payload.camera.target[0],
      "camera-target-y": payload.camera.target[1],
      "camera-target-z": payload.camera.target[2],
      "camera-direction-x": payload.camera.direction[0],
      "camera-direction-y": payload.camera.direction[1],
      "camera-direction-z": payload.camera.direction[2],
      "camera-zoom": payload.camera.zoom,
      "camera-distance": payload.camera.distance
    };

    Object.entries(values).forEach(([key, value]) => {
      const input = root.querySelector(`[data-intro-room-debug-field="${key}"]`);
      if (input) {
        input.value = formatNumber(value);
      }

      const slider = root.querySelector(`[data-intro-room-debug-slider="${key}"]`);
      if (slider) {
        slider.value = formatNumber(value);
      }
    });
  }

  function readField(key, fallback) {
    const input = root.querySelector(`[data-intro-room-debug-field="${key}"]`);
    return toNumber(input?.value, fallback);
  }

  function applyFieldsToScene() {
    const scene = getScene();
    const currentChopper = scene.getChopperPose();
    const currentCamera = scene.getCameraPose({ camera });

    scene.setDebugControlsActive?.(true);
    scene.setChopperPose({
      position: [
        readField("position-x", currentChopper.position[0]),
        readField("position-y", currentChopper.position[1]),
        readField("position-z", currentChopper.position[2])
      ],
      rotation: {
        yaw: readField("yaw", currentChopper.rotation.yaw),
        pitch: readField("pitch", currentChopper.rotation.pitch),
        roll: readField("roll", currentChopper.rotation.roll)
      },
      scale: readField("scale", currentChopper.scale)
    });

    scene.setCameraPose({
      target: [
        readField("camera-target-x", currentCamera.target[0]),
        readField("camera-target-y", currentCamera.target[1]),
        readField("camera-target-z", currentCamera.target[2])
      ],
      direction: [
        readField("camera-direction-x", currentCamera.direction[0]),
        readField("camera-direction-y", currentCamera.direction[1]),
        readField("camera-direction-z", currentCamera.direction[2])
      ],
      zoom: readField("camera-zoom", currentCamera.zoom),
      distance: readField("camera-distance", currentCamera.distance)
    }, {
      camera,
      cameraOrbit
    });
  }

  function saveSnapshot() {
    const payload = getCurrentSnapshotPayload();
    const id = `intro-keyframe-${state.snapshots.length + 1}-${Date.now().toString(36)}`;
    const labelInput = root.querySelector('[data-intro-room-debug-field="snapshot-label"]');
    const noteInput = root.querySelector('[data-intro-room-debug-field="snapshot-note"]');
    const label = labelInput?.value?.trim() || `Keyframe ${state.snapshots.length + 1}`;
    const note = noteInput?.value?.trim() || "";

    state.snapshots.push({
      id,
      label,
      time: Number((state.snapshots.length * 0.8).toFixed(2)),
      ...payload,
      note
    });
    renderSnapshots();
  }

  function findSnapshot(id) {
    return state.snapshots.find((snapshot) => snapshot.id === id);
  }

  function applySnapshot(id) {
    const snapshot = findSnapshot(id);
    if (!snapshot) {
      return;
    }

    getScene().setChopperPose(snapshot);
    getScene().setDebugControlsActive?.(true);
    getScene().setCameraPose(snapshot.camera, {
      camera,
      cameraOrbit
    });
    syncFieldsFromScene();
  }

  function render() {
    const payload = getCurrentSnapshotPayload();

    root.hidden = false;
    root.innerHTML = `
      <aside class="intro-room-debug" aria-label="Intro room debug panel">
        <div class="intro-room-debug__header">
          <strong>IntroRoom Debug</strong>
          <button type="button" data-intro-room-debug-action="hide">Hide</button>
        </div>
        <div class="intro-room-debug__grid">
          ${createField({ key: "position-x", label: "Pos X", value: payload.position[0] })}
          ${createField({ key: "position-y", label: "Pos Y", value: payload.position[1] })}
          ${createField({ key: "position-z", label: "Pos Z", value: payload.position[2] })}
          ${createField({ key: "yaw", label: "Yaw", value: payload.rotation.yaw, step: 0.01 })}
          ${createField({ key: "pitch", label: "Pitch", value: payload.rotation.pitch, step: 0.01 })}
          ${createField({ key: "roll", label: "Roll", value: payload.rotation.roll, step: 0.01 })}
          ${createField({ key: "scale", label: "Scale", value: payload.scale })}
          ${createField({ key: "camera-distance", label: "Cam Dist", value: payload.camera.distance })}
          ${createField({ key: "camera-zoom", label: "Cam Zoom", value: payload.camera.zoom })}
          ${createField({ key: "camera-direction-x", label: "Dir X", value: payload.camera.direction[0], step: 0.01 })}
          ${createField({ key: "camera-direction-y", label: "Dir Y", value: payload.camera.direction[1], step: 0.01 })}
          ${createField({ key: "camera-direction-z", label: "Dir Z", value: payload.camera.direction[2], step: 0.01 })}
          ${createField({ key: "camera-target-x", label: "Target X", value: payload.camera.target[0] })}
          ${createField({ key: "camera-target-y", label: "Target Y", value: payload.camera.target[1] })}
          ${createField({ key: "camera-target-z", label: "Target Z", value: payload.camera.target[2] })}
        </div>
        <div class="intro-room-debug__snapshot-form">
          <input type="text" data-intro-room-debug-field="snapshot-label" placeholder="Snapshot label" />
          <input type="text" data-intro-room-debug-field="snapshot-note" placeholder="Note" />
          <button type="button" data-intro-room-debug-action="save">Save Snapshot</button>
        </div>
        <div class="intro-room-debug__actions">
          <button type="button" data-intro-room-debug-action="copy-all">Copy All Keyframes</button>
          <button type="button" data-intro-room-debug-action="copy-prompt">Copy Animation Prompt</button>
        </div>
        <div class="intro-room-debug__snapshots" data-intro-room-debug-snapshots></div>
      </aside>
    `;
    renderSnapshots();
  }

  root.addEventListener("input", (event) => {
    const sliderKey = event.target.dataset?.introRoomDebugSlider;
    if (sliderKey) {
      const input = root.querySelector(`[data-intro-room-debug-field="${sliderKey}"]`);
      if (input) {
        input.value = event.target.value;
      }
      applyFieldsToScene();
      return;
    }

    const fieldKey = event.target.dataset?.introRoomDebugField;
    if (fieldKey) {
      const slider = root.querySelector(`[data-intro-room-debug-slider="${fieldKey}"]`);
      if (slider) {
        slider.value = event.target.value;
      }
    }

    if (event.target.matches('[data-intro-room-debug-field]:not([type="text"])')) {
      applyFieldsToScene();
    }
  });

  root.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  root.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-intro-room-debug-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.introRoomDebugAction;
    const id = actionTarget.dataset.id;

    if (action === "hide") {
      root.hidden = true;
      return;
    }

    if (action === "save") {
      saveSnapshot();
      return;
    }

    if (action === "apply") {
      applySnapshot(id);
      return;
    }

    if (action === "copy") {
      void writeClipboard(JSON.stringify(findSnapshot(id), null, 2));
      return;
    }

    if (action === "delete") {
      state.snapshots = state.snapshots.filter((snapshot) => snapshot.id !== id);
      renderSnapshots();
      return;
    }

    if (action === "copy-all") {
      void writeClipboard(JSON.stringify(state.snapshots, null, 2));
      return;
    }

    if (action === "copy-prompt") {
      void writeClipboard(buildAnimationPrompt(state.snapshots));
    }
  });

  return {
    setIntroRoomScene(nextIntroRoomScene) {
      state.introRoomScene = nextIntroRoomScene;
      render();
    },

    show() {
      render();
    },

    hide() {
      root.hidden = true;
      getScene()?.setDebugControlsActive?.(false);
    }
  };
}
