import { describe, expect, it, vi } from "vitest";
import { createGameplayInteractions } from "../world/gameplayInteractions.js";
import { HABITAT_EVENT } from "../app/sandbox/habitatData.js";
import {
  BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION,
  CAMPFIRE_ITEM_ID,
  DITTO_FLAG_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  LEAVES_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  PLACEHOLDER_RECIPES,
  STRAW_BED_ITEM_ID
} from "../gameplayContent.js";
import {
  addItems,
  consumeItems
} from "../story/progression.js";

function createInteractions(overrides = {}) {
  return createGameplayInteractions({
    npcProfiles: {},
    placeholderRecipes: {},
    getActiveQuest: () => ({
      id: "freeRoam",
      title: "Free Roam",
      actionLabel: "Explore",
    }),
    hasItems: () => true,
    consumeItems: vi.fn(() => true),
    addItems: vi.fn(),
    formatRequirementSummary: () => "",
    getItemLabel: (itemId) => itemId,
    showPokedexEntry: vi.fn(),
    findNearbyInteractable: vi.fn(() => null),
    findNearbyHarvestTarget: vi.fn(() => null),
    findNearbyGroundCell: vi.fn(() => null),
    purifyGroundCell: vi.fn(() => false),
    reviveGroundGrass: vi.fn(),
    strikeNearbyPalm: vi.fn(() => ({
      hit: false,
      felled: false,
      palm: null,
      nextWoodDropId: 1
    })),
    syncInventoryUi: vi.fn(),
    pushNotice: vi.fn(),
    ...overrides
  });
}

