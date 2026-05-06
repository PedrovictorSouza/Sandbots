import { describe, expect, it } from "vitest";
import { createStageRuntimeController } from "../app/ui/stageRuntimeController.js";

describe("stageRuntimeController", () => {
  it("applies a fixed UI layout while allowing the stage to fit smaller viewports", () => {
    const properties = new Map();
    const rootStyle = {
      setProperty(name, value) {
        properties.set(name, value);
      }
    };

    const controller = createStageRuntimeController({
      rootStyle,
      jitterValueElement: null,
      warmOverlayElement: null
    });

    controller.syncUiScale({
      width: 1280,
      height: 720,
      gameScale: 0.8
    });

    expect(properties.get("--game-scale")).toBe("0.8");
    expect(properties.get("--console-display-scale")).toBe("0.8");
    expect(properties.get("--ui-gap")).toBe("20px");
    expect(properties.get("--hud-width")).toBe("420px");
    expect(properties.get("--status-width")).toBe("420px");
    expect(properties.get("--skills-width")).toBe("280px");
    expect(properties.get("--inventory-width")).toBe("460px");
    expect(properties.get("--missions-width")).toBe("420px");
    expect(properties.get("--hud-scale")).toBe("1");
    expect(properties.get("--overlay-scale")).toBe("1");
    expect(properties.get("--guide-scale")).toBe("1");
    expect(properties.get("--ui-stage-width")).toBe("1600px");
    expect(properties.get("--ui-stage-height")).toBe("900px");
    expect(properties.get("--ui-stage-scale")).toBe("0.8");
  });
});
