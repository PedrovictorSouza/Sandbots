import { describe, expect, it, vi } from "vitest";
import { createGameplayInteractions } from "../world/gameplayInteractions.js";
import {
  FLOWER_BED_POKEDEX_ENTRY_ID,
  TALL_GRASS_POKEDEX_ENTRY_ID
} from "../pokedexEntries.js";

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
    expect(pushNotice).toHaveBeenCalledWith("Nenhum recurso na area.");
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
    const showPokedexEntry = vi.fn();
    const onFirstGrassRestored = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.32
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => true),
      onFirstGrassRestored,
      showPokedexEntry,
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
    expect(showPokedexEntry).toHaveBeenCalledWith(FLOWER_BED_POKEDEX_ENTRY_ID);
    expect(onFirstGrassRestored).toHaveBeenCalledTimes(1);
  });

  it("opens the tall grass pokedex entry after enough grass patches have been restored", () => {
    const groundCell = {
      id: "ground-4-4",
      offset: [0, 0, 0],
      scale: 1,
      tileSpan: 1.425,
      yaw: 0
    };
    const showPokedexEntry = vi.fn();
    const interactions = createInteractions({
      findNearbyGroundCell: vi.fn(() => ({
        groundCell,
        distance: 0.28
      })),
      purifyGroundCell: vi.fn(() => true),
      reviveGroundGrass: vi.fn(() => true),
      showPokedexEntry,
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
      groundGrassPatches: [{ cellId: groundCell.id, state: "dead" }],
      canPurifyGround: true
    });

    expect(result).toBe(true);
    expect(storyState.flags.restoredGrassCount).toBe(4);
    expect(storyState.flags.tallGrassDiscovered).toBe(true);
    expect(storyState.flags.rustlingGrassCellId).toBe(groundCell.id);
    expect(showPokedexEntry).toHaveBeenCalledWith(TALL_GRASS_POKEDEX_ENTRY_ID);
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
});