describe("createGameplayInteractions", () => {
  it("advances the onboarding quest when talking to Tangrowth", () => {
    const pushNotice = vi.fn();
    let onComplete = null;
    const startDialogue = vi.fn(({ onComplete: nextOnComplete }) => {
      onComplete = nextOnComplete;
      return true;
    });
    const interactions = createInteractions({
      startDialogue,
      getActiveQuest: () => ({
        id: "meetTangrowth",
        title: "Talk to Tangrowth",
        actionLabel: "E / Talk",
        resolveLine: "Tangrowth onboarding complete."
      }),
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Tangrowth"
        },
        distance: 1.2
      })),
      pushNotice
    });
    const storyState = {
      questIndex: 0,
      flags: {}
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {}
    });

    expect(result).toBe(true);
    expect(startDialogue).toHaveBeenCalledWith({
      targetId: "tangrowth",
      dialogueId: "onboarding",
      onComplete: expect.any(Function)
    });
    expect(storyState.questIndex).toBe(0);
    onComplete();
    expect(storyState.questIndex).toBe(1);
    expect(pushNotice).toHaveBeenCalledWith(
      expect.stringContaining("Tangrowth onboarding complete.")
    );
  });

  it("escalates repeated empty interactions into a valid input hint", () => {
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      pushNotice
    });
    const action = {
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: { questIndex: 0, flags: {} },
      inventory: {}
    };

    expect(interactions.performInteractAction(action)).toBe(false);
    expect(interactions.performInteractAction(action)).toBe(false);

    expect(pushNotice).toHaveBeenNthCalledWith(
      1,
      "Nothing to talk to nearby. Move closer to a marker or character, then press E."
    );
    expect(pushNotice).toHaveBeenNthCalledWith(
      2,
      "Still nothing nearby. Look for a PRESS X bubble or move closer, then press A / E / X."
    );
  });

  it("requests Professor Tangrowth's house-building talk when available", () => {
    const onTangrowthHouseTalkRequested = vi.fn();
    const interactions = createInteractions({
      onTangrowthHouseTalkRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Professor Tangrowth"
        },
        distance: 1.05
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          tangrowthHouseTalkAvailable: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onTangrowthHouseTalkRequested).toHaveBeenCalledWith({
      targetId: "tangrowth"
    });
  });

  it("purifies a nearby corrupted ground cell when the water power is available", () => {
    const groundCell = {
      id: "ground-1-1",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const groundDeadInstances = [groundCell];
    const groundPurifiedInstances = [];
    const pushNotice = vi.fn();
    const purifyGroundCell = vi.fn(() => true);
    const reviveGroundGrass = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.32
      })),
      purifyGroundCell,
      reviveGroundGrass,
      pushNotice
    });

    const result = interactions.performHarvestAction({
      playerPosition: [0.1, 0, 0.1],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: { questIndex: 0, flags: {} },
      woodDrops: [],
      groundDeadInstances,
      groundGrassPatches: [],
      groundPurifiedInstances,
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(purifyGroundCell).toHaveBeenCalledWith(
      groundCell,
      groundDeadInstances,
      groundPurifiedInstances
    );
    expect(reviveGroundGrass).toHaveBeenCalledWith(groundCell, []);
    expect(pushNotice).toHaveBeenCalledWith("Chao purificado.");
  });

  it("can purify a specific ground cell through a forced harvest target", () => {
    const groundCell = {
      id: "ground-2-2",
      offset: [2, 0, 2],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const groundDeadInstances = [groundCell];
    const groundPurifiedInstances = [];
    const findNearbyGroundCell = vi.fn(() => null);
    const purifyGroundCell = vi.fn(() => true);
    const interactions = createInteractions({
      findNearbyGroundCell,
      purifyGroundCell
    });

    const result = interactions.performHarvestAction({
      playerPosition: [10, 0, 10],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: { questIndex: 0, flags: {} },
      woodDrops: [],
      groundDeadInstances,
      groundGrassPatches: [],
      groundPurifiedInstances,
      canPurifyGround: true,
      forcedHarvestTarget: {
        groundCell,
        distance: 0
      }
    });

    expect(result).toBe(true);
    expect(findNearbyGroundCell).not.toHaveBeenCalled();
    expect(purifyGroundCell).toHaveBeenCalledWith(
      groundCell,
      groundDeadInstances,
      groundPurifiedInstances
    );
  });

  it("emits a ground-item callback when harvesting a resource node", () => {
    const resourceNode = {
      id: "reed-node",
      itemId: "reed",
      yield: 2,
      respawnDuration: 8
    };
    const syncInventoryUi = vi.fn();
    const onGroundItemCollected = vi.fn();
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      findNearbyHarvestTarget: vi.fn(() => ({
        resourceNode,
        distance: 0.4
      })),
      syncInventoryUi,
      onGroundItemCollected,
      pushNotice
    });
    const inventory = {};

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [resourceNode],
      inventory,
      storyState: { questIndex: 0, flags: {} },
      woodDrops: []
    });

    expect(result).toBe(true);
    expect(inventory.reed).toBe(2);
    expect(resourceNode.cooldown).toBe(8);
    expect(syncInventoryUi).toHaveBeenCalledWith(inventory);
    expect(onGroundItemCollected).toHaveBeenCalledWith({
      itemId: "reed",
      amount: 2
    });
    expect(pushNotice).toHaveBeenCalledWith("+2 reed");
  });

  it("keeps the old no-resource fallback when the purification power is unavailable", () => {
    const findNearbyGroundCell = vi.fn();
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell,
      pushNotice
    });

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: { questIndex: 0, flags: {} },
      woodDrops: [],
      groundDeadInstances: [],
      groundPurifiedInstances: [],
      canPurifyGround: false
    });

    expect(result).toBe(false);
    expect(findNearbyGroundCell).not.toHaveBeenCalled();
    expect(pushNotice).toHaveBeenCalledWith(
      "No resource in range. Move closer to a tree or drop, then press Enter."
    );
  });

  it("escalates repeated empty field actions into a visible target hint", () => {
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      pushNotice
    });
    const action = {
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: { questIndex: 0, flags: {} },
      woodDrops: [],
      groundDeadInstances: [],
      groundPurifiedInstances: [],
      canPurifyGround: true
    };

    expect(interactions.performHarvestAction(action)).toBe(false);
    expect(interactions.performHarvestAction(action)).toBe(false);

    expect(pushNotice).toHaveBeenNthCalledWith(
      1,
      "No target in range. Move closer to dry ground, grass, a tree, or a marker, then press Enter."
    );
    expect(pushNotice).toHaveBeenNthCalledWith(
      2,
      "Still no target. Move until a tile outline or PRESS X bubble appears, then press Enter / X."
    );
  });

  it("advances the quest when the player finds the stranded pokemon", () => {
    const pushNotice = vi.fn();
    let onComplete = null;
    const unlockPlayerAbility = vi.fn();
    const unlockPokedexReward = vi.fn();
    const startDialogue = vi.fn(({ onComplete: nextOnComplete }) => {
      onComplete = nextOnComplete;
      return true;
    });
    const interactions = createInteractions({
      startDialogue,
      unlockPlayerAbility,
      unlockPokedexReward,
      getActiveQuest: () => ({
        id: "findPokemon",
        title: "Find the Pokemon",
        actionLabel: "E / Talk",
        resolveLine: "You found the stranded Pokemon."
      }),
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "site",
          id: "squirtle",
          label: "Stranded Pokemon"
        },
        distance: 1.1
      })),
      pushNotice
    });
    const storyState = {
      questIndex: 1,
      flags: {}
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {}
    });

    expect(result).toBe(true);
    expect(startDialogue).toHaveBeenCalledWith({
      targetId: "squirtle",
      dialogueId: "discovery",
      onComplete: expect.any(Function)
    });
    expect(storyState.questIndex).toBe(1);
    expect(unlockPlayerAbility).not.toHaveBeenCalled();
    expect(unlockPokedexReward).not.toHaveBeenCalled();
    onComplete();
    expect(unlockPlayerAbility).toHaveBeenCalledWith("waterGun");
    expect(unlockPokedexReward).toHaveBeenCalledTimes(1);
    expect(storyState.questIndex).toBe(2);
    expect(pushNotice).toHaveBeenCalledWith(
      expect.stringContaining("You found the stranded Pokemon.")
    );
  });

  it("shows a special notice when the player restores the first dead grass", () => {
    const groundCell = {
      id: "ground-1-1",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const pushNotice = vi.fn();
    const habitatSystem = { recordEvent: vi.fn() };
    const onFirstGrassRestored = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.32
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => true),
      onFirstGrassRestored,
      habitatSystem,
      pushNotice
    });
    const storyState = {
      questIndex: 0,
      flags: {
        firstGrassRestored: false
      }
    };

    const result = interactions.performHarvestAction({
      playerPosition: [0.1, 0, 0.1],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundPurifiedInstances: [],
      groundGrassPatches: [{ cellId: groundCell.id, state: "dead" }],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.firstGrassRestored).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith("You've restored a dead grass!");
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.REVIVE_PATCH,
      targetId: "grass"
    });
    expect(onFirstGrassRestored).toHaveBeenCalledTimes(1);
  });

  it("counts any purified ground tile as restored patch quest progress", () => {
    const groundCell = {
      id: "ground-1-2",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const questSystem = { emit: vi.fn() };
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.32
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => null),
      questSystem
    });

    const result = interactions.performHarvestAction({
      playerPosition: [0.1, 0, 0.1],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: {
        questIndex: 0,
        flags: {
          firstGrassRestored: false
        }
      },
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundPurifiedInstances: [],
      groundGrassPatches: [],
      groundFlowerPatches: [],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(questSystem.emit).toHaveBeenCalledWith({
      type: "BUILD",
      targetId: "revived-habitat"
    });
  });

  it("schedules a delayed rustling grass encounter after enough grass is restored", () => {
    const groundCell = {
      id: "ground-4-4",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const restoredPatch = {
      id: "tall-grass-habitat-0-grass-3",
      cellId: groundCell.id,
      habitatGroupId: "tall-grass-habitat-0",
      state: "alive"
    };
    const habitatSystem = {
      recordEvent: vi.fn((event) => {
        if (
          event.type === HABITAT_EVENT.RESTORE_HABITAT &&
          event.targetId === "tall-grass"
        ) {
          storyState.flags.tallGrassDiscovered = true;
        }
      })
    };
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.28
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => restoredPatch),
      habitatSystem,
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 0,
      flags: {
        firstGrassRestored: true,
        restoredGrassCount: 3,
        tallGrassDiscovered: false
      }
    };

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundPurifiedInstances: [],
      groundGrassPatches: [
        {
          id: "tall-grass-habitat-0-grass-0",
          cellId: "ground-4-3",
          habitatGroupId: "tall-grass-habitat-0",
          state: "alive"
        },
        {
          id: "tall-grass-habitat-0-grass-1",
          cellId: "ground-5-3",
          habitatGroupId: "tall-grass-habitat-0",
          state: "alive"
        },
        {
          id: "tall-grass-habitat-0-grass-2",
          cellId: "ground-5-4",
          habitatGroupId: "tall-grass-habitat-0",
          state: "alive"
        },
        restoredPatch
      ],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.restoredGrassCount).toBe(4);
    expect(storyState.flags.tallGrassDiscovered).toBe(true);
    expect(storyState.flags.rustlingGrassCellId).toBeUndefined();
    expect(storyState.flags.pendingRustlingGrassCellId).toBe("ground-4-3");
    expect(storyState.flags.rustlingGrassDelay).toBeGreaterThan(0);
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.REVIVE_PATCH,
      targetId: "grass"
    });
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "tall-grass"
    });
  });

  it("grows Leafage tall grass and starts Charmander's rustling grass encounter", () => {
    const groundCell = {
      id: "ground-8-8",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const pushNotice = vi.fn();
    const questSystem = {
      emit: vi.fn()
    };
    const habitatSystem = {
      recordEvent: vi.fn()
    };
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.22
      })),
      questSystem,
      habitatSystem,
      pushNotice
    });
    const storyState = {
      questIndex: 2,
      flags: {
        leafageTallGrassCount: 3
      }
    };
    const groundGrassPatches = [
      {
        id: "leafage-grass-a",
        cellId: "ground-8-7",
        habitatGroupId: "leafage-tall-grass-habitat-0",
        state: "alive"
      },
      {
        id: "leafage-grass-b",
        cellId: "ground-9-7",
        habitatGroupId: "leafage-tall-grass-habitat-0",
        state: "alive"
      },
      {
        id: "leafage-grass-c",
        cellId: "ground-9-8",
        habitatGroupId: "leafage-tall-grass-habitat-0",
        state: "alive"
      }
    ];

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [],
      groundPurifiedInstances: [groundCell],
      groundGrassPatches,
      groundFlowerPatches: [],
      canUseLeafage: true
    });

    expect(result).toBe(true);
    expect(groundGrassPatches).toHaveLength(4);
    expect(storyState.flags.leafageTallGrassCount).toBe(4);
    expect(storyState.flags.leafageTallGrassHabitatCreated).toBe(true);
    expect(storyState.flags.charmanderRustlingGrassCellId).toBe("ground-8-7");
    expect(questSystem.emit).toHaveBeenCalledWith({
      type: "PLACE",
      targetId: "leafy-home-patch"
    });
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "tall-grass"
    });
    expect(pushNotice).toHaveBeenCalledWith("A patch of tall grass is rustling.", 3.4);
  });

  it("finds a Leafage target without rebuilding the full ground grid candidate list", () => {
    const targetGroundCell = {
      id: "near-leafage-cell",
      offset: [0, 0, 0],
      surfaceY: 0,
      tileSpan: 1.425,
      active: true,
      purifiable: true
    };
    const groundPurifiedInstances = [
      ...Array.from({ length: 2500 }, (_, index) => ({
        id: `far-leafage-cell-${index}`,
        offset: [120 + index, 0, 120],
        surfaceY: 0,
        tileSpan: 1.425,
        active: true,
        purifiable: true
      })),
      targetGroundCell
    ];
    const findNearbyGroundCell = vi.fn(() => {
      throw new Error("Leafage target lookup should use the optimized direct scan.");
    });
    const interactions = createInteractions({
      findNearbyGroundCell,
      pushNotice: vi.fn()
    });
    const groundGrassPatches = [];

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: {
        questIndex: 2,
        flags: {}
      },
      woodDrops: [],
      groundDeadInstances: [],
      groundPurifiedInstances,
      groundGrassPatches,
      groundFlowerPatches: [],
      canUseLeafage: true
    });

    expect(result).toBe(true);
    expect(findNearbyGroundCell).not.toHaveBeenCalled();
    expect(groundGrassPatches).toEqual([
      expect.objectContaining({
        cellId: "near-leafage-cell",
        state: "alive"
      })
    ]);
  });

  it("does not grow Leafage on dry ground that has not been watered", () => {
    const dryGroundCell = {
      id: "dry-leafage-cell",
      offset: [0, 0, 0],
      surfaceY: 0,
      tileSpan: 1.425,
      active: true,
      purifiable: true
    };
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell: dryGroundCell,
        distance: 0.2
      })),
      pushNotice
    });
    const groundGrassPatches = [];

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: {
        questIndex: 2,
        flags: {}
      },
      woodDrops: [],
      groundDeadInstances: [dryGroundCell],
      groundPurifiedInstances: [],
      groundGrassPatches,
      groundFlowerPatches: [],
      canUseLeafage: true
    });

    expect(result).toBe(false);
    expect(groundGrassPatches).toEqual([]);
    expect(pushNotice).toHaveBeenCalledWith(
      "Leafage needs restored ground. Use Water Gun here first."
    );
  });

  it("shows a tall grass habitat notice when a full grass group is restored", () => {
    const groundCell = {
      id: "ground-4-4",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const restoredPatch = {
      id: "tall-grass-habitat-0-grass-3",
      cellId: groundCell.id,
      habitatGroupId: "tall-grass-habitat-0",
      state: "alive"
    };
    const habitatSystem = { recordEvent: vi.fn() };
    const pushNotice = vi.fn();
    const onTallGrassHabitatRestored = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.28
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => restoredPatch),
      habitatSystem,
      onTallGrassHabitatRestored,
      pushNotice
    });
    const storyState = {
      questIndex: 0,
      flags: {
        firstGrassRestored: true
      }
    };

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundPurifiedInstances: [],
      groundGrassPatches: [
        {
          id: "tall-grass-habitat-0-grass-0",
          cellId: "ground-4-3",
          habitatGroupId: "tall-grass-habitat-0",
          state: "alive"
        },
        {
          id: "tall-grass-habitat-0-grass-1",
          cellId: "ground-5-3",
          habitatGroupId: "tall-grass-habitat-0",
          state: "alive"
        },
        {
          id: "tall-grass-habitat-0-grass-2",
          cellId: "ground-5-4",
          habitatGroupId: "tall-grass-habitat-0",
          state: "alive"
        },
        restoredPatch
      ],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.restoredTallGrassHabitatIds).toEqual([
      "tall-grass-habitat-0"
    ]);
    expect(pushNotice).toHaveBeenCalledWith(
      "You've restored a tall grass habitat!",
      3.6
    );
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "tall-grass"
    });
    expect(onTallGrassHabitatRestored).toHaveBeenCalledWith({
      groundCell,
      restoredGrassHabitat: {
        id: "tall-grass-habitat-0",
        patches: expect.any(Array)
      },
      newlyDiscoveredHabitats: []
    });
  });

  it("triggers Tangrowth's flower recovery comment after enough flowers are revived", () => {
    const groundCell = {
      id: "ground-6-2",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const onFlowersRecovered = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.28
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => false),
      reviveGroundFlower: vi.fn(() => true),
      onFlowersRecovered,
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 0,
      flags: {
        firstGrassRestored: true,
        restoredGrassCount: 1,
        tallGrassDiscovered: false,
        restoredFlowerCount: 1,
        tangrowthFlowerCommentSeen: false
      }
    };

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundFlowerPatches: [{ cellId: groundCell.id, state: "dead" }],
      groundGrassPatches: [],
      groundPurifiedInstances: [],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.restoredFlowerCount).toBe(2);
    expect(storyState.flags.tangrowthFlowerCommentSeen).toBe(true);
    expect(onFlowersRecovered).toHaveBeenCalledTimes(1);
  });

  it("shows a pretty flower bed habitat notice when a full flower group is restored", () => {
    const groundCell = {
      id: "ground-8-6",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const restoredPatch = {
      id: "pretty-flower-bed-habitat-0-flower-3",
      cellId: groundCell.id,
      habitatGroupId: "pretty-flower-bed-habitat-0",
      state: "alive"
    };
    const habitatSystem = { recordEvent: vi.fn() };
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.28
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => false),
      reviveGroundFlower: vi.fn(() => restoredPatch),
      habitatSystem,
      pushNotice
    });
    const storyState = {
      questIndex: 0,
      flags: {
        restoredFlowerCount: 3,
        tangrowthFlowerCommentSeen: true
      }
    };

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundFlowerPatches: [
        {
          id: "pretty-flower-bed-habitat-0-flower-0",
          cellId: "ground-7-5",
          habitatGroupId: "pretty-flower-bed-habitat-0",
          state: "alive"
        },
        {
          id: "pretty-flower-bed-habitat-0-flower-1",
          cellId: "ground-8-5",
          habitatGroupId: "pretty-flower-bed-habitat-0",
          state: "alive"
        },
        {
          id: "pretty-flower-bed-habitat-0-flower-2",
          cellId: "ground-7-6",
          habitatGroupId: "pretty-flower-bed-habitat-0",
          state: "alive"
        },
        restoredPatch
      ],
      groundGrassPatches: [],
      groundPurifiedInstances: [],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.restoredFlowerCount).toBe(4);
    expect(storyState.flags.restoredFlowerBedHabitatIds).toEqual([
      "pretty-flower-bed-habitat-0"
    ]);
    expect(pushNotice).toHaveBeenCalledWith(
      "You've restored a pretty flower bed habitat!",
      3.6
    );
    expect(pushNotice).not.toHaveBeenCalledWith("Chao purificado.");
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.REVIVE_PATCH,
      targetId: "flower"
    });
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "pretty-flower-bed"
    });
  });

  it("reveals Bulbasaur when the player interacts with the rustling grass", () => {
    const onBulbasaurRevealed = vi.fn();
    const interactions = createInteractions({
      onBulbasaurRevealed,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "grassEncounter",
          id: "rustlingGrass",
          label: "Investigate the rustling grass",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 2,
      flags: {
        bulbasaurRevealed: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(storyState.flags.bulbasaurRevealed).toBe(true);
    expect(onBulbasaurRevealed).toHaveBeenCalledWith({
      cellId: "ground-2-3"
    });
  });

  it("reveals Charmander when the player inspects the Leafage rustling grass", () => {
    const onCharmanderRevealed = vi.fn();
    const interactions = createInteractions({
      onCharmanderRevealed,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "charmanderGrassEncounter",
          id: "charmanderRustlingGrass",
          label: "Inspect the rustling grass",
          cellId: "ground-8-7"
        },
        distance: 1.05
      }))
    });
    const storyState = {
      questIndex: 2,
      flags: {
        charmanderRevealed: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(storyState.flags.charmanderRevealed).toBe(true);
    expect(onCharmanderRevealed).toHaveBeenCalledWith({
      cellId: "ground-8-7"
    });
  });

  it("accepts Bulbasaur's dry grass mission from the Bulbasaur interaction", () => {
    const onBulbasaurDryGrassMissionAccepted = vi.fn();
    const onNpcInteractionStart = vi.fn();
    const interactions = createInteractions({
      onBulbasaurDryGrassMissionAccepted,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "bulbasaurMission",
          id: "bulbasaurDryGrassMission",
          label: "Talk to Bulbasaur",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 2,
      flags: {
        bulbasaurRevealed: true,
        bulbasaurDryGrassMissionAccepted: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {},
      groundGrassPatches: [
        {
          cellId: "ground-2-3",
          position: [2, 0.02, 3]
        }
      ],
      onNpcInteractionStart
    });

    expect(result).toBe(true);
    expect(storyState.flags.bulbasaurDryGrassMissionAccepted).toBe(true);
    expect(onBulbasaurDryGrassMissionAccepted).toHaveBeenCalledTimes(1);
    expect(onNpcInteractionStart).toHaveBeenCalledWith({
      targetId: "bulbasaurDryGrassMission",
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      targetPosition: [2, 0.02, 3]
    });
  });

  it("accepts Bulbasaur's dry grass mission as complete if 10 patches were already restored", () => {
    const onBulbasaurDryGrassMissionAccepted = vi.fn();
    const interactions = createInteractions({
      onBulbasaurDryGrassMissionAccepted,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "bulbasaurMission",
          id: "bulbasaurDryGrassMission",
          label: "Talk to Bulbasaur",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 2,
      flags: {
        bulbasaurRevealed: true,
        bulbasaurDryGrassMissionAccepted: false,
        restoredGrassCount: 10
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(storyState.flags.bulbasaurDryGrassMissionAccepted).toBe(true);
    expect(storyState.flags.bulbasaurDryGrassMissionComplete).toBe(true);
    expect(onBulbasaurDryGrassMissionAccepted).toHaveBeenCalledTimes(1);
  });

  it("marks Bulbasaur's dry grass mission complete after enough grass is restored", () => {
    const groundCell = {
      id: "ground-4-4",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.28
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => ({
        id: "grass-9",
        cellId: groundCell.id,
        state: "alive"
      })),
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 0,
      flags: {
        firstGrassRestored: true,
        bulbasaurDryGrassMissionAccepted: true,
        restoredGrassCount: 9
      }
    };

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      groundDeadInstances: [groundCell],
      groundPurifiedInstances: [],
      groundGrassPatches: [
        {
          id: "grass-9",
          cellId: groundCell.id,
          state: "alive"
        }
      ],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.restoredGrassCount).toBe(10);
    expect(storyState.flags.bulbasaurDryGrassMissionComplete).toBe(true);
  });

  it("turns in Bulbasaur's completed dry grass request from the Bulbasaur interaction", () => {
    const onBulbasaurDryGrassRequestCompleted = vi.fn();
    const interactions = createInteractions({
      onBulbasaurDryGrassRequestCompleted,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "bulbasaurRequestComplete",
          id: "bulbasaurLeafageReward",
          label: "Talk to Bulbasaur",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 2,
      flags: {
        bulbasaurRevealed: true,
        bulbasaurDryGrassMissionAccepted: true,
        bulbasaurDryGrassMissionComplete: true,
        restoredGrassCount: 10
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onBulbasaurDryGrassRequestCompleted).toHaveBeenCalledTimes(1);
  });

  it("requests Bulbasaur's Straw Bed recipe from the Do you need anything interaction", () => {
    const onBulbasaurStrawBedRecipeRequested = vi.fn();
    const interactions = createInteractions({
      onBulbasaurStrawBedRecipeRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "bulbasaurStrawBedRecipe",
          id: "bulbasaurStrawBedRecipe",
          label: "Do you need anything?",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          bulbasaurStrawBedChallengeComplete: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onBulbasaurStrawBedRecipeRequested).toHaveBeenCalledTimes(1);
  });

  it("turns in Bulbasaur's request after the Straw Bed is placed", () => {
    const onBulbasaurStrawBedRequestCompleted = vi.fn();
    const interactions = createInteractions({
      onBulbasaurStrawBedRequestCompleted,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "bulbasaurStrawBedComplete",
          id: "bulbasaurStrawBedComplete",
          label: "Talk to Bulbasaur",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          strawBedPlacedInBulbasaurHabitat: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onBulbasaurStrawBedRequestCompleted).toHaveBeenCalledTimes(1);
  });

  it("waters nearby trees for Bulbasaur's first challenge set without striking them", () => {
    const palm = {
      id: "palm-0"
    };
    const storyState = {
      questIndex: 2,
      flags: {
        bulbasaurStrawBedChallengeAvailable: true,
        wateredTreeCount: 4,
        sturdySticksGatheredForChallenge: 10
      }
    };
    const strikeNearbyPalm = vi.fn(() => ({
      hit: true,
      felled: false,
      palm,
      nextWoodDropId: 1
    }));
    const waterNearbyPalm = vi.fn((playerPosition, palmModel, palmInstances, nextStoryState) => {
      nextStoryState.flags.wateredTreeCount = 5;
      nextStoryState.flags.bulbasaurStrawBedChallengeComplete = true;
      return {
        hit: true,
        counted: true,
        challengeComplete: true,
        palm
      };
    });
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      findNearbyHarvestTarget: vi.fn(() => ({
        palm,
        distance: 0.4
      })),
      strikeNearbyPalm,
      waterNearbyPalm,
      pushNotice
    });

    const result = interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: {},
      palmInstances: [palm],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      canPurifyGround: true,
      useWaterGun: true
    });

    expect(result).toBe(true);
    expect(waterNearbyPalm).toHaveBeenCalledTimes(1);
    expect(strikeNearbyPalm).not.toHaveBeenCalled();
    expect(pushNotice).toHaveBeenCalledWith("First set of challenges complete. Talk to Bulbasaur.");
  });

  it("does not revive the Leppa tree by clicking the dead tree with Water Gun", () => {
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      pushNotice
    });
    const storyState = {
      questIndex: 2,
      flags: {
        squirtleLeppaRequestAvailable: true,
        leppaBerryGiftComplete: false
      }
    };
    const leppaTree = {
      position: [1, 0.02, 1],
      revived: false,
      berryDropped: false,
      deadInstance: { active: false },
      aliveInstance: { active: false }
    };

    expect(interactions.performHarvestAction({
      playerPosition: [1.2, 0, 1.2],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      leppaTree,
      canPurifyGround: true
    })).toBe(false);

    expect(storyState.flags.leppaTreeRevived).toBeUndefined();
    expect(leppaTree.aliveInstance.active).toBe(false);
  });

  it("revives the Leppa tree after Squirtle waters the fourth surrounding tile", () => {
    const finalGroundCell = {
      id: "ground-near-leppa-north",
      offset: [1, 0, -0.4],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const storyState = {
      flags: {
        squirtleLeppaRequestAvailable: true,
        leppaBerryGiftComplete: false
      }
    };
    const leppaTree = {
      position: [1, 0.02, 1],
      revived: false,
      berryDropped: false,
      deadInstance: { active: false },
      aliveInstance: { active: false }
    };
    const groundPurifiedInstances = [
      { id: "ground-near-leppa-east", offset: [2.4, 0, 1], tileSpan: 1.425 },
      { id: "ground-near-leppa-west", offset: [-0.4, 0, 1], tileSpan: 1.425 },
      { id: "ground-near-leppa-south", offset: [1, 0, 2.4], tileSpan: 1.425 }
    ];
    const findNearbyGroundCell = vi.fn(() => ({
      groundCell: finalGroundCell,
      distance: 0.02
    }));
    const purifyGroundCell = vi.fn((groundCell, groundDeadInstances, purifiedInstances) => {
      purifiedInstances.push(groundCell);
      return true;
    });
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell,
      purifyGroundCell,
      pushNotice
    });

    const result = interactions.performHarvestAction({
      playerPosition: [1, 0, -0.4],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState,
      woodDrops: [],
      leppaTree,
      groundDeadInstances: [finalGroundCell],
      groundPurifiedInstances,
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.leppaTreeRevived).toBe(true);
    expect(leppaTree.aliveInstance.active).toBe(true);
    expect(purifyGroundCell).toHaveBeenCalledWith(
      finalGroundCell,
      [finalGroundCell],
      groundPurifiedInstances
    );
    expect(pushNotice).toHaveBeenCalledWith("The dead tree perked back up.");
  });

  it("requests the Leppa Berry gift flow from Bulbasaur's Look at this interaction", () => {
    const onLeppaBerryGiftRequested = vi.fn();
    const interactions = createInteractions({
      onLeppaBerryGiftRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "leppaBerryGift",
          id: "bulbasaur",
          label: "Look at this!",
          cellId: "ground-2-3"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          leppaBerryCollected: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onLeppaBerryGiftRequested).toHaveBeenCalledWith({
      targetId: "bulbasaur"
    });
  });

  it("collects a Leppa Berry from a revived tree through the interact action", () => {
    const pushNotice = vi.fn();
    const syncInventoryUi = vi.fn();
    const interactions = createInteractions({
      pushNotice,
      syncInventoryUi,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "leppaBerryTree",
          id: "leppaTree",
          label: "Pick Leppa Berry"
        },
        distance: 1.2
      }))
    });
    const storyState = {
      questIndex: 2,
      flags: {
        squirtleLeppaRequestAvailable: true,
        leppaTreeRevived: true,
        leppaBerryGiftComplete: false
      }
    };
    const inventory = {};
    const leppaTree = {
      position: [1, 0.02, 1],
      revived: true,
      berryDropped: false
    };
    const leppaBerryDrops = [];

    const result = interactions.performInteractAction({
      playerPosition: [1.2, 0, 1.2],
      npcActors: [],
      interactables: [],
      storyState,
      inventory,
      leppaTree,
      leppaBerryDrops
    });

    expect(result).toBe(true);
    expect(inventory.leppaBerry).toBe(1);
    expect(storyState.flags.leppaBerryDropped).toBe(true);
    expect(storyState.flags.leppaBerryCollected).toBe(true);
    expect(leppaBerryDrops).toHaveLength(1);
    expect(leppaBerryDrops[0].collected).toBe(true);
    expect(syncInventoryUi).toHaveBeenCalledWith(inventory);
    expect(pushNotice).toHaveBeenCalledWith("+1 Leppa Berry");
  });

  it("starts Chopper's log chair gift dialogue when the request is available", () => {
    let onComplete = null;
    const startDialogue = vi.fn(({ onComplete: nextOnComplete }) => {
      onComplete = nextOnComplete;
      return true;
    });
    const onChopperLogChairGiftRequested = vi.fn();
    const interactions = createInteractions({
      startDialogue,
      onChopperLogChairGiftRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Tangrowth"
        },
        distance: 1.05
      })),
      pushNotice: vi.fn()
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          tangrowthLogChairRequestAvailable: true,
          logChairReceived: false
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(startDialogue).toHaveBeenCalledWith({
      targetId: "tangrowth",
      dialogueId: "logChairGift",
      onComplete: expect.any(Function)
    });
    onComplete();
    expect(onChopperLogChairGiftRequested).toHaveBeenCalledTimes(1);
  });

  it("requests log chair placement from the contextual action", () => {
    const onLogChairPlacementRequested = vi.fn();
    const interactions = createInteractions({
      onLogChairPlacementRequested,
      pushNotice: vi.fn()
    });
    const playerPosition = [3, 0, 3];

    const result = interactions.performHarvestAction({
      playerPosition,
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {
        [LOG_CHAIR_ITEM_ID]: 1
      },
      storyState: {
        questIndex: 2,
        flags: {
          logChairReceived: true,
          logChairPlaced: false
        }
      },
      woodDrops: [],
      canPurifyGround: false
    });

    expect(result).toBe(true);
    expect(onLogChairPlacementRequested).toHaveBeenCalledWith({
      playerPosition
    });
  });

  it("requests sitting when the player interacts with the placed log chair", () => {
    const onLogChairSitRequested = vi.fn();
    const interactions = createInteractions({
      onLogChairSitRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "logChairSeat",
          id: "logChair",
          label: "Sit on Log Chair"
        },
        distance: 0.5
      })),
      pushNotice: vi.fn()
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          logChairPlaced: true
        }
      },
      inventory: {},
      groundGrassPatches: [],
      logChair: {
        position: [0, 0.1, 0]
      }
    });

    expect(result).toBe(true);
    expect(onLogChairSitRequested).toHaveBeenCalledWith({
      targetId: "logChair"
    });
  });

  it("requests simple wooden DIY recipes from the Workbench first", () => {
    const onWorkbenchRecipesRequested = vi.fn();
    const interactions = createInteractions({
      onWorkbenchRecipesRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "station",
          id: "workbench",
          label: "Workbench"
        },
        distance: 0.8
      })),
      pushNotice: vi.fn()
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          bulbasaurWorkbenchGuideAvailable: true,
          workbenchDiyRecipesReceived: false
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onWorkbenchRecipesRequested).toHaveBeenCalledTimes(1);
  });

  it("crafts a Campfire at the Workbench after recipes are learned", () => {
    const onCampfireCrafted = vi.fn();
    const syncInventoryUi = vi.fn();
    const questSystem = { emit: vi.fn() };
    const interactions = createInteractions({
      onCampfireCrafted,
      placeholderRecipes: PLACEHOLDER_RECIPES,
      addItems,
      consumeItems,
      questSystem,
      syncInventoryUi,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "station",
          id: "workbench",
          label: "Workbench"
        },
        distance: 0.8
      })),
      pushNotice: vi.fn()
    });
    const inventory = {
      wood: 3
    };
    const storyState = {
      questIndex: 2,
      flags: {
        bulbasaurWorkbenchGuideAvailable: true,
        workbenchDiyRecipesReceived: true,
        campfireCrafted: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory,
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(inventory.wood).toBe(0);
    expect(inventory[CAMPFIRE_ITEM_ID]).toBe(1);
    expect(storyState.flags.campfireCrafted).toBe(true);
    expect(syncInventoryUi).toHaveBeenCalledWith(inventory);
    expect(questSystem.emit).toHaveBeenCalledWith({
      type: "BUILD",
      targetId: CAMPFIRE_ITEM_ID,
      amount: 1
    });
    expect(onCampfireCrafted).toHaveBeenCalledWith({
      recipe: expect.objectContaining({
        id: "campfire"
      })
    });
  });

  it("crafts a Straw Bed at the Workbench after Bulbasaur unlocks the recipe", () => {
    const onStrawBedCrafted = vi.fn();
    const syncInventoryUi = vi.fn();
    const questSystem = { emit: vi.fn() };
    const interactions = createInteractions({
      onStrawBedCrafted,
      placeholderRecipes: PLACEHOLDER_RECIPES,
      addItems,
      consumeItems,
      questSystem,
      syncInventoryUi,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "station",
          id: "workbench",
          label: "Workbench"
        },
        distance: 0.8
      })),
      pushNotice: vi.fn()
    });
    const inventory = {
      [LEAVES_ITEM_ID]: 2
    };
    const storyState = {
      questIndex: 2,
      flags: {
        workbenchDiyRecipesReceived: true,
        campfireCrafted: true,
        strawBedRecipeUnlocked: true,
        strawBedCrafted: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory,
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(inventory[LEAVES_ITEM_ID]).toBe(0);
    expect(inventory[STRAW_BED_ITEM_ID]).toBe(1);
    expect(storyState.flags.strawBedCrafted).toBe(true);
    expect(syncInventoryUi).toHaveBeenCalledWith(inventory);
    expect(questSystem.emit).toHaveBeenCalledWith({
      type: "BUILD",
      targetId: STRAW_BED_ITEM_ID,
      amount: 1
    });
    expect(onStrawBedCrafted).toHaveBeenCalledWith({
      recipe: expect.objectContaining({
        id: "strawBed"
      })
    });
  });

  it("places the selected Straw Bed only inside Bulbasaur's habitat", () => {
    const onStrawBedPlacementRequested = vi.fn();
    const pushNotice = vi.fn();
    const interactions = createInteractions({
      onStrawBedPlacementRequested,
      pushNotice
    });
    const storyState = {
      questIndex: 2,
      flags: {
        rustlingGrassCellId: "ground-1",
        strawBedCrafted: true,
        strawBedSelectedForBulbasaur: true,
        strawBedPlacedInBulbasaurHabitat: false
      }
    };
    const groundGrassPatches = [
      {
        cellId: "ground-1",
        habitatGroupId: "tall-grass-habitat-0",
        state: "alive",
        position: [8, 0.02, -6]
      },
      {
        cellId: "ground-2",
        habitatGroupId: "tall-grass-habitat-0",
        state: "alive",
        position: [9, 0.02, -6]
      },
      {
        cellId: "ground-3",
        habitatGroupId: "tall-grass-habitat-0",
        state: "alive",
        position: [8, 0.02, -5]
      },
      {
        cellId: "ground-4",
        habitatGroupId: "tall-grass-habitat-0",
        state: "alive",
        position: [9, 0.02, -5]
      }
    ];

    expect(interactions.performHarvestAction({
      playerPosition: [14, 0, -5],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {
        [STRAW_BED_ITEM_ID]: 1
      },
      storyState,
      woodDrops: [],
      groundGrassPatches
    })).toBe(false);
    expect(pushNotice).toHaveBeenCalledWith(
      "Move closer to Bulbasaur's restored tall grass habitat."
    );

    expect(interactions.performHarvestAction({
      playerPosition: [8.4, 0, -5.4],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {
        [STRAW_BED_ITEM_ID]: 1
      },
      storyState,
      woodDrops: [],
      groundGrassPatches
    })).toBe(true);
    expect(onStrawBedPlacementRequested).toHaveBeenCalledWith({
      placementTarget: expect.objectContaining({
        canPlace: true,
        center: [8.5, 0.02, -5.5]
      })
    });
  });

  it("places the selected Leaf Den Kit in the current area", () => {
    const onLeafDenKitPlacementRequested = vi.fn();
    const interactions = createInteractions({
      onLeafDenKitPlacementRequested
    });
    const storyState = {
      questIndex: 2,
      flags: {
        leafDenBuildAvailable: true,
        leafDenKitSelected: true,
        leafDenKitPlaced: false
      }
    };

    expect(interactions.performHarvestAction({
      playerPosition: [5, 0, 5],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {
        [LEAF_DEN_KIT_ITEM_ID]: 1
      },
      storyState,
      woodDrops: []
    })).toBe(true);

    expect(onLeafDenKitPlacementRequested).toHaveBeenCalledWith({
      playerPosition: [5, 0, 5]
    });
  });

  it("requests Leaf Den construction when inspecting the placed kit", () => {
    const onLeafDenConstructionRequested = vi.fn();
    const interactions = createInteractions({
      onLeafDenConstructionRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "leafDenConstruction",
          id: "leafDen",
          label: "Leaf Den Kit"
        },
        distance: 1.1
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          leafDenKitPlaced: true
        }
      },
      inventory: {},
      groundGrassPatches: [],
      leafDen: {
        position: [0, 0.02, 0]
      }
    });

    expect(result).toBe(true);
    expect(onLeafDenConstructionRequested).toHaveBeenCalledWith({
      targetId: "leafDen"
    });
  });

  it("requests Leaf Den entry after the den is complete", () => {
    const onLeafDenEnterRequested = vi.fn();
    const interactions = createInteractions({
      onLeafDenEnterRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "leafDenEntrance",
          id: "leafDen",
          label: "Leaf Den"
        },
        distance: 1.1
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          leafDenBuilt: true,
          leafDenFurnitureRequestAvailable: true
        }
      },
      inventory: {},
      groundGrassPatches: [],
      leafDen: {
        position: [0, 0.02, 0]
      }
    });

    expect(result).toBe(true);
    expect(onLeafDenEnterRequested).toHaveBeenCalledWith({
      targetId: "leafDen"
    });
  });

  it("places furniture inside the Leaf Den once the player has entered", () => {
    const onLeafDenFurniturePlacementRequested = vi.fn();
    const interactions = createInteractions({
      onLeafDenFurniturePlacementRequested
    });

    expect(interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {},
      storyState: {
        questIndex: 2,
        flags: {
          leafDenFurnitureRequestAvailable: true,
          leafDenInteriorEntered: true,
          leafDenFurniturePlacedCount: 1
        }
      },
      woodDrops: []
    })).toBe(true);

    expect(onLeafDenFurniturePlacementRequested).toHaveBeenCalledWith({
      playerPosition: [0, 0, 0]
    });
  });

  it("places the selected Ditto Flag on the Leaf Den", () => {
    const onDittoFlagPlacementRequested = vi.fn();
    const interactions = createInteractions({
      onDittoFlagPlacementRequested
    });
    const leafDen = {
      id: "leaf-den-0",
      position: [0.4, 0.02, 0.4]
    };

    expect(interactions.performHarvestAction({
      playerPosition: [0, 0, 0],
      palmModel: null,
      palmInstances: [],
      resourceNodes: [],
      inventory: {
        [DITTO_FLAG_ITEM_ID]: 1
      },
      storyState: {
        questIndex: 2,
        flags: {
          dittoFlagReceived: true,
          dittoFlagSelectedForHouse: true,
          dittoFlagPlacedOnHouse: false,
          leafDenKitPlaced: true,
          leafDenBuilt: true
        }
      },
      leafDen,
      woodDrops: []
    })).toBe(true);

    expect(onDittoFlagPlacementRequested).toHaveBeenCalledWith({
      placementTarget: {
        leafDen
      }
    });
  });

  it("requests Timburr's Leaf Den furniture completion dialogue", () => {
    const onTimburrLeafDenFurnitureCompleteRequested = vi.fn();
    const interactions = createInteractions({
      onTimburrLeafDenFurnitureCompleteRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "timburrLeafDenFurnitureComplete",
          id: "timburr",
          label: "Talk to Timburr"
        },
        distance: 1.1
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          leafDenFurnitureRequestAvailable: true,
          leafDenFurniturePlacedCount: 3,
          timburrRevealed: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onTimburrLeafDenFurnitureCompleteRequested).toHaveBeenCalledWith({
      targetId: "timburr"
    });
  });

  it("starts Charmander's celebration request from Charmander", () => {
    const onCharmanderCelebrationSuggested = vi.fn();
    const interactions = createInteractions({
      onCharmanderCelebrationSuggested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "charmanderCelebrationRequest",
          id: "charmander",
          label: "Talk to Charmander"
        },
        distance: 1.1
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          charmanderCelebrationRequestAvailable: true,
          charmanderRevealed: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onCharmanderCelebrationSuggested).toHaveBeenCalledWith({
      targetId: "charmander"
    });
  });

  it("starts the Charmander celebration cutscene through Tangrowth", () => {
    const onCharmanderCelebrationTangrowthRequested = vi.fn();
    const onNpcInteractionStart = vi.fn();
    const interactions = createInteractions({
      onCharmanderCelebrationTangrowthRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Professor Tangrowth"
        },
        distance: 1.1
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          charmanderCelebrationSuggested: true,
          charmanderCelebrationComplete: false
        }
      },
      inventory: {},
      groundGrassPatches: [],
      onNpcInteractionStart
    });

    expect(result).toBe(true);
    expect(onNpcInteractionStart).toHaveBeenCalledWith({
      targetId: "tangrowth",
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: []
    });
    expect(onCharmanderCelebrationTangrowthRequested).toHaveBeenCalledWith({
      targetId: "tangrowth"
    });
  });

  it("asks the player to select the Campfire before giving it to Tangrowth", () => {
    const pushNotice = vi.fn();
    const onCampfireSpitOutRequested = vi.fn();
    const interactions = createInteractions({
      onCampfireSpitOutRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Professor Tangrowth"
        },
        distance: 1.1
      })),
      pushNotice
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          campfireCrafted: true,
          campfireSelectedForTangrowth: false,
          campfireSpatOut: false
        }
      },
      inventory: {
        [CAMPFIRE_ITEM_ID]: 1
      },
      groundGrassPatches: []
    });

    expect(result).toBe(false);
    expect(pushNotice).toHaveBeenCalledWith("Open the bag with X and select the Campfire first.");
    expect(onCampfireSpitOutRequested).not.toHaveBeenCalled();
  });

  it("starts Tangrowth's Campfire spit out flow once the Campfire is selected", () => {
    const onCampfireSpitOutRequested = vi.fn();
    const onNpcInteractionStart = vi.fn();
    const interactions = createInteractions({
      onCampfireSpitOutRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Professor Tangrowth"
        },
        distance: 1.1
      }))
    });
    const storyState = {
      questIndex: 2,
      flags: {
        campfireCrafted: true,
        campfireSelectedForTangrowth: true,
        campfireSpatOut: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {
        [CAMPFIRE_ITEM_ID]: 1
      },
      groundGrassPatches: [],
      onNpcInteractionStart
    });

    expect(result).toBe(true);
    expect(onNpcInteractionStart).toHaveBeenCalledWith({
      targetId: "tangrowth",
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: []
    });
    expect(onCampfireSpitOutRequested).toHaveBeenCalledWith({
      targetId: "tangrowth"
    });
  });

  it("opens Tangrowth's tall grass return dialogue after the habitat has been restored", () => {
    let onComplete = null;
    const startDialogue = vi.fn(({ onComplete: nextOnComplete }) => {
      onComplete = nextOnComplete;
      return true;
    });
    const interactions = createInteractions({
      startDialogue,
      getActiveQuest: () => ({
        id: "findPokemon",
        title: "Find the Pokemon",
        actionLabel: "E / Talk"
      }),
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "npc",
          id: "tangrowth",
          label: "Tangrowth"
        },
        distance: 1.1
      })),
      pushNotice: vi.fn()
    });
    const storyState = {
      questIndex: 1,
      flags: {
        tallGrassDiscovered: true,
        tangrowthTallGrassCommentSeen: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {}
    });

    expect(result).toBe(true);
    expect(startDialogue).toHaveBeenCalledWith({
      targetId: "tangrowth",
      dialogueId: "tallGrassReturn",
      onComplete: expect.any(Function)
    });
    expect(storyState.flags.tangrowthTallGrassCommentSeen).toBe(false);
    onComplete();
    expect(storyState.flags.tangrowthTallGrassCommentSeen).toBe(true);
  });

  it("requests ruined Pokemon Center inspection from the site interaction", () => {
    const onRuinedPokemonCenterInspectRequested = vi.fn();
    const onNpcInteractionStart = vi.fn();
    const interactions = createInteractions({
      onRuinedPokemonCenterInspectRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "site",
          id: "ruinedPokemonCenter",
          label: "Ruined Pokemon Center"
        },
        distance: 1.4
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          pokemonCenterGuideStarted: true
        }
      },
      inventory: {},
      groundGrassPatches: [],
      onNpcInteractionStart
    });

    expect(result).toBe(true);
    expect(onNpcInteractionStart).toHaveBeenCalledWith({
      targetId: "ruinedPokemonCenter",
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: []
    });
    expect(onRuinedPokemonCenterInspectRequested).toHaveBeenCalledWith({
      targetId: "ruinedPokemonCenter"
    });
  });

  it("requests Challenges unlock from the Pokemon Center PC interaction", () => {
    const onPokemonCenterPcCheckRequested = vi.fn();
    const interactions = createInteractions({
      onPokemonCenterPcCheckRequested,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "site",
          id: "pokemonCenterPc",
          label: "Pokemon Center PC"
        },
        distance: 1.2
      }))
    });

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState: {
        questIndex: 2,
        flags: {
          ruinedPokemonCenterInspected: true
        }
      },
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(onPokemonCenterPcCheckRequested).toHaveBeenCalledWith({
      targetId: "pokemonCenterPc"
    });
  });

  it("creates Boulder-Shaded Tall Grass with Leafage near the challenge boulder", () => {
    const groundPurifiedInstances = [0, 1, 2, 3].map((index) => ({
      id: `boulder-ground-${index}`,
      offset: [
        BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION[0] + (index % 2) * 1.1,
        0,
        BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION[2] + Math.floor(index / 2) * 1.1
      ],
      surfaceY: 0,
      tileSpan: 1.425,
      active: true,
      purifiable: true
    }));
    const groundGrassPatches = [];
    const pushNotice = vi.fn();
    const habitatSystem = { recordEvent: vi.fn() };
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn((playerPosition, candidateGroundCells) => ({
        groundCell: candidateGroundCells[0],
        distance: 0.2
      })),
      habitatSystem,
      pushNotice
    });
    const storyState = {
      questIndex: 2,
      flags: {
        boulderChallengeAvailable: true
      }
    };

    for (let index = 0; index < 4; index += 1) {
      expect(interactions.performHarvestAction({
        playerPosition: groundPurifiedInstances[index].offset,
        palmModel: null,
        palmInstances: [],
        resourceNodes: [],
        inventory: {},
        storyState,
        woodDrops: [],
        groundDeadInstances: [],
        groundGrassPatches,
        groundPurifiedInstances,
        canUseLeafage: true
      })).toBe(true);
    }

    expect(storyState.flags.boulderShadedTallGrassCount).toBe(4);
    expect(storyState.flags.boulderShadedTallGrassHabitatCreated).toBe(true);
    expect(storyState.flags.timburrRustlingGrassCellId).toBe("boulder-ground-0");
    expect(pushNotice).toHaveBeenCalledWith(
      "A boulder-shaded tall grass habitat is rustling.",
      3.6
    );
    expect(habitatSystem.recordEvent).toHaveBeenCalledWith({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "boulder-shaded-tall-grass"
    });
  });

  it("reveals Timburr from the Boulder-Shaded Tall Grass inspection", () => {
    const onTimburrRevealed = vi.fn();
    const interactions = createInteractions({
      onTimburrRevealed,
      findNearbyInteractable: vi.fn(() => ({
        target: {
          kind: "timburrGrassEncounter",
          id: "timburrRustlingGrass",
          label: "Inspect the Boulder-Shaded Tall Grass",
          cellId: "boulder-ground-0"
        },
        distance: 1.1
      }))
    });
    const storyState = {
      questIndex: 2,
      flags: {
        boulderShadedTallGrassHabitatCreated: true,
        timburrRustlingGrassCellId: "boulder-ground-0",
        timburrRevealed: false
      }
    };

    const result = interactions.performInteractAction({
      playerPosition: [0, 0, 0],
      npcActors: [],
      interactables: [],
      storyState,
      inventory: {},
      groundGrassPatches: []
    });

    expect(result).toBe(true);
    expect(storyState.flags.timburrRevealed).toBe(true);
    expect(onTimburrRevealed).toHaveBeenCalledWith({
      cellId: "boulder-ground-0"
    });
  });
});
