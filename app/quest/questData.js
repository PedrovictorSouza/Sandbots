export const QUEST_EVENT = Object.freeze({
  MOVE: "MOVE",
  TALK: "TALK",
  COLLECT: "COLLECT",
  PLACE: "PLACE",
  BUILD: "BUILD",
  PHOTO: "PHOTO",
  UNLOCK: "UNLOCK"
});

export const QUEST_STATUS = Object.freeze({
  LOCKED: "locked",
  AVAILABLE: "available",
  ACTIVE: "active",
  COMPLETED: "completed"
});

export const SMALL_ISLAND_QUESTS = Object.freeze([
  {
    id: "learn-to-move",
    title: "Take Your First Steps",
    description: "Move around and get your bearings before talking to anyone.",
    guidance: "Use WASD or the left stick. When your character moves, the next task appears.",
    giverId: "chopper",
    status: QUEST_STATUS.ACTIVE,
    objectives: [
      { type: QUEST_EVENT.MOVE, targetId: "player", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["basic-movement"],
      items: []
    },
    nextQuestId: "wake-guide"
  },
  {
    id: "wake-guide",
    title: "Talk to Chopper",
    description: "Talk to Chopper so he can explain what happened and where to go next.",
    guidance: "Follow Chopper's marker, stand close, then press E to talk.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.TALK, targetId: "tangrowth", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["ash-trail"],
      items: []
    },
    nextQuestId: "gather-first-supplies"
  },
  {
    id: "gather-first-supplies",
    title: "Gather First Supplies",
    description: "Collect simple wood so Chopper can test your field rhythm.",
    guidance: "Walk near a tree or wood drop. Press Enter when the action prompt appears.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.COLLECT, targetId: "wood", required: 3, current: 0 }
    ],
    rewards: {
      unlocks: ["basic-crafting-note"],
      items: []
    },
    nextQuestId: "shape-a-living-patch"
  },
  {
    id: "shape-a-living-patch",
    title: "Shape a Living Patch",
    description: "Use the island's tools to build one small restored patch.",
    guidance: "Look for dry ground nearby and use the available field action when the prompt appears.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.BUILD, targetId: "revived-habitat", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["habitat-notes"],
      items: []
    },
    nextQuestId: "record-a-memory"
  },
  {
    id: "record-a-memory",
    title: "Record a Memory",
    description: "Register one memory photo with the field camera.",
    guidance: "Open the Pokedex/memory prompt after the tutorial moment completes.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.PHOTO, targetId: "first-memory", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["memory-log"],
      items: []
    },
    nextQuestId: "open-the-water-route"
  },
  {
    id: "open-the-water-route",
    title: "Open the Water Route",
    description: "Unlock a world action that can restore dry ground and reveal new habitat clues.",
    guidance: "Finish the helper conversation. The learned action will be confirmed on screen.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.UNLOCK, targetId: "waterGun", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["water-restoration"],
      items: []
    },
    nextQuestId: "water-dry-grass"
  },
  {
    id: "water-dry-grass",
    title: "Water dry grass!",
    description: "Use Water Gun to revive 10 patches of dry tall grass.",
    guidance: "Stand near dry grass or dry ground and press Enter to use Water Gun.",
    giverId: "leaf-helper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.BUILD, targetId: "revived-grass", required: 10, current: 0 }
    ],
    rewards: {
      unlocks: ["dry-grass-request-complete"],
      items: []
    },
    nextQuestId: "inspect-rustling-grass"
  },
  {
    id: "inspect-rustling-grass",
    title: "Talk to Bulbasaur",
    description: "Return to Bulbasaur after watering the dry tall grass and complete the request.",
    guidance: "Stand close to Bulbasaur, then press E to talk and learn Leafage.",
    giverId: "leaf-helper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.TALK, targetId: "leaf-helper", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["leafage"],
      items: []
    },
    nextQuestId: "grow-a-home-patch"
  },
  {
    id: "grow-a-home-patch",
    title: "Plant Leafage for Bulbasaur",
    description: "Use Leafage once on restored ground to start a new green corner for Bulbasaur.",
    guidance: "Switch to Leafage, choose restored ground near the helper habitat, then press Enter. Keep growing more if you want to shape the full corner.",
    giverId: "leaf-helper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.PLACE, targetId: "leafy-home-patch", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["first-helper-home"],
      items: []
    },
    nextQuestId: "chopper-first-habitat-report"
  },
  {
    id: "chopper-first-habitat-report",
    title: "Tell Chopper",
    description: "Return to Chopper and tell him the first habitat is taking root.",
    guidance: "Follow Chopper's marker, stand close, then press E to report back.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      { type: QUEST_EVENT.TALK, targetId: "chopper-first-habitat-report", required: 1, current: 0 }
    ],
    rewards: {
      unlocks: ["first-habitat-path"],
      items: []
    },
    nextQuestId: null
  }
]);
