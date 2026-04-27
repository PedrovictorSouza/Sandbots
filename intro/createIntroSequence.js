import {
  clearOverlayTransition,
  playOverlayTransition
} from "../app/ui/overlayTransition.js";
import { createDialogueTypewriter } from "../app/ui/dialogueTypewriter.js";
import {
  drawIntroDialogueBoxes,
  renderIntroDialogueBox
} from "./createIntroSequence/drawIntroDialogueBox.js";
import {
  GENDER_OPTIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  MEMORY_SLIDES,
  OUTFIT_COLORS,
  SKIN_TONES,
  TRAINER_TABS
} from "./introContent.js";
import { INTRO_STEPS } from "./introSteps.js";

const CONFIRM_STEP_INDEX = INTRO_STEPS.findIndex((step) => step.type === "confirm");
const EDITOR_STEP_INDEX = INTRO_STEPS.findIndex((step) => step.type === "editor");

function getCurrentStep(state) {
  return INTRO_STEPS[state.stepIndex] || INTRO_STEPS[0];
}

function canAdvanceWithSpace(step) {
  return step.type === "dialogue" || step.type === "carousel";
}

function getSelectedGender(state) {
  return GENDER_OPTIONS.find((option) => option.id === state.gender) || GENDER_OPTIONS[0];
}

function getSelectedOutfit(state) {
  return OUTFIT_COLORS[state.editor.outfit] || OUTFIT_COLORS[0];
}

function renderMemorySlide(step) {
  const slide = MEMORY_SLIDES[step.slideIndex] || MEMORY_SLIDES[0];

  if (slide.kind === "town") {
    return `
      <article class="memory-frame memory-frame--town">
        <div class="memory-frame__town-art">
          <div class="memory-frame__town-sky"></div>
          <div class="memory-frame__town-tree memory-frame__town-tree--a"></div>
          <div class="memory-frame__town-tree memory-frame__town-tree--b"></div>
          <div class="memory-frame__town-tree memory-frame__town-tree--c"></div>
          <div class="memory-frame__town-house"></div>
          <div class="memory-frame__town-path"></div>
          <div class="memory-frame__town-grass"></div>
        </div>
        <div class="memory-frame__meta">
          <span>${slide.title}</span>
          <strong>${slide.label}</strong>
          <p>${slide.caption}</p>
        </div>
      </article>
    `;
  }

  if (slide.kind === "trainer") {
    return `
      <article class="memory-frame memory-frame--trainer">
        <div class="memory-frame__trainer-art">
          <div class="memory-figure memory-figure--trainer"></div>
          <div class="memory-figure memory-figure--pet"></div>
          <div class="memory-figure__spark memory-figure__spark--a"></div>
          <div class="memory-figure__spark memory-figure__spark--b"></div>
        </div>
        <div class="memory-frame__meta">
          <span>${slide.title}</span>
          <strong>${slide.label}</strong>
          <p>${slide.caption}</p>
        </div>
      </article>
    `;
  }

  return `
    <article class="memory-frame memory-frame--device">
      <div class="memory-frame__device">
        <div class="memory-frame__camera-body"></div>
        <div class="memory-frame__camera-lens"></div>
        <div class="memory-frame__camera-flash"></div>
      </div>
      <div class="memory-frame__meta">
        <span>${slide.title}</span>
        <strong>${slide.label}</strong>
        <p>${slide.caption}</p>
      </div>
    </article>
  `;
}

function renderDialogue(step, state) {
  const showSpaceHint = canAdvanceWithSpace(step);
  const shouldAnimateBox = state.seenDialogueBox === false;

  return `
    <div
      class="intro-dialogue-motion"
      data-dialogue-motion="${shouldAnimateBox ? "enter" : "stable"}"
      data-dialogue-step="${step.id}"
    >
      <div class="intro-dialogue-motion__shadow"></div>
      <div class="intro-dialogue-motion__frame">
        ${renderIntroDialogueBox({
          text: step.text,
          showSpaceHint
        })}
      </div>
      <div class="intro-dialogue-motion__scanline"></div>
    </div>
  `;
}

function renderGenderChoices() {
  return `
    <div class="intro-gender-layout">
      <button class="intro-choice-card" type="button" data-intro-action="gender" data-intro-value="masculino">
        <span class="intro-choice-card__avatar" data-gender="masculino"></span>
        <strong>Masculino</strong>
      </button>
      <button class="intro-choice-card" type="button" data-intro-action="gender" data-intro-value="feminino">
        <span class="intro-choice-card__avatar" data-gender="feminino"></span>
        <strong>Feminino</strong>
      </button>
    </div>
  `;
}

