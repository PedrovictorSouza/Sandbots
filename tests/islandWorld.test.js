import { describe, expect, it } from "vitest";
import {
  buildCampfirePlacement,
  createCollisionChecker,
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
  reviveLeppaTreeFromWateredTiles,
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
        label: "Inspect dismantled Bulbasaur",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("uses Bulbasaur's dismantled module position for the first repair interaction", () => {
    const storyState = {
      flags: {
        bulbasaurRevealed: false,
        rustlingGrassCellId: "ground-3-1"
      }
    };
    const grassPatches = [
      {
        id: "grass-3",
        cellId: "ground-3-1",
        position: [8.4, 0.02, -4.2],
        state: "alive"
      }
    ];
    const bulbasaurEncounter = {
      repairPosition: [11.3, 0.04, -6.1]
    };

    const resultNearModule = findNearbyInteractable(
      [11.1, 0, -6],
      [],
      [],
      storyState,
      grassPatches,
      null,
      null,
      null,
      null,
      null,
      bulbasaurEncounter
    );
    const resultNearGrass = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      storyState,
      grassPatches,
      null,
      null,
      null,
      null,
      null,
      bulbasaurEncounter
    );

    expect(resultNearModule?.target).toEqual({
      kind: "grassEncounter",
      id: "rustlingGrass",
      label: "Inspect dismantled Bulbasaur",
      cellId: "ground-3-1"
    });
    expect(resultNearGrass).toBeNull();
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
        label: "Repair dismantled Charmander",
        cellId: "ground-8-7"
      },
      distance: expect.any(Number)
    });
  });

  it("uses companion dismantled module positions for later repair interactions", () => {
    const grassPatches = [
      {
        id: "leafage-grass-a",
        cellId: "ground-8-7",
        position: [8.4, 0.02, -4.2],
        state: "alive"
      },
      {
        id: "boulder-grass-a",
        cellId: "boulder-ground-0",
        position: [4.6, 0.02, -8.2],
        state: "alive"
      }
    ];

    const resultNearCharmanderModule = findNearbyInteractable(
      [12.2, 0, -6.4],
      [],
      [],
      {
        flags: {
          charmanderRevealed: false,
          charmanderRustlingGrassCellId: "ground-8-7"
        }
      },
      grassPatches,
      null,
      null,
      null,
      { repairPosition: [12.4, 0.04, -6.5] }
    );
    const resultNearTimburrModule = findNearbyInteractable(
      [15.1, 0, -9.2],
      [],
      [],
      {
        flags: {
          timburrRevealed: false,
          timburrRustlingGrassCellId: "boulder-ground-0"
        }
      },
      grassPatches,
      null,
      null,
      { repairPosition: [15.2, 0.04, -9.3] }
    );

    expect(resultNearCharmanderModule?.target).toEqual({
      kind: "charmanderGrassEncounter",
      id: "charmanderRustlingGrass",
      label: "Repair dismantled Charmander",
      cellId: "ground-8-7"
    });
    expect(resultNearTimburrModule?.target).toEqual({
      kind: "timburrGrassEncounter",
      id: "timburrRustlingGrass",
      label: "Repair dismantled Timburr",
      cellId: "boulder-ground-0"
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

  it("holds Bulbasaur's dry grass mission until the opening Leppa tree is revived", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          squirtleLeppaRequestAvailable: true,
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

    expect(result).toBeNull();
  });

  it("uses Bulbasaur's visible encounter position for mission interaction", () => {
    const storyState = {
      flags: {
        bulbasaurRevealed: true,
        bulbasaurDryGrassMissionAccepted: false,
        restoredGrassCount: 4,
        rustlingGrassCellId: "ground-3-1"
      }
    };
    const grassPatches = [
      {
        id: "grass-3",
        cellId: "ground-3-1",
        position: [8.4, 0.02, -4.2],
        state: "alive"
      }
    ];
    const bulbasaurEncounter = {
      visible: true,
      position: [12.2, 0.02, -2.1]
    };

    const resultNearBulbasaur = findNearbyInteractable(
      [12.4, 0, -2.2],
      [],
      [],
      storyState,
      grassPatches,
      null,
      null,
      null,
      null,
      null,
      bulbasaurEncounter
    );
    const resultNearGrass = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      storyState,
      grassPatches,
      null,
      null,
      null,
      null,
      null,
      bulbasaurEncounter
    );

    expect(resultNearBulbasaur).toEqual({
      target: {
        kind: "bulbasaurMission",
        id: "bulbasaurDryGrassMission",
        label: "Talk to Bulbasaur",
        cellId: "ground-3-1",
        position: [12.2, 0.02, -2.1]
      },
      distance: expect.any(Number)
    });
    expect(resultNearGrass).toBeNull();
  });

  it("keeps Bulbasaur talk available from the opened repair box position", () => {
    const storyState = {
      flags: {
        bulbasaurRevealed: true,
        bulbasaurDryGrassMissionAccepted: false,
        restoredGrassCount: 4,
        rustlingGrassCellId: "ground-3-1"
      }
    };
    const grassPatches = [
      {
        id: "grass-3",
        cellId: "ground-3-1",
        position: [8.55, 0.02, -5.7],
        state: "alive"
      }
    ];
    const bulbasaurEncounter = {
      visible: true,
      position: [8.55, 0.02, -5.7],
      repairBoxPosition: [10.1, 0.04, -4.65]
    };

    const result = findNearbyInteractable(
      [10.1, 0, -4.65],
      [],
      [],
      storyState,
      grassPatches,
      null,
      null,
      null,
      null,
      null,
      bulbasaurEncounter
    );

    expect(result).toEqual({
      target: {
        kind: "bulbasaurMission",
        id: "bulbasaurDryGrassMission",
        label: "Talk to Bulbasaur",
        cellId: "ground-3-1",
        position: [8.55, 0.02, -5.7]
      },
      distance: expect.any(Number)
    });
  });

  it("still detects Bulbasaur mission interaction if enough grass was watered before accepting it", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: false,
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
        label: "Repair dismantled Timburr",
        cellId: "boulder-ground-0"
      },
      distance: expect.any(Number)
    });
  });

  it("exposes the Leppa Berry tree only after the surrounding tiles are watered", () => {
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

    expect(findNearbyLeppaTree([2.4, 0, 2.2], leppaTree, storyState)).toBeNull();

    expect(reviveLeppaTreeFromWateredTiles(leppaTree, storyState, [
      { id: "east", offset: [3.4, 0, 2], tileSpan: 1.425 },
      { id: "west", offset: [0.6, 0, 2], tileSpan: 1.425 },
      { id: "south", offset: [2, 0, 3.4], tileSpan: 1.425 },
      { id: "north", offset: [2, 0, 0.6], tileSpan: 1.425 }
    ])).toBe(true);
    expect(storyState.flags.leppaTreeRevived).toBe(true);
    expect(leppaTree.deadInstance.active).toBe(true);
    expect(leppaTree.deadInstance.tintStrength).toBeGreaterThan(0);
    expect(leppaTree.aliveInstance.active).toBe(false);
    expect(reviveLeppaTreeFromWateredTiles(leppaTree, storyState, [
      { id: "east", offset: [3.4, 0, 2], tileSpan: 1.425 },
      { id: "west", offset: [0.6, 0, 2], tileSpan: 1.425 },
      { id: "south", offset: [2, 0, 3.4], tileSpan: 1.425 },
      { id: "north", offset: [2, 0, 0.6], tileSpan: 1.425 }
    ])).toBe(false);
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

  it("detects placed objects before the player has to stand on top of them", () => {
    const logChair = buildLogChairPlacement([2, 0, 2]);
    const storyState = {
      flags: {
        logChairPlaced: true,
        logChairSat: false
      }
    };

    expect(findNearbyInteractable(
      [5.05, 0, 2.42],
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

  it("uses a forgiving reach for station and site object interactables", () => {
    expect(findNearbyInteractable(
      [2.45, 0, 0],
      [],
      [
        {
          id: "pokemonCenterPc",
          label: "Pokemon Center PC",
          type: "site",
          position: [0, 0.02, 0],
          interactDistance: 1.85,
          activeWhen: () => true
        }
      ],
      { flags: {} }
    )).toEqual({
      target: {
        kind: "site",
        id: "pokemonCenterPc",
        label: "Pokemon Center PC"
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
    })).toBe("[E / X] Leaf Den Kit • Start construction");
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
    })).toBe("[E / X] Leaf Den • Enter");
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
    })).toBe("[E / X] Workbench • Workbench");
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

  it("describes active moves when no target is available", () => {
    expect(buildNearbyPrompt({
      harvestTarget: null,
      interactTarget: null,
      activeMoveId: "leafage",
      quest: {
        title: "Plant Leafage for Bulbasaur",
        actionLabel: "Grow"
      },
      getItemLabel: (itemId) => itemId
    })).toBe("Leafage: grow tall grass on restored ground.");

    expect(buildNearbyPrompt({
      harvestTarget: null,
      interactTarget: null,
      activeMoveId: "waterGun",
      pendingWaterGunCount: 2,
      quest: {
        title: "Water dry grass!",
        actionLabel: "Restore"
      },
      getItemLabel: (itemId) => itemId
    })).toBe("Water Gun: Squirtle has 2 tiles queued.");
  });

  it("shows Squirtle queue status in the Water Gun ground prompt", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        groundCell: {
          id: "ground-2-2"
        }
      },
      activeMoveId: "waterGun",
      pendingWaterGunCount: 1,
      quest: {
        title: "Water dry grass!",
        actionLabel: "Restore"
      },
      getItemLabel: (itemId) => itemId
    })).toBe("[Enter] Mark dry ground for Squirtle • 1 queued");
  });
});

