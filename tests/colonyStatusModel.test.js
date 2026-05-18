import { describe, expect, it } from "vitest";
import {
  COLONY_STATUS_STATE,
  COLONY_STATUS_SYSTEM_ID,
  createColonyStatusModel,
  validateColonyStatusModel
} from "../app/ui/colonyStatusModel.js";

describe("colony status model", () => {
  it("starts as a small system-state model instead of quest copy", () => {
    const model = createColonyStatusModel();

    expect(model.systems.map((system) => system.id)).toEqual([
      COLONY_STATUS_SYSTEM_ID.POWER,
      COLONY_STATUS_SYSTEM_ID.WATER,
      COLONY_STATUS_SYSTEM_ID.SOIL,
      COLONY_STATUS_SYSTEM_ID.SHELTER
    ]);
    expect(model.systems.map((system) => system.state)).toEqual([
      COLONY_STATUS_STATE.OFFLINE,
      COLONY_STATUS_STATE.OFFLINE,
      COLONY_STATUS_STATE.OFFLINE,
      COLONY_STATUS_STATE.OFFLINE
    ]);
    expect(model.activeBot).toBeNull();
    expect(model.activeTool).toBeNull();
    expect(validateColonyStatusModel(model)).toEqual([]);
  });

  it("reports water and soil status from unlocked tools and restoration progress", () => {
    const model = createColonyStatusModel({
      storyState: {
        flags: {
          restoredGrassCount: 4
        }
      },
      playerSkills: { waterGun: true },
      activeMoveId: "waterGun"
    });

    expect(model.activeBot).toBe("Hydro Bot");
    expect(model.activeTool).toBe("Hydro Jet");
    expect(model.systems.find((system) => system.id === COLONY_STATUS_SYSTEM_ID.WATER)).toMatchObject({
      state: COLONY_STATUS_STATE.ACTIVE,
      detail: "Hydro Jet selected."
    });
    expect(model.systems.find((system) => system.id === COLONY_STATUS_SYSTEM_ID.SOIL)).toMatchObject({
      state: COLONY_STATUS_STATE.ACTIVE,
      detail: "4/10 dry grass restored.",
      value: 0.4
    });
  });

  it("reports power and shelter progress from existing colony flags", () => {
    const model = createColonyStatusModel({
      storyState: {
        flags: {
          strawBedPlacedInBulbasaurHabitat: true,
          leafDenBuildAvailable: true,
          leafDenKitPlaced: true
        }
      },
      inventory: {
        leafDenKit: 1
      }
    });

    expect(model.systems.find((system) => system.id === COLONY_STATUS_SYSTEM_ID.POWER)).toMatchObject({
      state: COLONY_STATUS_STATE.ACTIVE,
      detail: "Solar Station online."
    });
    expect(model.systems.find((system) => system.id === COLONY_STATUS_SYSTEM_ID.SHELTER)).toMatchObject({
      state: COLONY_STATUS_STATE.ACTIVE,
      detail: "House Kit placed."
    });
  });

  it("uses human-readable ready states before placement", () => {
    const model = createColonyStatusModel({
      storyState: {
        flags: {
          strawBedRecipeUnlocked: true,
          leafDenBuildAvailable: true
        }
      }
    });

    expect(model.systems.find((system) => system.id === COLONY_STATUS_SYSTEM_ID.POWER)).toMatchObject({
      state: COLONY_STATUS_STATE.AVAILABLE,
      detail: "Solar Station plans ready."
    });
    expect(model.systems.find((system) => system.id === COLONY_STATUS_SYSTEM_ID.SHELTER)).toMatchObject({
      state: COLONY_STATUS_STATE.READY,
      detail: "House Kit ready."
    });
  });

  it("validates duplicated, incomplete, and unknown status records", () => {
    expect(validateColonyStatusModel({
      systems: [
        { id: "power", label: "Power", state: COLONY_STATUS_STATE.ACTIVE, detail: "Online." },
        { id: "power", label: "", state: "maybe", detail: "" },
        { label: "No id", state: COLONY_STATUS_STATE.READY, detail: "Ready." }
      ]
    })).toEqual([
      { type: "duplicate-system-id", systemId: "power", index: 1 },
      { type: "unknown-system-state", systemId: "power", state: "maybe", index: 1 },
      { type: "missing-system-label", systemId: "power", index: 1 },
      { type: "missing-system-detail", systemId: "power", index: 1 },
      { type: "missing-system-id", index: 2 }
    ]);
  });
});
