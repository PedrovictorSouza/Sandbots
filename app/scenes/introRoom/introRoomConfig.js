export const INTRO_ROOM_CAMERA_POSE = Object.freeze({
  target: [0, 2.1, 0],
  direction: [0.7818836374185156, -0.13500149135283723, 0.6086317235157079],
  zoom: 6.4,
  distance: 11.7
});

export const INTRO_ROOM_CHOPPER_ACTOR = Object.freeze({
  id: "intro-chopper",
  position: [-0.65, 2.1, 0],
  rotation: {
    yaw: 0.65,
    pitch: -0.04,
    roll: 0
  },
  scale: 1.85,
  yaw: 0.65,
  state: "intro-speaking"
});

export const INTRO_ROOM_CORRUPTION_FOCUS_POINT = Object.freeze([3.8, 0.2, -3.8]);

export const INTRO_ROOM_ENTRY_DELAY = 0.5;

export const INTRO_ROOM_ENTRY_KEYFRAMES = Object.freeze([
  {
    time: 0,
    position: [-8, 2.85, 0],
    rotation: { yaw: 0.08, pitch: 0, roll: 0 },
    scale: 0.1
  },
  {
    time: 0.8,
    position: [-4.15, 2.5, 0],
    rotation: { yaw: 0.48, pitch: -0.19, roll: 0 },
    scale: 0.45
  },
  {
    time: 1.6,
    position: [-0.35, 2.5, 0],
    rotation: { yaw: -0.11, pitch: 2.13, roll: 0 },
    scale: 0.55
  },
  {
    time: 2.4,
    position: [3.75, 0.5, 0],
    rotation: { yaw: 1.05, pitch: 2.13, roll: 0 },
    scale: 0.85
  },
  {
    time: 3.2,
    position: [-0.65, 2.1, 0],
    rotation: { yaw: 0.65, pitch: -0.04, roll: 0 },
    scale: 1.85
  }
]);

export const INTRO_ROOM_FLOOR_INSTANCES = Object.freeze([
  { offset: [-3.8, 0, -3.8], scale: 1, yaw: 0 },
  { offset: [0, 0, -3.8], scale: 1, yaw: 0 },
  { offset: [3.8, 0, -3.8], scale: 1, yaw: 0 },
  { offset: [-3.8, 0, 0], scale: 1, yaw: 0 },
  { offset: [0, 0, 0], scale: 1, yaw: 0 },
  { offset: [3.8, 0, 0], scale: 1, yaw: 0 },
  { offset: [-3.8, 0, 3.8], scale: 1, yaw: 0 },
  { offset: [0, 0, 3.8], scale: 1, yaw: 0 },
  { offset: [3.8, 0, 3.8], scale: 1, yaw: 0 }
]);
