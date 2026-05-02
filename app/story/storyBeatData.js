import {
  BULBASAUR_POKEDEX_ENTRY_ID,
  CHARMANDER_POKEDEX_ENTRY_ID,
  SQUIRTLE_POKEDEX_ENTRY_ID,
  TIMBURR_POKEDEX_ENTRY_ID
} from "../../pokedexEntries.js";
import {
  BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID,
  NEW_HABITAT_CHALLENGES_ID,
  SQUIRTLE_LEPPA_BERRY_REQUEST_ID
} from "../../pokedexRequests.js";
import {
  BULBASAUR_DRY_GRASS_REQUEST_DIALOGUE,
  BULBASAUR_HABITAT_DISCOVERY_DIALOGUE,
  BULBASAUR_LEAFAGE_REWARD_DIALOGUE,
  CHOPPER_BULBASAUR_ENCOURAGEMENT_DIALOGUE,
  SQUIRTLE_DISCOVERY_DIALOGUE,
  TANGROWTH_FLOWER_RECOVERY_DIALOGUE,
  TANGROWTH_ONBOARDING_DIALOGUE,
  TANGROWTH_TALL_GRASS_MEMORY_DIALOGUE,
  TANGROWTH_TALL_GRASS_RETURN_DIALOGUE
} from "../../dialogue/gameplayDialogueContent.js";
import { QUEST_EVENT } from "../quest/questData.js";

export const FIELD_TASK_IDS = Object.freeze({
  MAKING_HABITATS: "making-habitats",
  BULBASAUR_DRY_GRASS_REQUEST: "bulbasaur-dry-grass-request",
  WATER_DRY_TALL_GRASS: "water-dry-tall-grass",
  BULBASAUR_LEAFAGE_REWARD: "bulbasaur-leafage-reward",
  BULBASAUR_GREEN_CORNER_PLAY_SEED: "bulbasaur-green-corner-play-seed",
  GIVE_LEPPA_BERRY: "give-leppa-berry",
  TANGROWTH_LOG_CHAIR: "tangrowth-log-chair",
  WORKBENCH_CAMPFIRE: "workbench-campfire",
  SPIT_OUT_CAMPFIRE: "spit-out-campfire",
  CHARMANDER_TALL_GRASS: "charmander-tall-grass",
  RUINED_POKEMON_CENTER: "ruined-pokemon-center",
  BOULDER_SHADED_TALL_GRASS: "boulder-shaded-tall-grass",
  BULBASAUR_STRAW_BED: "bulbasaur-straw-bed",
  STRAW_BED_RECIPE: "straw-bed-recipe",
  NEW_CHALLENGES_IN_PC: "new-challenges-in-pc",
  LEAF_DEN_KIT: "leaf-den-kit",
  BUILD_LEAF_DEN: "build-leaf-den",
  LEAF_DEN_FURNITURE: "leaf-den-furniture",
  CHARMANDER_CELEBRATION: "charmander-celebration",
  DITTO_FLAG_HOUSE: "ditto-flag-house"
});

export const STORY_BEAT_IDS = Object.freeze({
  CHOPPER_ONBOARDING: "chopper-onboarding",
  SQUIRTLE_DISCOVERY: "squirtle-discovery",
  CHOPPER_TALL_GRASS_RETURN: "chopper-tall-grass-return",
  CHOPPER_TALL_GRASS_MEMORY: "chopper-tall-grass-memory",
  CHOPPER_FLOWER_RECOVERY: "chopper-flower-recovery",
  BULBASAUR_HABITAT_DISCOVERY: "bulbasaur-habitat-discovery",
  CHOPPER_BULBASAUR_ENCOURAGEMENT: "chopper-bulbasaur-encouragement",
  BULBASAUR_DRY_GRASS_REQUEST: "bulbasaur-dry-grass-request",
  BULBASAUR_LEAFAGE_REWARD: "bulbasaur-leafage-reward",
  LEPPA_BERRY_DELIVERY: "leppa-berry-delivery",
  CHOPPER_LOG_CHAIR_GIFT: "chopper-log-chair-gift",
  LOG_CHAIR_REST: "log-chair-rest",
  WORKBENCH_DIY_RECIPES: "workbench-diy-recipes",
  CAMPFIRE_CREATED: "campfire-created",
  CAMPFIRE_SPIT_OUT: "campfire-spit-out",
  CHARMANDER_DISCOVERY: "charmander-discovery",
  CHARMANDER_CAMPFIRE_LIT: "charmander-campfire-lit",
  RUINED_POKEMON_CENTER_INSPECTED: "ruined-pokemon-center-inspected",
  CHALLENGES_UNLOCKED: "challenges-unlocked",
  TIMBURR_DISCOVERY: "timburr-discovery",
  BOULDER_CHALLENGE_REWARD: "boulder-challenge-reward",
  BULBASAUR_STRAW_BED_RECIPE: "bulbasaur-straw-bed-recipe",
  STRAW_BED_CREATED: "straw-bed-created",
  BULBASAUR_STRAW_BED_REQUEST_COMPLETE: "bulbasaur-straw-bed-request-complete",
  NEW_PC_CHALLENGES: "new-pc-challenges",
  TANGROWTH_HOUSE_BUILDING_TALK: "tangrowth-house-building-talk",
  LEAF_DEN_KIT_PURCHASED: "leaf-den-kit-purchased",
  LEAF_DEN_CONSTRUCTION_STARTED: "leaf-den-construction-started",
  LEAF_DEN_COMPLETE: "leaf-den-complete",
  TIMBURR_LEAF_DEN_FURNITURE_COMPLETE: "timburr-leaf-den-furniture-complete",
  CHARMANDER_CELEBRATION_SUGGESTION: "charmander-celebration-suggestion",
  CHARMANDER_CELEBRATION_CUTSCENE: "charmander-celebration-cutscene",
  DITTO_FLAG_PLACED_ON_HOUSE: "ditto-flag-placed-on-house",
  CHOPPER_FIRST_HABITAT_REPORT: "chopper-first-habitat-report"
});

