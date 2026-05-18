import { createQuestLog } from "./createQuestLog.js";
import {
  getInventoryPresentationOrder,
  getInventorySlotRole
} from "./inventoryPresentation.js";
import { getCompanionAbilityByAbilityId } from "../gameplay/content/companionAbilities.js";
import {
  formatActiveMoveGuidanceByAbilityId,
  getSmallIslandMoveByAbilityId
} from "../sandbox/moveData.js";
import { getErrandQuestInstructionText } from "../quest/errandQuestDesign.js";
import { createColonyCacheState } from "../gameplay/colonyCacheContract.js";
import { resolveGameHudInitialStatus } from "./gameHudControllerConfig.ts";
import { createColonyStatusModel } from "./colonyStatusModel.js";
import { resolveInitialHudGuide } from "./inputPromptResolver.js";
import { renderInventoryCountHtml } from "./uiTextValue.ts";

const ACTIVE_COMPANION_THUMBNAILS = Object.freeze({
  squirtle: new URL("./images/Robot-1-thumb.png", import.meta.url).href,
  bulbasaur: new URL("./images/Robot-2-thumb.png", import.meta.url).href,
  charmander: new URL("./images/Robot-3-thumb.png", import.meta.url).href
});
const ACTIVE_COMPANION_ARROW_ICON_URL = new URL("./images/arrow.png", import.meta.url).href;
const ACTIVE_COMPANION_LT_ICON_URL = new URL("./images/Lt-thumb.png", import.meta.url).href;
const INVENTORY_ITEM_IMAGES = Object.freeze({
  leaves: new URL("../../Objects/leave.png", import.meta.url).href,
  wood: new URL("../../Objects/wood.png", import.meta.url).href,
  carbon: new URL("../Commodities/carbon/carvao.png", import.meta.url).href
});
const SUPPLY_HUD_EXCLUDED_SLOT_ROLES = Object.freeze([
  "currency",
  "key",
  "recipe"
]);
const MISSION_COMPLETE_SFX_URL = new URL("../soundFx/mission-complete.mp3", import.meta.url).href;
const MISSION_COMPLETE_SFX_VOLUME = 0.792;
const TALK_ACTION_TERMS = Object.freeze([
  "chopper",
  "grow bot",
  "thermal bot",
  "builder bot",
  "overseer bot",
  "bulbasaur"
]);
const SUPPLY_PICKUP_FLY_DURATION_MS = 1000;
const COLONY_STATUS_STATE_LABELS = Object.freeze({
  offline: "offline",
  available: "available",
  ready: "ready",
  active: "online",
  complete: "stable"
});

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutBack(value) {
  const progress = clamp01(value);
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * Math.pow(progress - 1, 3) + overshoot * Math.pow(progress - 1, 2);
}

function formatColonyStatusSystem(system) {
  if (!system?.label) {
    return "";
  }

  const progressMatch = String(system.detail || "").match(/\b\d+\/\d+\b/);
  if (progressMatch) {
    return `${system.label} ${progressMatch[0]}`;
  }

  return `${system.label} ${COLONY_STATUS_STATE_LABELS[system.state] || system.state || "unknown"}`;
}

export function formatColonyStatusHudText(colonyStatus) {
  const systems = Array.isArray(colonyStatus?.systems) ? colonyStatus.systems : [];
  const toolText = colonyStatus?.activeTool ? `Tool ${colonyStatus.activeTool}` : "";
  const systemText = systems
    .map(formatColonyStatusSystem)
    .filter(Boolean)
    .join(" • ");

  return [toolText, systemText].filter(Boolean).join(" • ");
}

export function formatColonyCacheHudText(colonyCache) {
  const totalItems = Number(colonyCache?.totalItems || 0);

  if (totalItems <= 0) {
    return "";
  }

  const materialCount = Number(colonyCache?.groupCounts?.materials || 0);
  const cacheState = materialCount >= 3 ? "build-ready" : "stocked";
  return materialCount > 0 ?
    `Cache ${cacheState}: ${totalItems} supplies, ${materialCount} materials` :
    `Cache ${cacheState}: ${totalItems} supplies`;
}

