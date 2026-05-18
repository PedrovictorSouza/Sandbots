export const CRAFTED_ITEM_IDS = [
  "campfire",
  "strawBed",
  "bridgeKit",
  "marshPie",
  "granitePickaxe",
  "burrowRepairKit",
  "leafDenKit",
] as const;

export type CraftedItemId = typeof CRAFTED_ITEM_IDS[number];

export type CraftedItemDef = {
  id: CraftedItemId;
  label: string;
  bagLabel: string;
};

export const CRAFTED_ITEM_DEFS = {
  campfire: {
    id: "campfire",
    label: "Thermal Cabin",
    bagLabel: "Thermal Cabin",
  },
  strawBed: {
    id: "strawBed",
    label: "Solar Station",
    bagLabel: "Solar Station",
  },
  bridgeKit: {
    id: "bridgeKit",
    label: "Bridge Repair Kit",
    bagLabel: "Bridge kit",
  },
  marshPie: {
    id: "marshPie",
    label: "Marsh Ration",
    bagLabel: "Marsh ration",
  },
  granitePickaxe: {
    id: "granitePickaxe",
    label: "Granite Pickaxe",
    bagLabel: "Granite pickaxe",
  },
  burrowRepairKit: {
    id: "burrowRepairKit",
    label: "Hub Repair Kit",
    bagLabel: "Hub repair kit",
  },
  leafDenKit: {
    id: "leafDenKit",
    label: "House Kit",
    bagLabel: "House kit",
  },
} satisfies Record<CraftedItemId, CraftedItemDef>;