function renderConfirmCard(state, step) {
  const selectedGender = getSelectedGender(state);

  return `
    <div class="intro-confirm-layout">
      <div class="intro-confirm-card">
        <div class="intro-confirm-card__portrait" data-gender="${selectedGender.id}"></div>
        <div class="intro-confirm-card__copy">
          <span>${selectedGender.label}</span>
          <strong>${step.text}</strong>
        </div>
        <div class="intro-confirm-card__actions">
          <button class="intro-confirm-button" type="button" data-intro-action="confirm" data-intro-value="yes">Sim</button>
          <button class="intro-confirm-button" type="button" data-intro-action="confirm" data-intro-value="no">Nao</button>
        </div>
      </div>
    </div>
  `;
}

function renderHairOptions(state) {
  return HAIR_STYLES.map((option, index) => `
    <button
      class="trainer-option trainer-option--hair"
      type="button"
      data-intro-action="option"
      data-intro-value="${index}"
      data-selected="${state.editor.hairStyle === index ? "true" : "false"}"
    >
      <span class="trainer-option__hair-shape" data-style="${option.id}"></span>
      <strong>${option.label}</strong>
    </button>
  `).join("");
}

function renderSwatchOptions(items, stateValue) {
  return items.map((item, index) => `
    <button
      class="trainer-option trainer-option--swatch"
      type="button"
      data-intro-action="option"
      data-intro-value="${index}"
      data-selected="${stateValue === index ? "true" : "false"}"
      style="${item.value ? `--option-color:${item.value};` : `--option-color:${item.top}; --option-accent:${item.accent};`}"
      aria-label="${item.label}"
      title="${item.label}"
    >
      <span class="trainer-option__swatch"></span>
      <strong>${item.label}</strong>
    </button>
  `).join("");
}

function renderEditorOptions(state) {
  if (state.editor.tab === "hair") {
    return renderHairOptions(state);
  }

  if (state.editor.tab === "palette") {
    return renderSwatchOptions(HAIR_COLORS, state.editor.hairColor);
  }

  if (state.editor.tab === "outfit") {
    return renderSwatchOptions(OUTFIT_COLORS, state.editor.outfit);
  }

  return renderSwatchOptions(SKIN_TONES, state.editor.skinTone);
}

function renderTrainerPreview(state) {
  const selectedOutfit = getSelectedOutfit(state);
  const skinTone = SKIN_TONES[state.editor.skinTone]?.value || SKIN_TONES[0].value;
  const hairColor = HAIR_COLORS[state.editor.hairColor]?.value || HAIR_COLORS[0].value;
  const hairStyle = HAIR_STYLES[state.editor.hairStyle]?.id || HAIR_STYLES[0].id;

  return `
    <div
      class="trainer-preview"
      data-gender="${state.gender || "masculino"}"
      data-hair-style="${hairStyle}"
      style="
        --trainer-skin:${skinTone};
        --trainer-hair:${hairColor};
        --trainer-shirt:${selectedOutfit.top};
        --trainer-shirt-accent:${selectedOutfit.accent};
        --trainer-shorts:${selectedOutfit.shorts};
      "
    >
      <div class="trainer-preview__spotlight"></div>
      <div class="trainer-preview__avatar">
        <div class="trainer-preview__hair"></div>
        <div class="trainer-preview__head">
          <span class="trainer-preview__eye trainer-preview__eye--left"></span>
          <span class="trainer-preview__eye trainer-preview__eye--right"></span>
          <span class="trainer-preview__mouth"></span>
        </div>
        <div class="trainer-preview__torso"></div>
        <div class="trainer-preview__arm trainer-preview__arm--left"></div>
        <div class="trainer-preview__arm trainer-preview__arm--right"></div>
        <div class="trainer-preview__leg trainer-preview__leg--left"></div>
        <div class="trainer-preview__leg trainer-preview__leg--right"></div>
      </div>
    </div>
  `;
}

