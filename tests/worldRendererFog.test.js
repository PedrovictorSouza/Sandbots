import { describe, expect, it, vi } from "vitest";
import { createWorldRenderer } from "../rendering/worldRenderer.js";
import {
  createNoopWebGlContext,
  createWorldRenderingResources
} from "../rendering/worldAssets.js";
import {
  GAME_FLOW
} from "../gameFlow.js";
import {
  PSX_DISTANCE_FOG_PRESET_ID,
  resolvePsxDistanceFogSettings
} from "../app/rendering/psxDistanceFogConfig.js";

function createRecordingGl() {
  const gl = createNoopWebGlContext();
  const calls = {
    uniform1f: [],
    uniform3fv: []
  };

  gl.uniform1f = vi.fn((location, value) => {
    calls.uniform1f.push([location?.name, value]);
  });
  gl.uniform3fv = vi.fn((location, value) => {
    calls.uniform3fv.push([location?.name, Array.from(value)]);
  });
  gl.drawElements = vi.fn();

  return { gl, calls };
}

function createRenderer(gl) {
  const resources = createWorldRenderingResources(gl);
  return createWorldRenderer({
    gl,
    worldCanvas: { width: 320, height: 180 },
    camera: {
      getPose: () => ({
        target: [7, 0, -3],
        direction: [1, 0, 0]
      }),
      getBillboardAxes: () => ({
        right: [1, 0, 0],
        up: [0, 1, 0]
      })
    },
    jitterState: { amount: 0 },
    ...resources
  });
}

function createSceneObjects(gl, instances = [{ offset: [12, 0, -5], scale: 1 }]) {
  return [
    {
      brightness: 1,
      model: {
        offset: [0, 0, 0],
        scale: 1,
        size: [1, 1, 1],
        texture: gl.createTexture(),
        primitives: [
          {
            vertexBuffer: gl.createBuffer(),
            indexBuffer: gl.createBuffer(),
            indexCount: 3,
            indexType: gl.UNSIGNED_SHORT
          }
        ]
      },
      instances
    }
  ];
}

function lastUniform(calls, name) {
  return calls
    .filter(([uniformName]) => uniformName === name)
    .at(-1)?.[1];
}

describe("worldRenderer PSX distance fog", () => {
  it("applies fog uniforms only during the 3D scene pass", () => {
    const { gl, calls } = createRecordingGl();
    const renderer = createRenderer(gl);
    const fog = resolvePsxDistanceFogSettings({
      presetId: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT
    });

    renderer.drawScene(new Float32Array(16), createSceneObjects(gl), null, {
      psxDistanceFog: fog
    });

    expect(lastUniform(calls.uniform3fv, "uFogOrigin")).toEqual([7, 0, -3]);
    const fogColor = lastUniform(calls.uniform3fv, "uFogColor");
    fog.color.forEach((channel, index) => {
      expect(fogColor[index]).toBeCloseTo(channel, 5);
    });
    expect(lastUniform(calls.uniform1f, "uFogNear")).toBe(fog.near);
    expect(lastUniform(calls.uniform1f, "uFogFar")).toBe(fog.far);
    expect(lastUniform(calls.uniform1f, "uFogIntensity")).toBe(fog.intensity);
    expect(gl.drawElements).toHaveBeenCalled();
  });

  it("uses gameplay fog to hide the render cutoff for distant scene instances", () => {
    const { gl } = createRecordingGl();
    const renderer = createRenderer(gl);
    const fog = resolvePsxDistanceFogSettings({
      sceneId: GAME_FLOW.GAMEPLAY
    });

    renderer.drawScene(
      new Float32Array(16),
      createSceneObjects(gl, [
        { offset: [12, 0, -5], scale: 1 },
        { offset: [120, 0, -3], scale: 1 }
      ]),
      null,
      { psxDistanceFog: fog }
    );

    expect(fog.enabled).toBe(true);
    expect(fog.renderCullDistance).toBeGreaterThan(0);
    expect(gl.drawElements).toHaveBeenCalledTimes(1);
  });

  it("disables fog for highlight passes that omit scene options", () => {
    const { gl, calls } = createRecordingGl();
    const renderer = createRenderer(gl);

    renderer.drawGroundCellHighlight(new Float32Array(16), {
      visible: true,
      groundCell: {
        offset: [1, 0, 1],
        surfaceY: 0,
        tileSpan: 1
      }
    });

    expect(lastUniform(calls.uniform1f, "uFogIntensity")).toBe(0);
  });
});
