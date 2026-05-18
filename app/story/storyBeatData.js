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
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "./sandbotsLexicon.js";

export const FIELD_TASK_IDS = Object.freeze({
  MAKING_HABITATS: "making-habitats",
  BULBASAUR_DRY_GRASS_REQUEST: "bulbasaur-dry-grass-request",
  REVIVE_LEPPA_TREE: "revive-leppa-tree",
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
  BULBASAUR_WORKBENCH_GUIDE_INTRO: "bulbasaur-workbench-guide-intro",
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

const BULBASAUR_DRY_TALL_GRASS_RESTORE_TARGET = 10;

function buildChopperOnboardingLines(context = {}, { dialogueLines = [] } = {}) {
  const lines = dialogueLines.length ? dialogueLines : TANGROWTH_ONBOARDING_DIALOGUE;

  if (context.needsPlayerName !== false) {
    return lines;
  }

  return lines.filter((line) => line.id !== "ask-player-name");
}

export const SMALL_ISLAND_FIELD_TASKS = Object.freeze({
  [FIELD_TASK_IDS.MAKING_HABITATS]: {
    id: FIELD_TASK_IDS.MAKING_HABITATS,
    title: "Making colony zones",
    description: "Arrange tall grass, trees, rocks and furniture into the right combinations to create a viable colony zone.",
    completeFlag: "makingHabitatsComplete",
    background: true
  },
  [FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST]: {
    id: FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST,
    title: `Talk to ${SANDBOTS_BOT_NAMES.grow}`,
    description: `${SANDBOTS_BOT_NAMES.grow} has a request. Help it, and it will unlock a new field tool.`,
    completeFlag: "bulbasaurDryGrassMissionAccepted"
  },
  [FIELD_TASK_IDS.REVIVE_LEPPA_TREE]: {
    id: FIELD_TASK_IDS.REVIVE_LEPPA_TREE,
    title: "Revive the dead tree",
    description: `Use ${SANDBOTS_ITEM_NAMES.hydroTool} on the four dry tiles around the dead tree so the route can prove water still reaches deep roots.`,
    completeFlag: "leppaTreeRevived"
  },
  [FIELD_TASK_IDS.WATER_DRY_TALL_GRASS]: {
    id: FIELD_TASK_IDS.WATER_DRY_TALL_GRASS,
    title: "Water dry tall grass",
    description(storyState = {}) {
      const current = Math.min(
        BULBASAUR_DRY_TALL_GRASS_RESTORE_TARGET,
        Number(storyState.flags?.restoredGrassCount || 0)
      );
      return `Water the dry tall grass for ${SANDBOTS_BOT_NAMES.grow} so it can test whether habitat grass can return. ${current}/${BULBASAUR_DRY_TALL_GRASS_RESTORE_TARGET} restored.`;
    },
    isComplete(storyState = {}) {
      return Number(storyState.flags?.restoredGrassCount || 0) >=
        BULBASAUR_DRY_TALL_GRASS_RESTORE_TARGET;
    },
    completeFlag: "bulbasaurDryGrassMissionComplete"
  },
  [FIELD_TASK_IDS.BULBASAUR_LEAFAGE_REWARD]: {
    id: FIELD_TASK_IDS.BULBASAUR_LEAFAGE_REWARD,
    title: `Return to ${SANDBOTS_BOT_NAMES.grow}`,
    description: `Talk to ${SANDBOTS_BOT_NAMES.grow} to complete the request and learn ${SANDBOTS_ITEM_NAMES.growTool} for the first habitat patch.`,
    completeFlag: "bulbasaurDryGrassRequestTurnedIn"
  },
  [FIELD_TASK_IDS.BULBASAUR_GREEN_CORNER_PLAY_SEED]: {
    id: FIELD_TASK_IDS.BULBASAUR_GREEN_CORNER_PLAY_SEED,
    title: "Make a green corner",
    description(storyState = {}) {
      const flags = storyState.flags || {};
      const current = Math.min(4, Number(flags.leafageTallGrassCount || 0));

      if (flags.leafageTallGrassHabitatCreated) {
        return `${SANDBOTS_BOT_NAMES.grow}'s green corner is ready. Bots have a cozy place to gather.`;
      }

      return `Use ${SANDBOTS_ITEM_NAMES.growTool} where you want bots to gather; this turns restored soil into a colony corner. ${current}/4 tall grass grown.`;
    },
    completeFlag: "leafageTallGrassHabitatCreated",
    background: true,
    eyebrow: "play seed"
  },
  [FIELD_TASK_IDS.GIVE_LEPPA_BERRY]: {
    id: FIELD_TASK_IDS.GIVE_LEPPA_BERRY,
    title: `Give Pulse Berry to ${SANDBOTS_BOT_NAMES.grow}`,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.leppaBerryGiftComplete) {
        return `You gave the Pulse Berry to a friend for ${SANDBOTS_BOT_NAMES.grow}.`;
      }

      if (flags.leppaBerryCollected) {
        return `Talk to ${SANDBOTS_BOT_NAMES.hydro} or ${SANDBOTS_BOT_NAMES.grow} and choose Look at this! to show the Pulse Berry.`;
      }

      if (flags.leppaBerryDropped) {
        return "Pick up the Pulse Berry from the ground.";
      }

      if (flags.leppaTreeRevived) {
        return "Press X by the revived tree to pick a Pulse Berry.";
      }

      return `Use ${SANDBOTS_ITEM_NAMES.hydroTool} on the four tiles around a dead tree to revive it.`;
    },
    completeFlag: "leppaBerryGiftComplete"
  },
  [FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR]: {
    id: FIELD_TASK_IDS.TANGROWTH_LOG_CHAIR,
    title: SANDBOTS_BOT_NAMES.overseer,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.logChairSat) {
        return "You placed Chopper's log chair and saved your game.";
      }

      if (flags.logChairPlaced) {
        return "Stand close to the log chair and press X to save your game.";
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
        return `You made ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin} at the Workbench.`;
      }

      if (flags.workbenchDiyRecipesReceived) {
        return `Use the Workbench to create ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin}.`;
      }

      return `Follow ${SANDBOTS_BOT_NAMES.grow} to the nearby area and interact with the Workbench.`;
    },
    completeFlag: "campfireCrafted"
  },
  [FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE]: {
    id: FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE,
    title: SANDBOTS_ITEM_NAMES.thermalCabin,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.campfireSpatOut) {
        return `You placed ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin}.`;
      }

      return `Press A or E anywhere outside to place ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin}.`;
    },
    completeFlag: "campfireSpatOut"
  },
  [FIELD_TASK_IDS.CHARMANDER_TALL_GRASS]: {
    id: FIELD_TASK_IDS.CHARMANDER_TALL_GRASS,
    title: SANDBOTS_BOT_NAMES.thermal,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.charmanderCampfireLit) {
        return `${SANDBOTS_BOT_NAMES.thermal} moved into the ${SANDBOTS_ITEM_NAMES.thermalCabin}.`;
      }

      if (flags.charmanderFollowing) {
        return `Lead ${SANDBOTS_BOT_NAMES.thermal} close to the ${SANDBOTS_ITEM_NAMES.thermalCabin}.`;
      }

      if (flags.charmanderRevealed) {
        return `Press D-Pad Up or Arrow Up to ask ${SANDBOTS_BOT_NAMES.thermal} to follow you.`;
      }

      if (flags.charmanderRustlingGrassCellId) {
        return `Help ${SANDBOTS_BOT_NAMES.thermal} in the tall grass.`;
      }

      const current = Math.min(4, Number(flags.leafageTallGrassCount || 0));
      return `Use ${SANDBOTS_ITEM_NAMES.growTool} to grow a Tall Grass habitat. ${current}/4 tall grass grown.`;
    },
    completeFlag: "charmanderCampfireLit"
  },
  [FIELD_TASK_IDS.RUINED_POKEMON_CENTER]: {
    id: FIELD_TASK_IDS.RUINED_POKEMON_CENTER,
    title: SANDBOTS_WORLD_TERMS.terminalRuins,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.challengesUnlocked) {
        return `Habitat checks are unlocked from the old ${SANDBOTS_WORLD_TERMS.terminal}.`;
      }

      if (flags.ruinedPokemonCenterInspected) {
        return `Check the ${SANDBOTS_WORLD_TERMS.terminal} beside the destroyed station.`;
      }

      if (flags.pokemonCenterGuideStarted) {
        return `Follow ${SANDBOTS_BOT_NAMES.overseer} to the destroyed ${SANDBOTS_WORLD_TERMS.terminal} and inspect the building.`;
      }

      return `Wait for ${SANDBOTS_BOT_NAMES.overseer} to lead you to the destroyed ${SANDBOTS_WORLD_TERMS.terminal}.`;
    },
    completeFlag: "challengesUnlocked"
  },
  [FIELD_TASK_IDS.BOULDER_SHADED_TALL_GRASS]: {
    id: FIELD_TASK_IDS.BOULDER_SHADED_TALL_GRASS,
    title: "Boulder-Shaded Tall Grass",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.boulderChallengeRewardClaimed) {
        return `The ${SANDBOTS_WORLD_TERMS.terminal} logged the Boulder-Shaded Tall Grass viability report.`;
      }

      if (flags.timburrRevealed) {
        return `Return to the ${SANDBOTS_WORLD_TERMS.terminal} to log the habitat viability report.`;
      }

      if (flags.boulderShadedTallGrassHabitatCreated) {
        return `Help ${SANDBOTS_BOT_NAMES.builder} near the boulder.`;
      }

      const current = Math.min(4, Number(flags.boulderShadedTallGrassCount || 0));
      return `Use ${SANDBOTS_ITEM_NAMES.growTool} near the boulder to create Boulder-Shaded Tall Grass. ${current}/4 tall grass grown.`;
    },
    completeFlag: "boulderChallengeRewardClaimed"
  },
  [FIELD_TASK_IDS.BULBASAUR_STRAW_BED]: {
    id: FIELD_TASK_IDS.BULBASAUR_STRAW_BED,
    title: SANDBOTS_BOT_NAMES.grow,
    description(storyState = {}) {
      const flags = storyState.flags || {};
      const wateredTrees = Math.min(5, Number(flags.wateredTreeCount || 0));
      const sturdySticks = Math.min(10, Number(flags.sturdySticksGatheredForChallenge || 0));

      if (flags.strawBedRecipeUnlocked) {
        return `You received the ${SANDBOTS_ITEM_NAMES.solarStation} plans from ${SANDBOTS_BOT_NAMES.grow}.`;
      }

      if (flags.bulbasaurStrawBedChallengeComplete) {
        return `Talk to ${SANDBOTS_BOT_NAMES.grow} and choose "Do you need anything?" to receive the ${SANDBOTS_ITEM_NAMES.solarStation} plans.`;
      }

      return `Prepare ${SANDBOTS_BOT_NAMES.grow}'s habitat supplies.`;
    },
    subtasks(storyState = {}) {
      const flags = storyState.flags || {};
      const wateredTrees = Math.min(5, Number(flags.wateredTreeCount || 0));
      const sturdySticks = Math.min(10, Number(flags.sturdySticksGatheredForChallenge || 0));

      if (flags.strawBedRecipeUnlocked || flags.bulbasaurStrawBedChallengeComplete) {
        return [];
      }

      return [
        {
          id: "water-trees",
          label: "Water 5 trees",
          progress: `${wateredTrees}/5 trees watered`,
          done: wateredTrees >= 5
        },
        {
          id: "gather-sturdy-sticks",
          label: "Gather 10 sturdy sticks",
          progress: `${sturdySticks}/10 sturdy sticks gathered`,
          done: sturdySticks >= 10
        }
      ];
    },
    completeFlag: "strawBedRecipeUnlocked"
  },
  [FIELD_TASK_IDS.STRAW_BED_RECIPE]: {
    id: FIELD_TASK_IDS.STRAW_BED_RECIPE,
    title: "Solar Station Plans",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.bulbasaurStrawBedRequestComplete) {
        return `${SANDBOTS_BOT_NAMES.grow}'s ${SANDBOTS_ITEM_NAMES.solarStation} request is complete.`;
      }

      if (flags.strawBedPlacedInBulbasaurHabitat) {
        return `Talk to ${SANDBOTS_BOT_NAMES.grow} after placing the ${SANDBOTS_ITEM_NAMES.solarStation}.`;
      }

      if (flags.strawBedCrafted) {
        if (flags.strawBedSelectedForBulbasaur) {
          return "Place the Solar Station within the boundaries of the Solar Station field.";
        }

        return "Press X at the Solar Station field to place the Solar Station.";
      }

      return "Press X at the Workbench and craft the Solar Station. You will need 2 Leaves.";
    },
    completeFlag: "bulbasaurStrawBedRequestComplete"
  },
  [FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC]: {
    id: FIELD_TASK_IDS.NEW_CHALLENGES_IN_PC,
    title: `New Habitat Checks in ${SANDBOTS_WORLD_TERMS.terminal}`,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.newPcChallengesChecked) {
        return `You checked the new habitat checks added to the ${SANDBOTS_WORLD_TERMS.terminal}.`;
      }

      return `Interact with the ${SANDBOTS_WORLD_TERMS.terminal} to review the new habitat checks.`;
    },
    completeFlag: "newPcChallengesChecked"
  },
  [FIELD_TASK_IDS.LEAF_DEN_KIT]: {
    id: FIELD_TASK_IDS.LEAF_DEN_KIT,
    title: `Talk to ${SANDBOTS_BOT_NAMES.overseer}`,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.leafDenKitPurchased) {
        return "The House Kit is ready for your first shelter.";
      }

      if (flags.leafDenKitPurchaseAvailable) {
        return `Go to the ${SANDBOTS_WORLD_TERMS.terminal} and claim the House Kit.`;
      }

      return `Talk to ${SANDBOTS_BOT_NAMES.overseer} about building houses.`;
    },
    completeFlag: "leafDenKitPurchased"
  },
  [FIELD_TASK_IDS.BUILD_LEAF_DEN]: {
    id: FIELD_TASK_IDS.BUILD_LEAF_DEN,
    title: "Build a House",
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.leafDenBuilt) {
        return "The House is complete.";
      }

      if (flags.leafDenConstructionStarted) {
        return "Construction is underway. Wait a few seconds for the House to take shape.";
      }

      if (flags.leafDenKitPlaced) {
        return "Gather 3 Sturdy Sticks and 3 Leaves, then inspect the House Kit.";
      }

      if (flags.leafDenKitSelected) {
        return "Place the House Kit in a clear area.";
      }

      return "Open the bag with X and select the House Kit, then place it in a clear area.";
    },
    completeFlag: "leafDenBuilt"
  },
  [FIELD_TASK_IDS.LEAF_DEN_FURNITURE]: {
    id: FIELD_TASK_IDS.LEAF_DEN_FURNITURE,
    title: "Furnitures inside House",
    description(storyState = {}) {
      const flags = storyState.flags || {};
      const placed = Math.min(3, Number(flags.leafDenFurniturePlacedCount || 0));

      if (flags.leafDenFurnitureRequestComplete) {
        return `${SANDBOTS_BOT_NAMES.builder} approved the furniture inside the House.`;
      }

      if (placed >= 3) {
        return `Talk to ${SANDBOTS_BOT_NAMES.builder} to complete the request.`;
      }

      if (flags.leafDenInteriorEntered) {
        return `Place 3 furniture pieces inside the House. ${placed}/3 placed.`;
      }

      return "Enter the House and place 3 furniture pieces inside.";
    },
    completeFlag: "leafDenFurnitureRequestComplete"
  },
  [FIELD_TASK_IDS.CHARMANDER_CELEBRATION]: {
    id: FIELD_TASK_IDS.CHARMANDER_CELEBRATION,
    title: `${SANDBOTS_BOT_NAMES.thermal} Celebration`,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.dittoFlagReceived || flags.charmanderCelebrationComplete) {
        return `You received a ${SANDBOTS_ITEM_NAMES.colonyFlag} after the celebration.`;
      }

      if (flags.charmanderCelebrationSuggested) {
        return `Bring ${SANDBOTS_BOT_NAMES.thermal} to ${SANDBOTS_BOT_NAMES.overseer} and talk to the overseer.`;
      }

      return `Talk to ${SANDBOTS_BOT_NAMES.thermal} about throwing a celebration after building the house.`;
    },
    completeFlag: "dittoFlagReceived"
  },
  [FIELD_TASK_IDS.DITTO_FLAG_HOUSE]: {
    id: FIELD_TASK_IDS.DITTO_FLAG_HOUSE,
    title: `Place ${SANDBOTS_ITEM_NAMES.colonyFlag} on your house`,
    description(storyState = {}) {
      const flags = storyState.flags || {};

      if (flags.dittoFlagPlacedOnHouse) {
        return "The House is marked as your house.";
      }

      if (flags.dittoFlagSelectedForHouse) {
        return `Head to the House and place the ${SANDBOTS_ITEM_NAMES.colonyFlag}.`;
      }

      return `Open the bag with X and select the ${SANDBOTS_ITEM_NAMES.colonyFlag}, then head to the House.`;
    },
    completeFlag: "dittoFlagPlacedOnHouse"
  }
});

