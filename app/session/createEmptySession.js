import { INTERACTABLE_DEFS } from "../../gameplayContent.js";
import { createResourceNodes } from "../../world/islandWorld.js";

export function createEmptySession() {
  return {
    bulbasaurEncounter: null,
    bulbasaurTexture: null,
    actTwoPokedexCache: null,
    actTwoRepairPlant: null,
    actTwoSquirtle: null,
    characterTextures: {},
    chopperNpcActor: null,
    deadFlowerTexture: null,
    deadGrassTexture: null,
    elevatedTerrainColliders: [],
    elevatedTerrainInstances: [],
    greenFlowerTexture: null,
    greenGrassTexture: null,
    groundDeadInstances: [],
    groundFlowerPatches: [],
    groundGrassPatches: [],
    groundPurifiedInstances: [],
    interactables: INTERACTABLE_DEFS.map((interactable) => ({ ...interactable })),
    markerTextures: {},
    natureRevivalEffects: null,
    natureRevivalSparkTexture: null,
    npcActors: [],
    palmInstances: [],
    palmModel: null,
    playerCharacter: null,
    playerDust: null,
    playerDustTexture: null,
    pokedexCacheTexture: null,
    repairPlantBrokenTexture: null,
    repairPlantFixedTexture: null,
    resourceNodes: createResourceNodes(),
    sceneObjects: [],
    spawnActTwoPlayer: () => {},
    squirtleRecoveredTexture: null,
    squirtleTexture: null,
    woodDrops: [],
    woodTexture: null
  };
}