function renderEditor(state, step) {
  const selectedGender = getSelectedGender(state);

  return `
    <div class="trainer-editor">
      <div class="trainer-editor__header">
        <div class="trainer-editor__copy">
          <span>Recovered Memory</span>
          <strong>${step.text}</strong>
        </div>
        <div class="trainer-editor__gender-chip" data-gender="${selectedGender.id}">${selectedGender.label}</div>
      </div>
      <div class="trainer-editor__tabs">
        ${TRAINER_TABS.map((tab) => `
          <button
            class="trainer-editor__tab"
            type="button"
            data-intro-action="tab"
            data-intro-value="${tab.id}"
            data-selected="${state.editor.tab === tab.id ? "true" : "false"}"
          >
            ${tab.label}
          </button>
        `).join("")}
      </div>
      <div class="trainer-editor__body">
        <div class="trainer-editor__options">
          <div class="trainer-editor__options-label">Select details</div>
          <div class="trainer-editor__options-grid">
            ${renderEditorOptions(state)}
          </div>
        </div>
        <div class="trainer-editor__preview">
          ${renderTrainerPreview(state)}
        </div>
      </div>
      <div class="trainer-editor__footer">
        <div class="trainer-editor__summary">
          <span>${SKIN_TONES[state.editor.skinTone]?.label || SKIN_TONES[0].label}</span>
          <span>${HAIR_STYLES[state.editor.hairStyle]?.label || HAIR_STYLES[0].label}</span>
          <span>${HAIR_COLORS[state.editor.hairColor]?.label || HAIR_COLORS[0].label}</span>
          <span>${getSelectedOutfit(state).label}</span>
        </div>
        <button class="trainer-editor__confirm" type="button" data-intro-action="finish">Confirmar memoria</button>
      </div>
    </div>
  `;
}

function renderStage(state) {
  const step = getCurrentStep(state);

  if (step.type === "gender") {
    return `
      <div class="intro-stage">
        ${renderGenderChoices()}
        ${renderDialogue(step, state)}
      </div>
    `;
  }

  if (step.type === "confirm") {
    return `
      <div class="intro-stage">
        ${renderConfirmCard(state, step)}
      </div>
    `;
  }

  if (step.type === "editor") {
    return `
      <div class="intro-stage intro-stage--editor">
        ${renderEditor(state, step)}
      </div>
    `;
  }

  return `
    <div class="intro-stage">
      <div class="intro-memory-stage">
        ${step.type === "carousel"
          ? `
            <div class="intro-memory-panel">
              ${renderMemorySlide(step)}
            </div>
          `
          : ""
        }
      </div>
      ${renderDialogue(step, state)}
    </div>
  `;
}

function createInitialEditorState() {
  return {
    tab: "face",
    skinTone: 0,
    hairStyle: 0,
    hairColor: 0,
    outfit: 0,
  };
}

