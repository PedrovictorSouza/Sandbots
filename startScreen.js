import {
  clearOverlayTransition,
  playOverlayTransition
} from "./app/ui/overlayTransition.js";
import startTitleImageSrc from "./app/ui/images/Logo.png";

const START_TITLE = "Small Island";
const START_TITLE_IMAGE_SRC = startTitleImageSrc;

export function createStartScreen({
  root,
  uiLayer,
  onStart = () => {},
  prepareExitTransition = () => {},
  initiallyActive = true
} = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Start screen root invalido.");
  }
  const state = {
    active: initiallyActive,
    transitioning: false
  };
  let transitionToken = 0;

  function syncUiMode() {
    if (uiLayer instanceof HTMLElement) {
      uiLayer.dataset.mode = state.active ? "start" : "game";
    }
  }
  function buildRenderContext(root, state, START_TITLE) {
    return {
      root,
      state,
      START_TITLE
    };
  }
  function render() {
    const renderContext = buildRenderContext(root, state, START_TITLE);
    clearOverlayTransition(root);
    syncUiMode();
    renderContext.root.hidden = !renderContext.state.active;
    renderContext.root.innerHTML = renderContext.state.active ? `
        <div class="start-shell">
          <section class="start-card">
            <img
              class="start-card__title-image"
              src="${START_TITLE_IMAGE_SRC}"
              alt="${renderContext.START_TITLE}"
            />
            <strong class="start-card__title" hidden>${renderContext.START_TITLE}</strong>
            <button class="start-card__button" type="button" data-start-action="begin">
              Start Game
            </button>
          </section>
        </div>
      ` : "";

    const titleImage = renderContext.root.querySelector(".start-card__title-image");
    const titleFallback = renderContext.root.querySelector(".start-card__title");

    titleImage?.addEventListener("error", () => {
      titleImage.hidden = true;
      if (titleFallback instanceof HTMLElement) {
        titleFallback.hidden = false;
      }
    }, { once: true });

    if (renderContext.state.active && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(syncUiMode);
    }
  }
  function setStartActionsDisabled(disabled) {
    root.querySelectorAll("[data-start-action]").forEach((actionElement) => {
      if (actionElement instanceof HTMLButtonElement) {
        actionElement.disabled = disabled;
      }
    });
  }

  async function begin() {
    if (!state.active || state.transitioning) {
      return;
    }

    const token = transitionToken + 1;
    transitionToken = token;
    state.transitioning = true;
    setStartActionsDisabled(true);
    await prepareExitTransition();
    await playOverlayTransition(root, {
      direction: "exit"
    });

    if (token !== transitionToken) {
      return;
    }

    state.active = false;
    state.transitioning = false;
    render();
    onStart();
  }
  root.addEventListener("click", event => {
    if (!state.active) {
      return;
    }
    const actionTarget = event.target.closest("[data-start-action]");
    if (!actionTarget) {
      return;
    }
    begin();
  });
  render();
  return {
    isActive() {
      return state.active;
    },
    start() {
      transitionToken += 1;
      state.active = true;
      state.transitioning = false;
      render();
    },
    dismiss() {
      transitionToken += 1;
      state.active = false;
      state.transitioning = false;
      render();
    },
    handleKeydown(event) {
      if (!state.active) {
        return false;
      }
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if (state.transitioning) {
        event.preventDefault();
        return true;
      }
      if (event.code === "Space" || event.code === "Enter") {
        begin();
        event.preventDefault();
        return true;
      }
      if (event.code === "Escape" || event.code === "KeyE" || event.code === "KeyM" || ["w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        return true;
      }
      return false;
    },
    handleKeyup(event) {
      if (!state.active) {
        return false;
      }
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if (["w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        return true;
      }
      return false;
    }
  };
}
