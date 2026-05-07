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

const ACTIVE_COMPANION_THUMBNAILS = Object.freeze({
  squirtle: new URL("./images/Robot-1-thumb.png", import.meta.url).href,
  bulbasaur: new URL("./images/Robot-2-thumb.png", import.meta.url).href
});
const ACTIVE_COMPANION_THUMBNAIL_ORDER = Object.freeze(["squirtle", "bulbasaur"]);
const INVENTORY_ITEM_IMAGES = Object.freeze({
  wood: new URL("../../Objects/wood.png", import.meta.url).href
});
const MISSION_COMPLETE_SFX_URL = new URL("../soundFx/mission-complete.mp3", import.meta.url).href;
const MISSION_COMPLETE_SFX_VOLUME = 0.72;

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
  initialStatus = "Inicializando cena..."
}) {
  const MAX_VISIBLE_INVENTORY_SLOTS = 5;
  const TRACKED_TASK_COMPLETION_FLASH_MS = 3000;
  const INITIAL_GAMEPLAY_GUIDE =
    "Use WASD ou o analogico esquerdo para falar com Chopper. Ele te orientara no que fazer.";
  const HUD_GUIDE_BY_QUEST_ID = Object.freeze({
    findPokemon: "Fale com Squirtle",
    makingHabitats: "Making habitats: arrange plantas, pedras e objetos para criar habitats."
  });
  const QUEST_CHECKLIST_LABELS = Object.freeze({
    meetTangrowth: ["Falar com Chopper"],
    findPokemon: ["Falar com Squirtle"],
    makingHabitats: [
      "Usar Water Gun em um objeto seco",
      "Encontrar um habitat restaurado",
      "Observar a pista no Pokedex"
    ]
  });
  const statusState = {
    runtime: initialStatus,
    error: false,
    trackedRecipe: null
  };
  const transientNotice = {
    message: "",
    timer: 0
  };
  const missionCompleteAudioPool = [];
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

  function renderRobotThumbnailImageHtml(companionId, variant) {
    const normalizedCompanionId = escapeHtml(companionId || "unknown");
    const thumbnailUrl = ACTIVE_COMPANION_THUMBNAILS[companionId] || ACTIVE_COMPANION_THUMBNAILS.squirtle;

    return `
      <span class="active-companion-hud__portrait active-companion-hud__portrait--${variant}" aria-hidden="true">
        <img
          class="active-companion-hud__portrait-image"
          src="${escapeHtml(thumbnailUrl)}"
          alt=""
          data-companion-id="${normalizedCompanionId}"
          loading="eager"
          decoding="async"
        >
      </span>
    `;
  }

  function renderRobotThumbnailHtml(companionId) {
    const secondaryCompanionId =
      ACTIVE_COMPANION_THUMBNAIL_ORDER.find((candidateCompanionId) => candidateCompanionId !== companionId) ||
      "squirtle";

    return `
      <span class="active-companion-hud__portraits" aria-hidden="true">
        ${renderRobotThumbnailImageHtml(companionId, "primary")}
        ${renderRobotThumbnailImageHtml(secondaryCompanionId, "secondary")}
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
      `${activeAbility.companionName}: ${activeAbility.label} selecionado${activeGuidance ? `. ${activeGuidance}` : ""}`
    );

    const nextHtml = `
      ${renderRobotThumbnailHtml(activeAbility.companionId)}
      <span class="active-companion-hud__text">
        <span class="active-companion-hud__move">${escapeHtml(skill.shortLabel || activeAbility.label)}</span>
        <span class="active-companion-hud__name">${escapeHtml(activeAbility.companionName)}</span>
        ${activeGuidance ? `<span class="active-companion-hud__hint">${escapeHtml(activeGuidance)}</span>` : ""}
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
      normalizedCopy.includes("chopper") ||
      normalizedCopy.includes("bulbasaur")
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

    return `Receita: ${recipe.name} | ${summary}`;
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

  function pushNotice(message, duration = 2.8) {
    transientNotice.message = message;
    transientNotice.timer = duration;

    if (shouldPlayMissionCompleteSfx(message)) {
      playMissionCompleteSfx();
    }
  }

  function updateTransientNotice(deltaTime) {
    if (transientNotice.timer <= 0) {
      transientNotice.timer = 0;
      return;
    }

    transientNotice.timer = Math.max(0, transientNotice.timer - deltaTime);
    if (transientNotice.timer === 0) {
      transientNotice.message = "";
    }
  }

  function syncInventoryUi(inventory) {
    if (!inventoryGridElement) {
      return;
    }

    const presentedItemIds = getInventoryPresentationOrder(inventory, inventoryOrder, itemDefs);
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
          <span class="inventory-count">${count}</span>
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
      `Rastreada: ${trackedRecipe.name}` :
      "Abra o handbook com M para rastrear receitas e consultar rotas.";
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
          <span>Recompensa: ${quest.reward}</span>
          <span>${formatDifficulty(quest)}</span>
        </div>
      </article>
      <article class="mission-card">
        <div class="mission-card__eyebrow">${recipe ? "Cadencia" : "Progressao"}</div>
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
          label: "Usar Water Gun em um objeto seco",
          done: Boolean(storyState.flags?.firstGrassRestored)
        },
        {
          label: "Encontrar um habitat restaurado",
          done: uiCache.nearbyHabitats.length > 0
        },
        {
          label: "Descobrir pista de tall grass",
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
        title: "Task concluida",
        body: "O objetivo foi resolvido. O proximo aviso ja esta ativo."
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
    const nextValue = habitatLabels.filter(Boolean).join(" • ");

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

    const nextText = "";

    if (uiCache.hudMeta === nextText) {
      return;
    }

    uiCache.hudMeta = nextText;
    hudMetaElement.textContent = nextText;
    flashHudBoard();
  }

  function syncHudInstructions(storyState, promptCopy = "") {
    rememberStoryState(storyState);
    refreshActiveCompanionHudFromCache();

    if (!hudInstructionsElement) {
      return;
    }

    if (questSystem?.getActiveQuest) {
      const activeQuest = questSystem.getActiveQuest();
      const nextText = promptCopy ||
        activeQuest?.guidance ||
        activeQuest?.description ||
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
    const nextText = promptCopy || HUD_GUIDE_BY_QUEST_ID[activeQuest?.id] || INITIAL_GAMEPLAY_GUIDE;
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
    updateTransientNotice
  };
}
