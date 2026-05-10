export const MOTION_IMPACT_PRESET_IDS = Object.freeze({
  WATER_GUN_HIT: "water-gun-hit",
  TILE_RESTORE_POP: "tile-restore-pop",
  ROBOT_BUMP: "robot-bump",
  WORKBENCH_CRAFT: "workbench-craft",
  TASK_COMPLETE: "task-complete",
  CRASH_IMPACT: "crash-impact"
});

export const MOTION_IMPACT_BLEND = Object.freeze({
  SHARP: "sharp",
  SOFT: "soft"
});

export const MOTION_IMPACT_SILHOUETTE_BIAS = Object.freeze({
  CAMERA_READABLE: "camera-readable",
  OBJECT_LOCAL: "object-local"
});

export const WATER_GUN_HIT_DURATION_MS = 220;
export const WATER_GUN_HIT_FREEZE_MS = 40;
export const WATER_GUN_HIT_ANTICIPATION_MS = 30;
export const WATER_GUN_HIT_RECOVER_MS = 120;
export const WATER_GUN_HIT_POSITION_JOLT = Object.freeze({ x: 0, y: 0.03, z: -0.04 });
export const WATER_GUN_HIT_ROTATION_JOLT = Object.freeze({ x: -0.08, y: 0.12, z: 0.04 });
export const WATER_GUN_HIT_SCALE_PULSE = 1.04;

export const TILE_RESTORE_POP_DURATION_MS = 180;
export const TILE_RESTORE_POP_FREEZE_MS = 28;
export const TILE_RESTORE_POP_ANTICIPATION_MS = 20;
export const TILE_RESTORE_POP_RECOVER_MS = 100;

export const ROBOT_BUMP_DURATION_MS = 240;
export const ROBOT_BUMP_FREEZE_MS = 36;
export const ROBOT_BUMP_ANTICIPATION_MS = 24;
export const ROBOT_BUMP_RECOVER_MS = 130;

export const WORKBENCH_CRAFT_DURATION_MS = 260;
export const WORKBENCH_CRAFT_FREEZE_MS = 36;
export const WORKBENCH_CRAFT_ANTICIPATION_MS = 32;
export const WORKBENCH_CRAFT_RECOVER_MS = 150;

export const TASK_COMPLETE_DURATION_MS = 300;
export const TASK_COMPLETE_FREEZE_MS = 44;
export const TASK_COMPLETE_ANTICIPATION_MS = 24;
export const TASK_COMPLETE_RECOVER_MS = 170;

export const CRASH_IMPACT_DURATION_MS = 420;
export const CRASH_IMPACT_FREEZE_MS = 64;
export const CRASH_IMPACT_ANTICIPATION_MS = 0;
export const CRASH_IMPACT_RECOVER_MS = 260;

function freezePreset(preset) {
  return Object.freeze({
    ...preset,
    positionJolt: Object.freeze({ ...preset.positionJolt }),
    rotationJolt: Object.freeze({ ...preset.rotationJolt })
  });
}

