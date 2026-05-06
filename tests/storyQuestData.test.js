import { describe, expect, it } from "vitest";
import { getQuestById, getRecipeById, STORY_QUESTS } from "../gameplayContent.js";

describe("story quest data", () => {
  it("defines the broken bridge infrastructure objective as the south route repair", () => {
    expect(getQuestById("craftBridgeKit")).toMatchObject({
      id: "craftBridgeKit",
      title: "Repair the Bridge",
      requirements: {
        wood: 4,
        flaxFiber: 2
      },
      recipeId: "bridgeKit",
      stationId: "workbench"
    });

    expect(getQuestById("repairBridge")).toMatchObject({
      id: "repairBridge",
      title: "Fix the Bridge",
      delivery: {
        bridgeKit: 1
      },
      targetId: "bridge",
      reward: "Bufo unlocked"
    });
  });

  it("tracks bridge cleanup progress from kit craft to repaired south route", () => {
    expect(STORY_QUESTS.map((quest) => quest.id)).toEqual(
      expect.arrayContaining(["craftBridgeKit", "repairBridge", "meetBufo"])
    );

    const bridgeKitIndex = STORY_QUESTS.findIndex((quest) => quest.id === "craftBridgeKit");
    const repairBridgeIndex = STORY_QUESTS.findIndex((quest) => quest.id === "repairBridge");
    const meetBufoIndex = STORY_QUESTS.findIndex((quest) => quest.id === "meetBufo");

    expect(bridgeKitIndex).toBeLessThan(repairBridgeIndex);
    expect(repairBridgeIndex).toBeLessThan(meetBufoIndex);
    expect(getQuestById("meetBufo")).toMatchObject({
      eyebrow: "Marsh Route",
      title: "Meet Bufo",
      body: expect.stringContaining("Cross the repaired route")
    });
  });

  it("defines the Granite Ridge cooking, pickaxe and hard-rock route objectives", () => {
    expect(getQuestById("cookMarshPie")).toMatchObject({
      id: "cookMarshPie",
      eyebrow: "Cooking",
      leadNpcId: "bufo",
      requirements: {
        blackberry: 4,
        rowanberry: 4,
        elderberry: 2
      },
      recipeId: "marshPie",
      stationId: "stove"
    });

    expect(getQuestById("feedBufo")).toMatchObject({
      id: "feedBufo",
      delivery: {
        marshPie: 1
      },
      targetId: "bufo",
      reward: "Pickaxe blueprint"
    });

    expect(getQuestById("craftPickaxe")).toMatchObject({
      id: "craftPickaxe",
      title: "Craft the Granite Pickaxe",
      requirements: {
        wood: 3,
        granite: 3,
        woolYarn: 1
      },
      recipeId: "granitePickaxe",
      stationId: "workbench"
    });

    expect(getQuestById("breakGate")).toMatchObject({
      id: "breakGate",
      title: "Break the Granite Gate",
      targetId: "graniteGate",
      reward: "West route open"
    });
  });

  it("tracks Granite Ridge progress from cooking to specialist route access", () => {
    expect(getRecipeById("marshPie")).toMatchObject({
      id: "marshPie",
      stationId: "stove",
      ingredients: {
        blackberry: 4,
        rowanberry: 4,
        elderberry: 2
      },
      output: {
        marshPie: 1
      }
    });

    expect(getRecipeById("granitePickaxe")).toMatchObject({
      id: "granitePickaxe",
      stationId: "workbench",
      ingredients: {
        wood: 3,
        granite: 3,
        woolYarn: 1
      },
      output: {
        granitePickaxe: 1
      }
    });

    expect(STORY_QUESTS.map((quest) => quest.id)).toEqual(
      expect.arrayContaining([
        "cookMarshPie",
        "feedBufo",
        "craftPickaxe",
        "breakGate",
        "meetWillow"
      ])
    );

    const cookIndex = STORY_QUESTS.findIndex((quest) => quest.id === "cookMarshPie");
    const feedIndex = STORY_QUESTS.findIndex((quest) => quest.id === "feedBufo");
    const pickaxeIndex = STORY_QUESTS.findIndex((quest) => quest.id === "craftPickaxe");
    const breakGateIndex = STORY_QUESTS.findIndex((quest) => quest.id === "breakGate");
    const specialistIndex = STORY_QUESTS.findIndex((quest) => quest.id === "meetWillow");

    expect(cookIndex).toBeLessThan(feedIndex);
    expect(feedIndex).toBeLessThan(pickaxeIndex);
    expect(pickaxeIndex).toBeLessThan(breakGateIndex);
    expect(breakGateIndex).toBeLessThan(specialistIndex);
    expect(getQuestById("meetWillow")).toMatchObject({
      title: "Find Willow",
      body: expect.stringContaining("Head through the opened gate")
    });
  });
});
