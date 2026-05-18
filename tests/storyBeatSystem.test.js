import { describe, expect, it, vi } from "vitest";
import {
  BULBASAUR_POKEDEX_ENTRY_ID,
  CHARMANDER_POKEDEX_ENTRY_ID,
  TALL_GRASS_POKEDEX_ENTRY_ID,
  TIMBURR_POKEDEX_ENTRY_ID
} from "../pokedexEntries.js";
import { createStoryBeatSystem } from "../app/story/createStoryBeatSystem.js";
import { getRecipeById } from "../gameplayContent.js";
import {
  FIELD_TASK_IDS,
  STORY_BEAT_EFFECT,
  STORY_BEAT_IDS
} from "../app/story/storyBeatData.js";
import {
  BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID,
  NEW_HABITAT_CHALLENGES_ID,
  SQUIRTLE_LEPPA_BERRY_REQUEST_ID
} from "../pokedexRequests.js";

function createSystem(overrides = {}) {
  const storyState = overrides.storyState || { flags: {} };
  const openConversation = vi.fn(({ onComplete }) => {
    return {
      complete: onComplete
    };
  });
  const trackFieldTask = vi.fn();
  const questSystem = {
    emit: vi.fn()
  };
  const pokedexRuntime = {
    unlock: vi.fn(),
    setOpen: vi.fn()
  };
  const system = createStoryBeatSystem({
    storyState,
    dialogueSystem: {
      getConversation: vi.fn(() => [])
    },
    gameplayDialogue: {
      openConversation
    },
    questSystem,
    pokedexRuntime,
    trackFieldTask,
    ...overrides
  });

  return {
    openConversation,
    pokedexRuntime,
    questSystem,
    storyState,
    system,
    trackFieldTask
  };
}

