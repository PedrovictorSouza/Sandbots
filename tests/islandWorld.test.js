import { describe, expect, it } from "vitest";
import {
  buildCampfirePlacement,
  buildLeafDenKitPlacement,
  buildLogChairPlacement,
  buildNearbyPrompt,
  buildStrawBedPlacement,
  collectLeppaBerryDrops,
  dropLeppaBerryFromTree,
  findNearbyInteractable,
  findNearbyLeafDen,
  findNearbyLogChair,
  findNearbyLeppaTree,
  reviveLeppaTree,
  updateBulbasaurStrawBedChallengeCompletion,
  waterNearbyPalm
} from "../world/islandWorld.js";
import { LEPPA_BERRY_ITEM_ID } from "../gameplayContent.js";

describe("findNearbyInteractable", () => {
  it("detects an active rustling grass encounter", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: false,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "grassEncounter",
        id: "rustlingGrass",
        label: "Investigate the rustling grass",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("detects Charmander's Leafage rustling grass encounter", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          charmanderRevealed: false,
          charmanderRustlingGrassCellId: "ground-8-7"
        }
      },
      [
        {
          id: "leafage-grass-a",
          cellId: "ground-8-7",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "charmanderGrassEncounter",
        id: "charmanderRustlingGrass",
        label: "Inspect the rustling grass",
        cellId: "ground-8-7"
      },
      distance: expect.any(Number)
    });
  });

  it("detects Bulbasaur mission interaction after the encounter when grass is still dry", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: false,
          restoredGrassCount: 4,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "bulbasaurMission",
        id: "bulbasaurDryGrassMission",
        label: "Talk to Bulbasaur",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("detects Bulbasaur request turn-in after 10 grass patches are watered", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: true,
          bulbasaurDryGrassMissionComplete: true,
          restoredGrassCount: 10,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "bulbasaurRequestComplete",
        id: "bulbasaurLeafageReward",
        label: "Talk to Bulbasaur",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("detects the Timburr rustling grass challenge interaction", () => {
    const result = findNearbyInteractable(
      [31.3, 0, 10.6],
      [],
      [],
      {
        flags: {
          boulderShadedTallGrassHabitatCreated: true,
          timburrRustlingGrassCellId: "boulder-ground-0",
          timburrRevealed: false
        }
      },
      [
        {
          id: "boulder-grass-0",
          cellId: "boulder-ground-0",
          position: [31.2, 0.02, 10.4],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "timburrGrassEncounter",
        id: "timburrRustlingGrass",
        label: "Inspect the Boulder-Shaded Tall Grass",
        cellId: "boulder-ground-0"
      },
      distance: expect.any(Number)
    });
  });

  it("detects the Leppa Berry tree watering and headbutt steps", () => {
    const storyState = {
      flags: {
        squirtleLeppaRequestAvailable: true,
        leppaBerryGiftComplete: false
      }
    };
    const leppaTree = {
      position: [2, 0.02, 2],
      revived: false,
      berryDropped: false,
      deadInstance: { active: false },
      aliveInstance: { active: false }
    };

    expect(findNearbyLeppaTree([2.4, 0, 2.2], leppaTree, storyState)).toEqual({
      leppaTree,
      action: "water",
      distance: expect.any(Number)
    });

    expect(reviveLeppaTree(leppaTree, storyState)).toBe(true);
    expect(storyState.flags.leppaTreeRevived).toBe(true);
    expect(findNearbyLeppaTree([2.4, 0, 2.2], leppaTree, storyState)).toEqual({
      leppaTree,
      action: "headbutt",
      distance: expect.any(Number)
    });
  });

  it("drops and collects the Leppa Berry", () => {
    const storyState = { flags: {} };
    const leppaTree = {
      position: [2, 0.02, 2],
      berryDropped: false
    };
    const drops = [];
    const inventory = {};

    const drop = dropLeppaBerryFromTree(leppaTree, drops, storyState);
    const collected = collectLeppaBerryDrops(drop.position, drops, inventory, storyState);

    expect(drop.itemId).toBe(LEPPA_BERRY_ITEM_ID);
    expect(storyState.flags.leppaBerryDropped).toBe(true);
    expect(collected).toBe(1);
    expect(inventory[LEPPA_BERRY_ITEM_ID]).toBe(1);
    expect(storyState.flags.leppaBerryCollected).toBe(true);
  });

  it("detects the Bulbasaur Leppa Berry gift prompt after the berry is collected", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: true,
          bulbasaurDryGrassRequestTurnedIn: true,
          squirtleLeppaRequestAvailable: true,
          leppaBerryCollected: true,
          leppaBerryGiftComplete: false,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "leppaBerryGift",
        id: "bulbasaur",
        label: "Look at this!",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("detects Bulbasaur's Straw Bed recipe prompt after the first challenge set", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: true,
          bulbasaurDryGrassRequestTurnedIn: true,
          bulbasaurStrawBedChallengeComplete: true,
          strawBedRecipeUnlocked: false,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "bulbasaurStrawBedRecipe",
        id: "bulbasaurStrawBedRecipe",
        label: "Do you need anything?",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("detects Bulbasaur's request turn-in after the Straw Bed is placed", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: true,
          bulbasaurDryGrassRequestTurnedIn: true,
          strawBedPlacedInBulbasaurHabitat: true,
          bulbasaurStrawBedRequestComplete: false,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "bulbasaurStrawBedComplete",
        id: "bulbasaurStrawBedComplete",
        label: "Talk to Bulbasaur",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("counts a tree only once for Bulbasaur's Straw Bed challenge", () => {
    const treeModel = {
      size: [2, 4, 2]
    };
    const palmInstances = [
      {
        id: "palm-0",
        offset: [1, 0, 1],
        scale: 1,
        active: true,
        yaw: 0,
        shakeDuration: 0.42
      }
    ];
    const storyState = {
      flags: {
        bulbasaurStrawBedChallengeAvailable: true,
        wateredTreeCount: 4,
        sturdySticksGatheredForChallenge: 10
      }
    };

    const firstWatering = waterNearbyPalm([1.2, 0, 1.1], treeModel, palmInstances, storyState);
    const duplicateWatering = waterNearbyPalm([1.2, 0, 1.1], treeModel, palmInstances, storyState);

    expect(firstWatering).toMatchObject({
      hit: true,
      counted: true,
      challengeComplete: true
    });
    expect(duplicateWatering).toMatchObject({
      hit: true,
      counted: false,
      challengeComplete: false
    });
    expect(storyState.flags.wateredTreeCount).toBe(5);
    expect(storyState.flags.bulbasaurStrawBedChallengeComplete).toBe(true);
    expect(updateBulbasaurStrawBedChallengeCompletion(storyState)).toBe(false);
  });

  it("detects the placed log chair as a sit target", () => {
    const logChair = buildLogChairPlacement([2, 0, 2]);
    const storyState = {
      flags: {
        logChairPlaced: true,
        logChairSat: false
      }
    };

    expect(findNearbyLogChair(logChair.position, logChair, storyState)).toEqual({
      logChair,
      distance: expect.any(Number)
    });

    expect(findNearbyInteractable(
      logChair.position,
      [],
      [],
      storyState,
      [],
      logChair
    )).toEqual({
      target: {
        kind: "logChairSeat",
        id: "logChair",
        label: "Sit on Log Chair"
      },
      distance: expect.any(Number)
    });
  });

  it("describes the log chair placement action in the nearby prompt", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        logChairPlacement: true
      },
      quest: {
        title: "Tangrowth",
        actionLabel: "Place"
      },
      getItemLabel: (itemId) => itemId
    })).toBe("[Enter] Place the Log Chair nearby");
  });

  it("detects the placed Leaf Den Kit as a construction target", () => {
    const leafDen = buildLeafDenKitPlacement([4, 0, 4]);
    const storyState = {
      flags: {
        leafDenKitPlaced: true,
        leafDenBuilt: false
      }
    };

    expect(findNearbyLeafDen(leafDen.position, leafDen, storyState)).toEqual({
      leafDen,
      distance: expect.any(Number)
    });

    expect(findNearbyInteractable(
      leafDen.position,
      [],
      [],
      storyState,
      [],
      null,
      leafDen
    )).toEqual({
      target: {
        kind: "leafDenConstruction",
        id: "leafDen",
        label: "Leaf Den Kit"
      },
      distance: expect.any(Number)
    });
  });

  it("describes Leaf Den Kit placement and construction prompts", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        leafDenKitPlacement: true
      },
      quest: {
        title: "Building the Leaf Den",
        actionLabel: "Place"
      }
    })).toBe("[Enter] Place the Leaf Den Kit");

    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "leafDenConstruction",
          id: "leafDen",
          label: "Leaf Den Kit"
        }
      },
      quest: {
        title: "Building the Leaf Den",
        actionLabel: "Inspect"
      },
      storyState: {
        flags: {}
      }
    })).toBe("[A / E] Leaf Den Kit • Start construction");
  });

  it("detects the completed Leaf Den as an entrance", () => {
    const leafDen = buildLeafDenKitPlacement([4, 0, 4]);
    const storyState = {
      flags: {
        leafDenKitPlaced: true,
        leafDenBuilt: true,
        leafDenFurnitureRequestAvailable: true
      }
    };

    expect(findNearbyInteractable(
      leafDen.position,
      [],
      [],
      storyState,
      [],
      null,
      leafDen
    )).toEqual({
      target: {
        kind: "leafDenEntrance",
        id: "leafDen",
        label: "Leaf Den"
      },
      distance: expect.any(Number)
    });

    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "leafDenEntrance",
          id: "leafDen",
          label: "Leaf Den"
        }
      },
      quest: {
        title: "Furnitures inside Leaf Den",
        actionLabel: "Enter"
      }
    })).toBe("[A / E] Leaf Den • Enter");
  });

  it("detects Timburr as the Leaf Den furniture request turn-in", () => {
    const storyState = {
      flags: {
        leafDenFurnitureRequestAvailable: true,
        leafDenFurniturePlacedCount: 3,
        leafDenFurnitureRequestComplete: false,
        timburrRevealed: true
      }
    };

    expect(findNearbyInteractable(
      [1, 0, 1],
      [],
      [],
      storyState,
      [],
      null,
      null,
      {
        visible: true,
        position: [1, 0.02, 1]
      }
    )).toEqual({
      target: {
        kind: "timburrLeafDenFurnitureComplete",
        id: "timburr",
        label: "Talk to Timburr"
      },
      distance: expect.any(Number)
    });
  });

  it("detects Charmander as the celebration request starter", () => {
    const storyState = {
      flags: {
        charmanderCelebrationRequestAvailable: true,
        charmanderCelebrationSuggested: false,
        charmanderRevealed: true
      }
    };

    expect(findNearbyInteractable(
      [2, 0, 2],
      [],
      [],
      storyState,
      [],
      null,
      null,
      null,
      {
        visible: true,
        position: [2, 0.02, 2]
      }
    )).toEqual({
      target: {
        kind: "charmanderCelebrationRequest",
        id: "charmander",
        label: "Talk to Charmander"
      },
      distance: expect.any(Number)
    });
  });

  it("builds a Campfire placement near the supplied anchor", () => {
    expect(buildCampfirePlacement([7, 0, 3.78])).toEqual({
      id: "campfire-0",
      position: [7.92, 0.02, 4.2],
      size: [1.34, 1.18],
      uvRect: [0, 0, 1, 1]
    });
  });

  it("builds a Straw Bed placement on the supplied habitat anchor", () => {
    expect(buildStrawBedPlacement([8.5, 0.02, -5.5])).toEqual({
      id: "straw-bed-0",
      position: [8.5, 0.02, -5.5],
      size: [1.55, 1.02],
      uvRect: [0, 0, 1, 1]
    });
  });

  it("describes the Straw Bed placement action in the nearby prompt", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        strawBedPlacement: {
          canPlace: true
        }
      },
      quest: {
        title: "Straw Bed Recipe",
        actionLabel: "Place"
      }
    })).toBe("[Enter] Place the Straw Bed in Bulbasaur's habitat");
  });

  it("describes the Ditto Flag placement action in the nearby prompt", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        dittoFlagPlacement: {
          leafDen: {
            id: "leaf-den-0"
          }
        }
      },
      quest: {
        title: "Place Ditto Flag on your house",
        actionLabel: "Place"
      }
    })).toBe("[Enter] Place the Ditto Flag on the Leaf Den");
  });

  it("uses A or E copy for Workbench interaction prompts", () => {
    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "station",
          id: "workbench",
          label: "Workbench"
        }
      },
      quest: {
        title: "Workbench",
        actionLabel: "Interact"
      },
      getItemLabel: (itemId) => itemId
    })).toBe("[A / E] Workbench • Workbench");
  });

  it("describes the Leafage grow action in the nearby prompt", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        leafageGroundCell: {
          id: "ground-8-8"
        }
      },
      quest: {
        title: "Charmander",
        actionLabel: "Grow"
      },
      getItemLabel: (itemId) => itemId
    })).toBe("[Enter] Use Leafage to grow tall grass");
  });
});
