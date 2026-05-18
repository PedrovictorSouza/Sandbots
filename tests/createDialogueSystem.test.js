import { describe, expect, it } from "vitest";
import { createDialogueSystem } from "../app/dialogue/createDialogueSystem.js";
import { SANDBOTS_BOT_NAMES } from "../app/story/sandbotsLexicon.js";

describe("createDialogueSystem", () => {
  it("maps legacy speaker ids to Sandbots names before they become visible dialogue labels", () => {
    const dialogueSystem = createDialogueSystem({
      dialogues: {
        legacyBotNames: {
          id: "legacyBotNames",
          speakerId: "bulbasaur",
          lines: [
            { text: "Default speaker should be Grow Bot." },
            { speakerId: "squirtle", text: "Line override should be Hydro Bot." },
            { speakerId: "charmander", text: "Line override should be Thermal Bot." },
            { speaker: "Custom Bot", text: "Explicit speaker still wins." }
          ]
        }
      }
    });

    expect(dialogueSystem.getConversation("legacyBotNames").map((line) => line.speaker)).toEqual([
      SANDBOTS_BOT_NAMES.grow,
      SANDBOTS_BOT_NAMES.hydro,
      SANDBOTS_BOT_NAMES.thermal,
      "Custom Bot"
    ]);
  });
});
