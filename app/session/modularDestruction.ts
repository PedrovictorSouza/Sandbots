export type Vector3 = [number, number, number];

export type ModularDestructionPartDef = {
  id: string;
  primitiveIndex: number;
  offset: Vector3;
  yaw: number;
  pitch?: number;
  roll?: number;
  scale?: number;
  brightness?: number;
};

export type PrimitiveModel = {
  primitives?: unknown[];
  [key: string]: unknown;
};

export type RenderInstance = {
  offset?: Vector3;
  scale?: number;
  yaw?: number;
  pitch?: number;
  roll?: number;
  active?: boolean;
  [key: string]: unknown;
};

export type ModularDestructionSceneObject = {
  model: PrimitiveModel;
  instances: RenderInstance[];
  brightness?: number;
};

export type ModularDestructionSceneOptions = {
  model: PrimitiveModel | null | undefined;
  rootInstance: RenderInstance;
  active: boolean;
  parts: readonly ModularDestructionPartDef[];
  rootBrightness?: number;
  partBrightness?: number;
};

function createPrimitiveModel(
  model: PrimitiveModel,
  primitives: unknown[]
): PrimitiveModel {
  return {
    ...model,
    primitives
  };
}

function getRootOffset(rootInstance: RenderInstance): Vector3 {
  return Array.isArray(rootInstance.offset) ?
    rootInstance.offset :
    [0, 0, 0];
}

function createDetachedPartInstance(
  rootInstance: RenderInstance,
  part: ModularDestructionPartDef
): RenderInstance {
  const rootOffset = getRootOffset(rootInstance);

  return {
    offset: [
      rootOffset[0] + part.offset[0],
      rootOffset[1] + part.offset[1],
      rootOffset[2] + part.offset[2]
    ],
    scale: part.scale ?? rootInstance.scale ?? 1,
    yaw: part.yaw,
    pitch: part.pitch ?? 0,
    roll: part.roll ?? 0,
    active: true
  };
}

export function getModularDestructionSceneObjects({
  model,
  rootInstance,
  active,
  parts,
  rootBrightness = 1,
  partBrightness = 1
}: ModularDestructionSceneOptions): ModularDestructionSceneObject[] {
  const primitives = model?.primitives || [];

  if (!model || !primitives.length || !active) {
    return [
      {
        model: model || { primitives: [] },
        instances: [rootInstance],
        brightness: rootBrightness
      }
    ];
  }

  const detachedPrimitiveIndices = new Set(parts.map((part) => part.primitiveIndex));
  const bodyPrimitives = primitives.filter((primitive, index) => {
    return primitive && !detachedPrimitiveIndices.has(index);
  });
  const sceneObjects: ModularDestructionSceneObject[] = [];

  if (bodyPrimitives.length) {
    sceneObjects.push({
      model: createPrimitiveModel(model, bodyPrimitives),
      instances: [rootInstance],
      brightness: rootBrightness
    });
  }

  for (const part of parts) {
    const primitive = primitives[part.primitiveIndex];

    if (!primitive) {
      continue;
    }

    sceneObjects.push({
      model: createPrimitiveModel(model, [primitive]),
      instances: [createDetachedPartInstance(rootInstance, part)],
      brightness: part.brightness ?? partBrightness
    });
  }

  return sceneObjects;
}
