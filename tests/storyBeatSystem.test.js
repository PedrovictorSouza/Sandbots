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
        text: "Good morning, Trainer."
      }
    ]);
  });

  it("turns in Bulbasaur's request, unlocks Leafage, and opens Squirtle's request", () => {
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
    expect(pushNotice).toHaveBeenCalledWith("You learned Leafage.", undefined);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      page: "requests",
      entryId: "squirtle",
      requestId: SQUIRTLE_LEPPA_BERRY_REQUEST_ID
    });
  });

  it("builds Leppa Berry delivery dialogue from the chosen helper and completes the task", () => {
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
          speaker: "Squirtle",
          text: expect.stringContaining("Leppa Berry")
        })
      ]),
      onLineChange: undefined,
      onComplete: expect.any(Function)
    });

    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.leppaBerryGiftComplete).toBe(true);
    expect(storyState.flags.tangrowthLogChairRequestAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR);
    expect(pushNotice).toHaveBeenCalledWith("You gave away the Leppa Berry.", undefined);
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

  it("unlocks the first Workbench recipe and marks Train House creation beats", () => {
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
      "You learned simple wooden DIY recipes.",
      undefined
    );

    expect(system.complete(STORY_BEAT_IDS.CAMPFIRE_CREATED)).toBe(true);
    expect(storyState.flags.campfireCrafted).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE);
    expect(pushNotice).toHaveBeenCalledWith("You created Charmander's Train House.", undefined);

    system.playDialogue(STORY_BEAT_IDS.CAMPFIRE_SPIT_OUT);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.campfireSpatOut).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.CHARMANDER_TALL_GRASS);
    expect(pushNotice).toHaveBeenCalledWith("You placed Charmander's Train House.", undefined);
  });

  it("registers Charmander and completes the Train House home beat", () => {
    const pushNotice = vi.fn();
    const { openConversation, pokedexRuntime, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_DISCOVERY);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.charmanderRevealed).toBe(true);
    expect(pokedexRuntime.setOpen).toHaveBeenCalledWith(true, {
      markSeen: true,
      entryId: CHARMANDER_POKEDEX_ENTRY_ID
    });

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_CAMPFIRE_LIT);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.charmanderCampfireLit).toBe(true);
    expect(storyState.flags.pokemonCenterGuideStarted).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.RUINED_POKEMON_CENTER);
    expect(pushNotice).toHaveBeenCalledWith("Charmander moved into the Train House.", undefined);
  });

  it("keeps ruined Pokemon Center discovery separate from Challenges unlock", () => {
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
      "You inspected the ruined Pokemon Center.",
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
    expect(pushNotice).toHaveBeenCalledWith("Challenges unlocked.", undefined);
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
    expect(pushNotice).toHaveBeenCalledWith("You received Life Coins.", undefined);
  });

  it("unlocks the Solar Station recipe from Bulbasaur after the first challenge set", () => {
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
          text: expect.stringContaining("Solar Station recipe")
        })
      ]),
      onLineChange: undefined,
      onComplete: expect.any(Function)
    });

    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.bulbasaurStrawBedChallengeComplete).toBe(true);
    expect(storyState.flags.strawBedRecipeUnlocked).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.STRAW_BED_RECIPE);
    expect(pushNotice).toHaveBeenCalledWith("You learned the Solar Station recipe.", undefined);
  });

  it("marks Solar Station creation and Bulbasaur request completion beats", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.complete(STORY_BEAT_IDS.STRAW_BED_CREATED);

    expect(storyState.flags.strawBedCrafted).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith("You created a Solar Station.", undefined);

    system.playDialogue(STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.bulbasaurStrawBedRequestComplete).toBe(true);
    expect(storyState.flags.newPcChallengesAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC);
    expect(pushNotice).toHaveBeenCalledWith(
      "Bulbasaur's Solar Station request complete.",
      undefined
    );
  });

  it("checks new Challenges from the Pokemon Center PC", () => {
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
    expect(pushNotice).toHaveBeenCalledWith("New Challenges added.", undefined);
  });

  it("unlocks the House Kit purchase after Professor Tangrowth explains houses", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.tangrowthHouseTalkComplete).toBe(true);
    expect(storyState.flags.leafDenKitPurchaseAvailable).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith(
      "House Kit is available in the PC Shop.",
      undefined
    );
  });

  it("marks the House Kit purchase complete", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.leafDenKitPurchased).toBe(true);
    expect(storyState.flags.leafDenBuildAvailable).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.BUILD_LEAF_DEN);
    expect(pushNotice).toHaveBeenCalledWith("You purchased a House Kit.", undefined);
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

  it("completes Timburr's House furniture request", () => {
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

  it("starts and completes Charmander's celebration request", () => {
    const pushNotice = vi.fn();
    const { openConversation, storyState, system, trackFieldTask } = createSystem({
      pushNotice
    });

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION);
    openConversation.mock.results[0].value.complete();

    expect(storyState.flags.charmanderCelebrationSuggested).toBe(true);
    expect(storyState.flags.charmanderFollowing).toBe(true);
    expect(pushNotice).toHaveBeenCalledWith(
      "Bring Charmander to Professor Tangrowth.",
      undefined
    );

    system.playDialogue(STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE);
    openConversation.mock.results[1].value.complete();

    expect(storyState.flags.charmanderCelebrationComplete).toBe(true);
    expect(storyState.flags.dittoFlagReceived).toBe(true);
    expect(trackFieldTask).toHaveBeenCalledWith(FIELD_TASK_IDS.DITTO_FLAG_HOUSE);
    expect(pushNotice).toHaveBeenCalledWith("You received a Ditto Flag.", undefined);
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
