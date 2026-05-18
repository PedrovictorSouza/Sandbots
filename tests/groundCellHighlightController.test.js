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
    expect(outline.getAttribute("stroke-dasharray")).toBe("8 5");
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
    expect(outline.getAttribute("stroke-dasharray")).toBeNull();
  });

  it("renders ability action targets with distinct shape cues", () => {
    const mount = document.createElement("div");
    const controller = createGroundCellHighlightController({ mount });

    controller.show({
      groundCell: createGroundCell({ highlightAbilityId: "fire" })
    });
    controller.update(createCamera(), 320, 180);

    const layer = mount.querySelector("[data-ground-cell-highlight-layer]");
    const [, outline] = mount.querySelectorAll("svg > polygon");

    expect(layer.dataset.groundCellTargetState).toBe("fire");
    expect(outline.getAttribute("stroke")).toBe("#ff5a36");
    expect(outline.getAttribute("stroke-dasharray")).toBe("4 3");

    controller.show({
      groundCell: createGroundCell({ highlightAbilityId: "leafage" })
    });
    controller.update(createCamera(), 320, 180);

    expect(layer.dataset.groundCellTargetState).toBe("leafage");
    expect(outline.getAttribute("stroke")).toBe("#7effa5");
    expect(outline.getAttribute("stroke-dasharray")).toBe("2 5");
  });

  it("reuses marked cell polygons instead of recreating them", () => {
    const mount = document.createElement("div");
    const controller = createGroundCellHighlightController({ mount });

    controller.show({
      markedGroundCells: [
        createGroundCell({ offset: [0, 0, 0] }),
        createGroundCell({ offset: [1, 0, 0] })
      ]
    });
    controller.update(createCamera(), 320, 180);

    const initialPolygons = Array.from(mount.querySelectorAll("svg > g > polygon"));
    expect(initialPolygons).toHaveLength(4);

    controller.show({
      markedGroundCells: [
        createGroundCell({ offset: [2, 0, 0] })
      ]
    });
    controller.update(createCamera(), 320, 180);

    const reusedPolygons = Array.from(mount.querySelectorAll("svg > g > polygon"));
    expect(reusedPolygons).toHaveLength(4);
    expect(reusedPolygons[0]).toBe(initialPolygons[0]);
    expect(reusedPolygons[1]).toBe(initialPolygons[1]);
    expect(reusedPolygons[2].getAttribute("display")).toBe("none");
    expect(reusedPolygons[3].getAttribute("display")).toBe("none");
  });

  it("creates marked cell polygons from shared SVG prototypes", () => {
    const mount = document.createElement("div");
    const controller = createGroundCellHighlightController({ mount });

    controller.show({
      markedGroundCells: [
        createGroundCell({ offset: [0, 0, 0] })
      ]
    });
    controller.update(createCamera(), 320, 180);

    const [fillPolygon, outlinePolygon] = mount.querySelectorAll("svg > g > polygon");
    expect(fillPolygon.getAttribute("stroke-width")).toBe("5");
    expect(fillPolygon.getAttribute("stroke-linejoin")).toBe("round");
    expect(fillPolygon.getAttribute("vector-effect")).toBe("non-scaling-stroke");
    expect(outlinePolygon.getAttribute("stroke-width")).toBe("2");
    expect(outlinePolygon.getAttribute("stroke-linejoin")).toBe("round");
    expect(outlinePolygon.getAttribute("vector-effect")).toBe("non-scaling-stroke");
  });
});
