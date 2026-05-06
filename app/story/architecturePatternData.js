const REQUIRED_REFERENCE_FIELDS = Object.freeze([
  "id",
  "system",
  "pattern",
  "owns",
  "mustNotOwn"
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const ARCHITECTURE_SYSTEM_IDS = Object.freeze({
  INPUT_SYSTEM: "input-system",
  SCENARIO_SYSTEM: "scenario-system",
  QUEST_STATE_MACHINE: "quest-state-machine",
  STATE_FACTORY: "state-factory",
  FLYWEIGHT_CATALOGS: "flyweight-catalogs",
  FACTORY_BUILDER: "factory-builder",
  STRATEGY: "strategy",
  OBSERVER_EVENT_QUEUE: "observer-event-queue",
  REPOSITORY_REGISTRY: "repository-registry",
  UI_PRESENTER: "ui-presenter",
  RENDERING_SYSTEM: "rendering-system"
});

const ARCHITECTURE_PATTERN_REFERENCES = deepFreeze([
  {
    id: ARCHITECTURE_SYSTEM_IDS.INPUT_SYSTEM,
    system: "Input System",
    pattern: "Command / Intent Adapter",
    owningFiles: [
      "input/gameInputController.js",
      "input/gameInputBindings.js",
      "app/runtime/gamepadHarvestPolicy.js"
    ],
    owns: "Keyboard, gamepad and browser input converted into gameplay intents.",
    mustNotOwn: [
      "quest state",
      "story flags",
      "recipes",
      "rendering decisions",
      "route gates",
      "macro-biome completion tokens"
    ],
    highRiskAlias: "input"
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.SCENARIO_SYSTEM,
    system: "Scenario System",
    pattern: "State Machine / Gatekeeper",
    owningFiles: [
      "gameFlow.js",
      "app/scene/createSceneFlowRuntime.js",
      "app/scene/gameScenes.js",
      "app/scene/sceneDirector.js"
    ],
    owns: "Macro-biome entry, route gates, act transitions and scenario setup.",
    mustNotOwn: ["low-level input polling", "input handlers", "render drawing"],
    gateDataSources: ["macro-biome completion tokens", "scenario state"],
    usesBiomeTokenDataForGates: true
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.QUEST_STATE_MACHINE,
    system: "Quest State Machine",
    pattern: "State Machine",
    owningFiles: [
      "app/quest/createQuestSystem.js",
      "app/quest/questData.js",
      "app/quest/questFlowGuards.js",
      "story/progression.js",
      "app/story/finalReadinessData.js"
    ],
    owns: "Request availability, progress, completion, rewards and next-step guidance.",
    mustNotOwn: ["camera", "mesh setup", "direct input handling"]
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.STATE_FACTORY,
    system: "State Factory",
    pattern: "Factory",
    owningFiles: [
      "story/progression.js",
      "app/session/createEmptySession.js",
      "app/session/initializeGameplatState.js",
      "app/runtime/runtimeFlags.js"
    ],
    owns: "Default story, runtime and session state creation.",
    mustNotOwn: ["quest progression decisions", "camera", "render drawing"]
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.FLYWEIGHT_CATALOGS,
    system: "Flyweight Catalogs",
    pattern: "Flyweight",
    owningFiles: [
      "gameplayContent.js",
      "app/story/biomeProgressionData.js",
      "app/story/characterArcData.js",
      "app/story/currentPlaceholderCatalogData.js",
      "app/story/currentQuestTaxonomyData.js",
      "app/story/currentRecipeTaxonomyData.js",
      "app/story/currentRegionMacroBiomeMapData.js",
      "app/story/placeholderPolicyData.js",
      "app/story/recipeItemTaxonomyData.js",
      "app/story/requestTaxonomyData.js",
      "app/sandbox/habitatData.js",
      "app/sandbox/moveData.js"
    ],
    owns: "Immutable data for biomes, character arcs, requests, recipes, habitats, moves and placeholders.",
    mustNotOwn: ["runtime mutation"],
    requiresImmutableData: true,
    contentFirst: true
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.FACTORY_BUILDER,
    system: "Factory / Builder",
    pattern: "Factory / Builder",
    owningFiles: [
      "characterFactory.js",
      "app/session/buildSceneAssembly.js",
      "app/session/buildElevatedTerrain.js",
      "app/session/buildWorldLayout.js",
      "app/session/buildSessionResources.js",
      "app/session/createEmptySession.js"
    ],
    owns: "Creation of placeables, repaired structures, habitats, NPC instances and UI view models.",
    mustNotOwn: ["global orchestration"]
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.STRATEGY,
    system: "Strategy",
    pattern: "Strategy",
    owningFiles: [
      "app/runtime/renderFrameStrategies.js",
      "app/runtime/gamepadHarvestPolicy.js",
      "rendering/renderCulling.js",
      "world/gameplayInteractions.js"
    ],
    owns: "Variants of traversal, powered moves, crafting processors and repair handlers.",
    mustNotOwn: ["data catalog ownership"]
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.OBSERVER_EVENT_QUEUE,
    system: "Observer / Event Queue",
    pattern: "Observer",
    owningFiles: [
      "app/story/createStoryBeatSystem.js",
      "app/runtime/frameSnapshotController.js",
      "app/ui/gameHudController.js"
    ],
    owns: "Quest, UI and story reactions to gameplay events without direct coupling.",
    mustNotOwn: ["persistent canonical state by itself"]
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.REPOSITORY_REGISTRY,
    system: "Repository / Registry",
    pattern: "Registry",
    owningFiles: [
      "app/story/currentQuestTaxonomyData.js",
      "app/story/currentRecipeTaxonomyData.js",
      "app/story/currentPlaceholderCatalogData.js",
      "app/story/currentRegionMacroBiomeMapData.js",
      "pokedexEntries.js",
      "pokedexRequests.js"
    ],
    owns: "Stable lookup by ids across catalogs.",
    mustNotOwn: ["business rules that belong to quest or scenario systems"]
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.UI_PRESENTER,
    system: "UI Presenter",
    pattern: "Presenter",
    owningFiles: [
      "app/ui/createQuestLog.js",
      "app/ui/gameHudController.js",
      "app/ui/gameplayDialogueController.js",
      "app/ui/gameplayHudRuntime.js",
      "app/ui/inventoryPresentation.js",
      "app/ui/worldSpeechController.js"
    ],
    owns: "HUD, request log, codex and feedback copy derived from state.",
    mustNotOwn: [
      "gameplay rules",
      "progression decisions",
      "quest state mutation",
      "completion rewards",
      "route gates"
    ],
    readOnlyState: true
  },
  {
    id: ARCHITECTURE_SYSTEM_IDS.RENDERING_SYSTEM,
    system: "Rendering System",
    pattern: "Renderer",
    owningFiles: [
      "rendering/worldRenderer.js",
      "rendering/worldAssets.js",
      "rendering/renderCulling.js",
      "app/runtime/renderFrameController.js",
      "app/runtime/renderFrameStrategies.js"
    ],
    owns: "Drawing world, characters, UI overlays and frame output.",
    mustNotOwn: ["story progression", "input policy", "quest rewards"],
    highRiskAlias: "render-frame"
  }
]);

const HIGH_RISK_ARCHITECTURE_SYSTEM_IDS = Object.freeze([
  "camera",
  "render-frame",
  "stage",
  "input",
  "scene-flow",
  "runtime-boot",
  "game-loop"
]);

const ARCHITECTURE_HUB_RISK_MODULES = deepFreeze([
  {
    file: "app/bootstrap/createApplicationRuntime.js",
    severity: "high",
    fanIn: 1,
    fanOut: 33
  },
  {
    file: "actTwoSceneConfig.js",
    severity: "medium",
    fanIn: 10,
    fanOut: 0
  },
  {
    file: "app/quest/questData.js",
    severity: "medium",
    fanIn: 6,
    fanOut: 0
  },
  {
    file: "app/runtime/createEngineRuntime.js",
    severity: "medium",
    fanIn: 1,
    fanOut: 8
  },
  {
    file: "app/runtime/createUiRuntime.js",
    severity: "medium",
    fanIn: 1,
    fanOut: 15
  },
  {
    file: "app/runtime/gameLoop.js",
    severity: "medium",
    fanIn: 1,
    fanOut: 12
  },
  {
    file: "app/scene/createSceneFlowRuntime.js",
    severity: "medium",
    fanIn: 1,
    fanOut: 11
  },
  {
    file: "gameplayContent.js",
    severity: "medium",
    fanIn: 14,
    fanOut: 2
  },
  {
    file: "rendering/worldAssets.js",
    severity: "medium",
    fanIn: 9,
    fanOut: 0
  },
  {
    file: "world/islandWorld.js",
    severity: "medium",
    fanIn: 7,
    fanOut: 3
  }
]);

export function listArchitecturePatternReferences() {
  return ARCHITECTURE_PATTERN_REFERENCES;
}

export function getArchitecturePatternBySystemId(systemId) {
  return ARCHITECTURE_PATTERN_REFERENCES.find((reference) => reference.id === systemId) || null;
}

export function getArchitectureOwningFilesBySystemId(systemId) {
  return getArchitecturePatternBySystemId(systemId)?.owningFiles || [];
}

export function listArchitectureHubRiskModules() {
  return ARCHITECTURE_HUB_RISK_MODULES;
}

export function listHighRiskArchitectureSystemIds() {
  return HIGH_RISK_ARCHITECTURE_SYSTEM_IDS;
}

export function isHighRiskArchitectureSystem(systemId) {
  return HIGH_RISK_ARCHITECTURE_SYSTEM_IDS.includes(systemId);
}

export function getArchitecturePatternGaps(
  references = ARCHITECTURE_PATTERN_REFERENCES
) {
  return references
    .map((reference) => {
      const missing = REQUIRED_REFERENCE_FIELDS.filter((field) => {
        const value = reference[field];
        return Array.isArray(value) ? value.length === 0 : !value;
      });

      return {
        id: reference.id || "unknown",
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}
