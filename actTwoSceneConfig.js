export const ACT_TWO_MONSTER_POSITION = [12.4, 0.02, -8.4];
export const ACT_TWO_PLAYER_SPAWN = [8.4, 0, -3.2];
export const ACT_TWO_PLAYER_CAMERA_DIRECTION = [0, 0.36, 1];
export const ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT = 1.2;
export const ACT_TWO_PLAYER_CAMERA_ZOOM = 5.35;
export const ACT_TWO_PLAYER_CAMERA_DISTANCE = 8.2;
export const ACT_TWO_PLAYER_CAMERA_FOLLOW_LEAD = 1.6;
export const ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD = 11;
export const ACT_TWO_GAMEPLAY_OPENING_SHIP_START = 3;
export const ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND = 3.5;
export const ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START = 9;
export const ACT_TWO_GAMEPLAY_OPENING_IMPACT_SHAKE_DURATION = 0.55;
export const ACT_TWO_GAMEPLAY_OPENING_SHIP_SMOKE_DURATION = 300;
export const ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE = Object.freeze({
  target: [9.05, ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, -4.05],
  direction: [3.25, 1.3, -6.95],
  zoom: 6.05,
  distance: 7.78
});
export const ACT_TWO_GAMEPLAY_OPENING_SHIP_START_POSITION = Object.freeze([10.55, 7.8, 6.9]);
export const ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION = Object.freeze([5.95, 0.06, 6.45]);
export const ACT_TWO_GAMEPLAY_OPENING_SHIP_SIZE = Object.freeze([1.62, 1.28]);
export const ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION = Object.freeze([6.25, 0, 7.25]);
export const ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION = Object.freeze([...ACT_TWO_PLAYER_SPAWN]);
export const ACT_TWO_PLAYER_CAMERA_ZOOM_PRESETS = Object.freeze([
  {
    id: "default",
    zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
    distance: ACT_TWO_PLAYER_CAMERA_DISTANCE
  },
  {
    id: "far",
    zoom: 6.2,
    distance: 10.2
  }
]);
