import { describe, expect, it } from "vitest";
import {
  createPlayerConstructionPlacementBlockers,
  createPlayerConstructionTerrainColliders,
  getRotatedFootprintSize,
  isPositionBlockedByTerrainColliders,
  isPositionInsideTerrainColliderFootprint
} from "../app/gameplay/placementBlockers.js";

describe("placement blockers", () => {
  it("keeps player constructions in the placement blocker list", () => {
    const blockers = createPlayerConstructionPlacementBlockers({
      session: {
        strawBed: {
          position: [2, 0.02, 3],
          size: [0, 0]
        },
        campfire: {
          position: [6, 0.02, 3],
          yaw: Math.PI * 0.5
        },
        leafDen: {
          position: [10, 0.02, 3],
          yaw: Math.PI * 0.5
        },
        playerHouses: [
          {
            id: "house-2",
            position: [14, 0.02, 3]
          }
        ]
      },
      storyState: {
        flags: {
          strawBedPlacedInBulbasaurHabitat: true,
          campfireSpatOut: true,
          leafDenKitPlaced: true,
          leafDenBuilt: true
        }
      }
    });

    expect(blockers).toEqual([
      {
        id: "solar-station",
        kind: "solarStation",
        position: [2, 0.02, 3],
        size: [2.2, 2.2]
      },
      {
        id: "train-house",
        kind: "trainHouse",
        position: [6, 0.02, 3],
        size: [1.45, 1.7]
      },
      {
        id: "house",
        kind: "house",
        position: [10, 0.02, 3],
        size: [2.9, 3.9]
      },
      {
        id: "player-house:house-2",
        kind: "playerHouse",
        position: [14, 0.02, 3],
        size: [3.9, 2.9]
      }
    ]);
  });

  it("does not block inactive story constructions", () => {
    expect(createPlayerConstructionPlacementBlockers({
      session: {
        strawBed: { position: [2, 0.02, 3] },
        campfire: { position: [6, 0.02, 3] },
        leafDen: { position: [10, 0.02, 3] }
      },
      storyState: { flags: {} }
    })).toEqual([]);
  });

  it("swaps rectangular footprint axes on quarter-turn rotation", () => {
    expect(getRotatedFootprintSize([3.9, 2.9], Math.PI * 0.5)).toEqual([2.9, 3.9]);
    expect(getRotatedFootprintSize([3.9, 2.9], Math.PI)).toEqual([3.9, 2.9]);
  });

  it("converts construction blockers into solid terrain colliders", () => {
    expect(createPlayerConstructionTerrainColliders({
      session: {
        leafDen: {
          position: [10, 0.02, 3],
          yaw: Math.PI * 0.5
        }
      },
      storyState: {
        flags: {
          leafDenBuilt: true
        }
      }
    })).toEqual([
      {
        id: "player-construction-collider:house",
        kind: "house",
        position: [10, 0, 3],
        size: [2.9, 2.4, 3.9],
        surfaceY: 2.4,
        blocksPlayer: true,
        padding: 0.12
      }
    ]);
  });

  it("detects companion-sized positions blocked by construction colliders", () => {
    const colliders = createPlayerConstructionTerrainColliders({
      session: {
        leafDen: {
          position: [10, 0.02, 3]
        }
      },
      storyState: {
        flags: {
          leafDenBuilt: true
        }
      }
    });

    expect(isPositionInsideTerrainColliderFootprint([10, 0.04, 3], colliders[0])).toBe(true);
    expect(isPositionBlockedByTerrainColliders([10, 0.04, 3], colliders)).toBe(true);
    expect(isPositionBlockedByTerrainColliders([16, 0.04, 3], colliders)).toBe(false);
    expect(isPositionBlockedByTerrainColliders([10, 2.4, 3], colliders)).toBe(false);
  });
});
