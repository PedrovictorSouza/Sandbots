export const ACT_TWO_MONSTER_POSITION = [12.4, 0.02, -8.4];
export const ACT_TWO_PLAYER_SPAWN = [8.4, 0, -3.2];
export const ACT_TWO_PLAYER_CAMERA_DIRECTION = [0, 0.36, 1];
export const ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT = 1.2;
export const ACT_TWO_PLAYER_CAMERA_ZOOM = 5.35;
export const ACT_TWO_PLAYER_CAMERA_DISTANCE = 8.2;
export const ACT_TWO_PLAYER_CAMERA_FOLLOW_LEAD = 1.6;
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
  },
  {
    id: "close",
    zoom: 4.7,
    distance: 6.2
  }
]);
