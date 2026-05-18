// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createColliderGizmoOverlay } from "../app/ui/colliderGizmoOverlay.js";

function makeCollider(id, position = [0, 0, 0]) {
  return {
    id,
    position,
    size: [1, 1, 1],
    surfaceY: 0.5
  };
}

function makeCenteredCamera() {
  return {
    project(point) {
      return {
        x: 400 + point[0],
        y: 240 + point[2],
        depth: 0.5
      };
    }
  };
}

describe("createColliderGizmoOverlay", () => {
  it("caps rendered collider gizmos and labels so debug text stays readable", () => {
    const mount = document.createElement("div");
    const overlay = createColliderGizmoOverlay({ mount });
    const colliders = Array.from({ length: 400 }, (_, index) => makeCollider(`debug-${index}`));

    overlay.show({ colliders });
    overlay.update(makeCenteredCamera(), 800, 480);

    const renderedMarkers = Array.from(mount.querySelectorAll("g"))
      .filter((marker) => marker.getAttribute("display") !== "none");
    const visibleLabels = Array.from(mount.querySelectorAll(".collider-gizmo-overlay__label"))
      .filter((label) => label.getAttribute("display") !== "none");

    expect(renderedMarkers).toHaveLength(320);
    expect(visibleLabels).toHaveLength(40);
    expect(mount.querySelector(".collider-gizmo-overlay__banner")?.textContent)
      .toBe("COLLIDERS: 320/400/400");
  });

  it("culls projected colliders that are fully offscreen", () => {
    const mount = document.createElement("div");
    const overlay = createColliderGizmoOverlay({ mount });
    const camera = {
      project(point) {
        return {
          x: point[0],
          y: point[2],
          depth: 0.5
        };
      }
    };

    overlay.show({
      colliders: [
        makeCollider("visible", [100, 0, 100]),
        makeCollider("offscreen", [-1000, 0, 100])
      ]
    });
    overlay.update(camera, 800, 480);

    const renderedMarkers = Array.from(mount.querySelectorAll("g"))
      .filter((marker) => marker.getAttribute("display") !== "none");

    expect(renderedMarkers).toHaveLength(1);
    expect(mount.querySelector(".collider-gizmo-overlay__label")?.textContent).toBe("visible");
    expect(mount.querySelector(".collider-gizmo-overlay__banner")?.textContent)
      .toBe("COLLIDERS: 1/1/2");
  });
});
