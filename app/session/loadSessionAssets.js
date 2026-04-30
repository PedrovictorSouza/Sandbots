import { loadCharacterAssets } from "./assets/loadCharacterAssets.js";
import { loadPropAssets } from "./assets/loadPropAssets.js";
import { loadTerrainAssets } from "./assets/loadTerrainAssets.js";

export async function loadSessionAssets({ gl, setStatus }) {
  setStatus("Carregando assets...");

  const [
    terrainAssets,
    characterAssets,
    propAssets
  ] = await Promise.all([
    loadTerrainAssets({ gl, setStatus }),
    loadCharacterAssets({ gl, setStatus }),
    loadPropAssets({ gl, setStatus })
  ]);

  return {
    ...terrainAssets,
    ...characterAssets,
    ...propAssets
  };
}
