import {
  ITEM_DEFS,
  WORLD_MARKER_STYLES
} from "../../gameplayContent.js";
import {
  ACT_TWO_SQUIRTLE_POSITION,
  ACT_TWO_BULBASAUR_SIZE,
  ACT_TWO_POKEDEX_CACHE_POSITION,
  ACT_TWO_POKEDEX_CACHE_SIZE,
  ACT_TWO_REPAIR_PLANT_POSITION,
  ACT_TWO_REPAIR_PLANT_SIZE,
  ACT_TWO_SQUIRTLE_SIZE
} from "../../rendering/worldAssets.js";
import { createPlayerDustState } from "./playerDustParticles.js";
import { createNatureRevivalEffectState } from "./natureRevivalEffects.js";

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

export function buildSessionResources(session, assets, { worldTextureFactory }) {
  const { characterFactory, woodImage } = assets;
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
  session.playerDustTexture = worldTextureFactory.fromCanvas(createPlayerDustCanvas());
  session.playerDust = createPlayerDustState();
  session.natureRevivalSparkTexture = worldTextureFactory.fromCanvas(createNatureRevivalSparkCanvas());
  session.natureRevivalEffects = createNatureRevivalEffectState();
  session.squirtleTexture = worldTextureFactory.createSquirtleTexture();
  session.bulbasaurTexture = worldTextureFactory.createBulbasaurTexture();
  session.squirtleRecoveredTexture = worldTextureFactory.createSquirtleTexture({
    recovered: true
  });

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
    texture: session.squirtleTexture,
    position: [...ACT_TWO_SQUIRTLE_POSITION],
    size: ACT_TWO_SQUIRTLE_SIZE
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
}
