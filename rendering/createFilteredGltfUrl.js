function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isValidIndex(value) {
  return Number.isInteger(value) && value >= 0;
}

function toSet(values) {
  return Array.isArray(values) ? new Set(values) : null;
}

function nodeNameMatches(node, nameSet) {
  return Boolean(nameSet && node?.name && nameSet.has(node.name));
}

export function resolveFilteredSceneNodeIndices(gltf, {
  includeNodes = null,
  excludeNodes = [],
  includeNodeNames = null,
  excludeNodeNames = []
} = {}) {
  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes?.[sceneIndex];

  if (!scene || !Array.isArray(scene.nodes)) {
    throw new Error("GLTF sem scene.nodes válido.");
  }

  const includeNodeSet = toSet(includeNodes);
  const includeNameSet = toSet(includeNodeNames);
  const excludeNodeSet = toSet(excludeNodes);
  const excludeNameSet = toSet(excludeNodeNames);
  const hasIncludeFilter = Boolean(includeNodeSet || includeNameSet);

  return scene.nodes.filter((nodeIndex) => {
    const node = gltf.nodes?.[nodeIndex];
    const included =
      !hasIncludeFilter ||
      includeNodeSet?.has(nodeIndex) ||
      nodeNameMatches(node, includeNameSet);
    const excluded =
      excludeNodeSet?.has(nodeIndex) ||
      nodeNameMatches(node, excludeNameSet);

    return included && !excluded;
  });
}

export async function createFilteredGltfUrl(gltfPath, {
  includeNodes = null,
  excludeNodes = [],
  includeNodeNames = null,
  excludeNodeNames = []
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

  const selectedNodeIndices = resolveFilteredSceneNodeIndices(gltf, {
    includeNodes,
    excludeNodes,
    includeNodeNames,
    excludeNodeNames
  });

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
    selectedMeshIndices,
    includeNodeNames,
    excludeNodeNames
  });

  const blob = new Blob([JSON.stringify(gltf)], {
    type: "model/gltf+json"
  });

  return URL.createObjectURL(blob);
}
