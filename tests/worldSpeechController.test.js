// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createWorldSpeechController } from "../app/ui/worldSpeechController.js";

describe("createWorldSpeechController", () => {
  it("shows and positions a world speech bubble", () => {
    const mount = document.createElement("div");
    const controller = createWorldSpeechController({ mount });
    const camera = {
      project() {
        return {
          x: 128,
          y: 72,
          depth: 0.4
        };
      }
    };

    controller.show({
      text: "Hohohoh! I've found quite the haul today!",
      worldPosition: [12.4, 0.02, -8.4]
    });
    controller.update(camera, 426, 240);

    const bubble = mount.querySelector(".act-two-tutorial__speech-bubble");
    const speech = mount.querySelector(".act-two-tutorial__speech");

    expect(bubble?.textContent).toBe("Hohohoh! I've found quite the haul today!");
    expect(speech?.style.left).toBe("128px");
    expect(speech?.style.top).toBe("72px");
    expect(speech?.style.opacity).toBe("1");
  });

  it("hides the speech layer when requested", () => {
    const mount = document.createElement("div");
    const controller = createWorldSpeechController({ mount });

    controller.show({
      text: "Hello",
      worldPosition: [0, 0, 0]
    });
    controller.hide();

    const layer = mount.querySelector("[data-world-speech-layer='true']");
    expect(layer?.hidden).toBe(true);
    expect(controller.isVisible()).toBe(false);
  });
});
