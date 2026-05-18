const MATERIAL_IDS = [
  "wood",
  "leaves",
  "carbon",
  "flaxFiber",
  "granite",
  "woolYarn",
  "silkYarn",
  "nitrogen",
  "phosphorus",
  "potassium",
] as const;

export type MaterialId = typeof MATERIAL_IDS[number];

export type MaterialDef = {
  id: MaterialId;
  label: string;
  bagLabel: string;
};

export const MATERIAL_DEFS = {
  wood: {
    id: "wood",
    label: "Wood",
    bagLabel: "Sturdy stick",
  },
  leaves: {
    id: "leaves",
    label: "Leaves",
    bagLabel: "Leaves",
  },
  carbon: {
    id: "carbon",
    label: "Carbon",
    bagLabel: "Carbon ore",
  },
  nitrogen: {
    id: "nitrogen",
    label: "Nitrogen",
    bagLabel: "Nitrogen ore",
  },
  phosphorus: {
    id: "phosphorus",
    label: "Phosphorus",
    bagLabel: "Phosphorus ore",
  },
  potassium: {
    id: "potassium",
    label: "Potassium",
    bagLabel: "Potassium ore",
  },
  flaxFiber: {
    id: "flaxFiber",
    label: "Flax Fiber",
    bagLabel: "Flax fiber",
  },
  granite: {
    id: "granite",
    label: "Granite",
    bagLabel: "Stone",
  },
  woolYarn: {
    id: "woolYarn",
    label: "Wool Yarn",
    bagLabel: "Wool yarn",
  },
  silkYarn: {
    id: "silkYarn",
    label: "Silk Yarn",
    bagLabel: "Silk yarn",
  },
} satisfies Record<MaterialId, MaterialDef>;

export { MATERIAL_IDS };
