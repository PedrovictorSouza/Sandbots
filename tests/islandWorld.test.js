import { describe, expect, it } from "vitest";
import {
  BULBASAUR_TALK_INTERACT_DISTANCE,
  buildCampfirePlacement,
  createCollisionChecker,
  buildLeafDenKitPlacement,
  buildLogChairPlacement,
  buildNearbyPrompt,
  buildStrawBedPlacement,
  collectLeafDrops,
  collectLeafResourceNodes,
  collectLeppaBerryDrops,
  dropLeppaBerryFromTree,
  findNearbyDestroyableInstantiatedObject,
  findNearbyInteractable,
  findNearbyLeafDen,
  findNearbyLogChair,
  findNearbyLeppaTree,
  getLeppaTreeSurroundingGroundCells,
  normalizeWorldPromptCopy,
  reviveLeppaTreeFromWateredTiles,
  updateBulbasaurStrawBedChallengeCompletion,
  validateBuildingKitPlacement,
  waterNearbyPalm
} from "../world/islandWorld.js";
import {
  INTERACTABLE_DEFS,
  COLONY_TERMINAL_INTERACT_DISTANCE,
  LEAVES_ITEM_ID,
  LEPPA_BERRY_ITEM_ID,
  POKEMON_TALK_INTERACT_DISTANCE,
  POKEMON_CENTER_PC_POSITION,
  RUINED_POKEMON_CENTER_GUIDE_POSITION,
  RUINED_POKEMON_CENTER_INTERACT_DISTANCE,
  RUINED_POKEMON_CENTER_POSITION,
  WORKBENCH_INTERACT_DISTANCE,
  WORKBENCH_POSITION,
  canClaimBoulderChallengeReward
} from "../gameplayContent.js";

