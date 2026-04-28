export const MOVE_STATUS = Object.freeze({
  ACTIVE: "active",
  PARTIAL: "partial",
  PLANNED: "planned"
});

export const MOVE_CATEGORY = Object.freeze({
  REGULAR: "regular",
  TRANSFORMATION: "transformation"
});

export const SMALL_ISLAND_MOVES = Object.freeze([
  {
    id: "water-gun",
    label: "Water Gun",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.ACTIVE,
    learnedFromNpcId: "stranded-helper",
    unlockId: "waterGun",
    effects: ["restore-dry-plants", "restore-dry-terrain", "water-crops"],
    inputHint: "Hold X",
    notes: "Currently restores dry ground and revived plant patches."
  },
  {
    id: "leafage",
    label: "Leafage",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PARTIAL,
    learnedFromNpcId: "leaf-helper",
    unlockId: "leafage",
    effects: ["create-tall-grass", "create-leafy-home-patch"],
    inputHint: "TBD",
    notes: "Unlocked by the Water dry grass quest; final terrain behavior still needs implementation."
  },
  {
    id: "cut",
    label: "Cut",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "woodcutter-helper",
    effects: ["cut-grass", "cut-vines", "cut-wooden-objects", "gather-wood-materials"],
    inputHint: "TBD",
    notes: "Future material-gathering and route-opening move."
  },
  {
    id: "rock-smash",
    label: "Rock Smash",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "stone-helper",
    effects: ["break-rocks", "break-terrain-blocks", "gather-stone-materials"],
    inputHint: "TBD",
    notes: "Future move for caves, cliffs, and blocked paths."
  },
  {
    id: "rototiller",
    label: "Rototiller",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "field-helper",
    effects: ["till-soil", "prepare-crop-fields", "move-flower-beds", "move-crops"],
    inputHint: "TBD",
    notes: "Future farming and habitat-arrangement move."
  },
  {
    id: "jump",
    label: "Jump",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PARTIAL,
    learnedFromNpcId: "spring-helper",
    effects: ["traverse-ledges", "reach-low-platforms"],
    inputHint: "Space / B",
    notes: "Player can already jump; later this can become an explicit learned traversal move."
  },
  {
    id: "strength",
    label: "Strength",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "builder-helper",
    effects: ["push-heavy-objects", "pull-heavy-objects", "move-route-blockers"],
    inputHint: "TBD",
    notes: "Future push/pull move for boulders, machinery, and construction tasks."
  },
  {
    id: "suck",
    label: "Suck",
    category: MOVE_CATEGORY.REGULAR,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "mud-helper",
    effects: ["collect-liquid", "place-liquid", "create-water-source"],
    inputHint: "TBD",
    notes: "Future liquid relocation move for water, mud, and biome puzzles."
  },
  {
    id: "surf",
    label: "Surf",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "ferry-helper",
    effects: ["travel-across-water"],
    inputHint: "Contextual",
    notes: "Future water traversal transformation."
  },
  {
    id: "waterfall",
    label: "Waterfall",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "cascade-helper",
    effects: ["climb-waterfalls"],
    inputHint: "Contextual",
    notes: "Future vertical water traversal."
  },
  {
    id: "camouflage",
    label: "Camouflage",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "mimic-helper",
    effects: ["transform-into-nearby-object"],
    inputHint: "Contextual",
    notes: "Future stealth/puzzle transformation."
  },
  {
    id: "rollout",
    label: "Rollout",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "rolling-stone-helper",
    effects: ["move-faster", "cross-rough-ground"],
    inputHint: "Contextual",
    notes: "Future speed traversal transformation."
  },
  {
    id: "glide",
    label: "Glide",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "sky-helper",
    effects: ["glide-from-high-places"],
    inputHint: "Contextual",
    notes: "Future highland/skyland traversal."
  },
  {
    id: "magnet-rise",
    label: "Magnet Rise",
    category: MOVE_CATEGORY.TRANSFORMATION,
    status: MOVE_STATUS.PLANNED,
    learnedFromNpcId: "magnet-helper",
    effects: ["hover", "fly-over-terrain"],
    inputHint: "Contextual",
    notes: "Late/post-game traversal candidate."
  }
]);
