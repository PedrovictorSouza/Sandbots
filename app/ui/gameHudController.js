import { createQuestLog } from "./createQuestLog.js";

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
  inventoryOrder,
  itemDefs,
  playerSkillDefs,
  playerSkillOrder,
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
  const uiCache = {
    inventoryHtml: "",
    missionsHtml: "",
    hudContext: "",
    hudChecklist: "",
    hudMeta: "",
    hudInstructions: "",
    nearbyHabitats: "",
    hudFocusQuestId: null,
    hudQuestId: null
  };
  const recentCompletion = {
    questId: null,
    until: 0
  };
  const inventorySlotState = {
    collectedOrder: []
  };
  const hudBoardElement = hudInstructionsElement?.closest?.(".hud") || hudMetaElement?.closest?.(".hud") || null;
  let hudBoardFlashTimeout = 0;
  let hudBoardEntranceVariant = false;
  const questLog = questSystem ? createQuestLog({ questSystem }) : null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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

  function pushNotice(message, duration = 2.8) {
    transientNotice.message = message;
    transientNotice.timer = duration;
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

    inventorySlotState.collectedOrder = inventorySlotState.collectedOrder.filter(
      (itemId) => (inventory[itemId] || 0) > 0
    );

    for (const itemId of inventoryOrder) {
      if ((inventory[itemId] || 0) <= 0) {
        continue;
      }

      if (!inventorySlotState.collectedOrder.includes(itemId)) {
        inventorySlotState.collectedOrder.push(itemId);
      }
    }

    const visibleItemIds = inventorySlotState.collectedOrder.slice(0, MAX_VISIBLE_INVENTORY_SLOTS);
    const emptySlotCount = Math.max(0, MAX_VISIBLE_INVENTORY_SLOTS - visibleItemIds.length);

    const filledSlotsHtml = visibleItemIds.map((itemId) => {
      const item = itemDefs[itemId];
      const count = inventory[itemId] || 0;

      return `
        <div class="inventory-slot" data-filled="true" data-empty="false">
          <div
            class="inventory-slot__icon"
            style="--slot-color:${item.color}; --slot-ink:${item.ink}"
            aria-hidden="true"
          >
            ${item.glyph}
          </div>
          <span class="inventory-slot__label">${item.shortLabel}</span>
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

  function syncSkillsUi(skills) {
    if (!skillsGridElement || !skillsPanelElement) {
      return;
    }

    const unlockedSkillIds = playerSkillOrder.filter((skillId) => skills[skillId]);
    skillsPanelElement.hidden = unlockedSkillIds.length === 0;

    const nextHtml = playerSkillOrder.map((skillId) => {
      const skill = playerSkillDefs[skillId];
      const unlocked = Boolean(skills[skillId]);

      return `
        <div class="skill-slot" data-unlocked="${unlocked ? "true" : "false"}">
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
  }

  function renderMissionCards(storyState, inventory, nearbyPrompt = "") {
    if (!missionsStackElement) {
      return;
    }

    if (questLog) {
      const nextHtml = questLog.renderLogHtml();

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
    flashHudBoard();
  }

  function syncQuestFocus(storyState) {
    if (!hudContextElement && !hudChecklistElement) {
      return;
    }

    if (questLog) {
      const activeQuest = questSystem.getActiveQuest();
      const activeQuestId = activeQuest?.id || null;
      const questChanged = activeQuestId && uiCache.hudFocusQuestId !== activeQuestId;
      const nextContext = questLog.renderActiveSummaryHtml();
      const nextChecklist = questLog.renderChecklistHtml();

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
    if (!hudInstructionsElement) {
      return;
    }

    if (questSystem?.getActiveQuest) {
      const activeQuest = questSystem.getActiveQuest();
      const nextText = activeQuest ?
        activeQuest.description :
        "Explore freely, restore habitats, and check in with helpers.";
      const questChanged = activeQuest?.id && uiCache.hudQuestId !== activeQuest.id;
      uiCache.hudQuestId = activeQuest?.id || uiCache.hudQuestId;

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
    const nextText = HUD_GUIDE_BY_QUEST_ID[activeQuest?.id] || INITIAL_GAMEPLAY_GUIDE;
    const questChanged = activeQuest?.id && uiCache.hudQuestId !== activeQuest.id;
    uiCache.hudQuestId = activeQuest?.id || uiCache.hudQuestId;

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
