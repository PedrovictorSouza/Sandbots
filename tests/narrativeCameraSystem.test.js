import { describe, expect, it, vi } from "vitest";
import {
  NARRATIVE_CAMERA_BEAT_TYPES,
  NARRATIVE_CAMERA_IMPORTANCE,
  createNarrativeCameraBeat,
  createNarrativeCameraTargetSmoother,
  createNarrativeCinematographerAdapter,
  resolveNarrativeCameraIntent,
  validateNarrativeCameraBeat,
  warnForInvalidNarrativeCameraBeat
} from "../app/camera/narrativeCameraSystem.js";

describe("narrative camera system", () => {
  it("normalizes camera beats without leaking mutable subject arrays", () => {
    const position = [2, 0, 4];
    const beat = createNarrativeCameraBeat({
      id: "solar-station-placed",
      type: NARRATIVE_CAMERA_BEAT_TYPES.CONFIRM,
      subjects: [{ id: "solarStation", position }]
    });

    position[0] = 99;

    expect(beat).toMatchObject({
      id: "solar-station-placed",
      type: "confirm",
      importance: "medium",
      subjects: [
        {
          id: "solarStation",
          position: [2, 0, 4],
          role: "primary"
        }
      ]
    });
  });

  it("returns a fallback intent when an authored beat has no positioned subject", () => {
    const intent = resolveNarrativeCameraIntent({
      id: "grow-bot-revealed",
      type: NARRATIVE_CAMERA_BEAT_TYPES.REVEAL,
      importance: NARRATIVE_CAMERA_IMPORTANCE.HIGH,
      next: "conversation"
    });

    expect(intent).toMatchObject({
      type: "fallback",
      lockControl: false,
      restore: true,
      reason: "missing-camera-subject"
    });
    expect(intent.warnings.map((warning) => warning.code)).toContain(
      "narrative-camera:missing-subject"
    );
  });

  it("maps high-importance reveal beats to short locked focus intents", () => {
    const intent = resolveNarrativeCameraIntent({
      id: "grow-bot-revealed",
      type: NARRATIVE_CAMERA_BEAT_TYPES.REVEAL,
      importance: NARRATIVE_CAMERA_IMPORTANCE.HIGH,
      subjects: [{ id: "growBot", position: [5, 0, 7] }],
      interruptible: false,
      maxDuration: 2.2,
      next: "conversation"
    });

    expect(intent).toMatchObject({
      type: "focus",
      lockControl: true,
      restore: true,
      duration: 2.2,
      subject: {
        id: "growBot",
        position: [5, 0, 7]
      }
    });
  });

  it("keeps low-importance focus beats from stealing control", () => {
    const intent = resolveNarrativeCameraIntent({
      id: "small-object-focus",
      type: NARRATIVE_CAMERA_BEAT_TYPES.FOCUS,
      importance: NARRATIVE_CAMERA_IMPORTANCE.LOW,
      subjects: [{ id: "dryValve", position: [1, 0, 1] }]
    });

    expect(intent.lockControl).toBe(false);
  });

  it("validates risky cinematic beats without blocking runtime", () => {
    const warnings = validateNarrativeCameraBeat({
      id: "loose-reveal",
      type: NARRATIVE_CAMERA_BEAT_TYPES.REVEAL,
      importance: NARRATIVE_CAMERA_IMPORTANCE.HIGH,
      subjects: [{ id: "box", position: [0, 0, 0] }],
      interruptible: false
    });

    expect(warnings.map((warning) => warning.code)).toEqual([
      "narrative-camera:missing-max-duration",
      "narrative-camera:reveal-needs-return"
    ]);
  });

  it("logs validation warnings only when enabled", () => {
    const logger = {
      warn: vi.fn()
    };

    const warnings = warnForInvalidNarrativeCameraBeat({
      id: "long-confirm",
      type: NARRATIVE_CAMERA_BEAT_TYPES.CONFIRM,
      subjects: [{ id: "station", position: [0, 0, 0] }],
      maxDuration: 3
    }, {
      logger
    });

    expect(warnings).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("confirm-too-long"));

    logger.warn.mockClear();
    warnForInvalidNarrativeCameraBeat({
      id: "long-confirm",
      type: NARRATIVE_CAMERA_BEAT_TYPES.CONFIRM,
      subjects: [{ id: "station", position: [0, 0, 0] }],
      maxDuration: 3
    }, {
      enabled: false,
      logger
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("smooths small target jitter and damps vertical changes", () => {
    const smoother = createNarrativeCameraTargetSmoother({
      epsilon: 0.1,
      verticalStrength: 0.25
    });

    expect(smoother.sample([1, 1, 1])).toEqual([1, 1, 1]);
    expect(smoother.sample([1.02, 1.04, 1.02])).toEqual([1, 1, 1]);
    expect(smoother.sample([2, 5, 2])).toEqual([2, 2, 2]);
  });

  it("executes focus intents through the existing dialogue world-point camera", () => {
    const focusWorldPoint = vi.fn();
    const adapter = createNarrativeCinematographerAdapter({
      dialogueCameraController: {
        focusWorldPoint
      }
    });
    const intent = resolveNarrativeCameraIntent({
      id: "solar-station-placed",
      type: NARRATIVE_CAMERA_BEAT_TYPES.CONFIRM,
      subjects: [{ id: "solarStation", position: [4, 0, 5] }]
    });

    expect(adapter.executeIntent(intent)).toMatchObject({
      executed: true,
      mode: "dialogue-world-point"
    });
    expect(focusWorldPoint).toHaveBeenCalledWith({
      position: [4, 0, 5],
      height: expect.any(Number)
    });
  });

  it("falls back to pose transitions when no dialogue camera is provided", () => {
    const startPoseTransition = vi.fn();
    const sync = vi.fn();
    const adapter = createNarrativeCinematographerAdapter({
      camera: {
        getPose: () => ({
          direction: [1, 0.3, 0],
          zoom: 3,
          distance: 7,
          target: [0, 1, 0]
        }),
        startPoseTransition
      },
      cameraOrbit: {
        sync
      }
    });
    const intent = resolveNarrativeCameraIntent({
      id: "terminal-focus",
      type: NARRATIVE_CAMERA_BEAT_TYPES.FOCUS,
      subjects: [{ id: "terminal", position: [3, 0, 2] }]
    });

    expect(adapter.executeIntent(intent)).toMatchObject({
      executed: true,
      mode: "pose-transition"
    });
    expect(startPoseTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        target: [3, expect.any(Number), 2],
        direction: [1, 0.3, 0]
      }),
      expect.objectContaining({
        duration: expect.any(Number)
      })
    );
    expect(sync).toHaveBeenCalledWith([1, 0.3, 0]);
  });

  it("restores gameplay camera on return intents", () => {
    const restoreGameplayCamera = vi.fn();
    const follow = vi.fn();
    const adapter = createNarrativeCinematographerAdapter({
      camera: {
        follow
      },
      dialogueCameraController: {
        restoreGameplayCamera
      }
    });
    const intent = resolveNarrativeCameraIntent({
      id: "return-to-player",
      type: NARRATIVE_CAMERA_BEAT_TYPES.RETURN
    });

    expect(adapter.executeIntent(intent, {
      playerPosition: [8, 0, 9]
    })).toMatchObject({
      executed: true,
      mode: "return"
    });
    expect(restoreGameplayCamera).toHaveBeenCalled();
    expect(follow).toHaveBeenCalledWith([8, 0, 9]);
  });
});
