import {
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_FOLLOW_LEAD,
  ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "../../actTwoSceneConfig.js";
import { createPokemonCamera } from "../../camera.js";
import {
  FULL_UV_RECT,
  NPC_MARKER_OFFSET,
  NPC_MARKER_SIZE,
  WORLD_MARKER_HEIGHT,
  WORLD_MARKER_SIZE,
  createNoopWebGlContext,
  createWorldRenderingResources,
  createWorldTextureFactory
} from "../../rendering/worldAssets.js";
import { createWorldRenderer } from "../../rendering/worldRenderer.js";
import { createStageRuntimeController } from "../ui/stageRuntimeController.js";
import { createCameraOrbitController } from "./cameraOrbitController.js";
import { createRenderFrameController } from "./renderFrameController.js";
import { wireGameRuntime } from "./wireGameRuntime.js";

const CAMERA_TURN_SPEED = 1.9;

export function createEngineRuntime({
  dom,
  launchMode,
  shouldUseNoopWebGlForLaunchMode,
  onWebGlUnavailable = () => {},
  windowRef = window
}) {
  const {
    worldCanvas,
    spriteCanvas,
    mount,
    renderFrame: renderFrameElement,
    jitterSlider,
    jitterValue,
    warmOverlay,
    rootStyle
  } = dom;

  const stageRuntime = createStageRuntimeController({
    rootStyle,
    jitterValueElement: jitterValue,
    warmOverlayElement: warmOverlay
  });
  const renderFrame = createRenderFrameController({
    frameElement: renderFrameElement,
    windowRef
  });
  const gl = worldCanvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  }) || (shouldUseNoopWebGlForLaunchMode(launchMode) ? createNoopWebGlContext() : null);

  if (!gl) {
    onWebGlUnavailable();
    throw new Error("WebGL indisponivel");
  }

  const {
    program,
    attribs,
    uniforms,
    spriteProgram,
    spriteAttribs,
    spriteUniforms,
    spriteQuadBuffer,
    spriteQuadIndices,
    skyProgram,
    skyAttribs,
    skyUniforms,
    skyQuadBuffer,
    skyQuadIndices
  } = createWorldRenderingResources(gl);
  const camera = createPokemonCamera({
    worldCanvas,
    spriteCanvas,
    mount: renderFrameElement || mount,
    initialZoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    target: [0, ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, 0],
    direction: ACT_TWO_PLAYER_CAMERA_DIRECTION,
    distance: ACT_TWO_PLAYER_CAMERA_DISTANCE,
    followLeadDistance: ACT_TWO_PLAYER_CAMERA_FOLLOW_LEAD
  });
  const cameraTurnKeys = new Set();
  const cameraOrbit = createCameraOrbitController({
    camera,
    initialDirection: ACT_TWO_PLAYER_CAMERA_DIRECTION
  });
  const jitterState = {
    amount: Number(jitterSlider?.value || 0) / 100
  };

  if (jitterSlider) {
    jitterSlider.addEventListener("input", () => {
      jitterState.amount = Number(jitterSlider.value) / 100;
      stageRuntime.syncJitterUi(jitterState.amount);
    });
  }

  const gameRuntime = wireGameRuntime({
    windowRef,
    renderFrameController: renderFrame,
    stageRuntimeController: stageRuntime
  });
  stageRuntime.syncJitterUi(jitterState.amount);

  const worldRenderer = createWorldRenderer({
    gl,
    worldCanvas,
    camera,
    program,
    uniforms,
    attribs,
    spriteProgram,
    spriteUniforms,
    spriteAttribs,
    spriteQuadBuffer,
    spriteQuadIndices,
    skyProgram,
    skyUniforms,
    skyAttribs,
    skyQuadBuffer,
    skyQuadIndices,
    jitterState
  });
  const worldTextureFactory = createWorldTextureFactory(gl);

  return {
    gl,
    camera,
    cameraOrbit,
    cameraOrbitConfig: {
      getDirection: cameraOrbit.getDirection,
      rotate: cameraOrbit.rotate,
      turnSpeed: CAMERA_TURN_SPEED
    },
    cameraTurnKeys,
    gameRuntime,
    renderFrame,
    worldRenderer,
    worldTextureFactory,
    rendering: {
      fullUvRect: FULL_UV_RECT,
      worldMarkerHeight: WORLD_MARKER_HEIGHT,
      worldMarkerSize: WORLD_MARKER_SIZE,
      npcMarkerOffset: NPC_MARKER_OFFSET,
      npcMarkerSize: NPC_MARKER_SIZE
    }
  };
}