export function createIntroSequence({ root, uiLayer, onComplete = () => {}, autoStart = true } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Intro root invalido.");
  }

  let fadeTimeoutId = 0;
  const typewriter = createDialogueTypewriter({
    onTick: ({ visibleCharacters }) => {
      const canvas = root.querySelector("[data-intro-dialogue-canvas]");
      if (!canvas) {
        return;
      }

      canvas.dataset.introDialogueVisibleCharacters = `${visibleCharacters}`;
      drawIntroDialogueBoxes(root);
    }
  });
  const state = {
    active: autoStart,
    phase: autoStart ? "active" : "idle",
    stepIndex: 0,
    gender: null,
    confirmation: null,
    editor: createInitialEditorState(),
    seenDialogueBox: false,
  };

  function syncUiMode() {
    if (uiLayer instanceof HTMLElement) {
      uiLayer.dataset.mode = state.active ? "intro" : "game";
    }
  }

  function render() {
    typewriter.stop();
    syncUiMode();
    root.hidden = !state.active;
    root.innerHTML = state.active
      ? `
        <div class="intro-shell${state.phase === "fading" ? " intro-shell--fading" : ""}">
          ${renderStage(state)}
        </div>
      `
      : "";
    drawIntroDialogueBoxes(root);

    const step = getCurrentStep(state);
    if (state.active && state.phase === "active" && canAdvanceWithSpace(step)) {
      const canvas = root.querySelector("[data-intro-dialogue-canvas]");
      if (canvas) {
        canvas.dataset.introDialogueVisibleCharacters = "0";
        typewriter.start(step.text);
        state.seenDialogueBox = true;
      }
    }
  }

  function advance() {
    const step = getCurrentStep(state);
    if (!canAdvanceWithSpace(step)) {
      return;
    }

    if (!typewriter.isComplete()) {
      typewriter.complete();
      return;
    }

    state.stepIndex = Math.min(state.stepIndex + 1, INTRO_STEPS.length - 1);
    render();
  }

  function applyGenderPreset(gender) {
    if (gender === "feminino") {
      state.editor.hairStyle = 1;
      state.editor.outfit = 5;
      state.editor.hairColor = 1;
      return;
    }

    state.editor.hairStyle = 3;
    state.editor.outfit = 2;
    state.editor.hairColor = 5;
  }

  function selectGender(gender) {
    state.gender = gender;
    applyGenderPreset(gender);
    state.stepIndex = CONFIRM_STEP_INDEX >= 0 ? CONFIRM_STEP_INDEX : state.stepIndex;
    render();
  }

  function confirmMemory(value) {
    state.confirmation = value;
    state.stepIndex = EDITOR_STEP_INDEX >= 0 ? EDITOR_STEP_INDEX : state.stepIndex;
    render();
  }

  function updateEditorTab(tabId) {
    if (!TRAINER_TABS.some((tab) => tab.id === tabId)) {
      return;
    }

    state.editor.tab = tabId;
    render();
  }

  function updateEditorValue(index) {
    const numericIndex = Number(index);
    if (!Number.isInteger(numericIndex) || numericIndex < 0) {
      return;
    }

    if (state.editor.tab === "hair") {
      state.editor.hairStyle = Math.min(numericIndex, HAIR_STYLES.length - 1);
      render();
      return;
    }

    if (state.editor.tab === "palette") {
      state.editor.hairColor = Math.min(numericIndex, HAIR_COLORS.length - 1);
      render();
      return;
    }

    if (state.editor.tab === "outfit") {
      state.editor.outfit = Math.min(numericIndex, OUTFIT_COLORS.length - 1);
      render();
      return;
    }

    state.editor.skinTone = Math.min(numericIndex, SKIN_TONES.length - 1);
    render();
  }

  function finish() {
    if (state.phase !== "active") {
      return;
    }

    const payload = {
      gender: state.gender,
      confirmation: state.confirmation,
      trainer: {
        skinTone: SKIN_TONES[state.editor.skinTone]?.id || SKIN_TONES[0].id,
        hairStyle: HAIR_STYLES[state.editor.hairStyle]?.id || HAIR_STYLES[0].id,
        hairColor: HAIR_COLORS[state.editor.hairColor]?.id || HAIR_COLORS[0].id,
        outfit: OUTFIT_COLORS[state.editor.outfit]?.id || OUTFIT_COLORS[0].id,
      },
    };

    state.phase = "fading";
    typewriter.stop();
    render();

    window.clearTimeout(fadeTimeoutId);
    fadeTimeoutId = window.setTimeout(() => {
      state.active = false;
      state.phase = "complete";
      typewriter.stop();
      render();
      onComplete(payload);
    }, 820);
  }

  function start() {
    window.clearTimeout(fadeTimeoutId);
    clearOverlayTransition(root);
    typewriter.stop();
    state.active = true;
    state.phase = "active";
    state.stepIndex = 0;
    state.gender = null;
    state.confirmation = null;
    state.editor = createInitialEditorState();
    state.seenDialogueBox = false;
    render();
    return playOverlayTransition(root, {
      direction: "enter"
    });
  }

  root.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-intro-action]");
    if (!actionTarget || !state.active || state.phase !== "active") {
      return;
    }

    const action = actionTarget.dataset.introAction;
    const value = actionTarget.dataset.introValue;

    if (action === "gender") {
      selectGender(value);
      return;
    }

    if (action === "confirm") {
      confirmMemory(value);
      return;
    }

    if (action === "tab") {
      updateEditorTab(value);
      return;
    }

    if (action === "option") {
      updateEditorValue(value);
      return;
    }

    if (action === "finish") {
      finish();
    }
  });

  render();

  return {
    isActive() {
      return state.active;
    },
    start,
    dismiss() {
      window.clearTimeout(fadeTimeoutId);
      clearOverlayTransition(root);
      typewriter.stop();
      state.active = false;
      state.phase = "complete";
      render();
    },
    handleKeydown(event) {
      if (!state.active) {
        return false;
      }

      if (event.code === "Space") {
        if (!event.repeat && state.phase === "active") {
          advance();
        }
        event.preventDefault();
        return true;
      }

      if (
        event.code === "Escape" ||
        event.code === "KeyE" ||
        event.code === "KeyM" ||
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