export const STORY_BEAT_EFFECT = Object.freeze({
  QUEST_EVENT: "quest-event",
  TRACK_FIELD_TASK: "track-field-task",
  SET_FLAG: "set-flag",
  OPEN_POKEDEX_ENTRY: "open-pokedex-entry",
  OPEN_DISCOVERED_HABITAT_POKEDEX: "open-discovered-habitat-pokedex",
  REGISTER_POKEDEX_REQUEST: "register-pokedex-request",
  OPEN_POKEDEX_REQUEST: "open-pokedex-request",
  UNLOCK_SKILL: "unlock-skill",
  PUSH_NOTICE: "push-notice",
  CUSTOM: "custom"
});

export const SMALL_ISLAND_FIELD_TASKS = Object.freeze({
  [FIELD_TASK_IDS.MAKING_HABITATS]: {
    id: FIELD_TASK_IDS.MAKING_HABITATS,
    title: "Making habitats",
    description: "Arrange tall grass, trees, rocks and furniture into the right combinations to create a Pokemon Habitat!",
    completeFlag: "makingHabitatsComplete",
    background: true
  },
  [FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST]: {
    id: FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST,
    title: "Talk to Bulbasaur",
    description: "Bulbasaur has a request. Help him, and he will teach you a new move.",
    completeFlag: "bulbasaurDryGrassMissionAccepted"
  },
  [FIELD_TASK_IDS.WATER_DRY_TALL_GRASS]: {
    id: FIELD_TASK_IDS.WATER_DRY_TALL_GRASS,
    title: "Water dry tall grass",
    description(storyState = {}) {
      const current = Math.min(10, Number(storyState.flags?.restoredGrassCount || 0));
      return `Water the dry tall grass for Bulbasaur. ${current}/10 restored.`;
    },
    completeFlag: "bulbasaurDryGrassMissionComplete"
  },
  [FIELD_TASK_IDS.BULBASAUR_LEAFAGE_REWARD]: {
    id: FIELD_TASK_IDS.BULBASAUR_LEAFAGE_REWARD,
    title: "Return to Bulbasaur",
    description: "Talk to Bulbasaur to complete the request and learn Leafage.",
    completeFlag: "bulbasaurDryGrassRequestTurnedIn"
  },
  [FIELD_TASK_IDS.BULBASAUR_GREEN_CORNER_PLAY_SEED]: {
    id: FIELD_TASK_IDS.BULBASAUR_GREEN_CORNER_PLAY_SEED,
    title: "Make a green corner",
    description(storyState = {}) {
      const flags = storyState.flags || {};
      const current = Math.min(4, Number(flags.leafageTallGrassCount || 0));

      if (flags.leafageTallGrassHabitatCreated) {
        return "Bulbasaur's green corner is ready. Pokemon have a cozy place to gather.";
      }

      return `Use Leafage where you want Pokemon to gather. ${current}/4 tall grass grown.`;
    },
    completeFlag: "leafageTallGrassHabitatCreated",
    background: true,
    eyebrow: "play seed"
  },
  [FIELD_TASK_IDS.GIVE_LEPPA_BERRY]: {
    id: FIELD_TASK_IDS.GIVE_LEPPA_BERRY,
    title: "Give Leppa Berry to Bulbasaur",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.leppaBerryGiftComplete) {
        return "You gave the Leppa Berry to a friend for Bulbasaur.";
      }

      if (flags.leppaBerryCollected) {
        return "Talk to Squirtle or Bulbasaur and choose Look at this! to show the Leppa Berry.";
      }

      if (flags.leppaBerryDropped) {
        return "Pick up the Leppa Berry from the ground.";
      }

      if (flags.leppaTreeRevived) {
        return "Press X by the revived tree to pick a Leppa Berry.";
      }

      return "Use Water Gun on the four tiles around a dead tree to revive it.";
    },
    completeFlag: "leppaBerryGiftComplete"
  },
  [FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR]: {
    id: FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR,
    title: "Tangrowth",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.logChairSat) {
        return "You placed Chopper's log chair and took a short rest.";
      }

      if (flags.logChairPlaced) {
        return "Stand close to the log chair and press A or E to sit on it.";
      }

      if (flags.logChairReceived) {
        return "Place the log chair nearby.";
      }

      return "Talk to Chopper and receive a log chair.";
    },
    completeFlag: "logChairSat"
  },
  [FIELD_TASK_IDS.WORKBENCH_CAMPFIRE]: {
    id: FIELD_TASK_IDS.WORKBENCH_CAMPFIRE,
    title: "Workbench",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.campfireCrafted) {
        return "You made a Campfire at the Workbench.";
      }

      if (flags.workbenchDiyRecipesReceived) {
        return "Use the Workbench to create a Campfire.";
      }

      return "Follow Bulbasaur to the nearby area and interact with the Workbench.";
    },
    completeFlag: "campfireCrafted"
  },
  [FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE]: {
    id: FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE,
    title: "Professor Tangrowth",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.campfireSpatOut) {
        return "You spat out the Campfire for Professor Tangrowth.";
      }

      if (flags.campfireSelectedForTangrowth) {
        return "Return to Professor Tangrowth and press A or E to spit out the Campfire.";
      }

      return "Press X to open the bag and select the Campfire.";
    },
    completeFlag: "campfireSpatOut"
  },
  [FIELD_TASK_IDS.CHARMANDER_TALL_GRASS]: {
    id: FIELD_TASK_IDS.CHARMANDER_TALL_GRASS,
    title: "Charmander",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.charmanderCampfireLit) {
        return "Charmander lit the Campfire.";
      }

      if (flags.charmanderFollowing) {
        return "Lead Charmander close to the Campfire.";
      }

      if (flags.charmanderRevealed) {
        return "Press D-Pad Up or Arrow Up to ask Charmander to follow you.";
      }

      if (flags.charmanderRustlingGrassCellId) {
        return "Inspect the rustling grass.";
      }

      const current = Math.min(4, Number(flags.leafageTallGrassCount || 0));
      return `Use Leafage to grow a Tall Grass habitat. ${current}/4 tall grass grown.`;
    },
    completeFlag: "charmanderCampfireLit"
  },
  [FIELD_TASK_IDS.RUINED_POKEMON_CENTER]: {
    id: FIELD_TASK_IDS.RUINED_POKEMON_CENTER,
    title: "Ruined Pokemon Center",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.challengesUnlocked) {
        return "Challenges are unlocked from the old PC.";
      }

      if (flags.ruinedPokemonCenterInspected) {
        return "Check the PC inside the destroyed Pokemon Center.";
      }

      if (flags.pokemonCenterGuideStarted) {
        return "Follow Professor Tangrowth to the destroyed Pokemon Center and inspect the building.";
      }

      return "Wait for Professor Tangrowth to lead you to the destroyed Pokemon Center.";
    },
    completeFlag: "challengesUnlocked"
  },
  [FIELD_TASK_IDS.BOULDER_SHADED_TALL_GRASS]: {
    id: FIELD_TASK_IDS.BOULDER_SHADED_TALL_GRASS,
    title: "Boulder-Shaded Tall Grass",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.boulderChallengeRewardClaimed) {
        return "You claimed Life Coins from the Pokemon Center PC.";
      }

      if (flags.timburrRevealed) {
        return "Return to the Pokemon Center PC to receive Life Coins.";
      }

      if (flags.boulderShadedTallGrassHabitatCreated) {
        return "Inspect the rustling Boulder-Shaded Tall Grass.";
      }

      const current = Math.min(4, Number(flags.boulderShadedTallGrassCount || 0));
      return `Use Leafage near the boulder to create Boulder-Shaded Tall Grass. ${current}/4 tall grass grown.`;
    },
    completeFlag: "boulderChallengeRewardClaimed"
  },
  [FIELD_TASK_IDS.BULBASAUR_STRAW_BED]: {
    id: FIELD_TASK_IDS.BULBASAUR_STRAW_BED,
    title: "Bulbasaur",
    description(storyState = {}) {
      const flags = storyState.flags || {};
      const wateredTrees = Math.min(5, Number(flags.wateredTreeCount || 0));
      const sturdySticks = Math.min(10, Number(flags.sturdySticksGatheredForChallenge || 0));

      if (flags.strawBedRecipeUnlocked) {
        return "You learned the Straw Bed recipe from Bulbasaur.";
      }

      if (flags.bulbasaurStrawBedChallengeComplete) {
        return 'Talk to Bulbasaur and choose "Do you need anything?" to learn the Straw Bed recipe.';
      }

      return `Water 5 trees and gather 10 sturdy sticks. ${wateredTrees}/5 trees watered, ${sturdySticks}/10 sturdy sticks gathered.`;
    },
    completeFlag: "strawBedRecipeUnlocked"
  },
  [FIELD_TASK_IDS.STRAW_BED_RECIPE]: {
    id: FIELD_TASK_IDS.STRAW_BED_RECIPE,
    title: "Straw Bed Recipe",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.bulbasaurStrawBedRequestComplete) {
        return "Bulbasaur's Straw Bed request is complete.";
      }

      if (flags.strawBedPlacedInBulbasaurHabitat) {
        return "Talk to Bulbasaur after placing the Straw Bed.";
      }

      if (flags.strawBedCrafted) {
        if (flags.strawBedSelectedForBulbasaur) {
          return "Place the Straw Bed within the boundaries of Bulbasaur's habitat.";
        }

        return "Open the bag with X and select the Straw Bed.";
      }

      return "Use the Workbench to craft the Straw Bed. You will need 2 Leaves.";
    },
    completeFlag: "bulbasaurStrawBedRequestComplete"
  },
  [FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC]: {
    id: FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC,
    title: "New Challenges in PC",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.newPcChallengesChecked) {
        return "You checked the new Challenges added to the Pokemon Center PC.";
      }

      return "Interact with the PC to check the new Challenges that have been added.";
    },
    completeFlag: "newPcChallengesChecked"
  },
  [FIELD_TASK_IDS.LEAF_DEN_KIT]: {
    id: FIELD_TASK_IDS.LEAF_DEN_KIT,
    title: "Talk to Professor Tangrowth",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.leafDenKitPurchased) {
        return "You purchased a Leaf Den Kit from the PC Shop.";
      }

      if (flags.leafDenKitPurchaseAvailable) {
        return "Go to the Pokemon Center PC and purchase a Leaf Den Kit from the Shop.";
      }

      return "Talk to Professor Tangrowth about building houses.";
    },
    completeFlag: "leafDenKitPurchased"
  },
  [FIELD_TASK_IDS.BUILD_LEAF_DEN]: {
    id: FIELD_TASK_IDS.BUILD_LEAF_DEN,
    title: "Building the Leaf Den",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.leafDenBuilt) {
        return "The Leaf Den is complete.";
      }

      if (flags.leafDenConstructionStarted) {
        return "Construction is underway. Inspect the Leaf Den after a few real-world hours, or skip ahead by changing the system time.";
      }

      if (flags.leafDenKitPlaced) {
        return "Gather 3 Sturdy Sticks and 3 Leaves, then lead Timburr and Charmander to the Leaf Den Kit and inspect it.";
      }

      if (flags.leafDenKitSelected) {
        return "Place the Leaf Den Kit in a clear area.";
      }

      return "Open the bag with X and select the Leaf Den Kit, then place it in a clear area.";
    },
    completeFlag: "leafDenBuilt"
  },
  [FIELD_TASK_IDS.LEAF_DEN_FURNITURE]: {
    id: FIELD_TASK_IDS.LEAF_DEN_FURNITURE,
    title: "Furnitures inside Leaf Den",
    description(storyState = {}) {
      const flags = storyState.flags || {};
      const placed = Math.min(3, Number(flags.leafDenFurniturePlacedCount || 0));

      if (flags.leafDenFurnitureRequestComplete) {
        return "Timburr approved the furniture inside the Leaf Den.";
      }

      if (placed >= 3) {
        return "Talk to Timburr to complete the request.";
      }

      if (flags.leafDenInteriorEntered) {
        return `Place 3 furniture pieces inside the Leaf Den. ${placed}/3 placed.`;
      }

      return "Enter the Leaf Den and place 3 furniture pieces inside.";
    },
    completeFlag: "leafDenFurnitureRequestComplete"
  },
  [FIELD_TASK_IDS.CHARMANDER_CELEBRATION]: {
    id: FIELD_TASK_IDS.CHARMANDER_CELEBRATION,
    title: "Charmander Celebration",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.dittoFlagReceived || flags.charmanderCelebrationComplete) {
        return "You received a Ditto Flag after the celebration.";
      }

      if (flags.charmanderCelebrationSuggested) {
        return "Bring Charmander to Professor Tangrowth and talk to Tangrowth.";
      }

      return "Talk to Charmander about throwing a celebration after building the house.";
    },
    completeFlag: "dittoFlagReceived"
  },
  [FIELD_TASK_IDS.DITTO_FLAG_HOUSE]: {
    id: FIELD_TASK_IDS.DITTO_FLAG_HOUSE,
    title: "Place Ditto Flag on your house",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.dittoFlagPlacedOnHouse) {
        return "The Leaf Den is marked as your house.";
      }

      if (flags.dittoFlagSelectedForHouse) {
        return "Head to the Leaf Den and place the Ditto Flag.";
      }

      return "Open the bag with X and select the Ditto Flag, then head to the Leaf Den.";
    },
    completeFlag: "dittoFlagPlacedOnHouse"
  }
});

