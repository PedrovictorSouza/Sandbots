import { describe, expect, it } from "vitest";
import {
  cloneSavedGridPlacement,
  cloneSavedPlacement,
  createLegacyGridPlacementSaveData,
  restoreSavedSessionState
} from "../app/bootstrap/createApplicationRuntime.js";
import { buildLeafDenKitPlacement } from "../world/islandWorld.js";

describe("construction site save data", () => {
  it("preserves ConstructionSite metadata when cloning placeables for save", () => {
    const leafDenSite = buildLeafDenKitPlacement([4, 0, 4]);
    leafDenSite.constructionStatus = "building";

    const saved = cloneSavedPlacement(leafDenSite);

    expect(saved).toEqual({
      id: "leaf-den-0",
      kind: "constructionSite",
      constructionSiteId: "leaf-den-0",
      buildingKitId: "leafDenKit",
      constructionName: "House",
      constructionStatus: "building",
      interactionBox: {
        id: "leaf-den-0-interaction-box",
        markerKey: "workbench",
        offset: [1.02, 1.18, -0.42]
      },
      position: [5.15, 0.02, 4.35],
      size: [1.95, 1.45],
      uvRect: [0, 0, 1, 1]
    });

    leafDenSite.position[0] = 99;
    leafDenSite.size[0] = 99;
    leafDenSite.uvRect[0] = 99;
    leafDenSite.interactionBox.offset[0] = 99;

    expect(saved.position).toEqual([5.15, 0.02, 4.35]);
    expect(saved.size).toEqual([1.95, 1.45]);
    expect(saved.uvRect).toEqual([0, 0, 1, 1]);
    expect(saved.interactionBox.offset).toEqual([1.02, 1.18, -0.42]);
  });

  it("restores model-backed house placements saved without billboard uv data", () => {
    const saved = cloneSavedPlacement({
      id: "leaf-den-0",
      kind: "constructionSite",
      position: [5.15, 0.02, 4.35],
      size: [1.95, 1.45],
      yaw: Math.PI * 0.5
    });

    expect(saved).toMatchObject({
      id: "leaf-den-0",
      kind: "constructionSite",
      position: [5.15, 0.02, 4.35],
      size: [1.95, 1.45],
      uvRect: [0, 0, 1, 1],
      yaw: Math.PI * 0.5
    });
  });

  it("preserves grid placement records when cloning save data", () => {
    const gridPlacement = {
      schemaVersion: 1,
      gridConfig: {
        cellSize: 2,
        origin: { x: -8, y: 0, z: -8 },
        width: 16,
        height: 16,
        visualOffsetY: 0.05
      },
      placedObjects: [
        {
          placedObjectId: "solar-station-1",
          sourceDatabaseId: "solarStation",
          originCell: { x: 5, y: 7 },
          size: { width: 4, height: 4 },
          occupiedCells: [
            { x: 5, y: 7 },
            { x: 6, y: 7 },
            { x: 7, y: 7 },
            { x: 8, y: 7 }
          ]
        }
      ]
    };

    const saved = cloneSavedGridPlacement(gridPlacement);

    expect(saved).toEqual(gridPlacement);

    gridPlacement.gridConfig.origin.x = 99;
    gridPlacement.placedObjects[0].originCell.x = 99;
    gridPlacement.placedObjects[0].occupiedCells[0].x = 99;

    expect(saved.gridConfig.origin.x).toBe(-8);
    expect(saved.placedObjects[0].originCell.x).toBe(5);
    expect(saved.placedObjects[0].occupiedCells[0].x).toBe(5);
  });

  it("mirrors legacy placeables into grid placement save data", () => {
    const legacyPlaceables = {
      campfire: {
        id: "campfire-0",
        kind: "trainHouse",
        position: [4.5, 0, 6.5],
        size: [1.7, 1.45],
        uvRect: [0, 0, 1, 1]
      }
    };

    const saved = createLegacyGridPlacementSaveData(legacyPlaceables);

    expect(saved.schemaVersion).toBe(1);
    expect(saved.placedObjects).toHaveLength(1);
    expect(saved.placedObjects[0]).toMatchObject({
      placedObjectId: "legacy-campfire",
      sourceDatabaseId: "trainHouse",
      size: { width: 3, height: 3 },
      legacyKey: "campfire"
    });
    expect(saved.placedObjects[0].occupiedCells).toHaveLength(9);
  });

  it("restores saved grid placement records on session boot", () => {
    const session = {
      spawnActTwoPlayer({ position }) {
        session.playerCharacter = {
          getPosition: () => position
        };
      }
    };
    const savePoint = {
      version: 1,
      playerPosition: [1, 0, 2],
      gridPlacement: {
        schemaVersion: 1,
        placedObjects: [
          {
            placedObjectId: "leaf-den-1",
            sourceDatabaseId: "leafDen",
            originCell: { x: 12, y: 14 },
            size: { width: 3, height: 3 },
            occupiedCells: [{ x: 12, y: 14 }]
          }
        ]
      }
    };

    expect(restoreSavedSessionState(session, savePoint)).toBe(true);
    expect(session.gridPlacement).toMatchObject({
      schemaVersion: 1,
      placedObjects: [
        {
          placedObjectId: "leaf-den-1",
          sourceDatabaseId: "leafDen",
          originCell: { x: 12, y: 14 },
          size: { width: 3, height: 3 },
          occupiedCells: [{ x: 12, y: 14 }]
        }
      ]
    });
    expect(session.playerCharacter.getPosition()).toEqual([1, 0, 2]);
  });
});