export const SMALL_ISLAND_STORY_BEATS = Object.freeze({
  [STORY_BEAT_IDS.CHOPPER_ONBOARDING]: {
    id: STORY_BEAT_IDS.CHOPPER_ONBOARDING,
    dialogueId: "chopperOnboarding",
    buildLines: buildChopperOnboardingLines
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
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "squirtleLeppaRequestAvailable"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.REVIVE_LEPPA_TREE
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
        message: `You learned ${SANDBOTS_ITEM_NAMES.growTool}.`
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
      const targetName = targetId === "squirtle" ? SANDBOTS_BOT_NAMES.hydro : SANDBOTS_BOT_NAMES.grow;

      return [
        {
          speaker: "You",
          text: "Look at this!"
        },
        {
          speaker: SANDBOTS_WORLD_TERMS.codex,
          text: "You chose the Pulse Berry."
        },
        targetId === "squirtle" ?
          {
            speaker: SANDBOTS_BOT_NAMES.hydro,
            text: `A Pulse Berry. Good. ${SANDBOTS_BOT_NAMES.grow}'s stabilizer should stop complaining in plant language.`
          } :
          {
            speaker: SANDBOTS_BOT_NAMES.grow,
            text: "Oh! A Pulse Berry. Thank you. This makes the tall grass feel less like a crash site with leaves."
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
        message: "You gave away the Pulse Berry."
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
        text: "Here, take this log chair. Place it nearby, then use it to save your game."
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
        text: "Keep building habitats like that, with room for bots to rest, hide, and pretend this is normal."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "logChairSat"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "saved."
      }
    ]
  },
  [STORY_BEAT_IDS.BULBASAUR_WORKBENCH_GUIDE_INTRO]: {
    id: STORY_BEAT_IDS.BULBASAUR_WORKBENCH_GUIDE_INTRO,
    onceFlag: "bulbasaurWorkbenchGuideIntroSeen",
    fallbackLines: [
      {
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "I was thinking about that chair. A habitat needs more than a safe patch of grass."
      },
      {
        speaker: "You",
        text: "It needs things bots can actually use."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "Yeah! The Workbench can help us make cozy things from the materials we find. Come on, I'll show you!"
      }
    ],
    effects: [
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
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "Here it is! Chopper called this a Workbench."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "If we leave starter plans here, the bench can make things the colony actually needs."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Starter plans logged. Power plans can now issue Thermal Bot's cabin."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "workbenchDiyRecipesReceived"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "New Workbench plans available: Power."
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
        message: `You created ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin}.`
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
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: `You placed ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin}.`
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "campfireSpatOut"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: `You placed ${SANDBOTS_BOT_NAMES.thermal}'s ${SANDBOTS_ITEM_NAMES.thermalCabin}.`
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
        speaker: "Chopper",
        text: `The tall grass pinged an old repair beacon. ${SANDBOTS_BOT_NAMES.thermal} is moving again.`
      },
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: "Fresh cover. My chassis stopped erroring for a second, which is my highest available compliment."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: `If you find my ${SANDBOTS_ITEM_NAMES.thermalCabin}, call me over. That is where my heat loop belongs.`
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: `${SANDBOTS_BOT_NAMES.thermal} was registered.`
      }
    ],
    onceFlag: "charmanderDiscoverySeen",
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderRevealed"
      },
      {
        type: STORY_BEAT_EFFECT.TRACK_FIELD_TASK,
        taskId: FIELD_TASK_IDS.CHARMANDER_TALL_GRASS
      },
      {
        type: STORY_BEAT_EFFECT.UNLOCK_SKILL,
        skillId: "fire",
        options: {
          silent: true
        }
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: `You learned ${SANDBOTS_ITEM_NAMES.thermalTool}.`
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
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: "Thermal cabin detected. It is small, warm, and only slightly haunted by bad wiring."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.hydro,
        text: "There are three active bots and one ruined planet. Try to pace the celebration."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: "If the colony needs heat, call me. If it needs emotional stability, call someone else."
      },
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "charmanderCampfireLit"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: `${SANDBOTS_BOT_NAMES.thermal} moved into the ${SANDBOTS_ITEM_NAMES.thermalCabin}.`
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
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "Well, this is what's left of our office. For a brief, beautiful moment, we had some dignity."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "Then Bill had another fit of rage. The walls took it personally. The insurance, less so."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "But that's life, isn't it? You build a workplace, someone has a revelation, shit is all over the place."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Terminal core is responding. Please inspect the computer before the building lowers expectations further."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "ruinedPokemonCenterInspected"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: `You inspected the ruined ${SANDBOTS_WORLD_TERMS.terminal}.`
      }
    ]
  },
  [STORY_BEAT_IDS.CHALLENGES_UNLOCKED]: {
    id: STORY_BEAT_IDS.CHALLENGES_UNLOCKED,
    fallbackLines: [
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "The Colony Terminal flickers back online."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Habitat checks unlocked."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "Good. Habitat checks will prove each restored zone can support the colony."
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
        message: "Habitat checks unlocked."
      }
    ]
  },
  [STORY_BEAT_IDS.TIMBURR_DISCOVERY]: {
    id: STORY_BEAT_IDS.TIMBURR_DISCOVERY,
    fallbackLines: [
      {
        speaker: "Chopper",
        text: `That boulder shade woke ${SANDBOTS_BOT_NAMES.builder}. The heavy-lift helper is responding.`
      },
      {
        speaker: SANDBOTS_BOT_NAMES.builder,
        text: "Hey! A shady patch by a boulder. That's perfect for training."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.builder,
        text: "This place still needs a lot of work, right? I can help carry the heavy stuff."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: `${SANDBOTS_BOT_NAMES.builder} was registered.`
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
        message: `Return to the ${SANDBOTS_WORLD_TERMS.terminal} to log viability.`
      }
    ]
  },
  [STORY_BEAT_IDS.BOULDER_CHALLENGE_REWARD]: {
    id: STORY_BEAT_IDS.BOULDER_CHALLENGE_REWARD,
    fallbackLines: [
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Habitat check complete: Boulder-Shaded Tall Grass."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Viability report logged."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "Good work. New bots finding their way back is the clearest sign this planet is recovering."
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
        message: "Viability check logged."
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
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "You watered the trees and gathered all those sturdy sticks! That's exactly what a grassy home needs."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "I saved Solar Station plans for you. It should make a habitat feel much steadier."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Solar Station plans were added to your bag."
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
        message: "Solar Station plans received."
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
        message: "Solar Station prepared."
      }
    ]
  },
  [STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE]: {
    id: STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE,
    fallbackLines: [
      {
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "A Solar Station right in the tall grass! It catches the light and hums softly."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.grow,
        text: "This habitat feels much more like home now. Thank you!"
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: `${SANDBOTS_BOT_NAMES.grow}'s request is complete.`
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
        message: `${SANDBOTS_BOT_NAMES.grow}'s Solar Station request complete.`
      }
    ]
  },
  [STORY_BEAT_IDS.NEW_PC_CHALLENGES]: {
    id: STORY_BEAT_IDS.NEW_PC_CHALLENGES,
    fallbackLines: [
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "The Colony Terminal is online again."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "New habitat checks have been added."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "That means the planet is ready for more habitat checks. Review the terminal whenever you need the next lead."
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
        message: "New habitat checks added."
      }
    ]
  },
  [STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK]: {
    id: STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK,
    fallbackLines: [
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "You've been restoring habitats, but future humans will need places to settle too."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "A proper house gives the colony a quiet, stable shelter point."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "The Colony Terminal can prepare a House Kit now that the viability check passed."
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
        message: "House Kit ready."
      }
    ]
  },
  [STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED]: {
    id: STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED,
    fallbackLines: [
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "Colony construction is open."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "House Kit ready for {{playerName}}'s first shelter."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "Good. Bring that kit with you and we will start turning this restored zone into a real home."
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
        message: "House Kit ready for {{playerName}}'s first shelter."
      }
    ]
  },
  [STORY_BEAT_IDS.LEAF_DEN_CONSTRUCTION_STARTED]: {
    id: STORY_BEAT_IDS.LEAF_DEN_CONSTRUCTION_STARTED,
    fallbackLines: [
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: `${SANDBOTS_BOT_NAMES.builder} and ${SANDBOTS_BOT_NAMES.thermal} were selected as construction helpers.`
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "3 Sturdy Sticks and 3 Leaves were selected as materials."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.builder,
        text: "Leave the heavy lifting to me. This House will be standing before you know it!"
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "House construction has started. It will take a few seconds to complete."
      }
    ],
    effects: [
      {
        type: STORY_BEAT_EFFECT.SET_FLAG,
        flag: "leafDenConstructionStarted"
      },
      {
        type: STORY_BEAT_EFFECT.PUSH_NOTICE,
        message: "House construction started."
      }
    ]
  },
  [STORY_BEAT_IDS.LEAF_DEN_COMPLETE]: {
    id: STORY_BEAT_IDS.LEAF_DEN_COMPLETE,
    fallbackLines: [
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "House construction is complete."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "A real house like this proves humans might one day be welcome here too. Cautiously. With paperwork."
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
        message: "The House is complete."
      }
    ]
  },
  [STORY_BEAT_IDS.TIMBURR_LEAF_DEN_FURNITURE_COMPLETE]: {
    id: STORY_BEAT_IDS.TIMBURR_LEAF_DEN_FURNITURE_COMPLETE,
    fallbackLines: [
      {
        speaker: SANDBOTS_BOT_NAMES.builder,
        text: "Nice work! Three pieces of furniture make the House feel like a real home."
      },
      {
        speaker: SANDBOTS_BOT_NAMES.builder,
        text: "Now colonists have places to sit, sleep, and believe the floor is not a warning sign."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: "House furniture request complete."
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
        message: "House furniture request complete."
      }
    ]
  },
  [STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION]: {
    id: STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION,
    fallbackLines: [
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: "The House is ready, and it feels so cozy now!"
      },
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: "We should throw a celebration for everyone who helped build it!"
      },
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: `Come on, bring me to ${SANDBOTS_BOT_NAMES.overseer} and let's tell him!`
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
        message: `Bring ${SANDBOTS_BOT_NAMES.thermal} to ${SANDBOTS_BOT_NAMES.overseer}.`
      }
    ]
  },
  [STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE]: {
    id: STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE,
    fallbackLines: [
      {
        speaker: SANDBOTS_BOT_NAMES.thermal,
        text: `${SANDBOTS_BOT_NAMES.overseer}! The house is built, and we want to celebrate!`
      },
      {
        speaker: SANDBOTS_BOT_NAMES.overseer,
        text: "A celebration is exactly what this island needs. Let this flag mark the first home brought back to life."
      },
      {
        speaker: SANDBOTS_WORLD_TERMS.codex,
        text: `You received a ${SANDBOTS_ITEM_NAMES.colonyFlag}.`
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
        message: `You received a ${SANDBOTS_ITEM_NAMES.colonyFlag}.`
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
        message: "The House is now marked as your house."
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
