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

  it("hides the completed first movement card after the next quest is active", () => {
    const completedMoveQuest = {
      ...SMALL_ISLAND_QUESTS.find((entry) => entry.id === "learn-to-move"),
      status: "completed",
      objectives: [
        { type: QUEST_EVENT.MOVE, targetId: "player", required: 1, current: 1 }
      ]
    };
    const activeQuest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "wake-guide");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => activeQuest,
        getQuestLog: () => [completedMoveQuest, activeQuest]
      }
    });

    const logHtml = questLog.renderLogHtml();

    expect(logHtml).not.toContain("Take Your First Steps");
    expect(logHtml).not.toContain("Left stick");
    expect(logHtml).toContain("Talk to Chopper");
    expect(logHtml).toContain('aria-label="locked: Talk to Chopper');
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

  it("keeps field-action guidance out of the quest tracker summary", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });

    const summaryHtml = questLog.renderActiveSummaryHtml();
    const summaryText = questLog.renderActiveSummary();
    const logHtml = questLog.renderLogHtml();

    expect(summaryHtml).toContain("Water dry grass!");
    expect(summaryHtml).toContain("Use Hydro Jet to revive 10 patches");
    expect(summaryHtml).not.toContain("Next:");
    expect(summaryHtml).not.toContain("Stand near dry grass");
    expect(summaryText).not.toContain("Next:");
    expect(logHtml).not.toContain("Stand near dry grass");
  });

  it("does not render HUD-hidden objectives in the quest tracker", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "gather-first-supplies");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });

    expect(questLog.renderChecklistHtml()).toContain("Wake up Hydro Bot");
    expect(questLog.renderLogHtml()).toContain("Wake up Hydro Bot");
    expect(questLog.renderActiveSummaryHtml()).not.toContain("hud-task-subtitle");
    expect(questLog.renderActiveSummary()).toBe(
      "Wake up Hydro Bot. Follow Chopper's marker to Hydro Bot, then interact when the prompt appears."
    );
    expect(questLog.renderLogHtml()).toContain("Follow the signal marker");
    expect(questLog.renderLogHtml()).toContain("Sweep the dry edge first");
    expect(questLog.renderLogHtml()).toContain("Reward:");
    expect(questLog.renderLogHtml()).toContain("comes online and unlocks Hydro Jet");
    expect(questLog.renderLogHtml()).toContain("Next signal:");
    expect(questLog.renderLogHtml()).toContain("If water can move again");
    expect(questLog.renderChecklistHtml()).not.toContain("Unlock: Hydro Jet");
    expect(questLog.renderLogHtml()).not.toContain("Unlock: Hydro Jet");
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

    expect(checklistHtml).toContain("Making colony zones");
    expect(checklistHtml).toContain("Arrange tall grass, trees, rocks and furniture");
    expect(logHtml).toContain('data-task-id="making-habitats"');
    expect(logHtml).toContain("viable colony zone");
  });

  it("checks the Making colony zones task after a habitat is restored", () => {
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
    expect(checklistHtml).toContain("Making colony zones");
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

    expect(questLog.renderChecklistHtml(storyState, hiddenOptions)).not.toContain("Making colony zones");
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

  it("marks Bulbasaur's dry grass task complete when the restored count reaches 10", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const storyState = {
      flags: {
        bulbasaurDryGrassMissionAccepted: true,
        restoredGrassCount: 10,
        trackedTaskIds: ["water-dry-tall-grass"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("10/10 restored");
    expect(checklistHtml).toContain("Return to Grow Bot");
    expect(logHtml).toMatch(/data-task-done="true"[\s\S]*data-task-id="water-dry-tall-grass"/);
  });

  it("renders the first companion request in the request log after habitat discovery", () => {
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
    const bulbasaurIndex = checklistHtml.indexOf("Talk to Grow Bot");
    const habitatIndex = checklistHtml.indexOf("Making colony zones");

    expect(bulbasaurIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(bulbasaurIndex).toBeLessThan(habitatIndex);
    expect(checklistHtml).toContain("it will unlock a new field tool");
    expect(logHtml).toContain('data-task-id="bulbasaur-dry-grass-request"');
    expect(logHtml).toContain("field note");
  });

  it("shows the Leppa tree revival before Bulbasaur's dry grass request", () => {
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
        squirtleLeppaRequestAvailable: true,
        trackedTaskIds: ["making-habitats"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Revive the dead tree");
    expect(checklistHtml).toContain("four dry tiles around the dead tree");
    expect(checklistHtml).not.toContain("Talk to Grow Bot");
    expect(logHtml).toContain('data-task-id="revive-leppa-tree"');

    storyState.flags.leppaTreeRevived = true;

    const revivedChecklistHtml = questLog.renderChecklistHtml(storyState);
    expect(revivedChecklistHtml).toContain("Talk to Grow Bot");
    expect(revivedChecklistHtml).not.toContain("Revive the dead tree");
  });

  it("shows the Bio-Grow turn-in above old habitat notes after 10 dry grass patches", () => {
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
    const returnIndex = checklistHtml.indexOf("Return to Grow Bot");
    const habitatIndex = checklistHtml.indexOf("Making colony zones");
    const waterIndex = checklistHtml.indexOf("Water dry tall grass");

    expect(returnIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(waterIndex).toBeGreaterThan(-1);
    expect(returnIndex).toBeLessThan(habitatIndex);
    expect(returnIndex).toBeLessThan(waterIndex);
    expect(checklistHtml).toContain("learn Bio-Grow");
    expect(logHtml).toContain('data-task-id="bulbasaur-leafage-reward"');
  });

  it("shows a non-blocking play seed after Bio-Grow is learned", () => {
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
    const habitatIndex = checklistHtml.indexOf("Making colony zones");

    expect(quest.title).toBe("Plant Bio-Grow for Grow Bot");
    expect(playSeedIndex).toBeGreaterThan(-1);
    expect(habitatIndex).toBeGreaterThan(-1);
    expect(playSeedIndex).toBeLessThan(habitatIndex);
    expect(checklistHtml).toContain("0/4 tall grass grown");
    expect(logHtml).toContain("play seed");
    expect(logHtml).toContain('data-task-id="bulbasaur-green-corner-play-seed"');

    storyState.flags.leafageTallGrassCount = 2;

    expect(questLog.renderChecklistHtml(storyState)).toContain("2/4 tall grass grown");
  });

  it("renders the Pulse Berry task with step-specific guidance", () => {
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

    expect(checklistHtml).toContain("Give Pulse Berry to Grow Bot");
    expect(checklistHtml).toContain("Press X by the revived tree");
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
        bulbasaurDryGrassRequestTurnedIn: true,
        squirtleLeppaRequestAvailable: true,
        trackedTaskIds: ["making-habitats", "water-dry-tall-grass"]
      }
    };

    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const leppaIndex = checklistHtml.indexOf("Give Pulse Berry to Grow Bot");
    const habitatIndex = checklistHtml.indexOf("Making colony zones");
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

    expect(checklistHtml).toContain("Overseer Bot");
    expect(checklistHtml).toContain("press X to save");
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
    expect(checklistHtml).toContain("create Thermal Bot&#39;s Thermal Cabin");
    expect(logHtml).toContain('data-task-id="workbench-campfire"');
  });

  it("renders the Thermal Cabin placement task after crafting", () => {
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

    expect(initialChecklistHtml).toContain("Thermal Cabin");
    expect(initialChecklistHtml).toContain("Press A or E anywhere outside to place Thermal Bot&#39;s Thermal Cabin.");

    storyState.flags.campfireSpatOut = true;

    const placedChecklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(placedChecklistHtml).toContain("You placed Thermal Bot&#39;s Thermal Cabin.");
    expect(logHtml).toContain('data-task-id="spit-out-campfire"');
  });

  it("renders Thermal Bot's habitat and Thermal Cabin task as it progresses", () => {
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
        campfireCrafted: true,
        campfireSpatOut: true,
        leafageTallGrassCount: 2,
        trackedTaskIds: ["charmander-tall-grass"]
      }
    };

    expect(questLog.renderChecklistHtml(storyState)).toContain("2/4 tall grass grown");

    storyState.flags.charmanderRustlingGrassCellId = "ground-1-1";
    expect(questLog.renderChecklistHtml(storyState)).toContain(
      "Help Thermal Bot in the tall grass."
    );

    storyState.flags.charmanderRevealed = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("D-Pad Up");

    storyState.flags.charmanderFollowing = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Lead Thermal Bot close to the Thermal Cabin.");
    expect(logHtml).toContain('data-task-id="charmander-tall-grass"');

    const recoveredStoryState = {
      flags: {
        workbenchDiyRecipesReceived: true,
        campfireCrafted: true,
        campfireSpatOut: true,
        charmanderFollowing: true
      }
    };
    const recoveredChecklistHtml = questLog.renderChecklistHtml(recoveredStoryState);

    expect(recoveredChecklistHtml).toContain("Lead Thermal Bot close to the Thermal Cabin.");
  });

  it("keeps Thermal Cabin prerequisites ahead of Thermal Bot follow-up recovery", () => {
    const quest = SMALL_ISLAND_QUESTS.find((entry) => entry.id === "water-dry-grass");
    const questLog = createQuestLog({
      questSystem: {
        getActiveQuest: () => quest,
        getQuestLog: () => [quest]
      }
    });
    const missingWorkbenchState = {
      flags: {
        charmanderFollowing: true,
        trackedTaskIds: ["charmander-tall-grass"]
      }
    };

    const workbenchChecklistHtml = questLog.renderChecklistHtml(missingWorkbenchState);

    expect(workbenchChecklistHtml).toContain("Follow Grow Bot to the nearby area");
    expect(workbenchChecklistHtml).not.toContain("Lead Thermal Bot close to the Thermal Cabin.");

    missingWorkbenchState.flags.workbenchDiyRecipesReceived = true;
    missingWorkbenchState.flags.campfireCrafted = true;
    const trainHouseChecklistHtml = questLog.renderChecklistHtml(missingWorkbenchState);

    expect(trainHouseChecklistHtml).toContain("Press A or E anywhere outside to place Thermal Bot&#39;s Thermal Cabin.");
    expect(trainHouseChecklistHtml).not.toContain("Lead Thermal Bot close to the Thermal Cabin.");
  });

  it("renders the ruined Colony Terminal task through inspection and terminal steps", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("destroyed Colony Terminal");

    storyState.flags.ruinedPokemonCenterInspected = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Check the Colony Terminal beside");
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
    expect(questLog.renderChecklistHtml(storyState)).toContain(
      "Help Builder Bot near the boulder."
    );

    storyState.flags.timburrRevealed = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("log the habitat viability report");
    expect(logHtml).toContain('data-task-id="boulder-shaded-tall-grass"');
  });

  it("renders Grow Bot's Solar Station recipe challenge with both counters", () => {
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

    const supplyChecklistHtml = questLog.renderChecklistHtml(storyState);
    expect(supplyChecklistHtml).toContain("Prepare Grow Bot&#39;s habitat supplies.");
    expect(supplyChecklistHtml).toContain("Water 5 trees");
    expect(supplyChecklistHtml).toContain("3/5 trees watered");
    expect(supplyChecklistHtml).toContain("Gather 10 sturdy sticks");
    expect(supplyChecklistHtml).toContain("7/10 sturdy sticks gathered");
    expect(supplyChecklistHtml).toContain('data-subtask-id="water-trees"');
    expect(supplyChecklistHtml).toContain('data-subtask-id="gather-sturdy-sticks"');

    storyState.flags.bulbasaurStrawBedChallengeComplete = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain('choose &quot;Do you need anything?&quot;');
    expect(logHtml).toContain('data-task-id="bulbasaur-straw-bed"');
  });

  it("renders the Solar Station Recipe task from craft to Bulbasaur turn-in", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("Press X at the Workbench");

    storyState.flags.strawBedCrafted = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Press X at the Solar Station field");

    storyState.flags.strawBedSelectedForBulbasaur = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("within the boundaries of the Solar Station field");

    storyState.flags.strawBedPlacedInBulbasaurHabitat = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Talk to Grow Bot after placing");
    expect(logHtml).toContain('data-task-id="straw-bed-recipe"');
  });

  it("renders the new habitat checks in Terminal task", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("New Habitat Checks in Colony Terminal");
    expect(questLog.renderChecklistHtml(storyState)).toContain("review the new habitat checks");

    storyState.flags.newPcChallengesChecked = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("You checked the new habitat checks");
    expect(logHtml).toContain('data-task-id="new-challenges-in-pc"');
  });

  it("renders the House Kit task from Tangrowth talk to Terminal issue", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("Talk to Overseer Bot");
    expect(questLog.renderChecklistHtml(storyState)).toContain("building houses");

    storyState.flags.tangrowthHouseTalkComplete = true;
    storyState.flags.leafDenKitPurchaseAvailable = true;

    expect(questLog.renderChecklistHtml(storyState)).toContain("claim the House Kit");

    storyState.flags.leafDenKitPurchased = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("The House Kit is ready");
    expect(logHtml).toContain('data-task-id="leaf-den-kit"');
  });

  it("renders House repair material requirements through placement and construction", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("select the House Kit");

    storyState.flags.leafDenKitSelected = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Place the House Kit");

    storyState.flags.leafDenKitPlaced = true;
    const materialChecklistHtml = questLog.renderChecklistHtml(storyState);
    expect(materialChecklistHtml).toContain("Gather 3 Sturdy Sticks and 3 Leaves");
    expect(materialChecklistHtml).toContain("inspect the House Kit");

    storyState.flags.leafDenConstructionStarted = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("few seconds");

    storyState.flags.leafDenBuilt = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("The House is complete");
    expect(logHtml).toContain('data-task-id="build-leaf-den"');
  });

  it("renders the helper-character House furniture request through Timburr turn-in", () => {
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

    const availableChecklistHtml = questLog.renderChecklistHtml(storyState);
    const availableLogHtml = questLog.renderLogHtml(storyState);
    expect(availableChecklistHtml).toContain("Enter the House");
    expect(availableLogHtml).toContain('data-task-id="leaf-den-furniture"');

    storyState.flags.leafDenInteriorEntered = true;
    storyState.flags.leafDenFurniturePlacedCount = 2;
    expect(questLog.renderChecklistHtml(storyState)).toContain("2/3 placed");

    storyState.flags.leafDenFurniturePlacedCount = 3;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Talk to Builder Bot");

    storyState.flags.leafDenFurnitureRequestComplete = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("Builder Bot approved");
    expect(logHtml).toContain('data-task-id="leaf-den-furniture"');
  });

  it("renders Thermal Bot's celebration task through the Colony Flag reward", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("Talk to Thermal Bot");

    storyState.flags.charmanderCelebrationSuggested = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("Bring Thermal Bot to Overseer Bot");

    storyState.flags.dittoFlagReceived = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("You received a Colony Flag");
    expect(logHtml).toContain('data-task-id="charmander-celebration"');
  });

  it("renders the Colony Flag house task from bag selection to placement", () => {
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

    expect(questLog.renderChecklistHtml(storyState)).toContain("select the Colony Flag");

    storyState.flags.dittoFlagSelectedForHouse = true;
    expect(questLog.renderChecklistHtml(storyState)).toContain("place the Colony Flag");

    storyState.flags.dittoFlagPlacedOnHouse = true;
    const checklistHtml = questLog.renderChecklistHtml(storyState);
    const logHtml = questLog.renderLogHtml(storyState);

    expect(checklistHtml).toContain("marked as your house");
    expect(logHtml).toContain('data-task-id="ditto-flag-house"');
  });
});