export const SMALL_ISLAND_STORY_BEATS = Object.freeze({
  [STORY_BEAT_IDS.CHOPPER_ONBOARDING]: {
    id: STORY_BEAT_IDS.CHOPPER_ONBOARDING,
    dialogueId: "chopperOnboarding",
    fallbackLines: TANGROWTH_ONBOARDING_DIALOGUE
  },
  [STORY_BEAT_IDS.SQUIRTLE_DISCOVERY]: {
    id: STORY_BEAT_IDS.SQUIRTLE_DISCOVERY,
    dialogueId: "strandedHelperDiscovery",
    fallbackLines: SQUIRTLE_DISCOVERY_DIALOGUE
  },
  [STORY_BEAT_IDS.CHOPPER_TALL_GRASS_RETURN]: {
    id: STORY_BEAT_IDS.CHOPPER_TALL_GRASS_RETURN,
    dialogueId: "chopperTallGrassReturn",
    fallbackLines: TANGROWTH_TALL_GRASS_RETURN_DIALOGUE,
    onceFlag: "tangrowthTallGrassCommentSeen",
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "tangrowthTallGrassCommentSeen"
      }
    ]
  },
  [STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY]: {
    id: STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY,
    dialogueId: "chopperTallGrassHabitatRestored",
    fallbackLines: TANGROWTH_TALL_GRASS_MEMORY_DIALOGUE,
    onceFlag: "chopperTallGrassHabitatMemorySeen",
    effects: [
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.MAKING_HABITATS
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_DISCOVERED_HABITAT_POKEDEX
      }
    ]
  },
  [STORY_BEAT_IDS.CHOPPER_FLOWER_RECOVERY]: {
    id: STORY_BEAT_IDS.CHOPPER_FLOWER_RECOVERY,
    dialogueId: "chopperFlowerRecovery",
    fallbackLines: TANGROWTH_FLOWER_RECOVERY_DIALOGUE
  },
  [STORY_BEAT_IDS.BULBASAUR_HABITAT_DISCOVERY]: {
    id: STORY_BEAT_IDS.BULBASAUR_HABITAT_DISCOVERY,
    dialogueId: "leafHelperHabitat",
    fallbackLines: BULBASAUR_HABITAT_DISCOVERY_DIALOGUE
  },
  [STORY_BEAT_IDS.CHOPPER_BULBASAUR_ENCOURAGEMENT]: {
    id: STORY_BEAT_IDS.CHOPPER_BULBASAUR_ENCOURAGEMENT,
    dialogueId: "chopperBulbasaurEncouragement",
    fallbackLines: CHOPPER_BULBASAUR_ENCOURAGEMENT_DIALOGUE,
    onceFlag: "chopperBulbasaurEncouragementSeen",
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "chopperPatrolEnabled"
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_POKEDEX_ENTRY,
        entryId: BULBASAUR_POKEDEX_ENTRY_ID
      }
    ]
  },
  [STORY_BEAT_IDS.BULBASAUR_DRY_GRASS_REQUEST]: {
    id: STORY_BEAT_IDS.BULBASAUR_DRY_GRASS_REQUEST,
    dialogueId: "bulbasaurDryGrassRequest",
    fallbackLines: BULBASAUR_DRY_GRASS_REQUEST_DIALOGUE,
    effects: [
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.WATER_DRY_TALL_GRASS
      }
    ]
  },
  [STORY_BEAT_IDS.BULBASAUR_LEAFAGE_REWARD]: {
    id: STORY_BEAT_IDS.BULBASAUR_LEAFAGE_REWARD,
    dialogueId: "bulbasaurLeafageReward",
    fallbackLines: BULBASAUR_LEAFAGE_REWARD_DIALOGUE,
    onceFlag: "bulbasaurDryGrassRequestTurnedIn",
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "bulbasaurDryGrassRequestTurnedIn"
      },
      {
        type: STORY_BEAT_EFFECT.QUEST_EVENT,
        event: {
          type: QUEST_EVENT.TALK,
          targetId: "leaf-helper"
        }
      },
      {
        type: STORY_BEAT_EFFECT.UNLOCK_SKILL,
        skillId: "leafage",
        options: {
          silent: true
        }
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You learned Leafage."
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "squirtleLeppaRequestAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.GIVE_LEPPA_BERRY
      },
      {
        type: STORY_BEAT_EFFECT.REGISTER_POKEDEX_REQUEST,
        requestId: SQUIRTLE_LEPPA_BERRY_REQUEST_ID
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_POKEDEX_REQUEST,
        requestId: SQUIRTLE_LEPPA_BERRY_REQUEST_ID,
        entryId: SQUIRTLE_POKEDEX_ENTRY_ID
      }
    ]
  },
  [STORY_BEAT_IDS.LEPPA_BERRY_DELIVERY]: {
    id: STORY_BEAT_IDS.LEPPA_BERRY_DELIVERY,
    buildLines(context = {}) {
      const targetId = context.targetId || "bulbasaur";
      const targetName = targetId === "squirtle" ? "Squirtle" : "Bulbasaur";

      return [
        {
          speaker: "You",
          text: "Look at this!"
        },
        {
          speaker: "Pokedesk",
          text: "You chose the Leppa Berry."
        },
        targetId === "squirtle" ?
          {
            speaker: "Squirtle",
            text: "A Leppa Berry! That's perfect. Bulbasaur will feel a lot better with this."
          } :
          {
            speaker: "Bulbasaur",
            text: "Oh! A Leppa Berry! Thank you so much. This makes the tall grass feel even more like home."
          },
        {
          speaker: targetName,
          text: "Let's keep making this place greener, one little habitat at a time."
        }
      ];
    },
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leppaBerryGiftComplete"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You gave away the Leppa Berry."
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "tangrowthLogChairRequestAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR
      }
    ]
  },
  [STORY_BEAT_IDS.CHOPPER_LOG_CHAIR_GIFT]: {
    id: STORY_BEAT_IDS.CHOPPER_LOG_CHAIR_GIFT,
    fallbackLines: [
      {
        speaker: "Chopper",
        text: "You've been working hard out here. A habitat is not just plants and paths, you know."
      },
      {
        speaker: "Chopper",
        text: "It needs a place where someone can stop for a moment and feel welcome."
      },
      {
        speaker: "Chopper",
        text: "Here, take this log chair. Place it nearby, then try sitting on it."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "logChairReceived"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You got a Log Chair."
      }
    ]
  },
  [STORY_BEAT_IDS.LOG_CHAIR_REST]: {
    id: STORY_BEAT_IDS.LOG_CHAIR_REST,
    fallbackLines: [
      {
        speaker: "Chopper",
        text: "There we go. Even a small chair can make this place feel a little more lived in."
      },
      {
        speaker: "Chopper",
        text: "Keep building habitats like that, with room for Pokemon to rest, hide, and feel at home."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "logChairSat"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You sat on the Log Chair."
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "bulbasaurWorkbenchGuideAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.WORKBENCH_CAMPFIRE
      }
    ]
  },
  [STORY_BEAT_IDS.WORKBENCH_DIY_RECIPES]: {
    id: STORY_BEAT_IDS.WORKBENCH_DIY_RECIPES,
    fallbackLines: [
      {
        speaker: "Bulbasaur",
        text: "Here it is! Chopper called this a Workbench."
      },
      {
        speaker: "Bulbasaur",
        text: "If you learn the simple wooden DIY recipes, you can make things that help habitats feel cozy."
      },
      {
        speaker: "Pokedesk",
        text: "Simple wooden DIY recipes were added to your bag."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "workbenchDiyRecipesReceived"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You learned simple wooden DIY recipes."
      }
    ]
  },
  [STORY_BEAT_IDS.CAMPFIRE_CREATED]: {
    id: STORY_BEAT_IDS.CAMPFIRE_CREATED,
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "campfireCrafted"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You created a Campfire."
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE
      }
    ]
  },
  [STORY_BEAT_IDS.CAMPFIRE_SPIT_OUT]: {
    id: STORY_BEAT_IDS.CAMPFIRE_SPIT_OUT,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "You spat out the Campfire."
      },
      {
        speaker: "Professor Tangrowth",
        text: "Good. Furniture and tools belong out in the world, not just tucked away in your bag."
      },
      {
        speaker: "Professor Tangrowth",
        text: "Place things where Pokemon can gather, rest, and feel at home."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "campfireSpatOut"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You spat out the Campfire."
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.CHARMANDER_TALL_GRASS
      }
    ]
  },
  [STORY_BEAT_IDS.CHARMANDER_DISCOVERY]: {
    id: STORY_BEAT_IDS.CHARMANDER_DISCOVERY,
    fallbackLines: [
      {
        speaker: "Charmander",
        text: "Whoa, fresh tall grass! I was hiding in there where it felt warm and safe."
      },
      {
        speaker: "Charmander",
        text: "If you need fire, call me over. I can help light that Campfire."
      },
      {
        speaker: "Pokedesk",
        text: "Charmander was registered."
      }
    ],
    onceFlag: "charmanderDiscoverySeen",
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderRevealed"
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_POKEDEX_ENTRY,
        entryId: CHARMANDER_POKEDEX_ENTRY_ID
      }
    ]
  },
  [STORY_BEAT_IDS.CHARMANDER_CAMPFIRE_LIT]: {
    id: STORY_BEAT_IDS.CHARMANDER_CAMPFIRE_LIT,
    fallbackLines: [
      {
        speaker: "Charmander",
        text: "There! A warm fire makes this place feel much more like home."
      },
      {
        speaker: "Professor Tangrowth",
        text: "Excellent. Habitats come alive when the right Pokemon and objects work together."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderCampfireLit"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Charmander lit the Campfire."
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "pokemonCenterGuideStarted"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.RUINED_POKEMON_CENTER
      }
    ]
  },
  [STORY_BEAT_IDS.RUINED_POKEMON_CENTER_INSPECTED]: {
    id: STORY_BEAT_IDS.RUINED_POKEMON_CENTER_INSPECTED,
    fallbackLines: [
      {
        speaker: "Professor Tangrowth",
        text: "This is what is left of the old Pokemon Center. It used to be the safest place on the island."
      },
      {
        speaker: "Professor Tangrowth",
        text: "The building is ruined, but that PC still has power flickering through it."
      },
      {
        speaker: "Pokedesk",
        text: "Check the PC inside the ruins."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "ruinedPokemonCenterInspected"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You inspected the ruined Pokemon Center."
      }
    ]
  },
  [STORY_BEAT_IDS.CHALLENGES_UNLOCKED]: {
    id: STORY_BEAT_IDS.CHALLENGES_UNLOCKED,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "The old PC flickers back online."
      },
      {
        speaker: "Pokedesk",
        text: "Challenges unlocked."
      },
      {
        speaker: "Professor Tangrowth",
        text: "Good. Challenges will help us prove each restored habitat can hold up."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "challengesUnlocked"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "boulderChallengeAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.BOULDER_SHADED_TALL_GRASS
      },
      {
        type: STORY_BEAT_EFFECT.REGISTER_POKEDEX_REQUEST,
        requestId: BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_POKEDEX_REQUEST,
        requestId: BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Challenges unlocked."
      }
    ]
  },
  [STORY_BEAT_IDS.TIMBURR_DISCOVERY]: {
    id: STORY_BEAT_IDS.TIMBURR_DISCOVERY,
    fallbackLines: [
      {
        speaker: "Timburr",
        text: "Hey! A shady patch by a boulder. That's perfect for training."
      },
      {
        speaker: "Timburr",
        text: "This place still needs a lot of work, right? I can help carry the heavy stuff."
      },
      {
        speaker: "Pokedesk",
        text: "Timburr was registered."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "timburrRevealed"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "boulderChallengeRewardReady"
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_POKEDEX_ENTRY,
        entryId: TIMBURR_POKEDEX_ENTRY_ID
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Return to the PC to claim Life Coins."
      }
    ]
  },
  [STORY_BEAT_IDS.BOULDER_CHALLENGE_REWARD]: {
    id: STORY_BEAT_IDS.BOULDER_CHALLENGE_REWARD,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "Challenge complete: Boulder-Shaded Tall Grass."
      },
      {
        speaker: "Pokedesk",
        text: "Life Coins received."
      },
      {
        speaker: "Professor Tangrowth",
        text: "Good work. New Pokemon finding their way back is the clearest sign this island is recovering."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "boulderChallengeRewardClaimed"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "bulbasaurStrawBedChallengeAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.BULBASAUR_STRAW_BED
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You received Life Coins."
      }
    ]
  },
  [STORY_BEAT_IDS.BULBASAUR_STRAW_BED_RECIPE]: {
    id: STORY_BEAT_IDS.BULBASAUR_STRAW_BED_RECIPE,
    fallbackLines: [
      {
        speaker: "You",
        text: "Do you need anything?"
      },
      {
        speaker: "Bulbasaur",
        text: "You watered the trees and gathered all those sturdy sticks! That's exactly what a grassy home needs."
      },
      {
        speaker: "Bulbasaur",
        text: "I drew up a Straw Bed recipe for you. It should make a habitat feel much cozier."
      },
      {
        speaker: "Pokedesk",
        text: "Straw Bed recipe was added to your bag."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "bulbasaurStrawBedChallengeComplete"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "strawBedRecipeUnlocked"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.STRAW_BED_RECIPE
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You learned the Straw Bed recipe."
      }
    ]
  },
  [STORY_BEAT_IDS.STRAW_BED_CREATED]: {
    id: STORY_BEAT_IDS.STRAW_BED_CREATED,
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "strawBedCrafted"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You created a Straw Bed."
      }
    ]
  },
  [STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE]: {
    id: STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE,
    fallbackLines: [
      {
        speaker: "Bulbasaur",
        text: "A Straw Bed right in the tall grass! It smells like fresh leaves and feels so soft."
      },
      {
        speaker: "Bulbasaur",
        text: "This habitat feels much more like home now. Thank you!"
      },
      {
        speaker: "Pokedesk",
        text: "Bulbasaur's request is complete."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "bulbasaurStrawBedRequestComplete"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "newPcChallengesAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Bulbasaur's Straw Bed request complete."
      }
    ]
  },
  [STORY_BEAT_IDS.NEW_PC_CHALLENGES]: {
    id: STORY_BEAT_IDS.NEW_PC_CHALLENGES,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "The Pokemon Center PC is online again."
      },
      {
        speaker: "Pokedesk",
        text: "New Challenges have been added."
      },
      {
        speaker: "Professor Tangrowth",
        text: "That means the island is ready for more habitat checks. Open the Challenges whenever you need the next lead."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "newPcChallengesChecked"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "tangrowthHouseTalkAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.LEAF_DEN_KIT
      },
      {
        type: STORY_BEAT_EFFECT.REGISTER_POKEDEX_REQUEST,
        requestId: NEW_HABITAT_CHALLENGES_ID
      },
      {
        type: STORY_BEAT_EFFECT.OPEN_POKEDEX_REQUEST,
        requestId: NEW_HABITAT_CHALLENGES_ID
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "New Challenges added."
      }
    ]
  },
  [STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK]: {
    id: STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK,
    fallbackLines: [
      {
        speaker: "Professor Tangrowth",
        text: "You've been restoring habitats, but Pokemon need places to settle too."
      },
      {
        speaker: "Professor Tangrowth",
        text: "A proper house gives them somewhere quiet to rest after they come back to the island."
      },
      {
        speaker: "Professor Tangrowth",
        text: "The Pokemon Center PC Shop should have a Leaf Den Kit. Buy one and we can start from there."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "tangrowthHouseTalkComplete"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenKitPurchaseAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Leaf Den Kit is available in the PC Shop."
      }
    ]
  },
  [STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED]: {
    id: STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "PC Shop opened."
      },
      {
        speaker: "Pokedesk",
        text: "Leaf Den Kit purchased."
      },
      {
        speaker: "Professor Tangrowth",
        text: "Good. Bring that kit with you and we will start turning these habitats into real homes."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenKitPurchased"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenBuildAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.BUILD_LEAF_DEN
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You purchased a Leaf Den Kit."
      }
    ]
  },
  [STORY_BEAT_IDS.LEAF_DEN_CONSTRUCTION_STARTED]: {
    id: STORY_BEAT_IDS.LEAF_DEN_CONSTRUCTION_STARTED,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "Timburr and Charmander were selected as construction helpers."
      },
      {
        speaker: "Pokedesk",
        text: "3 Sturdy Sticks and 3 Leaves were selected as materials."
      },
      {
        speaker: "Timburr",
        text: "Leave the heavy lifting to me. This Leaf Den will be standing before you know it!"
      },
      {
        speaker: "Pokedesk",
        text: "Leaf Den construction has started. It will take a few real-world hours to complete."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenConstructionStarted"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Leaf Den construction started."
      }
    ]
  },
  [STORY_BEAT_IDS.LEAF_DEN_COMPLETE]: {
    id: STORY_BEAT_IDS.LEAF_DEN_COMPLETE,
    fallbackLines: [
      {
        speaker: "Pokedesk",
        text: "Leaf Den construction is complete."
      },
      {
        speaker: "Professor Tangrowth",
        text: "A leafy home like this will make Pokemon feel much more welcome here."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenBuilt"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenFurnitureRequestAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.LEAF_DEN_FURNITURE
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "The Leaf Den is complete."
      }
    ]
  },
  [STORY_BEAT_IDS.TIMBURR_LEAF_DEN_FURNITURE_COMPLETE]: {
    id: STORY_BEAT_IDS.TIMBURR_LEAF_DEN_FURNITURE_COMPLETE,
    fallbackLines: [
      {
        speaker: "Timburr",
        text: "Nice work! Three pieces of furniture make the Leaf Den feel like a real home."
      },
      {
        speaker: "Timburr",
        text: "Now Pokemon have places to sit, sleep, and settle in after they move here."
      },
      {
        speaker: "Pokedesk",
        text: "Leaf Den furniture request complete."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenFurnitureRequestComplete"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderCelebrationRequestAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.CHARMANDER_CELEBRATION
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Leaf Den furniture request complete."
      }
    ]
  },
  [STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION]: {
    id: STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION,
    fallbackLines: [
      {
        speaker: "Charmander",
        text: "The Leaf Den is ready, and it feels so cozy now!"
      },
      {
        speaker: "Charmander",
        text: "We should throw a celebration for everyone who helped build it!"
      },
      {
        speaker: "Charmander",
        text: "Come on, bring me to Professor Tangrowth and let's tell him!"
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderCelebrationSuggested"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderFollowing"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "Bring Charmander to Professor Tangrowth."
      }
    ]
  },
  [STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE]: {
    id: STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE,
    fallbackLines: [
      {
        speaker: "Charmander",
        text: "Professor Tangrowth! The house is built, and we want to celebrate!"
      },
      {
        speaker: "Professor Tangrowth",
        text: "A celebration is exactly what this island needs. Let this flag mark the first home brought back to life."
      },
      {
        speaker: "Pokedesk",
        text: "You received a Ditto Flag."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderCelebrationComplete"
      },
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "dittoFlagReceived"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.DITTO_FLAG_HOUSE
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "You received a Ditto Flag."
      }
    ]
  },
  [STORY_BEAT_IDS.DITTO_FLAG_PLACED_ON_HOUSE]: {
    id: STORY_BEAT_IDS.DITTO_FLAG_PLACED_ON_HOUSE,
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "dittoFlagPlacedOnHouse"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "The Leaf Den is now marked as your house."
      }
    ]
  },
  [STORY_BEAT_IDS.CHOPPER_FIRST_HABITAT_REPORT]: {
    id: STORY_BEAT_IDS.CHOPPER_FIRST_HABITAT_REPORT,
    dialogueId: "chopperFirstHabitatReport",
    effects: [
      {
        type: STORY_BEAT_EFFECT.QUEST_EVENT,
        event: {
          type: QUEST_EVENT.TALK,
          targetId: "chopper-first-habitat-report"
        }
      }
    ]
  }
});
