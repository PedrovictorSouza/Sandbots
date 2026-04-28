import { describe, expect, it, vi } from "vitest";
import { createFrameSnapshotController } from "../app/runtime/frameSnapshotController.js";

describe("createFrameSnapshotController", () => {
  it("builds a work-in-progress frame and commits it through the active buffer", () => {
    const hud = {
      syncQuestFocus: vi.fn(),
      syncHudMeta: vi.fn(),
      syncHudInstructions: vi.fn(),
      renderMissionCards: vi.fn(),
      setStatus: vi.fn()
    };
    const worldRenderer = {
      drawScene: vi.fn(),
      drawBillboards: vi.fn(),
      drawWorldMarkers: vi.fn(),
      drawWoodDrops: vi.fn(),
      drawBillboard: vi.fn(),
      drawCharacters: vi.fn()
    };
    const worldSpeech = {
      show: vi.fn(),
      hide: vi.fn(),
      update: vi.fn(),
      setWorldPosition: vi.fn(),
      showTaskPop: vi.fn(),
      hideTaskPop: vi.fn(),
      updateTaskPop: vi.fn(),
      setTaskPopWorldPosition: vi.fn()
    };
    const groundCellHighlight = {
      show: vi.fn(),
      hide: vi.fn(),
      update: vi.fn(),
      setGroundCell: vi.fn()
    };
    const colliderGizmos = {
      show: vi.fn(),
      hide: vi.fn(),
      update: vi.fn()
    };
    const actTwoTutorial = {
      update: vi.fn()
    };
    const camera = {};
    const mount = {
      clientWidth: 1280,
      clientHeight: 720
    };
    const storyState = { questIndex: 2 };
    const inventory = { wood: 3 };
    const viewProjection = new Float32Array(16);
    const sceneObjects = [{ id: "ground" }];
    const worldMarkers = { markerTextures: {} };
    const characters = { playerCharacter: { id: "player" } };
    const groundCell = { id: "cell-1" };
    const collider = {
      id: "terrain-collider-1",
      position: [7, 1, -2],
      size: [2, 2, 2],
      surfaceY: 2
    };
    const speechPosition = [12, 0.5, -3];

    const controller = createFrameSnapshotController({
      camera,
      mount,
      worldRenderer,
      worldSpeech,
      colliderGizmos,
      groundCellHighlight,
      actTwoTutorial,
      hud
    });

    const firstFrame = controller.beginFrame();
    firstFrame.hud.active = true;
    firstFrame.hud.storyState = storyState;
    firstFrame.hud.inventory = inventory;
    firstFrame.hud.playerPosition = [4, 0, 2];
    firstFrame.hud.promptCopy = "Pressione E";
    firstFrame.hud.statusMessage = "Pressione E";
    firstFrame.worldSpeech.visible = true;
    firstFrame.worldSpeech.text = "Tangrowth esta esperando.";
    firstFrame.worldSpeech.worldPosition = speechPosition;
    firstFrame.taskPop.visible = true;
    firstFrame.taskPop.text = "YOU RESTORED THE TALL GRASS!";
    firstFrame.taskPop.worldPosition = [4, 0, 2];
    firstFrame.groundCellHighlight.visible = true;
    firstFrame.groundCellHighlight.groundCell = groundCell;
    firstFrame.colliderGizmos.visible = true;
    firstFrame.colliderGizmos.colliders = [collider];
    firstFrame.render.viewProjection = viewProjection;
    firstFrame.render.sceneObjects = sceneObjects;
    firstFrame.render.grassBillboards.push({ texture: "grass", position: [0, 0, 0], size: [1, 1] });
    firstFrame.render.flowerBillboards.push({ texture: "flower", position: [1, 0, 1], size: [1, 1] });
    firstFrame.render.worldMarkers = worldMarkers;
    firstFrame.render.woodTexture = "wood";
    firstFrame.render.woodDrops = [{ collected: false }];
    firstFrame.render.genericBillboards.push({
      texture: "cache",
      position: [3, 0, 3],
      size: [1, 1],
      uvRect: [0, 0, 1, 1]
    });
    firstFrame.render.characters = characters;
    firstFrame.tutorial.active = true;
    firstFrame.tutorial.playerPosition = [4, 0, 2];
    firstFrame.tutorial.deltaTime = 0.016;

    controller.commitFrame();

    expect(hud.syncQuestFocus).toHaveBeenCalledWith(storyState);
    expect(hud.syncHudMeta).toHaveBeenCalledWith(storyState, inventory, [4, 0, 2]);
    expect(hud.syncHudInstructions).toHaveBeenCalledWith(storyState, "Pressione E");
    expect(hud.renderMissionCards).toHaveBeenCalledWith(storyState, inventory, "Pressione E");
    expect(hud.setStatus).toHaveBeenCalledWith("Pressione E");
    expect(worldSpeech.show).toHaveBeenCalledWith({
      text: "Tangrowth esta esperando.",
      worldPosition: speechPosition
    });
    expect(worldSpeech.showTaskPop).toHaveBeenCalledWith({
      text: "YOU RESTORED THE TALL GRASS!",
      worldPosition: [4, 0, 2],
      anchorHeight: 2.68
    });
    expect(groundCellHighlight.show).toHaveBeenCalledWith({
      groundCell
    });
    expect(colliderGizmos.show).toHaveBeenCalledWith({
      colliders: [collider]
    });
    expect(worldRenderer.drawScene).toHaveBeenCalledWith(viewProjection, sceneObjects);
    expect(worldRenderer.drawBillboards).toHaveBeenNthCalledWith(
      1,
      viewProjection,
      firstFrame.render.grassBillboards
    );
    expect(worldRenderer.drawBillboards).toHaveBeenNthCalledWith(
      2,
      viewProjection,
      firstFrame.render.flowerBillboards
    );
    expect(worldRenderer.drawWorldMarkers).toHaveBeenCalledWith(viewProjection, worldMarkers);
    expect(worldRenderer.drawWoodDrops).toHaveBeenCalledWith(viewProjection, "wood", [{ collected: false }]);
    expect(worldRenderer.drawBillboard).toHaveBeenCalledWith(
      viewProjection,
      "cache",
      [3, 0, 3],
      [1, 1],
      [0, 0, 1, 1]
    );
    expect(worldRenderer.drawCharacters).toHaveBeenCalledWith(viewProjection, characters);
    expect(worldSpeech.update).toHaveBeenCalledWith(camera, 1280, 720);
    expect(worldSpeech.updateTaskPop).toHaveBeenCalledWith(camera, 1280, 720);
    expect(groundCellHighlight.update).toHaveBeenCalledWith(camera, 1280, 720);
    expect(colliderGizmos.update).toHaveBeenCalledWith(camera, 1280, 720);
    expect(actTwoTutorial.update).toHaveBeenCalledWith(camera, 1280, 720, [4, 0, 2], 0.016);

    const secondFrame = controller.beginFrame();
    secondFrame.render.viewProjection = viewProjection;
    secondFrame.render.sceneObjects = sceneObjects;
    secondFrame.worldSpeech.visible = true;
    secondFrame.worldSpeech.text = "Tangrowth esta esperando.";
    secondFrame.worldSpeech.worldPosition = [18, 0.5, -6];
    secondFrame.taskPop.visible = true;
    secondFrame.taskPop.text = "YOU RESTORED THE TALL GRASS!";
    secondFrame.taskPop.worldPosition = [8, 0, 5];
    secondFrame.groundCellHighlight.visible = true;
    secondFrame.groundCellHighlight.groundCell = groundCell;
    secondFrame.tutorial.active = true;
    secondFrame.tutorial.playerPosition = [8, 0, 5];
    secondFrame.tutorial.deltaTime = 0.02;

    controller.commitFrame();

    expect(secondFrame.render.grassBillboards).toHaveLength(0);
    expect(secondFrame.render.genericBillboards).toHaveLength(0);
    expect(worldSpeech.setWorldPosition).toHaveBeenCalledWith([18, 0.5, -6]);
    expect(worldSpeech.setTaskPopWorldPosition).toHaveBeenCalledWith([8, 0, 5]);
    expect(groundCellHighlight.setGroundCell).toHaveBeenCalledWith(groundCell);
    expect(worldRenderer.drawBillboard).toHaveBeenCalledTimes(1);

    const thirdFrame = controller.beginFrame();
    thirdFrame.render.viewProjection = viewProjection;
    thirdFrame.render.sceneObjects = sceneObjects;

    controller.commitFrame();

    expect(worldSpeech.hide).toHaveBeenCalledTimes(1);
    expect(worldSpeech.hideTaskPop).toHaveBeenCalledTimes(1);
    expect(groundCellHighlight.hide).toHaveBeenCalledTimes(1);
    expect(colliderGizmos.hide).toHaveBeenCalledTimes(1);
  });
});
