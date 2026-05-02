import { describe, expect, it, vi } from "vitest";
import { createCameraZoomPresetController } from "../app/runtime/cameraZoomPresetController.js";

describe("createCameraZoomPresetController", () => {
  it("can reapply the active zoom preset without advancing it", () => {
    const camera = {
      setZoom: vi.fn(),
      setDistance: vi.fn()
    };
    const controller = createCameraZoomPresetController({
      camera,
      presets: [
        { zoom: 3.15, distance: 8 },
        { zoom: 4.2, distance: 6.4 }
      ]
    });

    expect(controller.cycle()).toBe(1);
    expect(camera.setZoom).toHaveBeenLastCalledWith(4.2);
    expect(camera.setDistance).toHaveBeenLastCalledWith(6.4);

    camera.setZoom.mockClear();
    camera.setDistance.mockClear();

    expect(controller.applyCurrent()).toEqual({ zoom: 4.2, distance: 6.4 });
    expect(controller.getIndex()).toBe(1);
    expect(controller.getCurrentPreset()).toEqual({ zoom: 4.2, distance: 6.4 });
    expect(camera.setZoom).toHaveBeenCalledWith(4.2);
    expect(camera.setDistance).toHaveBeenCalledWith(6.4);
  });
});
