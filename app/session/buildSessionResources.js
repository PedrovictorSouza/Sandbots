import {
  BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION,
  ITEM_DEFS,
  POKEMON_CENTER_PC_POSITION,
  WORLD_MARKER_STYLES
} from "../../gameplayContent.js";
import {
  ACT_TWO_SQUIRTLE_POSITION,
  ACT_TWO_BULBASAUR_SIZE,
  ACT_TWO_CHARMANDER_SIZE,
  ACT_TWO_POKEDEX_CACHE_POSITION,
  ACT_TWO_POKEDEX_CACHE_SIZE,
  ACT_TWO_REPAIR_PLANT_POSITION,
  ACT_TWO_REPAIR_PLANT_SIZE
} from "../../rendering/worldAssets.js";
import { createPlayerDustState } from "./playerDustParticles.js";
import { createNatureRevivalEffectState } from "./natureRevivalEffects.js";
import { createColliderGizmoTextures } from "./colliderGizmos.js";

function createPlayerDustCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 24;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(184, 136, 91, 0.66)";
  context.fillRect(6, 12, 8, 6);
  context.fillRect(14, 9, 10, 8);
  context.fillRect(22, 13, 5, 5);

  context.fillStyle = "rgba(234, 197, 137, 0.72)";
  context.fillRect(10, 10, 5, 4);
  context.fillRect(18, 8, 5, 4);

  return canvas;
}

function createShipSmokeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 36;
  canvas.height = 32;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(22, 22, 25, 0.78)";
  context.fillRect(8, 15, 12, 8);
  context.fillRect(17, 10, 10, 10);
  context.fillStyle = "rgba(68, 68, 72, 0.62)";
  context.fillRect(11, 11, 8, 6);
  context.fillRect(22, 16, 6, 6);

  return canvas;
}

function createShipImpactFlashCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 245, 186, 0.94)";
  context.fillRect(13, 3, 6, 26);
  context.fillRect(3, 13, 26, 6);
  context.fillStyle = "rgba(255, 117, 67, 0.86)";
  context.fillRect(10, 10, 12, 12);

  return canvas;
}

function createNatureRevivalSparkCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255, 243, 97, 0.92)";
  context.fillRect(10, 2, 4, 20);
  context.fillRect(2, 10, 20, 4);

  context.fillStyle = "rgba(109, 255, 146, 0.72)";
  context.fillRect(7, 7, 10, 10);

  context.fillStyle = "rgba(255, 255, 218, 0.95)";
  context.fillRect(10, 10, 4, 4);

  return canvas;
}

function createSquirtleWaterSprayCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(191, 244, 255, 0.92)";
  context.fillRect(8, 3, 8, 4);
  context.fillRect(5, 7, 14, 8);
  context.fillRect(8, 15, 8, 5);

  context.fillStyle = "rgba(76, 181, 255, 0.82)";
  context.fillRect(5, 10, 4, 6);
  context.fillRect(15, 9, 4, 7);
  context.fillRect(10, 17, 5, 3);

  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.fillRect(9, 6, 4, 3);

  return canvas;
}

function createLeppaBerryCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(34, 31, 25, 0.28)";
  context.beginPath();
  context.ellipse(25, 40, 12, 4, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#7f4025";
  context.fillRect(23, 7, 4, 9);

  context.fillStyle = "#61a956";
  context.beginPath();
  context.ellipse(31, 10, 8, 4, -0.45, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ef6757";
  context.beginPath();
  context.ellipse(24, 26, 13, 15, 0.1, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#c93e3e";
  context.beginPath();
  context.ellipse(28, 29, 8, 11, 0.25, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(255, 236, 180, 0.82)";
  context.beginPath();
  context.ellipse(19, 21, 4, 6, 0.45, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#7b2433";
  context.fillRect(15, 31, 3, 3);
  context.fillRect(27, 35, 3, 3);

  return canvas;
}

function createLogChairCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 56;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(40, 26, 16, 0.26)";
  context.beginPath();
  context.ellipse(33, 47, 22, 5, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#5d3723";
  context.fillRect(17, 25, 8, 20);
  context.fillRect(42, 25, 8, 20);

  context.fillStyle = "#7c4b2f";
  context.fillRect(14, 21, 39, 12);
  context.fillRect(17, 9, 33, 12);

  context.fillStyle = "#a86e42";
  context.fillRect(17, 12, 27, 5);
  context.fillRect(17, 24, 31, 5);

  context.fillStyle = "#3c2519";
  context.fillRect(16, 32, 35, 4);

  context.fillStyle = "#d0a06a";
  context.fillRect(21, 13, 5, 3);
  context.fillRect(29, 25, 6, 3);
  context.fillRect(40, 13, 4, 3);

  return canvas;
}

function createStrawBedCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 56;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(34, 27, 16, 0.22)";
  context.beginPath();
  context.ellipse(36, 45, 27, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#7e5b2a";
  context.fillRect(15, 31, 42, 12);
  context.fillStyle = "#b78939";
  context.fillRect(12, 24, 48, 12);
  context.fillStyle = "#e0c565";
  context.fillRect(15, 18, 42, 12);

  context.strokeStyle = "#8d6d2e";
  context.lineWidth = 2;
  for (let x = 18; x <= 54; x += 7) {
    context.beginPath();
    context.moveTo(x, 19);
    context.lineTo(x - 7, 42);
    context.stroke();
  }

  context.fillStyle = "#f1dd8a";
  context.fillRect(18, 20, 14, 8);
  context.fillStyle = "#6dae52";
  context.fillRect(42, 15, 10, 6);
  context.fillRect(49, 18, 8, 5);

  return canvas;
}

function createCampfireCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(33, 24, 18, 0.28)";
  context.beginPath();
  context.ellipse(32, 53, 24, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#6f452b";
  context.lineWidth = 7;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(17, 47);
  context.lineTo(47, 36);
  context.stroke();
  context.beginPath();
  context.moveTo(18, 36);
  context.lineTo(48, 47);
  context.stroke();

  context.fillStyle = "#e9432f";
  context.beginPath();
  context.moveTo(32, 43);
  context.bezierCurveTo(17, 34, 26, 18, 32, 10);
  context.bezierCurveTo(43, 22, 48, 34, 32, 43);
  context.fill();

  context.fillStyle = "#ff9a32";
  context.beginPath();
  context.moveTo(32, 43);
  context.bezierCurveTo(24, 35, 30, 24, 35, 17);
  context.bezierCurveTo(42, 29, 42, 37, 32, 43);
  context.fill();

  context.fillStyle = "#ffe06d";
  context.beginPath();
  context.moveTo(31, 42);
  context.bezierCurveTo(27, 35, 31, 30, 34, 25);
  context.bezierCurveTo(38, 34, 37, 39, 31, 42);
  context.fill();

  return canvas;
}

function createPokemonCenterPcCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 72;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(27, 24, 25, 0.28)";
  context.beginPath();
  context.ellipse(37, 63, 24, 5, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#b9c3cd";
  context.fillRect(18, 16, 36, 31);
  context.fillStyle = "#7f8995";
  context.fillRect(14, 44, 44, 10);
  context.fillRect(25, 53, 22, 6);

  context.fillStyle = "#213448";
  context.fillRect(22, 20, 28, 19);
  context.fillStyle = "#7be2ff";
  context.fillRect(25, 23, 22, 13);
  context.fillStyle = "#eafcff";
  context.fillRect(29, 26, 10, 3);
  context.fillRect(29, 31, 15, 3);

  context.strokeStyle = "#4f5966";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(17, 18);
  context.lineTo(28, 29);
  context.lineTo(22, 41);
  context.stroke();

  context.fillStyle = "#d84b5d";
  context.fillRect(51, 26, 5, 5);
  context.fillStyle = "#ffd166";
  context.fillRect(51, 35, 5, 5);

  return canvas;
}

function createChallengeBoulderCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 72;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(24, 27, 28, 0.28)";
  context.beginPath();
  context.ellipse(42, 62, 28, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#6f7a82";
  context.beginPath();
  context.moveTo(14, 54);
  context.lineTo(23, 24);
  context.lineTo(41, 10);
  context.lineTo(60, 21);
  context.lineTo(70, 50);
  context.lineTo(52, 61);
  context.lineTo(26, 60);
  context.closePath();
  context.fill();

  context.fillStyle = "#8d98a1";
  context.beginPath();
  context.moveTo(24, 25);
  context.lineTo(42, 12);
  context.lineTo(55, 23);
  context.lineTo(40, 32);
  context.closePath();
  context.fill();

  context.fillStyle = "#515c64";
  context.beginPath();
  context.moveTo(15, 54);
  context.lineTo(28, 40);
  context.lineTo(38, 60);
  context.closePath();
  context.fill();

  context.fillStyle = "#9ea8ae";
  context.fillRect(36, 21, 10, 4);
  context.fillRect(49, 35, 8, 4);

  return canvas;
}

function createTimburrCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 72;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(30, 24, 20, 0.26)";
  context.beginPath();
  context.ellipse(37, 63, 21, 5, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#7a5132";
  context.save();
  context.translate(36, 39);
  context.rotate(-0.22);
  context.fillRect(-24, -5, 48, 10);
  context.fillStyle = "#b57a47";
  context.fillRect(-18, -4, 28, 4);
  context.restore();

  context.fillStyle = "#b9784b";
  context.fillRect(25, 34, 22, 22);
  context.fillStyle = "#d49a62";
  context.fillRect(22, 18, 28, 24);
  context.fillStyle = "#2c2420";
  context.fillRect(29, 28, 4, 5);
  context.fillRect(40, 28, 4, 5);
  context.fillRect(32, 37, 10, 3);

  context.fillStyle = "#945c3c";
  context.fillRect(18, 39, 7, 16);
  context.fillRect(47, 39, 7, 16);
  context.fillRect(27, 54, 7, 10);
  context.fillRect(40, 54, 7, 10);

  return canvas;
}

function createLeafDenKitCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 64;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(30, 24, 15, 0.24)";
  context.beginPath();
  context.ellipse(40, 54, 30, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#7a5132";
  context.fillRect(22, 36, 36, 12);
  context.fillStyle = "#a56b3e";
  context.fillRect(18, 29, 44, 10);
  context.fillStyle = "#6fbf62";
  context.beginPath();
  context.moveTo(20, 29);
  context.quadraticCurveTo(38, 12, 60, 29);
  context.lineTo(54, 35);
  context.quadraticCurveTo(39, 25, 25, 35);
  context.closePath();
  context.fill();

  context.fillStyle = "#d8c28b";
  context.fillRect(28, 39, 7, 12);
  context.fillRect(45, 39, 7, 12);
  context.fillStyle = "#446d38";
  context.fillRect(32, 23, 5, 4);
  context.fillRect(43, 21, 6, 4);

  return canvas;
}

function createLeafDenCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 76;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(25, 22, 16, 0.26)";
  context.beginPath();
  context.ellipse(48, 64, 36, 7, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#765039";
  context.fillRect(24, 36, 48, 25);
  context.fillStyle = "#9b6845";
  context.fillRect(28, 40, 40, 20);
  context.fillStyle = "#3c2619";
  context.fillRect(43, 46, 10, 15);

  context.fillStyle = "#5cad54";
  context.beginPath();
  context.moveTo(17, 38);
  context.quadraticCurveTo(45, 5, 79, 38);
  context.lineTo(70, 45);
  context.quadraticCurveTo(48, 29, 26, 45);
  context.closePath();
  context.fill();

  context.fillStyle = "#82d46d";
  context.beginPath();
  context.moveTo(25, 34);
  context.quadraticCurveTo(45, 15, 68, 34);
  context.lineTo(60, 38);
  context.quadraticCurveTo(47, 29, 34, 38);
  context.closePath();
  context.fill();

  context.fillStyle = "#e2d39b";
  context.fillRect(31, 44, 7, 10);
  context.fillRect(58, 44, 7, 10);

  return canvas;
}

function createDittoFlagCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 72;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(36, 22, 38, 0.22)";
  context.beginPath();
  context.ellipse(24, 66, 15, 4, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#6f4c37";
  context.fillRect(20, 16, 5, 48);
  context.fillStyle = "#4a3023";
  context.fillRect(22, 16, 2, 48);

  context.fillStyle = "#d98bd8";
  context.beginPath();
  context.moveTo(24, 17);
  context.lineTo(43, 22);
  context.lineTo(40, 42);
  context.lineTo(24, 38);
  context.closePath();
  context.fill();

  context.fillStyle = "#f2c1ee";
  context.beginPath();
  context.arc(32, 29, 6, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#6d4a78";
  context.fillRect(29, 28, 2, 2);
  context.fillRect(34, 28, 2, 2);
  context.fillRect(31, 34, 4, 2);

  context.fillStyle = "#c370c8";
  context.fillRect(24, 17, 3, 21);

  return canvas;
}

export function buildSessionResources(session, assets, { worldTextureFactory }) {
  const { characterFactory, woodImage, skyImage } = assets;
  const characterAssets = characterFactory.getSharedAssets();

  session.characterTextures = {
    walk: worldTextureFactory.fromCanvas(characterAssets.walk.canvas),
    idle: worldTextureFactory.fromCanvas(characterAssets.idle.canvas)
  };

  session.markerTextures = worldTextureFactory.buildMarkerTextureMap(
    ITEM_DEFS,
    WORLD_MARKER_STYLES
  );

  session.woodTexture = worldTextureFactory.fromImage(woodImage);
  session.leppaBerryTexture = worldTextureFactory.fromCanvas(createLeppaBerryCanvas());
  session.logChairTexture = worldTextureFactory.fromCanvas(createLogChairCanvas());
  session.strawBedTexture = worldTextureFactory.fromCanvas(createStrawBedCanvas());
  session.campfireTexture = worldTextureFactory.fromCanvas(createCampfireCanvas());
  session.leafDenKitTexture = worldTextureFactory.fromCanvas(createLeafDenKitCanvas());
  session.leafDenTexture = worldTextureFactory.fromCanvas(createLeafDenCanvas());
  session.dittoFlagTexture = worldTextureFactory.fromCanvas(createDittoFlagCanvas());
  session.pokemonCenterPcTexture = worldTextureFactory.fromCanvas(createPokemonCenterPcCanvas());
  session.challengeBoulderTexture = worldTextureFactory.fromCanvas(createChallengeBoulderCanvas());
  session.timburrTexture = worldTextureFactory.fromCanvas(createTimburrCanvas());
  session.skyTexture = skyImage ?
    worldTextureFactory.fromImage(skyImage, { filter: worldTextureFactory.LINEAR }) :
    null;
  session.playerDustTexture = worldTextureFactory.fromCanvas(createPlayerDustCanvas());
  session.playerDust = createPlayerDustState();
  session.gameplayOpeningShipTexture = worldTextureFactory.createOpeningShipTexture();
  session.gameplayOpeningShipSmokeTexture = worldTextureFactory.fromCanvas(createShipSmokeCanvas());
  session.gameplayOpeningShipFlashTexture = worldTextureFactory.fromCanvas(createShipImpactFlashCanvas());
  session.gameplayOpeningShip = {
    visible: false,
    position: null,
    size: null,
    dust: [],
    flash: null,
    smoke: []
  };
  session.natureRevivalSparkTexture = worldTextureFactory.fromCanvas(createNatureRevivalSparkCanvas());
  session.squirtleWaterSprayTexture = worldTextureFactory.fromCanvas(createSquirtleWaterSprayCanvas());
  session.squirtleWaterGunQueue = [];
  session.natureRevivalEffects = createNatureRevivalEffectState();
  session.colliderGizmoTextures = createColliderGizmoTextures(worldTextureFactory);
  session.bulbasaurTexture = worldTextureFactory.createBulbasaurTexture();
  session.charmanderTexture = worldTextureFactory.createCharmanderTexture();

  session.deadGrassTexture = worldTextureFactory.createGroundGrassTexture();
  session.greenGrassTexture = worldTextureFactory.createGroundGrassTexture({
    revived: true
  });

  session.deadFlowerTexture = worldTextureFactory.createGroundFlowerTexture();
  session.greenFlowerTexture = worldTextureFactory.createGroundFlowerTexture({
    revived: true
  });

  session.pokedexCacheTexture = worldTextureFactory.createPokedexCacheTexture();
  session.repairPlantBrokenTexture = worldTextureFactory.createRepairPlantTexture();
  session.repairPlantFixedTexture = worldTextureFactory.createRepairPlantTexture({
    fixed: true
  });

  session.actTwoSquirtle = {
    position: [...ACT_TWO_SQUIRTLE_POSITION],
    recovered: false,
    modelInstance: {
      offset: [...ACT_TWO_SQUIRTLE_POSITION],
      scale: 0.5,
      yaw: 0,
      active: false
    }
  };

  session.bulbasaurEncounter = {
    texture: session.bulbasaurTexture,
    size: ACT_TWO_BULBASAUR_SIZE,
    visible: false,
    jumpTimer: 0,
    jumpDuration: 0.9,
    originPosition: null,
    landingPosition: null,
    position: null
  };

  session.charmanderEncounter = {
    texture: session.charmanderTexture,
    size: ACT_TWO_CHARMANDER_SIZE,
    visible: false,
    position: null,
    targetPosition: null,
    litCampfire: false
  };

  session.timburrEncounter = {
    texture: session.timburrTexture,
    size: [0.96, 0.96],
    visible: false,
    position: null
  };

  session.actTwoPokedexCache = {
    texture: session.pokedexCacheTexture,
    position: [...ACT_TWO_POKEDEX_CACHE_POSITION],
    size: ACT_TWO_POKEDEX_CACHE_SIZE
  };

  session.actTwoRepairPlant = {
    position: [...ACT_TWO_REPAIR_PLANT_POSITION],
    size: ACT_TWO_REPAIR_PLANT_SIZE,
    fixed: false
  };

  session.pokemonCenterPc = {
    texture: session.pokemonCenterPcTexture,
    position: [...POKEMON_CENTER_PC_POSITION],
    size: [1.12, 1.12]
  };

  session.challengeBoulder = {
    texture: session.challengeBoulderTexture,
    position: [...BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION],
    size: [1.82, 1.42]
  };
}
