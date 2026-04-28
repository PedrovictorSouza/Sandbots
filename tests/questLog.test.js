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
});