describe("createCollisionChecker", () => {
  it("keeps terrain collision behavior with many far colliders", () => {
    const colliders = Array.from({ length: 600 }, (_, index) => ({
      id: `far-${index}`,
      position: [80 + index * 2, 0, 80],
      size: [1, 1, 1],
      surfaceY: 1,
      blocksPlayer: true
    }));
    colliders.push({
      id: "near-platform",
      position: [2, 0, 2],
      size: [4, 1, 4],
      surfaceY: 1,
      blocksPlayer: true
    });
    const isBlocked = createCollisionChecker(
      { size: [1, 1, 1] },
      { size: [1, 1, 1] },
      [],
      () => [],
      () => colliders,
      2000
    );

    expect(isBlocked([2, 0, 2])).toBe(true);
    expect(isBlocked([2, 1, 2])).toEqual({
      blocked: false,
      landingY: 1
    });
    expect(isBlocked([30, 0, 30])).toBe(false);
  });

  it("blocks solid building footprints while allowing low ramp colliders", () => {
    const colliders = [
      {
        id: "building-solid",
        position: [5, 0, 0],
        size: [4, 3, 4],
        surfaceY: 3,
        blocksPlayer: true,
        padding: 0
      },
      {
        id: "building-ramp",
        position: [-5, 0, 0],
        size: [2, 0.16, 2],
        surfaceY: 0.16,
        blocksPlayer: true,
        padding: 0
      }
    ];
    const isBlocked = createCollisionChecker(
      { size: [1, 1, 1] },
      { size: [1, 1, 1] },
      [],
      () => [],
      () => colliders,
      2000
    );

    expect(isBlocked([5, 0, 0])).toBe(true);
    expect(isBlocked([-5, 0, 0])).toEqual({
      blocked: false,
      landingY: 0.16
    });
  });
});
