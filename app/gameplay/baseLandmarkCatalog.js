import {
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
  ACT_TWO_MONSTER_POSITION
} from "../../actTwoSceneConfig.js";
import {
  COLONY_CACHE_POSITION,
  LEPPA_TREE_POSITION,
  POKEMON_CENTER_PC_POSITION,
  RUINED_POKEMON_CENTER_POSITION,
  WORKBENCH_POSITION
} from "../../gameplayContent.js";
import { ACT_TWO_SQUIRTLE_POSITION } from "../../rendering/worldAssets.js";

export const BASE_LANDMARK_ROLE = Object.freeze({
  PRIMARY: "primary",
  SECONDARY: "secondary",
  ROUTE: "route",
  DISCOVERY: "discovery"
});

export const BASE_LANDMARK_CUE = Object.freeze({
  SMOKE: "smoke",
  SILHOUETTE: "silhouette",
  LIGHT: "light",
  MARKER: "marker",
  CABLE_TRAIL: "cable-trail",
  BOT_SIGNAL: "bot-signal",
  ODD_TREE: "odd-tree"
});

function freezeLandmark(entry) {
  return Object.freeze({
    ...entry,
    position: Object.freeze([...entry.position]),
    cues: Object.freeze([...entry.cues])
  });
}

export const BASE_LANDMARKS = Object.freeze([
  freezeLandmark({
    id: "crash-site",
    label: "Crash Site",
    role: BASE_LANDMARK_ROLE.PRIMARY,
    position: ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
    cues: [BASE_LANDMARK_CUE.SMOKE, BASE_LANDMARK_CUE.SILHOUETTE],
    purpose: "The first home marker: where the player entered the planet and can reorient."
  }),
  freezeLandmark({
    id: "workbench",
    label: "Workbench",
    role: BASE_LANDMARK_ROLE.SECONDARY,
    position: WORKBENCH_POSITION,
    cues: [BASE_LANDMARK_CUE.SILHOUETTE, BASE_LANDMARK_CUE.MARKER],
    purpose: "The practical build hub for early colony protocols."
  }),
  freezeLandmark({
    id: "colony-cache",
    label: "Colony Cache",
    role: BASE_LANDMARK_ROLE.SECONDARY,
    position: COLONY_CACHE_POSITION,
    cues: [BASE_LANDMARK_CUE.MARKER],
    purpose: "The protected supply point that makes gathered materials feel like colony progress."
  }),
  freezeLandmark({
    id: "colony-terminal",
    label: "Colony Terminal",
    role: BASE_LANDMARK_ROLE.SECONDARY,
    position: POKEMON_CENTER_PC_POSITION,
    cues: [BASE_LANDMARK_CUE.LIGHT, BASE_LANDMARK_CUE.CABLE_TRAIL],
    purpose: "The diagnostic terminal that logs viability and authorizes colony protocols."
  }),
  freezeLandmark({
    id: "terminal-ruins",
    label: "Terminal Ruins",
    role: BASE_LANDMARK_ROLE.ROUTE,
    position: RUINED_POKEMON_CENTER_POSITION,
    cues: [BASE_LANDMARK_CUE.SILHOUETTE],
    purpose: "A readable route target that frames the broken colony infrastructure."
  }),
  freezeLandmark({
    id: "overseer-bot",
    label: "Overseer Bot",
    role: BASE_LANDMARK_ROLE.ROUTE,
    position: ACT_TWO_MONSTER_POSITION,
    cues: [BASE_LANDMARK_CUE.BOT_SIGNAL],
    purpose: "The first character anchor near the restored work zone."
  }),
  freezeLandmark({
    id: "hydro-bot",
    label: "Hydro Bot",
    role: BASE_LANDMARK_ROLE.DISCOVERY,
    position: ACT_TWO_SQUIRTLE_POSITION,
    cues: [BASE_LANDMARK_CUE.BOT_SIGNAL],
    purpose: "The first tool-bearing bot discovery."
  }),
  freezeLandmark({
    id: "pulse-tree",
    label: "Pulse Tree",
    role: BASE_LANDMARK_ROLE.DISCOVERY,
    position: LEPPA_TREE_POSITION,
    cues: [BASE_LANDMARK_CUE.ODD_TREE],
    purpose: "A small living landmark for the restoration loop."
  })
]);

export function listBaseLandmarks() {
  return BASE_LANDMARKS;
}

export function getBaseLandmarkById(landmarkId) {
  return BASE_LANDMARKS.find((landmark) => landmark.id === landmarkId) || null;
}

export function validateBaseLandmarkCatalog({ landmarks = BASE_LANDMARKS } = {}) {
  const errors = [];
  const ids = new Set();
  const roles = new Set(Object.values(BASE_LANDMARK_ROLE));
  const cues = new Set(Object.values(BASE_LANDMARK_CUE));

  landmarks.forEach((landmark, index) => {
    if (!landmark?.id) {
      errors.push({ type: "missing-landmark-id", index });
      return;
    }

    if (ids.has(landmark.id)) {
      errors.push({ type: "duplicate-landmark-id", landmarkId: landmark.id, index });
    }
    ids.add(landmark.id);

    if (!landmark.label) {
      errors.push({ type: "missing-landmark-label", landmarkId: landmark.id, index });
    }

    if (!roles.has(landmark.role)) {
      errors.push({ type: "unknown-landmark-role", landmarkId: landmark.id, role: landmark.role, index });
    }

    if (!Array.isArray(landmark.position) || landmark.position.length < 3) {
      errors.push({ type: "missing-landmark-position", landmarkId: landmark.id, index });
    }

    if (!Array.isArray(landmark.cues) || landmark.cues.length === 0) {
      errors.push({ type: "missing-landmark-cues", landmarkId: landmark.id, index });
    } else {
      landmark.cues.forEach((cue) => {
        if (!cues.has(cue)) {
          errors.push({ type: "unknown-landmark-cue", landmarkId: landmark.id, cue, index });
        }
      });
    }
  });

  if (!landmarks.some((landmark) => landmark.role === BASE_LANDMARK_ROLE.PRIMARY)) {
    errors.push({ type: "missing-primary-landmark" });
  }

  if (landmarks.filter((landmark) => landmark.role === BASE_LANDMARK_ROLE.SECONDARY).length < 2) {
    errors.push({ type: "missing-secondary-landmarks" });
  }

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}
