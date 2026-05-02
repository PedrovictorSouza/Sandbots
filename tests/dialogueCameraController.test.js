import { describe, expect, it, vi } from "vitest";
import { createDialogueCameraController } from "../app/runtime/dialogueCameraController.js";

describe("createDialogueCameraController", () => {
  it("restores the original gameplay camera after chained scripted focuses", () => {
    const gameplayPose = {
      target: [0, 0, 0],
      direction: [0, 0.5, 1],
      zoom: 2,
      distance: 8
    };
    let currentPose = gameplayPose;
    const camera = {
      getPose: vi.fn(() => currentPose),
      startPoseTransition: vi.fn((pose) => {
        currentPose = pose;
      })
    };
    const cameraOrbit = {
      sync: vi.fn()
    };
    const dialogueCamera = createDialogueCameraController({ camera, cameraOrbit });

    dialogueCamera.focusWorldPoint({ position: [6, 0, 2] });
    dialogueCamera.focusNpcConversation({
      playerPosition: [1, 0, 1],
      targetId: "tangrowth",
      npcActors: [
        {
          id: "tangrowth",
          character: {
            getPosition: () => [2, 0, 2]
          }
        }
      ],
      interactables: []
    });
    dialogueCamera.restoreGameplayCamera();

    expect(camera.startPoseTransition).toHaveBeenLastCalledWith(
      gameplayPose,
      expect.objectContaining({ duration: expect.any(Number) })
    );
  });

  it("can frame a conversation from an explicit dynamic target position", () => {
    const camera = {
      getPose: vi.fn(() => ({
        target: [0, 0, 0],
        direction: [0, 0.4, 1],
        zoom: 2,
        distance: 8
      })),
      startPoseTransition: vi.fn()
    };
    const cameraOrbit = {
      sync: vi.fn()
    };
    const dialogueCamera = createDialogueCameraController({ camera, cameraOrbit });

    dialogueCamera.focusNpcConversation({
      playerPosition: [0, 0, 0],
      targetId: "bulbasaurDryGrassMission",
      targetPosition: [2, 0.02, 3],
      npcActors: [],
      interactables: []
    });

    expect(camera.startPoseTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        target: [1, 1.25, 1.5],
        zoom: 3.9
      }),
      expect.objectContaining({ duration: expect.any(Number) })
    );
  });
});
