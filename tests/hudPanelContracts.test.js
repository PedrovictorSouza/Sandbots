import { describe, expect, it } from "vitest";
import {
  getHudPanelContract,
  HUD_PANEL_CONTRACTS,
  HUD_PANEL_ID,
  HUD_PANEL_REGION,
  HUD_PANEL_SOURCE,
  listHudPanelContracts,
  resolveColonyStatusPanelState,
  resolveCurrentActionPanelState,
  resolveHudPanelStates,
  resolveQuestTrackerPanelState,
  validateHudPanelContracts
} from "../app/ui/hudPanelContracts.js";

describe("hud panel contracts", () => {
  it("declares small HUD panels with explicit state inputs and no mutation ownership", () => {
    expect(listHudPanelContracts().map((panel) => panel.id)).toEqual([
      HUD_PANEL_ID.CURRENT_ACTION,
      HUD_PANEL_ID.QUEST_TRACKER,
      HUD_PANEL_ID.COLONY_STATUS,
      HUD_PANEL_ID.INVENTORY_BELT,
      HUD_PANEL_ID.NOTIFICATIONS,
      HUD_PANEL_ID.DEBUG
    ]);

    expect(getHudPanelContract(HUD_PANEL_ID.CURRENT_ACTION)).toMatchObject({
      label: "Current Action",
      region: HUD_PANEL_REGION.BOTTOM_LEFT,
      consumes: ["nearbyPrompt", "activeQuest", "inputModality"],
      mutates: []
    });
    expect(getHudPanelContract(HUD_PANEL_ID.QUEST_TRACKER)).toMatchObject({
      label: "Quest Tracker",
      region: HUD_PANEL_REGION.TOP_LEFT,
      consumes: ["activeQuest", "trackedTasks", "storyState"],
      mutates: []
    });
  });

  it("resolves current action from immediate prompt before quest text", () => {
    expect(resolveCurrentActionPanelState({
      nearbyPrompt: "Enter Restore",
      activeQuest: {
        id: "water-dry-grass",
        title: "Water dry grass!",
        guidance: "Use Hydro Jet."
      }
    })).toEqual({
      id: HUD_PANEL_ID.CURRENT_ACTION,
      visible: true,
      source: HUD_PANEL_SOURCE.IMMEDIATE_PROMPT,
      text: "Enter Restore",
      activeQuestId: "water-dry-grass"
    });
  });

  it("uses errand quest HUD text before generic guidance when it adds new guidance", () => {
    expect(resolveCurrentActionPanelState({
      activeQuest: {
        id: "gather-first-supplies",
        title: "Hydro wake route",
        description: "Bring Hydro Bot back online.",
        guidance: "Follow Chopper's marker.",
        errandQuest: {
          hudText: "Wake up Hydro Bot"
        }
      }
    })).toMatchObject({
      visible: true,
      source: HUD_PANEL_SOURCE.QUEST_HUD_TEXT,
      text: "Wake up Hydro Bot",
      activeQuestId: "gather-first-supplies"
    });
  });

  it("does not repeat the active quest title as current-action copy", () => {
    expect(resolveCurrentActionPanelState({
      activeQuest: {
        id: "gather-first-supplies",
        title: "Wake up Hydro Bot",
        description: "Bring Hydro Bot back online.",
        guidance: "Follow Chopper's marker to Hydro Bot, then interact when the prompt appears.",
        errandQuest: {
          hudText: "Wake up Hydro Bot"
        }
      }
    })).toMatchObject({
      visible: true,
      source: HUD_PANEL_SOURCE.QUEST_GUIDANCE,
      text: "Follow Chopper's marker to Hydro Bot, then interact when the prompt appears.",
      activeQuestId: "gather-first-supplies"
    });
  });

  it("falls back to guidance, then initial guide, without repeating title as copy", () => {
    expect(resolveCurrentActionPanelState({
      activeQuest: {
        id: "water-dry-grass",
        title: "Water dry grass!",
        guidance: "Restore one nearby patch."
      }
    })).toMatchObject({
      source: HUD_PANEL_SOURCE.QUEST_GUIDANCE,
      text: "Restore one nearby patch."
    });

    expect(resolveCurrentActionPanelState({
      initialGuide: "Use WASD to reach Chopper."
    })).toEqual({
      id: HUD_PANEL_ID.CURRENT_ACTION,
      visible: true,
      source: HUD_PANEL_SOURCE.INITIAL_GUIDE,
      text: "Use WASD to reach Chopper.",
      activeQuestId: null
    });
  });

  it("resolves quest tracker visibility from active quest or tracked tasks", () => {
    expect(resolveQuestTrackerPanelState()).toMatchObject({
      id: HUD_PANEL_ID.QUEST_TRACKER,
      visible: false,
      activeQuestId: null,
      trackedTaskCount: 0
    });

    expect(resolveQuestTrackerPanelState({
      activeQuest: {
        id: "water-dry-grass",
        title: "Water dry grass!"
      },
      trackedTasks: [{ id: "making-habitats" }]
    })).toEqual({
      id: HUD_PANEL_ID.QUEST_TRACKER,
      visible: true,
      activeQuestId: "water-dry-grass",
      title: "Water dry grass!",
      trackedTaskCount: 1,
      trackedTaskIds: ["making-habitats"]
    });
  });

  it("resolves colony status from system state instead of quest state", () => {
    expect(resolveColonyStatusPanelState()).toMatchObject({
      id: HUD_PANEL_ID.COLONY_STATUS,
      visible: false,
      systemCount: 0,
      activeBot: null,
      activeTool: null,
      systems: []
    });

    const state = resolveColonyStatusPanelState({
      colonyStatus: {
        activeBot: "Hydro Bot",
        activeTool: "Hydro Jet",
        systems: [
          {
            id: "water",
            label: "Water",
            state: "active",
            detail: "Hydro Jet selected.",
            value: null
          }
        ]
      }
    });

    expect(state).toMatchObject({
      id: HUD_PANEL_ID.COLONY_STATUS,
      visible: true,
      systemCount: 1,
      activeBot: "Hydro Bot",
      activeTool: "Hydro Jet"
    });
    expect(state.systems).toEqual([
      {
        id: "water",
        label: "Water",
        state: "active",
        detail: "Hydro Jet selected.",
        value: null
      }
    ]);
    expect(Object.isFrozen(state.systems)).toBe(true);
  });

  it("creates a small panel state map for the first extracted panels", () => {
    const states = resolveHudPanelStates({
      nearbyPrompt: "E Interact",
      activeQuest: {
        id: "wake-guide",
        title: "Talk to Chopper"
      },
      trackedTasks: [{ id: "workbench-campfire" }],
      colonyStatus: {
        systems: [{ id: "power", label: "Power", state: "offline", detail: "No colony power source." }]
      }
    });

    expect(Object.keys(states)).toEqual([
      HUD_PANEL_ID.CURRENT_ACTION,
      HUD_PANEL_ID.QUEST_TRACKER,
      HUD_PANEL_ID.COLONY_STATUS
    ]);
    expect(states[HUD_PANEL_ID.CURRENT_ACTION]).toMatchObject({
      text: "E Interact"
    });
    expect(states[HUD_PANEL_ID.QUEST_TRACKER]).toMatchObject({
      activeQuestId: "wake-guide",
      trackedTaskIds: ["workbench-campfire"]
    });
    expect(states[HUD_PANEL_ID.COLONY_STATUS]).toMatchObject({
      visible: true,
      systemCount: 1
    });
  });

  it("validates HUD panel contracts", () => {
    expect(validateHudPanelContracts()).toEqual({
      valid: true,
      errors: []
    });

    expect(validateHudPanelContracts({
      contracts: [
        HUD_PANEL_CONTRACTS[0],
        {
          ...HUD_PANEL_CONTRACTS[0],
          label: "",
          region: "wrong"
        },
        {
          id: "custom-panel",
          label: "Custom",
          region: HUD_PANEL_REGION.TOP_LEFT
        }
      ]
    }).errors).toEqual([
      { code: "duplicate-panel-id", panelId: HUD_PANEL_ID.CURRENT_ACTION },
      { code: "missing-panel-label", panelId: HUD_PANEL_ID.CURRENT_ACTION },
      { code: "invalid-panel-region", panelId: HUD_PANEL_ID.CURRENT_ACTION },
      { code: "missing-panel-consumes", panelId: "custom-panel" },
      { code: "missing-panel-mutates", panelId: "custom-panel" }
    ]);
  });
});
