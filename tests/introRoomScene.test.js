import { describe, expect, it } from "vitest";
import { buildIntroRoomScene } from "../app/scenes/introRoom/buildIntroRoomScene.js";

function createAssets() {
  return {
    groundDeadModel: { id: "ground-dead" },
    groundPurifiedModel: { id: "ground-purified" },
    chopperModel: { id: "chopper" },
    chopperBodyModel: { id: "chopper-body" },
    chopperPropellerModel: { id: "chopper-propeller" }
  };
}

describe("buildIntroRoomScene", () => {
  it("uses Chopper plus broken/restored floor models for the intro contract", () => {
    const assets = createAssets();
    const scene = buildIntroRoomScene(assets);
    const snapshot = scene.getRenderSnapshot({
      camera: {
        getViewProjection: () => "view-projection"
      },
      worldCanvas: {
        width: 426,
        height: 240
      }
    });

    expect(snapshot.sceneObjects.some((sceneObject) => sceneObject.model === assets.chopperBodyModel)).toBe(true);
    expect(snapshot.sceneObjects.some((sceneObject) => sceneObject.model === assets.chopperPropellerModel)).toBe(true);
    expect(snapshot.sceneObjects.some((sceneObject) => sceneObject.model === assets.groundDeadModel)).toBe(true);
    expect(snapshot.sceneObjects.some((sceneObject) => sceneObject.model === assets.groundPurifiedModel)).toBe(true);
    expect(snapshot.sceneObjects.find((sceneObject) => sceneObject.model === assets.groundDeadModel).instances).toHaveLength(8);
    expect(snapshot.sceneObjects.find((sceneObject) => sceneObject.model === assets.groundPurifiedModel).instances).toHaveLength(1);
  });

  it("passes yaw, pitch, and roll into the intro chopper instance", () => {
    const scene = buildIntroRoomScene(createAssets());

    scene.setDebugControlsActive(true);
    scene.setChopperPose({
      position: [1, 2, 3],
      rotation: {
        yaw: 0.4,
        pitch: 0.8,
        roll: -0.2
      },
      scale: 1.5
    });

    const snapshot = scene.getRenderSnapshot({
      camera: {
        getViewProjection: () => "view-projection"
      },
      worldCanvas: {
        width: 426,
        height: 240
      }
    });
    const chopperInstance = snapshot.sceneObjects[0].instances[0];

    expect(chopperInstance.offset).toEqual([1, 2, 3]);
    expect(chopperInstance.yaw).toBe(0.4);
    expect(chopperInstance.pitch).toBe(0.8);
    expect(chopperInstance.roll).toBe(-0.2);
    expect(chopperInstance.scale).toBe(1.5);
  });

  it("exposes the intro animation delay for the dialogue overlay", () => {
    const scene = buildIntroRoomScene(createAssets());

    expect(scene.getIntroUiDelayMs()).toBeCloseTo(3700);
  });

  it("throws a clear error when the chopper model is missing", () => {
    const assets = createAssets();
    delete assets.chopperBodyModel;

    expect(() => buildIntroRoomScene(assets)).toThrow(
      "IntroRoomScene: assets.chopperBodyModel ausente."
    );
  });

  it("rejects ground models wired as the chopper actor", () => {
    const assets = createAssets();
    assets.chopperBodyModel = assets.groundPurifiedModel;

    expect(() => buildIntroRoomScene(assets)).toThrow(
      "IntroRoomScene: assets.chopperBodyModel nao pode apontar para modelo de ground."
    );
  });
});
