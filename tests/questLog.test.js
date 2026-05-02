import { describe, expect, it } from "vitest";
import { createQuestLog } from "../app/ui/createQuestLog.js";
import { QUEST_EVENT, SMALL_ISLAND_QUESTS } from "../app/quest/questData.js";

describe("createQuestLog", () => {
  it("renders animated movement controls for the first movement task", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "learn-to-move");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest
      }
    });

    const checklistHtml = questLog.renderChecklistHtml();

    expect(checklistHtml).toContain(`data-objective-type="${QUEST_EVENT.MOVE}"`);
    expect(checklistHtml).toContain("hud-control-key");
    expect(checklistHtml).toContain("Left stick");
  });

  it("renders task title and subtitle as separate HUD elements", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "wake-guide");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest
      }
    });

    const summaryHtml = questLog.renderActiveSummaryHtml();

    expect(summaryHtml).toContain("hud-task-title");
    expect(summaryHtml).toContain("Talk to Chopper");
    expect(summaryHtml).toContain("hud-task-subtitle");
    expect(summaryHtml).toContain("Talk to Chopper so he can explain");
  });

  it("does not render HUD-hidden objectives in the quest tracker", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "gather-first-supplies");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });

    expect(questLog.renderChecklistHtml()).not.toContain("Collect: Wood");
    expect(questLog.renderLogHtml()).not.toContain("Collect: Wood");
  });

  it("renders tracked long-running tasks alongside the active quest", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        trackedTaskIds: ["making-habitats"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Making habitats");
    expect(checklistHtml).toContain("Arrange tall grass, trees, rocks and furniture");
    expect(logHtml).toContain('data-task-id="making-habitats"');
    expect(logHtml).toContain("Pokemon Habitat");
  });

  it("checks the Making habitats task after a habitat is restored", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        makingHabitatsComplete: true,
        trackedTaskIds: ["making-habitats"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);

    expect(checklistHtml).toContain('data-done="true"');
    expect(checklistHtml).toContain("Making habitats");
  });

  it("keeps completed tracked tasks visible only while they are flashing", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        makingHabitatsComplete: true,
        trackedTaskIds: ["making-habitats"]
      }
    };
    const hiddenOptions = {
      hideCompletedTrackedTasks: true
    };
    const flashingOptions = {
      hideCompletedTrackedTasks: true,
      flashingTaskIds: new Set(["making-habitats"])
    };

    expect(questLog.renderChecklistHtml(storyState, hiddenOptions)).not.toContain("Making habitats");
    expect(questLog.renderLogHtml(storyState, hiddenOptions)).not.toContain('data-task-id="making-habitats"');
    expect(questLog.renderChecklistHtml(storyState, flashingOptions)).toContain('data-task-flashing="true"');
    expect(questLog.renderLogHtml(storyState, flashingOptions)).toContain('data-task-flashing="true"');
  });

  it("renders Bulbasaur's dry grass task with progress from story state", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        restoredGrassCount: 4,
        trackedTaskIds: ["water-dry-tall-grass"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Water dry tall grass");
    expect(checklistHtml).toContain("4/10 restored");
    expect(logHtml).toContain('data-task-id="water-dry-tall-grass"');
  });

  it("prioritizes Bulbasaur's request over the background habitat note", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        bulbasaurRevealed: true,
        restoredGrassCount: 10,
        trackedTaskIds: ["making-habitats"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);
    const bulbasaurIndex = checklistHtml.indexOf("Talk to Bulbasaur");
    const habitatIndex = checklistHtml.indexOf("Making habitats");

    expect(bulbasaurIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(bulbasaurIndex).toBeLessThan(habitatIndex);
    expect(checklistHtml).toContain("he will teach you a new move");
    expect(logHtml).toContain('data-task-id="bulbasaur-dry-grass-request"');
    expect(logHtml).toContain("field note");
  });

  it("shows the Leafage turn-in above old habitat notes after 10 dry grass patches", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "inspect-rustling-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        bulbasaurRevealed: true,
        bulbasaurDryGrassMissionAccepted: true,
        bulbasaurDryGrassMissionComplete: true,
        restoredGrassCount: 10,
        trackedTaskIds: ["making-habitats", "water-dry-tall-grass"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);
    const returnIndex = checklistHtml.indexOf("Return to Bulbasaur");
    const habitatIndex = checklistHtml.indexOf("Making habitats");
    const waterIndex = checklistHtml.indexOf("Water dry tall grass");

    expect(returnIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(waterIndex).toBeGreaterThan(-1);
    expect(returnIndex).toBeLessThan(habitatIndex);
    expect(returnIndex).toBeLessThan(waterIndex);
    expect(checklistHtml).toContain("learn Leafage");
    expect(logHtml).toContain('data-task-id="bulbasaur-leafage-reward"');
  });

  it("shows a non-blocking play seed after Leafage is learned", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "grow-a-home-patch");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        bulbasaurDryGrassRequestTurnedIn: true,
        trackedTaskIds: ["making-habitats"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);
    const playSeedIndex = checklistHtml.indexOf("Make a green corner");
    const habitatIndex = checklistHtml.indexOf("Making habitats");

    expect(quest.title).toBe("Plant Leafage for Bulbasaur");
    expect(playSeedIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(playSeedIndex).toBeLessThan(habitatIndex);
    expect(checklistHtml).toContain("0/4 tall grass grown");
    expect(logHtml).toContain("play seed");
    expect(logHtml).toContain('data-task-id="bulbasaur-green-corner-play-seed"');

    storyState.flags.leafageTallGrassCount = 2;

    expect(questLog.renderChecklistHtml(storyState)).toContain("2/4 tall grass grown");
  });

  it("renders the Leppa Berry task with step-specific guidance", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        leppaTreeRevived: true,
        trackedTaskIds: ["give-leppa-berry"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Give Leppa Berry to Bulbasaur");
    expect(checklistHtml).toContain("Headbutt the revived tree");
    expect(logHtml).toContain('data-task-id="give-leppa-berry"');
  });

  it("prioritizes current incomplete field tasks over old completed habitat notes", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "grow-a-home-patch");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        makingHabitatsComplete: true,
        bulbasaurDryGrassMissionComplete: true,
        squirtleLeppaRequestAvailable: true,
        trackedTaskIds: ["making-habitats", "water-dry-tall-grass"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const leppaIndex = checklistHtml.indexOf("Give Leppa Berry to Bulbasaur");
    const habitatIndex = checklistHtml.indexOf("Making habitats");
    const dryGrassIndex = checklistHtml.indexOf("Water dry tall grass");

    expect(leppaIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(dryGrassIndex).toBeGreaterThan(-1);
    expect(leppaIndex).toBeLessThan(habitatIndex);
    expect(leppaIndex).toBeLessThan(dryGrassIndex);
  });

  it("renders Chopper's log chair task with step-specific guidance", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        logChairPlaced: true,
        trackedTaskIds: ["tangrowth-log-chair"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Tangrowth");
    expect(checklistHtml).toContain("press A or E to sit");
    expect(logHtml).toContain('data-task-id="tangrowth-log-chair"');
  });

  it("renders the Workbench task with recipe progress guidance", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        workbenchDiyRecipesReceived: true,
        trackedTaskIds: ["workbench-campfire"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Workbench");
    expect(checklistHtml).toContain("create a Campfire");
    expect(logHtml).toContain('data-task-id="workbench-campfire"');
  });

  it("renders the Campfire bag selection task as it progresses", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        campfireCrafted: true,
        trackedTaskIds: ["spit-out-campfire"]
      }
    };

    const initialChecklistHtml = questLog.renderChecklistHtml(storyState);

    expect(initialChecklistHtml).toContain("Professor Tangrowth");
    expect(initialChecklistHtml).toContain("Press X to open the bag and select the Campfire.");

    storyState.flags.campfireSelectedForTangrowth = true;

    const selectedChecklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(selectedChecklistHtml).toContain("press A or E to spit out the Campfire");
    expect(logHtml).toContain('data-task-id="spit-out-campfire"');
  });

  it("renders Charmander's habitat and Campfire task as it progresses", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        leafageTallGrassCount: 2,
        trackedTaskIds: ["charmander-tall-grass"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("2/4 tall grass grown");

    storyState.flags.charmanderRustlingGrassCellId = "ground-1-1";
    expect(questLog.renderChecklistHtml(storyState)).toContain("Inspect the rustling grass.");

    storyState.flags.charmanderRevealed = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("D-Pad Up");

    storyState.flags.charmanderFollowing = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Lead Charmander close to the Campfire.");
    expect(logHtml).toContain('data-task-id="charmander-tall-grass"');
  });

  it("renders the ruined Pokemon Center task through inspection and PC steps", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        pokemonCenterGuideStarted: true,
        trackedTaskIds: ["ruined-pokemon-center"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("destroyed Pokemon Center");

    storyState.flags.ruinedPokemonCenterInspected = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Check the PC inside");
    expect(logHtml).toContain('data-task-id="ruined-pokemon-center"');
  });

  it("renders the Boulder-Shaded Tall Grass challenge as it progresses", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        boulderChallengeAvailable: true,
        boulderShadedTallGrassCount: 2,
        trackedTaskIds: ["boulder-shaded-tall-grass"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("2/4 tall grass grown");

    storyState.flags.boulderShadedTallGrassHabitatCreated = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Inspect the rustling");

    storyState.flags.timburrRevealed = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("receive Life Coins");
    expect(logHtml).toContain('data-task-id="boulder-shaded-tall-grass"');
  });

  it("renders Bulbasaur's Straw Bed recipe challenge with both counters", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        bulbasaurStrawBedChallengeAvailable: true,
        wateredTreeCount: 3,
        sturdySticksGatheredForChallenge: 7,
        trackedTaskIds: ["bulbasaur-straw-bed"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("3/5 trees watered, 7/10 sturdy sticks");

    storyState.flags.bulbasaurStrawBedChallengeComplete = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain('choose &quot;Do you need anything?&quot;');
    expect(logHtml).toContain('data-task-id="bulbasaur-straw-bed"');
  });

  it("renders the Straw Bed Recipe task from craft to Bulbasaur turn-in", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        strawBedRecipeUnlocked: true,
        trackedTaskIds: ["straw-bed-recipe"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("You will need 2 Leaves");

    storyState.flags.strawBedCrafted = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("select the Straw Bed");

    storyState.flags.strawBedSelectedForBulbasaur = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("within the boundaries");

    storyState.flags.strawBedPlacedInBulbasaurHabitat = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Talk to Bulbasaur after placing");
    expect(logHtml).toContain('data-task-id="straw-bed-recipe"');
  });

  it("renders the New Challenges in PC task", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        newPcChallengesAvailable: true,
        trackedTaskIds: ["new-challenges-in-pc"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("New Challenges in PC");
    expect(questLog.renderChecklistHtml(storyState)).toContain("check the new Challenges");

    storyState.flags.newPcChallengesChecked = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("You checked the new Challenges");
    expect(logHtml).toContain('data-task-id="new-challenges-in-pc"');
  });

  it("renders the Leaf Den Kit task from Tangrowth talk to PC purchase", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        tangrowthHouseTalkAvailable: true,
        trackedTaskIds: ["leaf-den-kit"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("Talk to Professor Tangrowth");
    expect(questLog.renderChecklistHtml(storyState)).toContain("building houses");

    storyState.flags.tangrowthHouseTalkComplete = true;
    storyState.flags.leafDenKitPurchaseAvailable = true;

    expect(questLog.renderChecklistHtml(storyState)).toContain("purchase a Leaf Den Kit");

    storyState.flags.leafDenKitPurchased = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("You purchased a Leaf Den Kit");
    expect(logHtml).toContain('data-task-id="leaf-den-kit"');
  });

  it("renders the Building the Leaf Den task through placement and construction", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        leafDenBuildAvailable: true,
        trackedTaskIds: ["build-leaf-den"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("select the Leaf Den Kit");

    storyState.flags.leafDenKitSelected = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Place the Leaf Den Kit");

    storyState.flags.leafDenKitPlaced = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Gather 3 Sturdy Sticks and 3 Leaves");

    storyState.flags.leafDenConstructionStarted = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("few real-world hours");

    storyState.flags.leafDenBuilt = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("The Leaf Den is complete");
    expect(logHtml).toContain('data-task-id="build-leaf-den"');
  });

  it("renders the Leaf Den furniture task through interior placement and Timburr turn-in", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        leafDenFurnitureRequestAvailable: true,
        trackedTaskIds: ["leaf-den-furniture"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("Enter the Leaf Den");

    storyState.flags.leafDenInteriorEntered = true;
    storyState.flags.leafDenFurniturePlacedCount = 2;
    expect(questLog.renderChecklistHtml(storyState)).toContain("2/3 placed");

    storyState.flags.leafDenFurniturePlacedCount = 3;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Talk to Timburr");

    storyState.flags.leafDenFurnitureRequestComplete = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Timburr approved");
    expect(logHtml).toContain('data-task-id="leaf-den-furniture"');
  });

  it("renders Charmander's celebration task through the Ditto Flag reward", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        charmanderCelebrationRequestAvailable: true,
        trackedTaskIds: ["charmander-celebration"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("Talk to Charmander");

    storyState.flags.charmanderCelebrationSuggested = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Bring Charmander to Professor Tangrowth");

    storyState.flags.dittoFlagReceived = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("You received a Ditto Flag");
    expect(logHtml).toContain('data-task-id="charmander-celebration"');
  });

  it("renders the Ditto Flag house task from bag selection to placement", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        dittoFlagReceived: true,
        trackedTaskIds: ["ditto-flag-house"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("select the Ditto Flag");

    storyState.flags.dittoFlagSelectedForHouse = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("place the Ditto Flag");

    storyState.flags.dittoFlagPlacedOnHouse = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("marked as your house");
    expect(logHtml).toContain('data-task-id="ditto-flag-house"');
  });
});