export const MOTION_IMPACT_PRESETS = Object.freeze([
  freezePreset({
    id: MOTION_IMPACT_PRESET_IDS.WATER_GUN_HIT,
    durationMs: WATER_GUN_HIT_DURATION_MS,
    freezeMs: WATER_GUN_HIT_FREEZE_MS,
    anticipationMs: WATER_GUN_HIT_ANTICIPATION_MS,
    recoverMs: WATER_GUN_HIT_RECOVER_MS,
    positionJolt: WATER_GUN_HIT_POSITION_JOLT,
    rotationJolt: WATER_GUN_HIT_ROTATION_JOLT,
    scalePulse: WATER_GUN_HIT_SCALE_PULSE,
    blend: MOTION_IMPACT_BLEND.SHARP,
    silhouetteBias: MOTION_IMPACT_SILHOUETTE_BIAS.CAMERA_READABLE
  }),
  freezePreset({
    id: MOTION_IMPACT_PRESET_IDS.TILE_RESTORE_POP,
    durationMs: TILE_RESTORE_POP_DURATION_MS,
    freezeMs: TILE_RESTORE_POP_FREEZE_MS,
    anticipationMs: TILE_RESTORE_POP_ANTICIPATION_MS,
    recoverMs: TILE_RESTORE_POP_RECOVER_MS,
    positionJolt: { x: 0, y: 0.018, z: 0 },
    rotationJolt: { x: 0.03, y: 0, z: -0.025 },
    scalePulse: 1.035,
    blend: MOTION_IMPACT_BLEND.SHARP,
    silhouetteBias: MOTION_IMPACT_SILHOUETTE_BIAS.CAMERA_READABLE
  }),
  freezePreset({
    id: MOTION_IMPACT_PRESET_IDS.ROBOT_BUMP,
    durationMs: ROBOT_BUMP_DURATION_MS,
    freezeMs: ROBOT_BUMP_FREEZE_MS,
    anticipationMs: ROBOT_BUMP_ANTICIPATION_MS,
    recoverMs: ROBOT_BUMP_RECOVER_MS,
    positionJolt: { x: 0.025, y: 0.025, z: -0.025 },
    rotationJolt: { x: -0.04, y: 0.08, z: 0.035 },
    scalePulse: 1.025,
    blend: MOTION_IMPACT_BLEND.SHARP,
    silhouetteBias: MOTION_IMPACT_SILHOUETTE_BIAS.CAMERA_READABLE
  }),
  freezePreset({
    id: MOTION_IMPACT_PRESET_IDS.WORKBENCH_CRAFT,
    durationMs: WORKBENCH_CRAFT_DURATION_MS,
    freezeMs: WORKBENCH_CRAFT_FREEZE_MS,
    anticipationMs: WORKBENCH_CRAFT_ANTICIPATION_MS,
    recoverMs: WORKBENCH_CRAFT_RECOVER_MS,
    positionJolt: { x: 0, y: 0.022, z: 0.018 },
    rotationJolt: { x: 0.025, y: -0.05, z: 0.02 },
    scalePulse: 1.03,
    blend: MOTION_IMPACT_BLEND.SOFT,
    silhouetteBias: MOTION_IMPACT_SILHOUETTE_BIAS.OBJECT_LOCAL
  }),
  freezePreset({
    id: MOTION_IMPACT_PRESET_IDS.TASK_COMPLETE,
    durationMs: TASK_COMPLETE_DURATION_MS,
    freezeMs: TASK_COMPLETE_FREEZE_MS,
    anticipationMs: TASK_COMPLETE_ANTICIPATION_MS,
    recoverMs: TASK_COMPLETE_RECOVER_MS,
    positionJolt: { x: 0, y: 0.04, z: 0 },
    rotationJolt: { x: -0.02, y: 0.04, z: -0.04 },
    scalePulse: 1.055,
    blend: MOTION_IMPACT_BLEND.SOFT,
    silhouetteBias: MOTION_IMPACT_SILHOUETTE_BIAS.CAMERA_READABLE
  }),
  freezePreset({
    id: MOTION_IMPACT_PRESET_IDS.CRASH_IMPACT,
    durationMs: CRASH_IMPACT_DURATION_MS,
    freezeMs: CRASH_IMPACT_FREEZE_MS,
    anticipationMs: CRASH_IMPACT_ANTICIPATION_MS,
    recoverMs: CRASH_IMPACT_RECOVER_MS,
    positionJolt: { x: 0.05, y: 0.08, z: -0.06 },
    rotationJolt: { x: -0.12, y: 0.16, z: 0.08 },
    scalePulse: 1.035,
    blend: MOTION_IMPACT_BLEND.SHARP,
    silhouetteBias: MOTION_IMPACT_SILHOUETTE_BIAS.CAMERA_READABLE
  })
]);

const MOTION_IMPACT_PRESET_BY_ID = new Map(
  MOTION_IMPACT_PRESETS.map((preset) => [preset.id, preset])
);

export function getMotionImpactPreset(presetId) {
  return MOTION_IMPACT_PRESET_BY_ID.get(presetId) || null;
}
