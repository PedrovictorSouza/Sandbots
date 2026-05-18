import { getErrandQuestInstructionText } from "../quest/errandQuestDesign.js";

export const HUD_PANEL_ID = Object.freeze({
  CURRENT_ACTION: "current-action",
  QUEST_TRACKER: "quest-tracker",
  COLONY_STATUS: "colony-status",
  INVENTORY_BELT: "inventory-belt",
  NOTIFICATIONS: "notifications",
  DEBUG: "debug"
});

export const HUD_PANEL_REGION = Object.freeze({
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  CENTER: "center",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  OVERLAY: "overlay"
});

export const HUD_PANEL_SOURCE = Object.freeze({
  IMMEDIATE_PROMPT: "immediate-prompt",
  QUEST_HUD_TEXT: "quest-hud-text",
  QUEST_GUIDANCE: "quest-guidance",
  INITIAL_GUIDE: "initial-guide",
  NONE: "none"
});

export const HUD_PANEL_CONTRACTS = Object.freeze([
  Object.freeze({
    id: HUD_PANEL_ID.CURRENT_ACTION,
    label: "Current Action",
    region: HUD_PANEL_REGION.BOTTOM_LEFT,
    priority: 10,
    consumes: Object.freeze(["nearbyPrompt", "activeQuest", "inputModality"]),
    mutates: Object.freeze([])
  }),
  Object.freeze({
    id: HUD_PANEL_ID.QUEST_TRACKER,
    label: "Quest Tracker",
    region: HUD_PANEL_REGION.TOP_LEFT,
    priority: 20,
    consumes: Object.freeze(["activeQuest", "trackedTasks", "storyState"]),
    mutates: Object.freeze([])
  }),
  Object.freeze({
    id: HUD_PANEL_ID.COLONY_STATUS,
    label: "Colony Status",
    region: HUD_PANEL_REGION.TOP_RIGHT,
    priority: 30,
    consumes: Object.freeze(["colonyStatus"]),
    mutates: Object.freeze([])
  }),
  Object.freeze({
    id: HUD_PANEL_ID.INVENTORY_BELT,
    label: "Inventory Belt",
    region: HUD_PANEL_REGION.BOTTOM_RIGHT,
    priority: 40,
    consumes: Object.freeze(["inventory", "inventoryOrder", "itemDefs"]),
    mutates: Object.freeze([])
  }),
  Object.freeze({
    id: HUD_PANEL_ID.NOTIFICATIONS,
    label: "Notifications",
    region: HUD_PANEL_REGION.CENTER,
    priority: 50,
    consumes: Object.freeze(["notices", "recentCompletion"]),
    mutates: Object.freeze([])
  }),
  Object.freeze({
    id: HUD_PANEL_ID.DEBUG,
    label: "Debug",
    region: HUD_PANEL_REGION.OVERLAY,
    priority: 100,
    consumes: Object.freeze(["debugState"]),
    mutates: Object.freeze([])
  })
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value) {
  return hasText(value) ? value.trim() : "";
}

export function listHudPanelContracts() {
  return HUD_PANEL_CONTRACTS;
}

export function getHudPanelContract(panelId) {
  return HUD_PANEL_CONTRACTS.find((panel) => panel.id === panelId) || null;
}

export function resolveCurrentActionPanelState({
  nearbyPrompt = "",
  activeQuest = null,
  initialGuide = ""
} = {}) {
  const prompt = normalizeText(nearbyPrompt);
  if (prompt) {
    return {
      id: HUD_PANEL_ID.CURRENT_ACTION,
      visible: true,
      source: HUD_PANEL_SOURCE.IMMEDIATE_PROMPT,
      text: prompt,
      activeQuestId: activeQuest?.id || null
    };
  }

  const questInstruction = normalizeText(getErrandQuestInstructionText(activeQuest));
  if (questInstruction) {
    const rawErrandHudText = normalizeText(activeQuest?.errandQuest?.hudText || "");
    return {
      id: HUD_PANEL_ID.CURRENT_ACTION,
      visible: true,
      source: rawErrandHudText === questInstruction ?
        HUD_PANEL_SOURCE.QUEST_HUD_TEXT :
        HUD_PANEL_SOURCE.QUEST_GUIDANCE,
      text: questInstruction,
      activeQuestId: activeQuest?.id || null
    };
  }

  const guide = normalizeText(initialGuide);
  return {
    id: HUD_PANEL_ID.CURRENT_ACTION,
    visible: Boolean(guide),
    source: guide ? HUD_PANEL_SOURCE.INITIAL_GUIDE : HUD_PANEL_SOURCE.NONE,
    text: guide,
    activeQuestId: null
  };
}

export function resolveQuestTrackerPanelState({
  activeQuest = null,
  trackedTasks = []
} = {}) {
  const safeTrackedTasks = Array.isArray(trackedTasks) ? trackedTasks : [];
  const visible = Boolean(activeQuest?.id || safeTrackedTasks.length);

  return {
    id: HUD_PANEL_ID.QUEST_TRACKER,
    visible,
    activeQuestId: activeQuest?.id || null,
    title: activeQuest?.title || "",
    trackedTaskCount: safeTrackedTasks.length,
    trackedTaskIds: safeTrackedTasks
      .map((task) => task?.id)
      .filter(Boolean)
  };
}

export function resolveColonyStatusPanelState({
  colonyStatus = null
} = {}) {
  const systems = Array.isArray(colonyStatus?.systems) ?
    colonyStatus.systems.map((system) => Object.freeze({
      id: system?.id || null,
      label: system?.label || "",
      state: system?.state || "",
      detail: system?.detail || "",
      value: system?.value ?? null
    })) :
    [];

  return {
    id: HUD_PANEL_ID.COLONY_STATUS,
    visible: systems.length > 0,
    systemCount: systems.length,
    activeBot: colonyStatus?.activeBot || null,
    activeTool: colonyStatus?.activeTool || null,
    systems: Object.freeze(systems)
  };
}

export function resolveHudPanelStates({
  nearbyPrompt = "",
  activeQuest = null,
  initialGuide = "",
  trackedTasks = [],
  colonyStatus = null
} = {}) {
  return Object.freeze({
    [HUD_PANEL_ID.CURRENT_ACTION]: Object.freeze(resolveCurrentActionPanelState({
      nearbyPrompt,
      activeQuest,
      initialGuide
    })),
    [HUD_PANEL_ID.QUEST_TRACKER]: Object.freeze(resolveQuestTrackerPanelState({
      activeQuest,
      trackedTasks
    })),
    [HUD_PANEL_ID.COLONY_STATUS]: Object.freeze(resolveColonyStatusPanelState({
      colonyStatus
    }))
  });
}

export function validateHudPanelContracts({
  contracts = HUD_PANEL_CONTRACTS,
  regions = HUD_PANEL_REGION
} = {}) {
  const errors = [];
  const ids = new Set();
  const regionValues = new Set(Object.values(regions));

  for (const contract of contracts || []) {
    if (!contract?.id) {
      errors.push({ code: "missing-panel-id", panelId: null });
      continue;
    }

    if (ids.has(contract.id)) {
      errors.push({ code: "duplicate-panel-id", panelId: contract.id });
    }
    ids.add(contract.id);

    if (!contract.label) {
      errors.push({ code: "missing-panel-label", panelId: contract.id });
    }

    if (!regionValues.has(contract.region)) {
      errors.push({ code: "invalid-panel-region", panelId: contract.id });
    }

    if (!Array.isArray(contract.consumes)) {
      errors.push({ code: "missing-panel-consumes", panelId: contract.id });
    }

    if (!Array.isArray(contract.mutates)) {
      errors.push({ code: "missing-panel-mutates", panelId: contract.id });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