export function createGameHudController({
  statusElement,
  hudInstructionsElement,
  hudContextElement,
  hudChecklistElement,
  hudMetaElement,
  missionsStackElement,
  inventoryGridElement,
  skillsPanelElement,
  skillsGridElement,
  inventoryOrder = [],
  itemDefs = {},
  playerSkillDefs = {},
  playerSkillOrder = [],
  npcProfiles,
  placeholderRecipes,
  getActiveQuest,
  getQuestProgressDescriptor,
  buildQuestProgressCopy,
  formatRequirementSummary,
  formatDifficulty,
  getRegionForPosition,
  resourceHarvestPrompt,
  interactPrompt,
  questSystem = null,
  initialStatus
}) {
  const MAX_VISIBLE_INVENTORY_SLOTS = 5;
  const TRACKED_TASK_COMPLETION_FLASH_MS = 3000;
  const HUD_GUIDE_BY_QUEST_ID = Object.freeze({
    findPokemon: "Talk to Hydro Bot",
    makingHabitats: "Making habitats: arrange plants, rocks, and objects to create habitats."
  });
  const QUEST_CHECKLIST_LABELS = Object.freeze({
    meetTangrowth: ["Talk to Chopper"],
    findPokemon: ["Talk to Hydro Bot"],
    makingHabitats: [
      "Use Hydro Jet on a dry object",
      "Find a restored habitat",
      "Check the Colony Codex clue"
    ]
  });
  const statusState = {
    runtime: resolveGameHudInitialStatus({ initialStatus }),
    error: false,
    trackedRecipe: null
  };
  const transientNotice = {
    message: "",
    timer: 0
  };
  const transientNoticeQueue = [];
  const missionCompleteAudioPool = [];
  const supplyPickupFlyQueue = [];
  let supplyPickupFlyAnimating = false;
  let supplyPickupFlyLayer = null;
  let supplyPickupFlyStyleElement = null;
  const uiCache = {
    inventoryHtml: "",
    missionsHtml: "",
    hudContext: "",
    hudChecklist: "",
    hudMeta: "",
    hudInstructions: "",
    nearbyHabitats: "",
    activeCompanionHudHtml: "",
    hudFocusQuestId: null,
    hudQuestId: null
  };
  const recentCompletion = {
    questId: null,
    until: 0
  };
  const hudBoardElement = hudInstructionsElement?.closest?.(".hud") || hudMetaElement?.closest?.(".hud") || null;
  const hudCurrentActionElement = hudInstructionsElement?.closest?.(".hud-current-action") || null;
  let hudBoardFlashTimeout = 0;
  let hudBoardEntranceVariant = false;
  const questLog = questSystem ? createQuestLog({ questSystem }) : null;
  const trackedTaskCompletionDeadlines = new Map();
  const hiddenCompletedTrackedTaskIds = new Set();
  const noticedCompletedTrackedTaskIds = new Set();
  const hudChecklistProgressValues = new Map();
  let latestStoryState = { flags: {} };
  let latestSkillsState = null;
  let latestActiveSkillId = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getInventoryPanelElement() {
    return inventoryGridElement?.closest?.(".inventory") || null;
  }

  function rememberStoryState(storyState) {
    if (storyState && typeof storyState === "object") {
      latestStoryState = storyState;
    }

    return latestStoryState;
  }

  function getActiveCompanionGuidance(activeSkillId) {
    const move = getSmallIslandMoveByAbilityId(activeSkillId);

    if (!move) {
      return null;
    }

    return formatActiveMoveGuidanceByAbilityId(activeSkillId, {
      storyFlags: latestStoryState?.flags || {}
    });
  }

  function refreshActiveCompanionHudFromCache() {
    if (latestSkillsState) {
      syncActiveCompanionHud(latestSkillsState, latestActiveSkillId);
    }
  }

  function getOrCreateActiveCompanionHudElement() {
    const inventoryPanelElement = getInventoryPanelElement();

    if (!inventoryPanelElement) {
      return null;
    }

    let headerElement = inventoryPanelElement.querySelector(".inventory-header");
    if (!headerElement) {
      headerElement = document.createElement("div");
      headerElement.className = "inventory-header";

      const titleElement = Array.from(inventoryPanelElement.children).find((element) => {
        return element.tagName === "STRONG";
      });

      if (titleElement) {
        inventoryPanelElement.insertBefore(headerElement, titleElement);
        headerElement.appendChild(titleElement);
      } else {
        inventoryPanelElement.insertBefore(headerElement, inventoryGridElement);
      }
    }

    const companionHudParent = inventoryPanelElement.parentElement || inventoryPanelElement;
    let companionHudElement = companionHudParent.querySelector(".active-companion-hud");

    if (!companionHudElement) {
      companionHudElement = inventoryPanelElement.querySelector(".active-companion-hud");
    }

    if (!companionHudElement) {
      companionHudElement = document.createElement("div");
      companionHudElement.className = "active-companion-hud";
      companionHudElement.hidden = true;
      companionHudElement.setAttribute("aria-live", "polite");
    }

    if (companionHudElement.parentElement !== companionHudParent) {
      companionHudParent.appendChild(companionHudElement);
    }

    return companionHudElement;
  }

  function renderRobotThumbnailHtml(companionId) {
    const normalizedCompanionId = escapeHtml(companionId || "unknown");
    const thumbnailUrl = ACTIVE_COMPANION_THUMBNAILS[companionId] || ACTIVE_COMPANION_THUMBNAILS.squirtle;

    return `
      <span class="active-companion-hud__portrait-stack" aria-hidden="true">
        <span class="active-companion-hud__portrait">
          <img
            class="active-companion-hud__portrait-image"
            src="${escapeHtml(thumbnailUrl)}"
            alt=""
            data-companion-id="${normalizedCompanionId}"
            loading="eager"
            decoding="async"
          >
        </span>
      </span>
    `;
  }

  function renderInventorySlotIconHtml(itemId, item) {
    const imageUrl = INVENTORY_ITEM_IMAGES[itemId];

    if (imageUrl) {
      return `
        <img
          class="inventory-slot__image"
          src="${escapeHtml(imageUrl)}"
          alt=""
          loading="eager"
          decoding="async"
        >
      `;
    }

    return escapeHtml(item.glyph || "?");
  }

  function getHudDocument() {
    return inventoryGridElement?.ownerDocument || globalThis.document || null;
  }

  function getHudWindow() {
    return getHudDocument()?.defaultView || globalThis.window || null;
  }

  function getAnimationNow() {
    const hudWindow = getHudWindow();
    return hudWindow?.performance?.now?.() || globalThis.performance?.now?.() || Date.now();
  }

  function requestHudAnimationFrame(callback) {
    const hudWindow = getHudWindow();
    const requestFrame = hudWindow?.requestAnimationFrame || globalThis.requestAnimationFrame;

    if (typeof requestFrame === "function") {
      return requestFrame.call(hudWindow || globalThis, callback);
    }

    return setTimeout(() => callback(getAnimationNow()), 16);
  }

  function ensureSupplyPickupFlyStyles() {
    const documentRef = getHudDocument();

    if (!documentRef || supplyPickupFlyStyleElement?.isConnected) {
      return;
    }

    supplyPickupFlyStyleElement = documentRef.createElement("style");
    supplyPickupFlyStyleElement.textContent = `
      .supply-pickup-fly-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 10000;
      }

      .supply-pickup-fly {
        position: absolute;
        left: 0;
        top: 0;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        will-change: transform, opacity;
      }

      .supply-pickup-fly__icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border: 3px solid #fff1cf;
        background: var(--slot-color, #ffe08a);
        color: var(--slot-ink, #271806);
        box-shadow: 0 3px 0 rgba(43, 32, 44, 0.8);
        font-family: var(--game-ui-font, monospace);
        font-size: 20px;
        line-height: 1;
        overflow: hidden;
        image-rendering: pixelated;
      }

      .supply-pickup-fly__icon .inventory-slot__image {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .inventory-slot[data-pickup-pulse="true"] .inventory-slot__icon {
        animation: supplyPickupSlotPulse 360ms cubic-bezier(0.2, 1.5, 0.4, 1);
      }

      @keyframes supplyPickupSlotPulse {
        0% { transform: scale(1); filter: brightness(1); }
        45% { transform: scale(1.24); filter: brightness(1.35); }
        100% { transform: scale(1); filter: brightness(1); }
      }
    `;
    documentRef.head?.appendChild(supplyPickupFlyStyleElement);
  }

  function getSupplyPickupFlyLayer() {
    const documentRef = getHudDocument();

    if (!documentRef?.body) {
      return null;
    }

    ensureSupplyPickupFlyStyles();

    if (supplyPickupFlyLayer?.isConnected) {
      return supplyPickupFlyLayer;
    }

    supplyPickupFlyLayer = documentRef.createElement("div");
    supplyPickupFlyLayer.className = "supply-pickup-fly-layer";
    supplyPickupFlyLayer.setAttribute("aria-hidden", "true");
    documentRef.body.appendChild(supplyPickupFlyLayer);
    return supplyPickupFlyLayer;
  }

  function getSupplySlotElement(itemId) {
    if (!inventoryGridElement || !itemId) {
      return null;
    }

    return [...inventoryGridElement.querySelectorAll(".inventory-slot[data-filled='true']")]
      .find((slot) => slot.dataset.itemId === itemId) || null;
  }

  function getFallbackSupplyPickupOrigin() {
    const hudWindow = getHudWindow();
    return {
      x: (hudWindow?.innerWidth || 0) * 0.5,
      y: (hudWindow?.innerHeight || 0) * 0.5
    };
  }

  function normalizeSupplyPickupOrigin(origin) {
    if (Array.isArray(origin) && Number.isFinite(origin[0]) && Number.isFinite(origin[1])) {
      return { x: origin[0], y: origin[1] };
    }

    if (Number.isFinite(origin?.x) && Number.isFinite(origin?.y)) {
      return { x: origin.x, y: origin.y };
    }

    return getFallbackSupplyPickupOrigin();
  }

  function getElementCenter(element) {
    const rect = element?.getBoundingClientRect?.();

    if (!rect) {
      return getFallbackSupplyPickupOrigin();
    }

    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5
    };
  }

  function pulseSupplySlot(itemId) {
    const slotElement = getSupplySlotElement(itemId);

    if (!slotElement) {
      return;
    }

    slotElement.dataset.pickupPulse = "true";
    setTimeout(() => {
      if (slotElement.dataset.pickupPulse === "true") {
        delete slotElement.dataset.pickupPulse;
      }
    }, 380);
  }

  function createSupplyPickupFlyElement(itemId) {
    const documentRef = getHudDocument();
    const item = itemDefs[itemId];

    if (!documentRef || !item) {
      return null;
    }

    const flyElement = documentRef.createElement("div");
    flyElement.className = "supply-pickup-fly";
    flyElement.dataset.itemId = itemId;
    flyElement.innerHTML = `
      <div
        class="supply-pickup-fly__icon"
        style="--slot-color:${item.color}; --slot-ink:${item.ink}"
      >
        ${renderInventorySlotIconHtml(itemId, item)}
      </div>
    `;
    return flyElement;
  }

  function animateSupplyPickupFly(payload) {
    const slotElement = getSupplySlotElement(payload.itemId);
    const layerElement = getSupplyPickupFlyLayer();
    const flyElement = createSupplyPickupFlyElement(payload.itemId);

    if (!slotElement || !layerElement || !flyElement) {
      supplyPickupFlyAnimating = false;
      startNextSupplyPickupFly();
      return;
    }

    const start = normalizeSupplyPickupOrigin(payload.origin);
    const end = getElementCenter(slotElement);
    const control = {
      x: (start.x + end.x) * 0.5,
      y: Math.min(start.y, end.y) - 112 - Math.abs(end.x - start.x) * 0.08
    };
    const startedAt = getAnimationNow();

    layerElement.appendChild(flyElement);

    const update = (timestamp) => {
      const progress = clamp01((timestamp - startedAt) / SUPPLY_PICKUP_FLY_DURATION_MS);
      const eased = easeOutBack(progress);
      const curveT = clamp01(eased);
      const oneMinusT = 1 - curveT;
      const x = oneMinusT * oneMinusT * start.x +
        2 * oneMinusT * curveT * control.x +
        curveT * curveT * end.x;
      const y = oneMinusT * oneMinusT * start.y +
        2 * oneMinusT * curveT * control.y +
        curveT * curveT * end.y;
      const bounce = 1 + Math.sin(progress * Math.PI) * 0.24;
      const scale = (1 - progress * 0.28) * bounce;
      const rotation = Math.sin(progress * Math.PI * 2) * 10;

      flyElement.style.opacity = String(1 - Math.max(0, progress - 0.82) / 0.18);
      flyElement.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;

      if (progress < 1) {
        requestHudAnimationFrame(update);
        return;
      }

      flyElement.remove();
      pulseSupplySlot(payload.itemId);
      supplyPickupFlyAnimating = false;
      startNextSupplyPickupFly();
    };

    requestHudAnimationFrame(update);
  }

  function startNextSupplyPickupFly() {
    if (supplyPickupFlyAnimating || supplyPickupFlyQueue.length === 0) {
      return;
    }

    supplyPickupFlyAnimating = true;
    animateSupplyPickupFly(supplyPickupFlyQueue.shift());
  }

  function queueSupplyPickupFlyToSlot({ itemId, origin } = {}) {
    if (!itemDefs[itemId] || !getSupplySlotElement(itemId)) {
      return false;
    }

    supplyPickupFlyQueue.push({
      itemId,
      origin: normalizeSupplyPickupOrigin(origin)
    });
    startNextSupplyPickupFly();
    return true;
  }

  function syncActiveCompanionHud(skills, activeSkillId = null, storyState = null) {
    rememberStoryState(storyState);
    const companionHudElement = getOrCreateActiveCompanionHudElement();

    if (!companionHudElement) {
      return;
    }

    const activeAbility =
      activeSkillId && skills?.[activeSkillId] ?
        getCompanionAbilityByAbilityId(activeSkillId) :
        null;
    const skill = activeSkillId ? playerSkillDefs[activeSkillId] : null;

    if (!activeAbility || !skill) {
      companionHudElement.hidden = true;
      companionHudElement.removeAttribute("data-companion-id");
      companionHudElement.removeAttribute("data-element");
      companionHudElement.removeAttribute("aria-label");
      if (uiCache.activeCompanionHudHtml !== "") {
        uiCache.activeCompanionHudHtml = "";
        companionHudElement.innerHTML = "";
      }
      return;
    }

    const activeGuidance = getActiveCompanionGuidance(activeSkillId);

    companionHudElement.dataset.companionId = activeAbility.companionId;
    companionHudElement.dataset.element = activeAbility.element;
    companionHudElement.setAttribute(
      "aria-label",
      `${activeAbility.companionName}: ${activeAbility.label} selected${activeGuidance ? `. ${activeGuidance}` : ""}`
    );

    const nextHtml = `
      ${renderRobotThumbnailHtml(activeAbility.companionId)}
      <span class="active-companion-hud__text">
        <span class="active-companion-hud__move">${escapeHtml(skill.shortLabel || activeAbility.label)}</span>
        <span class="active-companion-hud__name">${escapeHtml(activeAbility.companionName)}</span>
        ${activeGuidance ? `
          <span class="active-companion-hud__hint">
            <img class="active-companion-hud__hint-image" src="${escapeHtml(ACTIVE_COMPANION_LT_ICON_URL)}" alt="${escapeHtml(activeGuidance)}" loading="eager" decoding="async">
          </span>
        ` : ""}
      </span>
    `;

    if (uiCache.activeCompanionHudHtml !== nextHtml) {
      uiCache.activeCompanionHudHtml = nextHtml;
      companionHudElement.innerHTML = nextHtml;
    }

    companionHudElement.hidden = false;
  }

  function flashHudBoard() {
    if (!hudBoardElement) {
      return;
    }

    if (hudBoardFlashTimeout) {
      clearTimeout(hudBoardFlashTimeout);
    }

    hudBoardElement.dataset.noticeFlash = "false";
    void hudBoardElement.offsetWidth;
    hudBoardElement.dataset.noticeFlash = "true";
    hudBoardFlashTimeout = setTimeout(() => {
      hudBoardElement.dataset.noticeFlash = "false";
      hudBoardFlashTimeout = 0;
    }, 3000);
  }

  function replayHudBoardEntrance() {
    if (!hudBoardElement) {
      return;
    }

    if (hudBoardFlashTimeout) {
      clearTimeout(hudBoardFlashTimeout);
      hudBoardFlashTimeout = 0;
    }

    hudBoardElement.dataset.noticeFlash = "false";
    hudBoardEntranceVariant = !hudBoardEntranceVariant;
    hudBoardElement.dataset.taskEnter = hudBoardEntranceVariant ? "a" : "b";
  }

  function getHudTime() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }

    return Date.now();
  }

  function getTrackedTaskRenderOptions(storyState = {}) {
    const flashingTaskIds = new Set();

    if (!questLog?.getTrackedTaskStates) {
      return {
        flashingTaskIds,
        hideCompletedTrackedTasks: true
      };
    }

    const now = getHudTime();
    const trackedTaskStates = questLog.getTrackedTaskStates(storyState);

    for (const entry of trackedTaskStates) {
      if (!entry.taskId) {
        continue;
      }

      if (!entry.done) {
        trackedTaskCompletionDeadlines.delete(entry.taskId);
        hiddenCompletedTrackedTaskIds.delete(entry.taskId);
        noticedCompletedTrackedTaskIds.delete(entry.taskId);
        continue;
      }

      if (
        !hiddenCompletedTrackedTaskIds.has(entry.taskId) &&
        !trackedTaskCompletionDeadlines.has(entry.taskId)
      ) {
        trackedTaskCompletionDeadlines.set(entry.taskId, now + TRACKED_TASK_COMPLETION_FLASH_MS);
      }

      if (!noticedCompletedTrackedTaskIds.has(entry.taskId)) {
        noticedCompletedTrackedTaskIds.add(entry.taskId);
        pushNotice(`Task complete: ${entry.task.title}.`, 3.2);
      }
    }

    for (const [taskId, deadline] of trackedTaskCompletionDeadlines) {
      if (deadline <= now) {
        trackedTaskCompletionDeadlines.delete(taskId);
        hiddenCompletedTrackedTaskIds.add(taskId);
        continue;
      }

      flashingTaskIds.add(taskId);
    }

    return {
      flashingTaskIds,
      hideCompletedTrackedTasks: true
    };
  }

  function getHudActionKind(copy = "") {
    const normalizedCopy = String(copy).toLowerCase();

    if (normalizedCopy.includes("leafage") || normalizedCopy.includes("tall grass")) {
      return "leafage";
    }

    if (
      normalizedCopy.includes("workbench") ||
      normalizedCopy.includes("campfire") ||
      normalizedCopy.includes("build") ||
      normalizedCopy.includes("craft")
    ) {
      return "build";
    }

    if (
      normalizedCopy.includes("talk") ||
      normalizedCopy.includes("fale") ||
      normalizedCopy.includes("[a / e]") ||
      TALK_ACTION_TERMS.some((term) => normalizedCopy.includes(term))
    ) {
      return "talk";
    }

    if (
      normalizedCopy.includes("water gun") ||
      normalizedCopy.includes("dry ground") ||
      normalizedCopy.includes("queued") ||
      normalizedCopy.includes("restore")
    ) {
      return "water";
    }

    return "neutral";
  }

  function syncHudActionKind(copy = "") {
    if (!hudCurrentActionElement) {
      return;
    }

    hudCurrentActionElement.dataset.actionKind = getHudActionKind(copy);
  }

  function formatTrackedRecipe(recipe) {
    if (!recipe) {
      return "";
    }

    const summary = recipe.ingredients
      .map((entry) => `${entry.amount} ${entry.name}`)
      .join(", ");

    return `Plan: ${recipe.name} | ${summary}`;
  }

  function renderStatus() {
    if (!statusElement) {
      return;
    }

    if (statusState.error) {
      statusElement.textContent = statusState.runtime;
      statusElement.dataset.error = "true";
      return;
    }

    const parts = [statusState.runtime];
    if (statusState.trackedRecipe) {
      parts.push(formatTrackedRecipe(statusState.trackedRecipe));
    }

    statusElement.textContent = parts.filter(Boolean).join(" | ");
    statusElement.dataset.error = "false";
  }

  function setStatus(message, isError = false) {
    statusState.runtime = message;
    statusState.error = isError;
    renderStatus();
  }

  function setTrackedRecipe(recipe) {
    statusState.trackedRecipe = recipe;
    renderStatus();
  }

  function getNoticeMessage() {
    return transientNotice.message;
  }

  function shouldPlayMissionCompleteSfx(message) {
    return String(message || "").trim().toLowerCase().startsWith("task complete:");
  }

  function canCreateMissionCompleteAudio() {
    const userAgent = globalThis.navigator?.userAgent || "";

    return typeof Audio === "function" && !userAgent.toLowerCase().includes("jsdom");
  }

  function getMissionCompleteAudio() {
    if (!canCreateMissionCompleteAudio()) {
      return null;
    }

    const availableAudio = missionCompleteAudioPool.find((audio) => {
      return audio.paused || audio.ended;
    });

    if (availableAudio) {
      return availableAudio;
    }

    const audio = new Audio(MISSION_COMPLETE_SFX_URL);
    audio.preload = "auto";
    missionCompleteAudioPool.push(audio);
    return audio;
  }

  function playMissionCompleteSfx() {
    const audio = getMissionCompleteAudio();
    if (!audio) {
      return;
    }

    audio.loop = false;
    audio.volume = MISSION_COMPLETE_SFX_VOLUME;

    try {
      audio.currentTime = 0;
    } catch {
      // Some browser audio objects disallow seeking before metadata is ready.
    }

    const playResult = audio.play?.();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }
  }

  function activateNotice(message, duration = 2.8) {
    transientNotice.message = message;
    transientNotice.timer = duration;

    if (shouldPlayMissionCompleteSfx(message)) {
      playMissionCompleteSfx();
    }
  }

  function pushNotice(message, duration = 2.8) {
    if (!message) {
      return;
    }

    if (transientNotice.timer <= 0) {
      activateNotice(message, duration);
      return;
    }

    if (transientNotice.message === message) {
      transientNotice.timer = Math.max(transientNotice.timer, duration);
      return;
    }

    transientNoticeQueue.push({ message, duration });
    if (transientNoticeQueue.length > 4) {
      transientNoticeQueue.shift();
    }
  }

  function updateTransientNotice(deltaTime) {
    if (transientNotice.timer <= 0) {
      transientNotice.timer = 0;
      if (transientNoticeQueue.length > 0) {
        const nextNotice = transientNoticeQueue.shift();
        activateNotice(nextNotice.message, nextNotice.duration);
      }
      return;
    }

    transientNotice.timer = Math.max(0, transientNotice.timer - deltaTime);
    if (transientNotice.timer === 0) {
      transientNotice.message = "";
      if (transientNoticeQueue.length > 0) {
        const nextNotice = transientNoticeQueue.shift();
        activateNotice(nextNotice.message, nextNotice.duration);
      }
    }
  }

  function syncInventoryUi(inventory) {
    if (!inventoryGridElement) {
      return;
    }

    const presentedItemIds = getInventoryPresentationOrder(inventory, inventoryOrder, itemDefs, {
      excludedRoles: SUPPLY_HUD_EXCLUDED_SLOT_ROLES
    });
    const visibleItemIds = presentedItemIds.slice(0, MAX_VISIBLE_INVENTORY_SLOTS);
    const emptySlotCount = Math.max(0, MAX_VISIBLE_INVENTORY_SLOTS - visibleItemIds.length);

    const filledSlotsHtml = visibleItemIds.map((itemId) => {
      const item = itemDefs[itemId];
      const count = inventory[itemId] || 0;
      const slotRole = getInventorySlotRole(item);

      return `
        <div
          class="inventory-slot"
          data-filled="true"
          data-empty="false"
          data-item-id="${escapeHtml(itemId)}"
          data-slot-role="${escapeHtml(slotRole)}"
          data-icon-kind="${INVENTORY_ITEM_IMAGES[itemId] ? "image" : "glyph"}"
        >
          <div
            class="inventory-slot__icon"
            style="--slot-color:${item.color}; --slot-ink:${item.ink}"
            aria-hidden="true"
          >
            ${renderInventorySlotIconHtml(itemId, item)}
          </div>
          ${renderInventoryCountHtml({ value: count })}
        </div>
      `;
    }).join("");

    const emptySlotsHtml = Array.from({ length: emptySlotCount }, () => `
      <div class="inventory-slot" data-filled="false" data-empty="true" aria-hidden="true">
        <div class="inventory-slot__icon inventory-slot__icon--empty"></div>
      </div>
    `).join("");

    const nextHtml = `${filledSlotsHtml}${emptySlotsHtml}`;

    if (uiCache.inventoryHtml === nextHtml) {
      return;
    }

    uiCache.inventoryHtml = nextHtml;
    inventoryGridElement.innerHTML = nextHtml;
  }

  function syncSkillsUi(skills, activeSkillId = null, storyState = null) {
    rememberStoryState(storyState);
    latestSkillsState = skills;
    latestActiveSkillId = activeSkillId;

    if (!skillsGridElement || !skillsPanelElement) {
      syncActiveCompanionHud(skills, activeSkillId);
      return;
    }

    const unlockedSkillIds = playerSkillOrder.filter((skillId) => skills[skillId]);
    skillsPanelElement.hidden = unlockedSkillIds.length === 0;

    const nextHtml = playerSkillOrder.map((skillId) => {
      const skill = playerSkillDefs[skillId];
      const unlocked = Boolean(skills[skillId]);
      const active = unlocked && skillId === activeSkillId;

      return `
        <div
          class="skill-slot"
          data-unlocked="${unlocked ? "true" : "false"}"
          data-active="${active ? "true" : "false"}"
        >
          <div
            class="skill-slot__icon"
            style="--slot-color:${skill.color}; --slot-ink:${skill.ink}"
            aria-hidden="true"
          >
            ${skill.glyph}
          </div>
          <span class="skill-slot__label">${unlocked ? skill.shortLabel : "Locked"}</span>
        </div>
      `;
    }).join("");

    skillsGridElement.innerHTML = nextHtml;
    syncActiveCompanionHud(skills, activeSkillId);
  }

  function renderMissionCards(storyState, inventory, nearbyPrompt = "") {
    rememberStoryState(storyState);
    refreshActiveCompanionHudFromCache();

    if (!missionsStackElement) {
      return;
    }

    if (questLog) {
      const nextHtml = questLog.renderLogHtml(storyState, getTrackedTaskRenderOptions(storyState));

      if (uiCache.missionsHtml === nextHtml) {
        return;
      }

      uiCache.missionsHtml = nextHtml;
      missionsStackElement.innerHTML = nextHtml;
      return;
    }

    const quest = getActiveQuest(storyState);
    const recipe = quest.recipeId ? placeholderRecipes[quest.recipeId] : null;
    const trackedRecipe = statusState.trackedRecipe;
    const leadProfile = quest.leadNpcId ? npcProfiles[quest.leadNpcId] : null;
    const controlCopy = trackedRecipe ?
      `Tracked: ${trackedRecipe.name}` :
      "Open the handbook with M to track plans and route hints.";
    const progressCopy = recipe ?
      formatRequirementSummary(recipe.ingredients, inventory) :
      buildQuestProgressCopy(getQuestProgressDescriptor(quest), inventory);
    const contextCopy = leadProfile ?
      `${leadProfile.summary} Prompt: ${nearbyPrompt || controlCopy}` :
      nearbyPrompt || controlCopy;

    const nextHtml = `
      <article class="mission-card">
        <div class="mission-card__eyebrow">${quest.act}</div>
        <div class="mission-card__title">${quest.title}</div>
        <div class="mission-card__copy">${quest.body} ${quest.storyBeat}</div>
        <div class="mission-card__meta">
          <span>Reward: ${quest.reward}</span>
          <span>${formatDifficulty(quest)}</span>
        </div>
      </article>
      <article class="mission-card">
        <div class="mission-card__eyebrow">${recipe ? "Plan" : "Progress"}</div>
        <div class="mission-card__title">${recipe ? recipe.title : "Onboarding"}</div>
        <div class="mission-card__copy">
          ${quest.onboarding} ${progressCopy ? `Progress: ${progressCopy}.` : ""}
        </div>
        <div class="mission-card__meta">
          <span>${quest.actionLabel}</span>
          <span>${quest.toolkitHint}</span>
        </div>
      </article>
      <article class="mission-card">
        <div class="mission-card__eyebrow">${leadProfile ? leadProfile.role : "Field Notes"}</div>
        <div class="mission-card__title">${leadProfile ? leadProfile.label : "Live Prompt"}</div>
        <div class="mission-card__copy">${contextCopy}</div>
        <div class="mission-card__meta">
          <span>${resourceHarvestPrompt}</span>
          <span>${interactPrompt}</span>
        </div>
      </article>
    `;

    if (uiCache.missionsHtml === nextHtml) {
      return;
    }

    uiCache.missionsHtml = nextHtml;
    missionsStackElement.innerHTML = nextHtml;
  }

  function getQuestChecklistItems(storyState, activeQuest, options = {}) {
    if (!activeQuest) {
      return [];
    }

    if (options.completed) {
      const labels = QUEST_CHECKLIST_LABELS[activeQuest.id] || [
        activeQuest.actionLabel || activeQuest.title
      ];

      return labels.map((label) => ({ label, done: true }));
    }

    if (activeQuest.id === "makingHabitats") {
      return [
        {
          label: "Use Hydro Jet on a dry object",
          done: Boolean(storyState.flags?.firstGrassRestored)
        },
        {
          label: "Find a restored habitat",
          done: uiCache.nearbyHabitats.length > 0
        },
        {
          label: "Discover the tall grass clue",
          done: Boolean(storyState.flags?.tallGrassDiscovered)
        }
      ];
    }

    const labels = QUEST_CHECKLIST_LABELS[activeQuest.id] || [
      activeQuest.actionLabel || activeQuest.title
    ];

    return labels.map((label) => ({ label, done: false }));
  }

  function renderHudChecklist(storyState, activeQuest, options = {}) {
    if (!hudChecklistElement) {
      return;
    }

    const items = getQuestChecklistItems(storyState, activeQuest, options);
    const nextHtml = items.map((item) => `
      <div class="hud-checklist__item" data-done="${item.done ? "true" : "false"}">
        <span class="hud-checklist__box" aria-hidden="true"></span>
        <span>${escapeHtml(item.label)}</span>
      </div>
    `).join("");

    if (uiCache.hudChecklist === nextHtml) {
      return;
    }

    uiCache.hudChecklist = nextHtml;
    hudChecklistElement.innerHTML = nextHtml;
    syncHudChecklistProgressPop();
    flashHudBoard();
  }

  function getHudChecklistProgressKey(item, itemIndex, match, occurrenceIndex, required) {
    const prefix = String(item.textContent || "")
      .slice(0, match.index)
      .replace(/\s+/g, " ")
      .trim();
    const objectiveType = item.dataset.objectiveType || "task";

    return `${objectiveType}:${itemIndex}:${required}:${occurrenceIndex}:${prefix}`;
  }

  function wrapHudChecklistProgressOccurrences(item, occurrenceIndexes) {
    if (!item || !occurrenceIndexes?.size) {
      return;
    }

    const documentRef = item.ownerDocument;
    const nodeFilter = documentRef?.defaultView?.NodeFilter;
    const walker = documentRef?.createTreeWalker?.(
      item,
      nodeFilter?.SHOW_TEXT || 4,
      {
        acceptNode(node) {
          if (node.parentElement?.classList?.contains("hud-checklist__progress")) {
            return nodeFilter?.FILTER_REJECT || 2;
          }

          return /\d+\/\d+/.test(node.nodeValue || "") ?
            (nodeFilter?.FILTER_ACCEPT || 1) :
            (nodeFilter?.FILTER_REJECT || 2);
        }
      }
    );

    if (!documentRef || !walker) {
      return;
    }

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    let occurrenceIndex = 0;
    for (const textNode of textNodes) {
      const text = textNode.nodeValue || "";
      const fragment = documentRef.createDocumentFragment();
      let lastIndex = 0;

      for (const match of text.matchAll(/(\d+\/\d+)/g)) {
        if (match.index > lastIndex) {
          fragment.append(documentRef.createTextNode(text.slice(lastIndex, match.index)));
        }

        if (occurrenceIndexes.has(occurrenceIndex)) {
          const progress = documentRef.createElement("span");
          progress.className = "hud-checklist__progress";
          progress.dataset.progressPop = "true";
          progress.textContent = match[1];
          fragment.append(progress);
        } else {
          fragment.append(documentRef.createTextNode(match[1]));
        }

        lastIndex = match.index + match[1].length;
        occurrenceIndex += 1;
      }

      if (lastIndex < text.length) {
        fragment.append(documentRef.createTextNode(text.slice(lastIndex)));
      }

      textNode.replaceWith(fragment);
    }
  }

  function syncHudChecklistProgressPop() {
    if (!hudChecklistElement) {
      return;
    }

    const visibleProgressKeys = new Set();
    const checklistItems = Array.from(hudChecklistElement.querySelectorAll(".hud-checklist__item"));

    checklistItems.forEach((item, itemIndex) => {
      const text = item.textContent || "";
      const progressOccurrencesToPop = new Set();
      let occurrenceIndex = 0;

      for (const match of text.matchAll(/(\d+)\/(\d+)/g)) {
        const current = Number(match[1]);
        const required = Number(match[2]);
        const progressKey = getHudChecklistProgressKey(
          item,
          itemIndex,
          match,
          occurrenceIndex,
          required
        );
        const previous = hudChecklistProgressValues.get(progressKey);

        if (previous !== undefined && current > previous) {
          progressOccurrencesToPop.add(occurrenceIndex);
        }

        hudChecklistProgressValues.set(progressKey, current);
        visibleProgressKeys.add(progressKey);
        occurrenceIndex += 1;
      }

      wrapHudChecklistProgressOccurrences(item, progressOccurrencesToPop);
    });

    for (const progressKey of hudChecklistProgressValues.keys()) {
      if (!visibleProgressKeys.has(progressKey)) {
        hudChecklistProgressValues.delete(progressKey);
      }
    }
  }

  function syncQuestFocus(storyState) {
    rememberStoryState(storyState);
    refreshActiveCompanionHudFromCache();

    if (!hudContextElement && !hudChecklistElement) {
      return;
    }

    if (questLog) {
      const activeQuest = questSystem.getActiveQuest();
      const activeQuestId = activeQuest?.id || null;
      const questChanged = activeQuestId && uiCache.hudFocusQuestId !== activeQuestId;
      const nextContext = questLog.renderActiveSummaryHtml();
      const nextChecklist = questLog.renderChecklistHtml(storyState, getTrackedTaskRenderOptions(storyState));

      if (questChanged) {
        replayHudBoardEntrance();
      }

      if (hudContextElement && uiCache.hudContext !== nextContext) {
        uiCache.hudContext = nextContext;
        hudContextElement.innerHTML = nextContext;
        if (!questChanged) {
          flashHudBoard();
        }
      }

      if (hudChecklistElement && uiCache.hudChecklist !== nextChecklist) {
        uiCache.hudChecklist = nextChecklist;
        hudChecklistElement.innerHTML = nextChecklist;
        syncHudChecklistProgressPop();
        if (!questChanged) {
          flashHudBoard();
        }
      }

      uiCache.hudFocusQuestId = activeQuestId;
      return;
    }

    const activeQuest = getActiveQuest(storyState);
    const activeQuestId = activeQuest?.id || null;
    const now = getHudTime();

    if (
      uiCache.hudFocusQuestId &&
      activeQuestId &&
      uiCache.hudFocusQuestId !== activeQuestId
    ) {
      recentCompletion.questId = uiCache.hudFocusQuestId;
      recentCompletion.until = now + 3000;
    }

    uiCache.hudFocusQuestId = activeQuestId || uiCache.hudFocusQuestId;

    const showingCompletion =
      recentCompletion.questId &&
      recentCompletion.until > now &&
      recentCompletion.questId !== activeQuestId;
    const displayQuest = showingCompletion ?
      {
        id: recentCompletion.questId,
        title: "Task complete",
        body: "The objective is resolved. The next signal is already active."
      } :
      activeQuest;
    const habitatCopy = uiCache.nearbyHabitats ?
      `Habitat: ${uiCache.nearbyHabitats}` :
      "";
    const questCopy = displayQuest ?
      `${displayQuest.title}. ${displayQuest.body}` :
      "";
    const nextContext = [questCopy, habitatCopy].filter(Boolean).join(" ");

    if (hudContextElement && uiCache.hudContext !== nextContext) {
      uiCache.hudContext = nextContext;
      hudContextElement.textContent = nextContext;
      flashHudBoard();
    }

    renderHudChecklist(storyState, displayQuest, {
      completed: showingCompletion
    });
  }

  function setNearbyHabitats(habitatLabels = []) {
    const safeHabitatLabels = Array.isArray(habitatLabels) ? habitatLabels : [];
    const nextValue = safeHabitatLabels.filter(Boolean).join(" • ");

    if (uiCache.nearbyHabitats === nextValue) {
      return;
    }

    uiCache.nearbyHabitats = nextValue;
  }

  function syncHudMeta(storyState, inventory, playerPosition = [0, 0, 0]) {
    rememberStoryState(storyState);
    refreshActiveCompanionHudFromCache();

    if (!hudMetaElement) {
      return;
    }

    const colonyStatus = createColonyStatusModel({
      storyState,
      inventory,
      playerSkills: latestSkillsState || {},
      activeMoveId: latestActiveSkillId
    });
    const colonyCache = createColonyCacheState({
      inventory,
      itemDefs
    });
    const nextText = [
      formatColonyStatusHudText(colonyStatus),
      formatColonyCacheHudText(colonyCache)
    ].filter(Boolean).join(" • ");

    if (uiCache.hudMeta === nextText) {
      return;
    }

    uiCache.hudMeta = nextText;
    hudMetaElement.textContent = nextText;
    hudMetaElement.dataset.colonyStatus = nextText ? "visible" : "hidden";
    flashHudBoard();
  }

  function syncHudInstructions(storyState, promptCopy = "", inputModalityState = null) {
    rememberStoryState(storyState);
    refreshActiveCompanionHudFromCache();

    if (!hudInstructionsElement) {
      return;
    }

    if (questSystem?.getActiveQuest) {
      const activeQuest = questSystem.getActiveQuest();
      const questGuide = getErrandQuestInstructionText(activeQuest);
      const nextText = promptCopy ||
        questGuide ||
        "Explore freely, restore habitats, and check in with helpers.";
      const questChanged = activeQuest?.id && uiCache.hudQuestId !== activeQuest.id;
      uiCache.hudQuestId = activeQuest?.id || uiCache.hudQuestId;
      syncHudActionKind(nextText);

      if (uiCache.hudInstructions === nextText) {
        if (questChanged) {
          replayHudBoardEntrance();
        }
        return;
      }

      uiCache.hudInstructions = nextText;
      hudInstructionsElement.textContent = nextText;
      if (questChanged) {
        replayHudBoardEntrance();
      } else {
        flashHudBoard();
      }
      return;
    }

    const activeQuest = getActiveQuest(storyState);
    const nextText = promptCopy ||
      HUD_GUIDE_BY_QUEST_ID[activeQuest?.id] ||
      resolveInitialHudGuide(inputModalityState);
    const questChanged = activeQuest?.id && uiCache.hudQuestId !== activeQuest.id;
    uiCache.hudQuestId = activeQuest?.id || uiCache.hudQuestId;
    syncHudActionKind(nextText);

    if (uiCache.hudInstructions === nextText) {
      if (questChanged) {
        replayHudBoardEntrance();
      }
      return;
    }

    uiCache.hudInstructions = nextText;
    hudInstructionsElement.textContent = nextText;
    if (questChanged) {
      replayHudBoardEntrance();
    } else {
      flashHudBoard();
    }
  }

  return {
    getNoticeMessage,
    pushNotice,
    renderMissionCards,
    renderStatus,
    setNearbyHabitats,
    setStatus,
    setTrackedRecipe,
    syncHudInstructions,
    syncHudMeta,
    syncQuestFocus,
    syncInventoryUi,
    syncSkillsUi,
    queueSupplyPickupFlyToSlot,
    updateTransientNotice
  };
}
