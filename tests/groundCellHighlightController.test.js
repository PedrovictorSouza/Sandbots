// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { createGroundCellHighlightController } from "../app/ui/groundCellHighlightController.js";

function createCamera() {
  return {
    project([x,, z]) {
      return {
        x: 120 + x * 16,
        y: 80 + z * 16,
        depth: 0.5
      };
    }
  };
}

function createGroundCell(overrides = {}) {
  return {
    offset: [1, 0, 2],
    surfaceY: 0,
    tileSpan: 1,
    ...overrides
  };
}

describe("createGroundCellHighlightController", () => {
  it("renders invalid action targets with an amber cue", () => {
    const mount = document.createElement("div");
    const controller = createGroundCellHighlightController({ mount });

    controller.show({
      groundCell: createGroundCell({ highlightTargetState: "invalid" })
    });
    controller.update(createCamera(), 320, 180);

    const layer = mount.querySelector("[data-ground-cell-highlight-layer]");
    const [, outline] = mount.querySelectorAll("svg > polygon");

    expect(layer.hidden).toBe(false);
    expect(layer.dataset.groundCellTargetState).toBe("invalid");
    expect(outline.getAttribute("stroke")).toBe("#ffd37a");
  });

  it("keeps valid action targets in the existing cyan cue", () => {
    const mount = document.createElement("div");
    const controller = createGroundCellHighlightController({ mount });

    controller.show({
      groundCell: createGroundCell({ highlightTargetState: "valid" })
    });
    controller.update(createCamera(), 320, 180);

    const layer = mount.querySelector("[data-ground-cell-highlight-layer]");
    const [, outline] = mount.querySelectorAll("svg > polygon");

    expect(layer.dataset.groundCellTargetState).toBe("valid");
    expect(outline.getAttribute("stroke")).toBe("#9ef8ff");
  });
});
