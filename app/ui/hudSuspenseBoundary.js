const MISSION_FALLBACK_HTML = `
  <article class="mission-card mission-card--skeleton" aria-hidden="true">
    <div class="hud-suspense-line hud-suspense-line--short"></div>
    <div class="hud-suspense-line hud-suspense-line--title"></div>
    <div class="hud-suspense-line"></div>
    <div class="hud-suspense-line"></div>
    <div class="hud-suspense-meta">
      <span class="hud-suspense-dot"></span>
      <span class="hud-suspense-dot hud-suspense-dot--wide"></span>
    </div>
  </article>
  <article class="mission-card mission-card--skeleton" aria-hidden="true">
    <div class="hud-suspense-line hud-suspense-line--short"></div>
    <div class="hud-suspense-line hud-suspense-line--title"></div>
    <div class="hud-suspense-line"></div>
    <div class="hud-suspense-line hud-suspense-line--medium"></div>
    <div class="hud-suspense-meta">
      <span class="hud-suspense-dot"></span>
      <span class="hud-suspense-dot"></span>
    </div>
  </article>
  <article class="mission-card mission-card--skeleton" aria-hidden="true">
    <div class="hud-suspense-line hud-suspense-line--short"></div>
    <div class="hud-suspense-line hud-suspense-line--title"></div>
    <div class="hud-suspense-line"></div>
    <div class="hud-suspense-line hud-suspense-line--medium"></div>
    <div class="hud-suspense-meta">
      <span class="hud-suspense-dot hud-suspense-dot--wide"></span>
      <span class="hud-suspense-dot"></span>
    </div>
  </article>
`;

const INVENTORY_FALLBACK_HTML = Array.from({ length: 5 }, () => `
  <div class="inventory-slot inventory-slot--skeleton" data-filled="false" data-empty="true" aria-hidden="true">
    <div class="inventory-slot__icon inventory-slot__icon--empty"></div>
  </div>
`).join("");

function isElement(value) {
  if (typeof HTMLElement === "undefined") {
    return Boolean(value && value.nodeType === 1);
  }

  return value instanceof HTMLElement;
}

function markBusy(elements, loading) {
  for (const element of elements) {
    if (!isElement(element)) {
      continue;
    }

    element.setAttribute("aria-busy", loading ? "true" : "false");
  }
}

function setTextWithFallbackMarker(element, text) {
  if (!isElement(element)) {
    return;
  }

  element.textContent = text;
  element.dataset.hudFallback = "true";
}

function clearTextFallback(element) {
  if (!isElement(element) || element.dataset.hudFallback !== "true") {
    return;
  }

  element.textContent = "";
  delete element.dataset.hudFallback;
}

export function createHudSuspenseBoundary({
  uiLayer,
  hudElement,
  questPanelElement,
  missionsPanelElement,
  inventoryPanelElement,
  skillsPanelElement,
  statusElement,
  hudInstructionsElement,
  hudContextElement,
  hudChecklistElement,
  hudMetaElement,
  missionsStackElement,
  inventoryGridElement,
  questTitleElement,
  questBodyElement,
  nearbyHabitatsValueElement
}) {
  const busyElements = [
    hudElement,
    questPanelElement,
    missionsPanelElement,
    inventoryPanelElement,
    skillsPanelElement,
    statusElement
  ];

  function applyFallbackContent() {
    setTextWithFallbackMarker(statusElement, "Carregando HUD...");
    if (isElement(statusElement)) {
      statusElement.dataset.error = "false";
    }

    setTextWithFallbackMarker(
      hudInstructionsElement,
      "Preparando comandos, prompts e feedback local do HUD."
    );
    setTextWithFallbackMarker(
      hudMetaElement,
      "Sincronizando quest chain, inventario e sinais do campo."
    );
    setTextWithFallbackMarker(hudContextElement, "Carregando quadro de avisos...");
    setTextWithFallbackMarker(hudChecklistElement, "...");
    setTextWithFallbackMarker(questTitleElement, "Carregando objetivo");
    setTextWithFallbackMarker(
      questBodyElement,
      "O HUD da expedicao entra assim que o bundle da interface terminar de resolver."
    );
    setTextWithFallbackMarker(nearbyHabitatsValueElement, "Mapeando habitats...");

    if (isElement(missionsStackElement) && missionsStackElement.dataset.hudFallback !== "true") {
      missionsStackElement.innerHTML = MISSION_FALLBACK_HTML;
      missionsStackElement.dataset.hudFallback = "true";
    }

    if (isElement(inventoryGridElement) && inventoryGridElement.dataset.hudFallback !== "true") {
      inventoryGridElement.innerHTML = INVENTORY_FALLBACK_HTML;
      inventoryGridElement.dataset.hudFallback = "true";
    }
  }

  function clearFallbackContent() {
    clearTextFallback(hudInstructionsElement);
    clearTextFallback(hudContextElement);
    clearTextFallback(hudChecklistElement);
    clearTextFallback(hudMetaElement);
    clearTextFallback(questTitleElement);
    clearTextFallback(questBodyElement);
    clearTextFallback(nearbyHabitatsValueElement);

    if (isElement(missionsStackElement) && missionsStackElement.dataset.hudFallback === "true") {
      missionsStackElement.innerHTML = "";
      delete missionsStackElement.dataset.hudFallback;
    }

    if (isElement(inventoryGridElement) && inventoryGridElement.dataset.hudFallback === "true") {
      inventoryGridElement.innerHTML = "";
      delete inventoryGridElement.dataset.hudFallback;
    }
  }

  return {
    setLoading(loading) {
      if (isElement(uiLayer)) {
        uiLayer.dataset.hudLoading = loading ? "true" : "false";
      }

      markBusy(busyElements, loading);

      if (loading) {
        applyFallbackContent();
        return;
      }

      clearFallbackContent();
    },

    setStatus(message, isError = false) {
      if (!isElement(statusElement)) {
        return;
      }

      statusElement.textContent = message;
      statusElement.dataset.error = isError ? "true" : "false";
      delete statusElement.dataset.hudFallback;
    }
  };
}