describe("findNearbyInteractable", () => {
  it("detects an active NPC talk target without requiring the player to touch them", () => {
    const result = findNearbyInteractable(
      [POKEMON_TALK_INTERACT_DISTANCE - 0.05, 0, 0],
      [
        {
          id: "tangrowth",
          label: "Chopper",
          activeWhen: () => true,
          character: {
            getPosition: () => [0, 0.02, 0]
          }
        }
      ],
      [],
      { flags: {} }
    );

    expect(result).toEqual({
      target: {
        kind: "npc",
        id: "tangrowth",
        label: "Chopper"
      },
      distance: expect.any(Number)
    });
  });

  it("detects the Workbench from outside its solid collider footprint", () => {
    const result = findNearbyInteractable(
      [WORKBENCH_POSITION[0] + 4.6, 0, WORKBENCH_POSITION[2]],
      [],
      [
        {
          id: "workbench",
          label: "Workbench",
          type: "station",
          position: [...WORKBENCH_POSITION],
          interactDistance: WORKBENCH_INTERACT_DISTANCE,
          activeWhen: () => true
        }
      ],
      { flags: {} }
    );

    expect(result).toEqual({
      target: {
        kind: "station",
        id: "workbench",
        label: "Workbench"
      },
      distance: expect.any(Number)
    });
  });

  it("detects the Ruined Colony Terminal from outside its solid collider footprint", () => {
    const result = findNearbyInteractable(
      [
        RUINED_POKEMON_CENTER_POSITION[0] + 4.8,
        0,
        RUINED_POKEMON_CENTER_POSITION[2]
      ],
      [],
      [
        {
          id: "ruinedPokemonCenter",
          label: "Ruined Colony Terminal",
          type: "site",
          position: [...RUINED_POKEMON_CENTER_POSITION],
          interactDistance: RUINED_POKEMON_CENTER_INTERACT_DISTANCE,
          activeWhen: () => true
        }
      ],
      { flags: {} }
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "ruinedPokemonCenter",
        label: "Ruined Colony Terminal"
      },
      distance: expect.any(Number)
    });
  });

  it("keeps the Colony Terminal guide stop outside the solid collider and within inspect reach", () => {
    const colliderCenter = [
      RUINED_POKEMON_CENTER_POSITION[0],
      RUINED_POKEMON_CENTER_POSITION[2] + 0.15
    ];
    const colliderHalfWidth = (7.6 / 2) + 0.18;
    const colliderHalfDepth = (6.2 / 2) + 0.18;
    const guideInsideSolidCollider =
      Math.abs(RUINED_POKEMON_CENTER_GUIDE_POSITION[0] - colliderCenter[0]) <=
        colliderHalfWidth &&
      Math.abs(RUINED_POKEMON_CENTER_GUIDE_POSITION[2] - colliderCenter[1]) <=
        colliderHalfDepth;
    const guideInspectDistance = Math.hypot(
      RUINED_POKEMON_CENTER_GUIDE_POSITION[0] - RUINED_POKEMON_CENTER_POSITION[0],
      RUINED_POKEMON_CENTER_GUIDE_POSITION[2] - RUINED_POKEMON_CENTER_POSITION[2]
    );

    expect(guideInsideSolidCollider).toBe(false);
    expect(guideInspectDistance).toBeLessThanOrEqual(RUINED_POKEMON_CENTER_INTERACT_DISTANCE);
  });

  it("prioritizes Colony Terminal inspection over nearby Chopper guide chatter", () => {
    const result = findNearbyInteractable(
      [...RUINED_POKEMON_CENTER_GUIDE_POSITION],
      [
        {
          id: "tangrowth",
          label: "Chopper",
          activeWhen: () => true,
          character: {
            getPosition: () => [...RUINED_POKEMON_CENTER_GUIDE_POSITION]
          }
        }
      ],
      [
        {
          id: "ruinedPokemonCenter",
          label: "Ruined Colony Terminal",
          type: "site",
          position: [...RUINED_POKEMON_CENTER_POSITION],
          interactDistance: RUINED_POKEMON_CENTER_INTERACT_DISTANCE,
          activeWhen: () => true
        }
      ],
      { flags: { pokemonCenterGuideStarted: true } }
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "ruinedPokemonCenter",
        label: "Ruined Colony Terminal"
      },
      distance: expect.any(Number)
    });
  });

  it("detects an active rustling grass encounter", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: false,
          chopperBulbasaurRepairBoxIntroComplete: true,
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
        label: "Check on Grow Bot",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("does not detect the Grow Bot repair box before the dry grass mission handoff is complete", () => {
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

    expect(result).toBeNull();
  });

  it("uses a wider talk reach for revealed Pokemon companions", () => {
    const result = findNearbyInteractable(
      [BULBASAUR_TALK_INTERACT_DISTANCE - 0.05, 0, 0],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true
        }
      },
      [],
      null,
      null,
      null,
      null,
      null,
      {
        visible: true,
        position: [0, 0.02, 0]
      }
    );

    expect(result).toEqual({
      target: {
        kind: "pokemonCompanion",
        id: "bulbasaur",
        label: "Follow me: Grow Bot",
        position: [0, 0.02, 0]
      },
      distance: expect.any(Number)
    });
  });

  it("lets the player talk to Grow Bot without standing on the model", () => {
    const result = findNearbyInteractable(
      [7.75, 0, 0],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true
        }
      },
      [],
      null,
      null,
      null,
      null,
      null,
      {
        visible: true,
        position: [0, 0.02, 0]
      }
    );

    expect(result).toMatchObject({
      target: {
        kind: "pokemonCompanion",
        id: "bulbasaur",
        label: "Follow me: Grow Bot"
      }
    });
  });

  it("lets the player talk to other helpers without standing on their models", () => {
    const result = findNearbyInteractable(
      [BULBASAUR_TALK_INTERACT_DISTANCE - 0.05, 0, 0],
      [],
      [],
      {
        flags: {
          charmanderRevealed: true
        }
      },
      [],
      null,
      null,
      null,
      {
        visible: true,
        position: [0, 0.02, 0]
      }
    );

    expect(result).toMatchObject({
      target: {
        kind: "pokemonCompanion",
        id: "charmander",
        label: "Follow me: Thermal Bot"
      }
    });
  });

  it("does not keep showing a generic talk prompt for Pokemon already following", () => {
    const result = findNearbyInteractable(
      [POKEMON_TALK_INTERACT_DISTANCE - 0.05, 0, 0],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurFollowing: true
        }
      },
      [],
      null,
      null,
      null,
      null,
      null,
      {
        visible: true,
        position: [0, 0.02, 0]
      }
    );

    expect(result).toBeNull();
  });

  it("uses Bulbasaur's dismantled module position for the first repair interaction", () => {
    const storyState = {
      flags: {
        bulbasaurRevealed: false,
        chopperBulbasaurRepairBoxIntroComplete: true,
        rustlingGrassCellId: "ground-3-1"
      }
    };
    const grassPatches = [
      {
        id: "grass-3",
        cellId: "ground-3-1",
        position: [2.1, 0.02, -4.2],
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
      [2.2, 0, -4.1],
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
      label: "Check on Grow Bot",
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
        label: "Help Thermal Bot",
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
      label: "Help Thermal Bot",
      cellId: "ground-8-7"
    });
    expect(resultNearTimburrModule?.target).toEqual({
      kind: "timburrGrassEncounter",
      id: "timburrRustlingGrass",
      label: "Help Builder Bot",
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
        label: "Talk to Grow Bot",
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
        position: [2.1, 0.02, -4.2],
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
      [2.2, 0, -4.1],
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
        label: "Talk to Grow Bot",
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
        label: "Talk to Grow Bot",
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
        label: "Talk to Grow Bot",
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
        label: "Talk to Grow Bot",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("holds Bulbasaur request turn-in while the early freedom window is active", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          bulbasaurRevealed: true,
          bulbasaurDryGrassMissionAccepted: true,
          bulbasaurDryGrassMissionComplete: true,
          firstRequiredTaughtActionFreedomWindowActive: true,
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

    expect(result).toBe(null);
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
        label: "Help Builder Bot",
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

    storyState.flags.leppaBerryDropped = true;
    leppaTree.berryDropped = true;

    expect(findNearbyLeppaTree([5.5, 0, 2], leppaTree, storyState)).toEqual({
      leppaTree,
      action: "leafageOptions",
      distance: expect.any(Number)
    });
  });

  it("finds dry tiles around the Leppa tree for mission guidance", () => {
    const leppaTree = {
      position: [2, 0.02, 2]
    };
    const eastTile = { id: "east", offset: [3.4, 0, 2], tileSpan: 1.425 };
    const westTile = { id: "west", offset: [0.6, 0, 2], tileSpan: 1.425 };
    const centerTile = { id: "center", offset: [2, 0, 2], tileSpan: 1.425 };
    const farTile = { id: "far", offset: [6, 0, 2], tileSpan: 1.425 };
    const inactiveTile = {
      id: "inactive",
      offset: [2, 0, 3.4],
      tileSpan: 1.425,
      active: false
    };

    expect(getLeppaTreeSurroundingGroundCells(leppaTree, [
      eastTile,
      westTile,
      centerTile,
      farTile,
      inactiveTile
    ])).toEqual([eastTile, westTile]);
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

  it("detects Bulbasaur's Solar Station recipe prompt after the first challenge set", () => {
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

  it("detects Bulbasaur's request turn-in after the Solar Station is placed", () => {
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
        label: "Talk to Grow Bot",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });

  it("counts a tree only once for Bulbasaur's Solar Station challenge", () => {
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

    const fieldDrops = [];
    const firstWatering = waterNearbyPalm(
      [1.2, 0, 1.1],
      treeModel,
      palmInstances,
      storyState,
      fieldDrops
    );
    const duplicateWatering = waterNearbyPalm(
      [1.2, 0, 1.1],
      treeModel,
      palmInstances,
      storyState,
      fieldDrops
    );

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
    expect(fieldDrops).toHaveLength(1);
    expect(fieldDrops.every((drop) => drop.itemId === LEAVES_ITEM_ID)).toBe(true);
    expect(duplicateWatering.leafDrops).toEqual([]);
    expect(storyState.flags.wateredTreeCount).toBe(5);
    expect(storyState.flags.bulbasaurStrawBedChallengeComplete).toBe(true);
    expect(updateBulbasaurStrawBedChallengeCompletion(storyState)).toBe(false);
  });

  it("collects leaf drops like wood drops when the player walks over them", () => {
    const inventory = {
      [LEAVES_ITEM_ID]: 0
    };
    const fieldDrops = [
      {
        id: "leaf-palm-0-1",
        itemId: LEAVES_ITEM_ID,
        position: [1, 0.03, 1],
        size: [0.66, 0.66],
        uvRect: [0, 0, 1, 1],
        pickupRadius: 0.64,
        collected: false
      }
    ];

    expect(collectLeafDrops([1.1, 0, 1.05], fieldDrops, inventory)).toBe(1);
    expect(inventory[LEAVES_ITEM_ID]).toBe(1);
    expect(fieldDrops[0].collected).toBe(true);
  });

  it("collects leaf piles from the ground into supplies", () => {
    const inventory = {
      [LEAVES_ITEM_ID]: 0
    };
    const resourceNodes = [
      {
        id: "leaf-pile-test",
        itemId: LEAVES_ITEM_ID,
        position: [1, 0.03, 1],
        yield: 2,
        respawnDuration: 12,
        interactDistance: 0.75,
        cooldown: 0,
        activeWhen: () => true
      }
    ];

    expect(collectLeafResourceNodes(
      [1.1, 0, 1.05],
      resourceNodes,
      { flags: { bulbasaurRevealed: true } },
      inventory
    )).toBe(2);
    expect(inventory[LEAVES_ITEM_ID]).toBe(2);
    expect(resourceNodes[0].cooldown).toBe(12);
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
        label: "Save Game"
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
        label: "Save Game"
      },
      distance: expect.any(Number)
    });
  });

  it("uses a forgiving reach for station and site object interactables", () => {
    const colonyTerminal = INTERACTABLE_DEFS.find((interactable) => {
      return interactable.id === "pokemonCenterPc";
    });

    expect(findNearbyInteractable(
      [
        POKEMON_CENTER_PC_POSITION[0] + COLONY_TERMINAL_INTERACT_DISTANCE - 0.05,
        0,
        POKEMON_CENTER_PC_POSITION[2]
      ],
      [],
      [colonyTerminal],
      { flags: { ruinedPokemonCenterInspected: true } }
    )).toEqual({
      target: {
        kind: "site",
        id: "pokemonCenterPc",
        label: "Colony Terminal"
      },
      distance: expect.any(Number)
    });
  });

  it("keeps the Pokemon Center PC active when Timburr was revealed before the reward-ready flag", () => {
    const pokemonCenterPc = INTERACTABLE_DEFS.find((interactable) => {
      return interactable.id === "pokemonCenterPc";
    });
    const storyState = {
      flags: {
        ruinedPokemonCenterInspected: true,
        timburrRevealed: true,
        boulderChallengeRewardReady: false,
        boulderChallengeRewardClaimed: false
      }
    };

    expect(canClaimBoulderChallengeReward(storyState)).toBe(true);
    expect(pokemonCenterPc.activeWhen(storyState)).toBe(true);
    expect(findNearbyInteractable(
      POKEMON_CENTER_PC_POSITION,
      [],
      [pokemonCenterPc],
      storyState
    )).toEqual({
      target: {
        kind: "site",
        id: "pokemonCenterPc",
        label: "Colony Terminal"
      },
      distance: expect.any(Number)
    });
  });

  it("keeps the Pokemon Center PC active after inspection even without a pending reward", () => {
    const pokemonCenterPc = INTERACTABLE_DEFS.find((interactable) => {
      return interactable.id === "pokemonCenterPc";
    });

    expect(pokemonCenterPc.activeWhen({
      flags: {
        ruinedPokemonCenterInspected: true,
        challengesUnlocked: true,
        boulderChallengeRewardClaimed: true,
        newPcChallengesChecked: true,
        leafDenKitPurchased: true
      }
    })).toBe(true);
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
    })).toBe("[X / Enter] Place the Log Chair nearby");
  });

  it("detects the placed House Kit as a construction target", () => {
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
    expect(findNearbyLeafDen([leafDen.position[0] + 4.25, 0, leafDen.position[2]], leafDen, storyState)).toEqual({
      leafDen,
      distance: expect.any(Number)
    });

    expect(leafDen).toMatchObject({
      kind: "constructionSite",
      constructionSiteId: "leaf-den-0",
      buildingKitId: "leafDenKit",
      constructionName: "House",
      constructionStatus: "incomplete",
      interactionBox: {
        id: "leaf-den-0-interaction-box",
        markerKey: "workbench",
        offset: [1.02, 1.18, -0.42]
      }
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
        label: "House"
      },
      distance: expect.any(Number)
    });
  });

  it("describes House Kit placement and construction prompts", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        leafDenKitPlacement: true
      },
      quest: {
        title: "Build a House",
        actionLabel: "Place"
      }
    })).toBe("[X / Enter] Place the House Kit");

    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "leafDenConstruction",
          id: "leafDen",
          label: "House"
        }
      },
      quest: {
        title: "Build a House",
        actionLabel: "Inspect"
      },
      storyState: {
        flags: {}
      }
    })).toBe("[E / X] House • Start construction");
  });

  it("detects the completed House as an entrance", () => {
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
        label: "House"
      },
      distance: expect.any(Number)
    });

    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "leafDenEntrance",
          id: "leafDen",
          label: "House"
        }
      },
      quest: {
        title: "Furnitures inside House",
        actionLabel: "Enter"
      }
    })).toBe("[E / X] House • Enter");
  });

  it("detects Timburr as the House furniture request turn-in", () => {
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
        label: "Talk to Builder Bot"
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
        label: "Talk to Thermal Bot"
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

  it("builds a Solar Station placement on the supplied habitat anchor", () => {
    expect(buildStrawBedPlacement([8.5, 0.02, -5.5])).toEqual({
      id: "straw-bed-0",
      position: [8.5, 0.02, -5.5],
      size: [1.55, 1.02],
      uvRect: [0, 0, 1, 1]
    });
  });

  it("validates BuildingKit placement terrain and occupied space", () => {
    expect(validateBuildingKitPlacement({
      position: [4, 0.02, 5],
      size: [1.95, 1.45],
      blockers: []
    })).toEqual({
      valid: true,
      reason: "valid"
    });

    expect(validateBuildingKitPlacement({
      position: [145, 0.02, 0],
      size: [1.95, 1.45]
    })).toEqual({
      valid: false,
      reason: "invalid-terrain"
    });

    expect(validateBuildingKitPlacement({
      position: [4, 0.02, 5],
      size: [1.95, 1.45],
      blockers: [
        {
          position: [4.4, 0.02, 5.2],
          size: [1.2, 1.2]
        }
      ]
    })).toMatchObject({
      valid: false,
      reason: "occupied-space"
    });
  });

  it("describes the Solar Station placement action in the nearby prompt", () => {
    expect(buildNearbyPrompt({
      harvestTarget: {
        strawBedPlacement: {
          canPlace: true
        }
      },
      quest: {
        title: "Solar Station Recipe",
        actionLabel: "Place"
      }
    })).toBe("[X / Enter] Place the Solar Station on open terrain");
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
    })).toBe("[X / Enter] Place the Colony Flag on the House");
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
    })).toBe("[E / X] Workbench");
  });

  it("normalizes legacy prompt copy at the world prompt boundary", () => {
    expect(normalizeWorldPromptCopy("Talk to Bulbasaur with Water Gun near the Pokemon Center PC")).toBe(
      "Talk to Grow Bot with Hydro Jet near the Colony Terminal"
    );

    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "site",
          id: "pokemonCenterPc",
          label: "Pokemon Center PC"
        }
      },
      quest: {
        title: "Open Pokedex Challenges",
        actionLabel: "Check"
      }
    })).toBe("[E / X] Colony Terminal • Check terminal");
  });

  it("describes the revived Leppa tree Leafage selector in the nearby prompt", () => {
    expect(buildNearbyPrompt({
      interactTarget: {
        target: {
          kind: "leppaTreeLeafageOptions",
          label: "Bio-Grow Options"
        }
      },
      quest: {
        title: "Any quest",
        actionLabel: "Choose"
      }
    })).toBe("[E / X] Bio-Grow Options • Choose Bio-Grow object");
  });

  it("detects a nearby Leafage-instantiated object as destroyable", () => {
    const result = findNearbyInteractable(
      [1.15, 0, 0.2],
      [],
      [],
      { flags: { bulbasaurRevealed: true } },
      [
        {
          id: "leafage-grass-ground-1",
          cellId: "ground-1",
          source: "leafage",
          leafageObjectId: "garden1",
          state: "alive",
          position: [1, 0.02, 0],
          size: [1.42, 1.18]
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "leafage-grass-ground-1",
        label: "Garden-1",
        action: "destroyInstantiatedObject",
        cellId: "ground-1"
      },
      distance: expect.any(Number)
    });
    expect(buildNearbyPrompt({
      interactTarget: result,
      quest: {
        title: "Any quest",
        actionLabel: "Destroy"
      }
    })).toBe("[Y] Garden-1 • Destroy");
  });

  it("does not detect world dry grass as destroyable before Bulbasaur is unlocked", () => {
    const result = findNearbyDestroyableInstantiatedObject(
      [1.15, 0, 0.2],
      [
        {
          id: "dry-grass-ground-1",
          cellId: "ground-1",
          state: "dead",
          position: [1, 0.02, 0],
          size: [1.18, 0.96]
        }
      ],
      { flags: {} }
    );

    expect(result).toBeNull();
  });

  it("detects a nearby Leafage-instantiated flower as destroyable", () => {
    const result = findNearbyInteractable(
      [1.15, 0, 0.2],
      [],
      [],
      { flags: { bulbasaurRevealed: true } },
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      [
        {
          id: "leafage-flower-ground-1",
          cellId: "ground-1",
          habitatGroupId: "leafage-flower-bed-habitat-0",
          source: "leafage",
          state: "alive",
          position: [1, 0.02, 0],
          size: [1.12, 1.12]
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "leafage-flower-ground-1",
        label: "Flower",
        action: "destroyInstantiatedObject",
        cellId: "ground-1"
      },
      distance: expect.any(Number)
    });
  });

  it("detects a nearby restored flower as destroyable with Y", () => {
    const result = findNearbyInteractable(
      [1.15, 0, 0.2],
      [],
      [],
      { flags: { bulbasaurRevealed: true } },
      [],
      null,
      null,
      null,
      null,
      null,
      null,
      [
        {
          id: "flower-ground-1",
          cellId: "ground-1",
          habitatGroupId: "water-gun-flower-field-0",
          state: "alive",
          position: [1, 0.02, 0],
          size: [1.12, 1.12]
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "flower-ground-1",
        label: "Flower",
        action: "destroyInstantiatedObject",
        cellId: "ground-1"
      },
      distance: expect.any(Number)
    });
    expect(buildNearbyPrompt({
      interactTarget: result,
      quest: {
        title: "Any quest",
        actionLabel: "Destroy"
      }
    })).toBe("[Y] Flower • Destroy");
  });

  it("detects nearby restored green grass as destroyable with Y", () => {
    const result = findNearbyDestroyableInstantiatedObject(
      [1.15, 0, 0.2],
      [
        {
          id: "grass-ground-1",
          cellId: "ground-1",
          state: "alive",
          position: [1, 0.02, 0],
          size: [1.18, 0.96]
        }
      ],
      { flags: { bulbasaurRevealed: true } }
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "grass-ground-1",
        label: "Tall Grass",
        action: "destroyInstantiatedObject",
        cellId: "ground-1"
      },
      distance: expect.any(Number)
    });
    expect(buildNearbyPrompt({
      interactTarget: result,
      quest: {
        title: "Any quest",
        actionLabel: "Destroy"
      }
    })).toBe("[Y] Tall Grass • Destroy");
  });

  it("detects nearby dry grass as destroyable with Y", () => {
    const result = findNearbyInteractable(
      [1.15, 0, 0.2],
      [],
      [],
      { flags: { bulbasaurRevealed: true } },
      [
        {
          id: "dry-grass-ground-1",
          cellId: "ground-1",
          state: "dead",
          position: [1, 0.02, 0],
          size: [1.18, 0.96]
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "site",
        id: "dry-grass-ground-1",
        label: "Dry Grass",
        action: "destroyInstantiatedObject",
        cellId: "ground-1"
      },
      distance: expect.any(Number)
    });
    expect(buildNearbyPrompt({
      interactTarget: result,
      quest: {
        title: "Any quest",
        actionLabel: "Destroy"
      }
    })).toBe("[Y] Dry Grass • Destroy");
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
    })).toBe("[Enter] Use Bio-Grow to grow tall grass");
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
    })).toBe("Bio-Grow: grow tall grass on restored ground.");

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
    })).toBe("Hydro Jet: Hydro Bot has 2 tiles queued.");
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
    })).toBe("[Enter] Mark dry ground for Hydro Bot • 1 queued");
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
