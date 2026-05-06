import { describe, expect, it } from "vitest";
import {
  getArchitecturePatternBySystemId,
  getArchitecturePatternGaps,
  getArchitectureOwningFilesBySystemId,
  isHighRiskArchitectureSystem,
  listArchitectureHubRiskModules,
  listArchitecturePatternReferences,
  listHighRiskArchitectureSystemIds
} from "../app/story/architecturePatternData.js";

describe("architecture pattern data", () => {
  it("codifies every documented architecture system as immutable reference data", () => {
    const systems = listArchitecturePatternReferences();

    expect(systems.map((system) => system.id)).toEqual([
      "input-system",
      "scenario-system",
      "quest-state-machine",
      "state-factory",
      "flyweight-catalogs",
      "factory-builder",
      "strategy",
      "observer-event-queue",
      "repository-registry",
      "ui-presenter",
      "rendering-system"
    ]);
    expect(Object.isFrozen(systems)).toBe(true);
    expect(Object.isFrozen(systems[0])).toBe(true);
    expect(getArchitecturePatternGaps()).toEqual([]);
  });

  it("keeps input ownership separate from quest, recipe and rendering rules", () => {
    expect(getArchitecturePatternBySystemId("input-system")).toMatchObject({
      pattern: "Command / Intent Adapter",
      owns: expect.stringContaining("gameplay intents"),
      mustNotOwn: expect.arrayContaining([
        "quest state",
        "story flags",
        "recipes",
        "rendering decisions",
        "route gates",
        "macro-biome completion tokens"
      ])
    });
  });

  it("keeps scenario gates driven by biome token data instead of input handlers", () => {
    expect(getArchitecturePatternBySystemId("scenario-system")).toMatchObject({
      pattern: "State Machine / Gatekeeper",
      owns: expect.stringContaining("route gates"),
      gateDataSources: expect.arrayContaining([
        "macro-biome completion tokens",
        "scenario state"
      ]),
      usesBiomeTokenDataForGates: true,
      mustNotOwn: expect.arrayContaining(["low-level input polling", "input handlers"])
    });
  });

  it("marks flyweight catalogs as the owner for immutable content definitions", () => {
    expect(getArchitecturePatternBySystemId("flyweight-catalogs")).toMatchObject({
      pattern: "Flyweight",
      requiresImmutableData: true,
      contentFirst: true
    });
  });

  it("keeps UI presenters read-only over quest state", () => {
    expect(getArchitecturePatternBySystemId("ui-presenter")).toMatchObject({
      pattern: "Presenter",
      readOnlyState: true,
      mustNotOwn: expect.arrayContaining([
        "quest state mutation",
        "completion rewards",
        "route gates"
      ])
    });
  });

  it("identifies high-risk systems that need separate specs", () => {
    expect(listHighRiskArchitectureSystemIds()).toEqual([
      "camera",
      "render-frame",
      "stage",
      "input",
      "scene-flow",
      "runtime-boot",
      "game-loop"
    ]);
    expect(isHighRiskArchitectureSystem("input")).toBe(true);
    expect(isHighRiskArchitectureSystem("flyweight-catalogs")).toBe(false);
  });

  it("maps major architecture systems to owning files", () => {
    expect(getArchitectureOwningFilesBySystemId("input-system")).toEqual([
      "input/gameInputController.js",
      "input/gameInputBindings.js",
      "app/runtime/gamepadHarvestPolicy.js"
    ]);

    expect(getArchitectureOwningFilesBySystemId("scenario-system")).toEqual([
      "gameFlow.js",
      "app/scene/createSceneFlowRuntime.js",
      "app/scene/gameScenes.js",
      "app/scene/sceneDirector.js"
    ]);

    expect(getArchitectureOwningFilesBySystemId("quest-state-machine")).toContain(
      "app/quest/createQuestSystem.js"
    );
    expect(getArchitectureOwningFilesBySystemId("state-factory")).toEqual([
      "story/progression.js",
      "app/session/createEmptySession.js",
      "app/session/initializeGameplatState.js",
      "app/runtime/runtimeFlags.js"
    ]);
    expect(getArchitectureOwningFilesBySystemId("flyweight-catalogs")).toContain(
      "app/story/requestTaxonomyData.js"
    );
    expect(getArchitectureOwningFilesBySystemId("factory-builder")).toContain(
      "app/session/buildSceneAssembly.js"
    );
    expect(getArchitectureOwningFilesBySystemId("strategy")).toContain(
      "app/runtime/renderFrameStrategies.js"
    );
    expect(getArchitectureOwningFilesBySystemId("observer-event-queue")).toContain(
      "app/story/createStoryBeatSystem.js"
    );
    expect(getArchitectureOwningFilesBySystemId("repository-registry")).toContain(
      "app/story/currentQuestTaxonomyData.js"
    );
    expect(getArchitectureOwningFilesBySystemId("ui-presenter")).toContain(
      "app/ui/createQuestLog.js"
    );
  });

  it("records high fan-in and fan-out modules that need extra guards", () => {
    expect(listArchitectureHubRiskModules()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        file: "app/bootstrap/createApplicationRuntime.js",
        severity: "high",
        fanOut: 33
      }),
      expect.objectContaining({
        file: "gameplayContent.js",
        severity: "medium",
        fanIn: 14
      }),
      expect.objectContaining({
        file: "world/islandWorld.js",
        severity: "medium",
        fanOut: 3
      })
    ]));
    expect(Object.isFrozen(listArchitectureHubRiskModules())).toBe(true);
    expect(Object.isFrozen(listArchitectureHubRiskModules()[0])).toBe(true);
  });
});
