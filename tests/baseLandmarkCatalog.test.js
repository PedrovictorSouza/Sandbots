// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createPokemonCamera } from "../camera.js";
import { WORKBENCH_POSITION } from "../gameplayContent.js";
import {
  BASE_LANDMARK_CUE,
  BASE_LANDMARK_ROLE,
  getBaseLandmarkById,
  listBaseLandmarks,
  validateBaseLandmarkCatalog
} from "../app/gameplay/baseLandmarkCatalog.js";

describe("base landmark catalog", () => {
  it("chooses one primary landmark and secondary first-area anchors", () => {
    const landmarks = listBaseLandmarks();

    expect(landmarks.filter((landmark) => landmark.role === BASE_LANDMARK_ROLE.PRIMARY)).toEqual([
      expect.objectContaining({
        id: "crash-site",
        label: "Crash Site",
        cues: [BASE_LANDMARK_CUE.SMOKE, BASE_LANDMARK_CUE.SILHOUETTE]
      })
    ]);
    expect(landmarks.filter((landmark) => landmark.role === BASE_LANDMARK_ROLE.SECONDARY).map((landmark) => landmark.id)).toEqual([
      "workbench",
      "colony-cache",
      "colony-terminal"
    ]);
    expect(getBaseLandmarkById("colony-cache")?.purpose).toBe(
      "The protected supply point that makes gathered materials feel like colony progress."
    );
    expect(getBaseLandmarkById("colony-terminal")?.purpose).toBe(
      "The diagnostic terminal that logs viability and authorizes colony protocols."
    );
    expect(validateBaseLandmarkCatalog()).toEqual([]);
  });

  it("keeps route and discovery landmarks explicit without depending on HUD text", () => {
    expect(getBaseLandmarkById("hydro-bot")).toMatchObject({
      label: "Hydro Bot",
      role: BASE_LANDMARK_ROLE.DISCOVERY,
      cues: [BASE_LANDMARK_CUE.BOT_SIGNAL]
    });
    expect(getBaseLandmarkById("pulse-tree")).toMatchObject({
      label: "Pulse Tree",
      role: BASE_LANDMARK_ROLE.DISCOVERY,
      cues: [BASE_LANDMARK_CUE.ODD_TREE]
    });
    expect(Object.isFrozen(listBaseLandmarks())).toBe(true);
    expect(Object.isFrozen(listBaseLandmarks()[0].position)).toBe(true);
  });

  it("keeps the central base landmarks inside a camera-follow smoke radius", () => {
    const worldCanvas = document.createElement("canvas");
    const spriteCanvas = document.createElement("canvas");
    const mount = document.createElement("div");
    const camera = createPokemonCamera({
      worldCanvas,
      spriteCanvas,
      mount,
      target: [0, 1.2, 0],
      followLeadDistance: 0
    });

    camera.follow(WORKBENCH_POSITION);
    const cameraTarget = camera.getPose().target;
    const centralBaseIds = ["workbench", "colony-cache", "colony-terminal", "overseer-bot"];
    const distances = centralBaseIds.map((id) => {
      const landmark = getBaseLandmarkById(id);
      return Math.hypot(
        Number(landmark.position[0]) - Number(cameraTarget[0]),
        Number(landmark.position[2]) - Number(cameraTarget[2])
      );
    });

    expect(Math.max(...distances)).toBeLessThanOrEqual(42);
  });

  it("validates missing, duplicate, and malformed landmarks", () => {
    expect(validateBaseLandmarkCatalog({
      landmarks: [
        { id: "crash-site", label: "Crash Site", role: BASE_LANDMARK_ROLE.PRIMARY, position: [0, 0, 0], cues: [BASE_LANDMARK_CUE.SMOKE] },
        { id: "crash-site", label: "", role: "hero", position: [0, 0], cues: ["sparkle"] },
        { label: "No id", role: BASE_LANDMARK_ROLE.SECONDARY, position: [1, 0, 1], cues: [BASE_LANDMARK_CUE.MARKER] }
      ]
    })).toEqual([
      { type: "duplicate-landmark-id", landmarkId: "crash-site", index: 1 },
      { type: "missing-landmark-label", landmarkId: "crash-site", index: 1 },
      { type: "unknown-landmark-role", landmarkId: "crash-site", role: "hero", index: 1 },
      { type: "missing-landmark-position", landmarkId: "crash-site", index: 1 },
      { type: "unknown-landmark-cue", landmarkId: "crash-site", cue: "sparkle", index: 1 },
      { type: "missing-landmark-id", index: 2 },
      { type: "missing-secondary-landmarks" }
    ]);
  });
});
