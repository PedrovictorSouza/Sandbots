function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidIndex(value) {
  return Number.isInteger(value) && value >= 0;
}

export async function createFilteredGltfUrl(gltfPath, {
  includeNodes = null,
  excludeNodes = []
} = {}) {
  const response = await fetch(gltfPath);

  if (!response.ok) {
    throw new Error(`Falha ao carregar GLTF: ${gltfPath}`);
  }

  const gltf = await response.json();
  const baseUrl = new URL(gltfPath, window.location.href);

  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes?.[sceneIndex];

  if (!scene || !Array.isArray(scene.nodes)) {
    throw new Error(`GLTF sem scene.nodes válido: ${gltfPath}`);
  }

  const originalSceneNodes = scene.nodes;

  const selectedNodeIndices = includeNodes
    ? originalSceneNodes.filter((nodeIndex) => includeNodes.includes(nodeIndex))
    : originalSceneNodes.filter((nodeIndex) => !excludeNodes.includes(nodeIndex));

  const selectedNodes = selectedNodeIndices
    .map((nodeIndex) => ({
      originalNodeIndex: nodeIndex,
      node: gltf.nodes?.[nodeIndex]
    }))
    .filter(({ node }) => node);

  const selectedMeshIndices = [
    ...new Set(
      selectedNodes
        .map(({ node }) => node.mesh)
        .filter(isValidIndex)
    )
  ];

  const meshIndexMap = new Map(
    selectedMeshIndices.map((meshIndex, nextIndex) => [meshIndex, nextIndex])
  );

  const nextNodes = selectedNodes.map(({ node }) => {
    const nextNode = cloneJson(node);

    if (isValidIndex(nextNode.mesh)) {
      nextNode.mesh = meshIndexMap.get(nextNode.mesh);
    }

    return nextNode;
  });

  const nextMeshes = selectedMeshIndices.map((meshIndex) => {
    const mesh = gltf.meshes?.[meshIndex];

    if (!mesh) {
      throw new Error(`Mesh ${meshIndex} não encontrado em ${gltfPath}`);
    }

    return cloneJson(mesh);
  });

  gltf.scene = 0;
  gltf.scenes = [
    {
      ...cloneJson(scene),
      nodes: nextNodes.map((_, index) => index)
    }
  ];
  gltf.nodes = nextNodes;
  gltf.meshes = nextMeshes;

  if (Array.isArray(gltf.buffers)) {
    gltf.buffers = gltf.buffers.map((buffer) => ({
      ...buffer,
      uri: buffer.uri ? new URL(buffer.uri, baseUrl).href : buffer.uri
    }));
  }

  if (Array.isArray(gltf.images)) {
    gltf.images = gltf.images.map((image) => ({
      ...image,
      uri: image.uri ? new URL(image.uri, baseUrl).href : image.uri
    }));
  }

  console.info("Filtered GLTF", {
    gltfPath,
    selectedNodeIndices,
    selectedMeshIndices
  });

  const blob = new Blob([JSON.stringify(gltf)], {
    type: "model/gltf+json"
  });

  return URL.createObjectURL(blob);
}