describe("createStoryBeatSystem", () => {
  it("falls back to beat dialogue and applies Bulbasaur encouragement rewards", () => {
    const { openConversation, pokedexRuntime, storyState, system, trackFieldTask } = createSystem();

    system.playDialogue(STORY_BEAT_IDS.CHOPPER_BULBASAUR_ENCOURAGEMENT);

    expect(openConversation).toHaveBeenCalledWith({
      lines: expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("great job")
        })
      ]),
      onLineChange: undefined,
      onComplete: expect.any(Function)
    });

    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.chopperPatrolEnabled).toBe(true);
    expect(storyState.flags.squirtleLeppaRequestAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.REVIVE_LEPPA_TREE);
    expect(pokedexRuntime.unlock).toHaveBeenCalledTimes(1);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      entryId: BULBASAUR_POKEDEX_ENTRY_ID
    });
  });

  it("tracks habitat tasks and opens a discovered habitat entry", () => {
    const { openConversation, pokedexRuntime, system, trackFieldTask } = createSystem();

    system.playDialogue(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY, {
      context: {
        discoveredHabitats: [
          {
            id: "tall-grass",
            pokedexEntryId: TALL_GRASS_POKEDEX_ENTRY_ID
          }
        ]
      }
    });
    openConversation.mock.results[0].value.complete();

    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.MAKING_HABITATS);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      entryId: TALL_GRASS_POKEDEX_ENTRY_ID
    });
  });

  it("uses dialogue system lines before fallback lines", () => {
    const dialogueLines = [
      {
        speaker: "Chopper",
        text: "Runtime dialogue"
      }
    ];
    const { system } = createSystem({
      dialogueSystem: {
        getConversation: vi.fn(() => dialogueLines)
      }
    });

    expect(system.getDialogueLines(STORY_BEAT_IDS.CHOPPER_ONBOARDING)).toEqual(dialogueLines);
  });

  it("includes the first Chopper name request only when a name is still needed", () => {
    const { system } = createSystem();

    expect(system.getDialogueLines(STORY_BEAT_IDS.CHOPPER_ONBOARDING, {
      needsPlayerName: true
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "ask-player-name"
      })
    ]));

    expect(system.getDialogueLines(STORY_BEAT_IDS.CHOPPER_ONBOARDING, {
      needsPlayerName: false
    })).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "ask-player-name"
      })
    ]));
  });

  it("interpolates the saved player name in dialogue lines", () => {
    const { system } = createSystem({
      beats: {
        greeting: {
          id: "greeting",
          fallbackLines: [
            {
              speaker: "Chopper",
              text: "Good morning, {{playerName}}."
            }
          ]
        }
      },
      playerProfile: {
        playerName: "Ada"
      }
    });

    expect(system.getDialogueLines("greeting")).toEqual([
      {
        speaker: "Chopper",
        text: "Good morning, Ada."
      }
    ]);
    expect(system.getDialogueLines("greeting", { playerName: "" })).toEqual([
      {
        speaker: "Chopper",
        text: "Good morning, Operator."
      }
    ]);
  });

  it("turns in Grow Bot's request, unlocks Bio-Grow, and opens Hydro Bot's request", () => {
    const unlockPlayerSkill = vi.fn();
    const pushNotice = vi.fn();
    const { openConversation, pokedexRuntime, questSystem, storyState, system, trackFieldTask } = createSystem({
      unlockPlayerSkill,
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.BULBASAUR_LEAFAGE_REWARD);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.bulbasaurDryGrassRequestTurnedIn).toBe(true);
    expect(storyState.flags.pokedexRequestIds).toEqual([
      SQUIRTLE_LEPPA_BERRY_REQUEST_ID
    ]);
    expect(storyState.flags.squirtleLeppaRequestAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.GIVE_LEPPA_BERRY);
    expect(questSystem.emit).toHaveBeenCalledWith({
      type: "TALK",
      targetId: "leaf-helper"
    });
    expect(unlockPlayerSkill).toHaveBeenCalledWith("leafage", {
      silent: true
    });
    expect(pushNotice).toHaveBeenCalledWith("You learned Bio-Grow.", undefined);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      page: "requests",
      entryId: "squirtle",
      requestId: SQUIRTLE_LEPPA_BERRY_REQUEST_ID
    });
  });

  it("builds Pulse Berry delivery dialogue from the chosen helper and completes the task", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.LEPPA_BERRY_DELIVERY, {
      context: {
        targetId: "squirtle"
      }
    });

    expect(openConversation).toHaveBeenCalledWith({
      lines: expect.arrayContaining([
        expect.objectContaining({
          speaker: "You",
          text: "Look at this!"
        }),
        expect.objectContaining({
          speaker: "Hydro Bot",
          text: expect.stringContaining("Pulse Berry")
        })
      ]),
      onLineChange: undefined,
      onComplete: expect.any(Function)
    });

    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.leppaBerryGiftComplete).toBe(true);
    expect(storyState.flags.tangrowthLogChairRequestAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR);
    expect(pushNotice).toHaveBeenCalledWith("You gave away the Pulse Berry.", undefined);
  });

  it("marks Chopper's log chair gift and chair rest beats", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.CHOPPER_LOG_CHAIR_GIFT);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.logChairReceived).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith("You got a Log Chair.", undefined);

    system.playDialogue(STORY_BEAT_IDS.LOG_CHAIR_REST);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.logChairSat).toBe(true);
    expect(storyState.flags.bulbasaurWorkbenchGuideAvailable).toBeUndefined();
    expect(trackFieldTask).not.toHaveBeenCalledWith(FIELD_TASK_IDS.WORKBENCH_CAMPFIRE);
    expect(pushNotice).toHaveBeenCalledWith("saved.", undefined);

    system.playDialogue(STORY_BEAT_IDS.BULBASAUR_WORKBENCH_GUIDE_INTRO);
    openConversation.mock.results[2].value.complete();

    expect(storyState.flags.bulbasaurWorkbenchGuideIntroSeen).toBe(true);
    expect(storyState.flags.bulbasaurWorkbenchGuideAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.WORKBENCH_CAMPFIRE);
  });

  it("unlocks the first Workbench recipe and marks Thermal Cabin creation beats", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });
    const starterRecipe = getRecipeById("campfire");

    expect(starterRecipe).toEqual(expect.objectContaining({
      id: "campfire",
      stationId: "workbench",
      ingredients: {
        wood: 3
      }
    }));
    expect(storyState.flags.workbenchDiyRecipesReceived).toBeUndefined();

    system.playDialogue(STORY_BEAT_IDS.WORKBENCH_DIY_RECIPES);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.workbenchDiyRecipesReceived).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith(
      "New Workbench plans available: Power.",
      undefined
    );

    expect(system.complete(STORY_BEAT_IDS.CAMPFIRE_CREATED)).toBe(true);
    expect(storyState.flags.campfireCrafted).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE);
    expect(pushNotice).toHaveBeenCalledWith("You created Thermal Bot's Thermal Cabin.", undefined);

    system.playDialogue(STORY_BEAT_IDS.CAMPFIRE_SPIT_OUT);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.campfireSpatOut).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.CHARMANDER_TALL_GRASS);
    expect(pushNotice).toHaveBeenCalledWith("You placed Thermal Bot's Thermal Cabin.", undefined);
  });

  it("registers Thermal Bot and completes the Thermal Cabin home beat", () => {
    const pushNotice = vi.fn();
    const { openConversation, pokedexRuntime, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_DISCOVERY);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.charmanderRevealed).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.CHARMANDER_TALL_GRASS);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      entryId: CHARMANDER_POKEDEX_ENTRY_ID
    });

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_CAMPFIRE_LIT);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.charmanderCampfireLit).toBe(true);
    expect(storyState.flags.pokemonCenterGuideStarted).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.RUINED_POKEMON_CENTER);
    expect(pushNotice).toHaveBeenCalledWith("Thermal Bot moved into the Thermal Cabin.", undefined);
  });

  it("keeps ruined Colony Terminal discovery separate from Challenges unlock", () => {
    const pushNotice = vi.fn();
    const { openConversation, pokedexRuntime, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    expect(storyState.flags.challengesUnlocked).toBeUndefined();
    expect(storyState.flags.boulderChallengeAvailable).toBeUndefined();

    system.playDialogue(STORY_BEAT_IDS.RUINED_POKEMON_CENTER_INSPECTED);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.ruinedPokemonCenterInspected).toBe(true);
    expect(storyState.flags.challengesUnlocked).toBeUndefined();
    expect(storyState.flags.boulderChallengeAvailable).toBeUndefined();
    expect(trackFieldTask).not.toHaveBeenCalled();
    expect(pushNotice).toHaveBeenCalledWith(
      "You inspected the ruined Colony Terminal.",
      undefined
    );

    system.playDialogue(STORY_BEAT_IDS.CHALLENGES_UNLOCKED);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.challengesUnlocked).toBe(true);
    expect(storyState.flags.boulderChallengeAvailable).toBe(true);
    expect(storyState.flags.pokedexRequestIds).toContain(
      BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID
    );
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.BOULDER_SHADED_TALL_GRASS);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      page: "requests",
      entryId: undefined,
      requestId: BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID
    });
    expect(pushNotice).toHaveBeenCalledWith("Habitat checks unlocked.", undefined);
  });

  it("registers Timburr and completes the Boulder Challenge reward beat", () => {
    const pushNotice = vi.fn();
    const { openConversation, pokedexRuntime, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.TIMBURR_DISCOVERY);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.timburrRevealed).toBe(true);
    expect(storyState.flags.boulderChallengeRewardReady).toBe(true);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      entryId: TIMBURR_POKEDEX_ENTRY_ID
    });

    system.playDialogue(STORY_BEAT_IDS.BOULDER_CHALLENGE_REWARD);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.boulderChallengeRewardClaimed).toBe(true);
    expect(storyState.flags.bulbasaurStrawBedChallengeAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.BULBASAUR_STRAW_BED);
    expect(pushNotice).toHaveBeenCalledWith("Viability check logged.", undefined);
  });

  it("unlocks the Solar Station plans from Grow Bot after the first challenge set", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.BULBASAUR_STRAW_BED_RECIPE);

    expect(openConversation).toHaveBeenCalledWith({
      lines: expect.arrayContaining([
        expect.objectContaining({
          text: "Do you need anything?"
        }),
        expect.objectContaining({
          text: expect.stringContaining("Solar Station plans")
        })
      ]),
      onLineChange: undefined,
      onComplete: expect.any(Function)
    });

    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.bulbasaurStrawBedChallengeComplete).toBe(true);
    expect(storyState.flags.strawBedRecipeUnlocked).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.STRAW_BED_RECIPE);
    expect(pushNotice).toHaveBeenCalledWith("Solar Station plans received.", undefined);
  });

  it("marks Solar Station creation and Grow Bot request completion beats", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.complete(STORY_BEAT_IDS.STRAW_BED_CREATED);

    expect(storyState.flags.strawBedCrafted).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith("Solar Station prepared.", undefined);

    system.playDialogue(STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.bulbasaurStrawBedRequestComplete).toBe(true);
    expect(storyState.flags.newPcChallengesAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC);
    expect(pushNotice).toHaveBeenCalledWith(
      "Grow Bot's Solar Station request complete.",
      undefined
    );
  });

  it("checks new habitat checks from the Colony Terminal", () => {
    const pushNotice = vi.fn();
    const { openConversation, pokedexRuntime, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.NEW_PC_CHALLENGES);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.newPcChallengesChecked).toBe(true);
    expect(storyState.flags.tangrowthHouseTalkAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.LEAF_DEN_KIT);
    expect(storyState.flags.pokedexRequestIds).toContain(NEW_HABITAT_CHALLENGES_ID);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      page: "requests",
      entryId: undefined,
      requestId: NEW_HABITAT_CHALLENGES_ID
    });
    expect(pushNotice).toHaveBeenCalledWith("New habitat checks added.", undefined);
  });

  it("authorizes the House Kit after Overseer Bot explains houses", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.tangrowthHouseTalkComplete).toBe(true);
    expect(storyState.flags.leafDenKitPurchaseAvailable).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith(
      "House Kit ready.",
      undefined
    );
  });

  it("marks the House Kit claim complete", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice,
      playerProfile: {
        playerName: "Ada"
      }
    });

    system.playDialogue(STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.leafDenKitPurchased).toBe(true);
    expect(storyState.flags.leafDenBuildAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.BUILD_LEAF_DEN);
    expect(pushNotice).toHaveBeenCalledWith(
      "House Kit ready for Ada's first shelter.",
      undefined
    );
  });

  it("uses the player name in the House Kit terminal dialogue", () => {
    const { system } = createSystem({
      playerProfile: {
        playerName: "Ada"
      }
    });

    expect(system.getDialogueLines(STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          speaker: "Colony Codex",
          text: "House Kit ready for Ada's first shelter."
        })
      ])
    );
  });

  it("sets the House hub repair completion flag after construction", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    expect(storyState.flags.leafDenBuilt).toBeUndefined();
    expect(storyState.flags.leafDenFurnitureRequestAvailable).toBeUndefined();

    system.playDialogue(STORY_BEAT_IDS.LEAF_DEN_CONSTRUCTION_STARTED);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.leafDenConstructionStarted).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith("House construction started.", undefined);

    system.playDialogue(STORY_BEAT_IDS.LEAF_DEN_COMPLETE);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.leafDenBuilt).toBe(true);
    expect(storyState.flags.leafDenFurnitureRequestAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.LEAF_DEN_FURNITURE);
    expect(pushNotice).toHaveBeenCalledWith("The House is complete.", undefined);
  });

  it("completes Builder Bot's House furniture request", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.TIMBURR_LEAF_DEN_FURNITURE_COMPLETE);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.leafDenFurnitureRequestComplete).toBe(true);
    expect(storyState.flags.charmanderCelebrationRequestAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.CHARMANDER_CELEBRATION);
    expect(pushNotice).toHaveBeenCalledWith(
      "House furniture request complete.",
      undefined
    );
  });

  it("starts and completes Thermal Bot's celebration request", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.charmanderCelebrationSuggested).toBe(true);
    expect(storyState.flags.charmanderFollowing).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith(
      "Bring Thermal Bot to Overseer Bot.",
      undefined
    );

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.charmanderCelebrationComplete).toBe(true);
    expect(storyState.flags.dittoFlagReceived).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.DITTO_FLAG_HOUSE);
    expect(pushNotice).toHaveBeenCalledWith("You received a Colony Flag.", undefined);
  });

  it("completes the Ditto Flag house marker beat", () => {
    const pushNotice = vi.fn();
    const { storyState, system } = createSystem({
      pushNotice
    });

    expect(system.complete(STORY_BEAT_IDS.DITTO_FLAG_PLACED_ON_HOUSE)).toBe(true);

    expect(storyState.flags.dittoFlagPlacedOnHouse).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith(
      "The House is now marked as your house.",
      undefined
    );
  });

  it("completes effects even when a dialogue cannot open", () => {
    const trackFieldTask = vi.fn();
    const system = createStoryBeatSystem({
      beats: {
        silentBeat: {
          id: "silentBeat",
          effects: [
            {
              type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
              taskId: FIELD_TASK_IDS.WATER_DRY_TALL_GRASS
            }
          ]
        }
      },
      storyState: { flags: {} },
      gameplayDialogue: {
        openConversation: vi.fn(() => false)
      },
      trackFieldTask
    });

    expect(system.playDialogue("silentBeat")).toBe(false);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.WATER_DRY_TALL_GRASS);
  });
});
