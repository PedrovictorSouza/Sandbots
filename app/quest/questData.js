import { THERMAL_GENERATOR_POKEDEX_ENTRY_ID } from "../../pokedexEntries.js";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "../story/sandbotsLexicon.js";

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
    title: `Wake up ${SANDBOTS_BOT_NAMES.hydro}`,
    description: `${SANDBOTS_BOT_NAMES.hydro} is dormant near the starter grove. The colony cannot circulate water until this bot is back online.`,
    guidance: `Follow ${SANDBOTS_BOT_NAMES.scout}'s marker to ${SANDBOTS_BOT_NAMES.hydro}, then interact when the prompt appears.`,
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    objectives: [
      {
        type: QUEST_EVENT.UNLOCK,
        targetId: "waterGun",
        required: 1,
        current: 0,
        hiddenFromHud: true,
        acceptsRememberedProgress: true
      }
    ],
    rewards: {
      unlocks: ["thermal-generator-diagnostic", "basic-crafting-note", "water-restoration"],
      items: []
    },
    errandQuest: {
      hook: {
        short: `${SANDBOTS_BOT_NAMES.hydro} is offline at the dry edge of the grove.`,
        setup: `${SANDBOTS_BOT_NAMES.scout} hears a weak wake pulse from ${SANDBOTS_BOT_NAMES.hydro}. If the pulse is real, water circulation can start again.`
      },
      hudText: `Wake up ${SANDBOTS_BOT_NAMES.hydro}`,
      approachChoices: [
        {
          id: "follow-marker",
          label: "Follow the signal marker",
          tradeoff: `Direct and readable. ${SANDBOTS_BOT_NAMES.scout} keeps the route short.`
        },
        {
          id: "sweep-dry-edge",
          label: "Sweep the dry edge first",
          tradeoff: `Slower, but the ${SANDBOTS_WORLD_TERMS.codex} can reveal nearby restoration clues before the wake pulse.`
        }
      ],
      microEvents: [
        {
          id: "first-hydro-ping",
          progressAt: 1,
          trigger: "hydro-wake-started",
          feedback: `${SANDBOTS_WORLD_TERMS.codex}: wake pulse confirmed. ${SANDBOTS_BOT_NAMES.hydro}'s water core is responding.`
        },
        {
          id: "hydro-tool-online",
          progressAt: 1,
          trigger: "hydro-tool-unlocked",
          feedback: `${SANDBOTS_BOT_NAMES.scout}: good. The island can be watered one patch at a time now. Grim, but measurable.`
        }
      ],
      fastResolution: {
        type: "radio-completion",
        description: `${SANDBOTS_BOT_NAMES.scout} confirms ${SANDBOTS_BOT_NAMES.hydro}'s wake sequence by radio, so the task resolves immediately when the tool comes online.`
      },
      visibleReward: {
        type: "base-function",
        description: `${SANDBOTS_BOT_NAMES.hydro} comes online and unlocks ${SANDBOTS_ITEM_NAMES.hydroTool} for the first restoration route.`,
        pokedeskEntryId: THERMAL_GENERATOR_POKEDEX_ENTRY_ID,
        pokedeskEntryLabel: "Hydro Wake Diagnostic"
      },
      nextHook: `If water can move again, the dry tall grass may show where the colony can safely expand.`
    },
    nextQuestId: "water-dry-grass"
  },
  {
    id: "shape-a-living-patch",
    title: "Shape a Living Patch",
    description: "Use the island's tools to build one small restored patch.",
    guidance: "Look for dry ground nearby and use the available field action when the prompt appears.",
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    detached: true,
    detachedReason: "Legacy tutorial branch kept for old saves while the main route uses Wake Up Hydro.",
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
    guidance: `Open the ${SANDBOTS_WORLD_TERMS.codex}/memory prompt after the tutorial moment completes.`,
    giverId: "chopper",
    status: QUEST_STATUS.LOCKED,
    detached: true,
    detachedReason: "Legacy tutorial branch kept for old saves while the main route uses Wake Up Hydro.",
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
    detached: true,
    detachedReason: "Legacy ability-unlock quest kept for old saves; the main route completes Wake Up Hydro when Hydro Jet is received.",
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
    description: `Use ${SANDBOTS_ITEM_NAMES.hydroTool} to revive 10 patches of dry tall grass.`,
    guidance: `Stand near dry grass or dry ground and press Enter to use ${SANDBOTS_ITEM_NAMES.hydroTool}.`,
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
    title: `Talk to ${SANDBOTS_BOT_NAMES.grow}`,
    description: `Return to ${SANDBOTS_BOT_NAMES.grow} after watering the dry tall grass and complete the request.`,
    guidance: `Stand close to ${SANDBOTS_BOT_NAMES.grow}, then press E to talk and learn ${SANDBOTS_ITEM_NAMES.growTool}.`,
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
    title: `Plant ${SANDBOTS_ITEM_NAMES.growTool} for ${SANDBOTS_BOT_NAMES.grow}`,
    description: `Use ${SANDBOTS_ITEM_NAMES.growTool} once on restored ground to start a new green corner for ${SANDBOTS_BOT_NAMES.grow}.`,
    guidance: `Switch to ${SANDBOTS_ITEM_NAMES.growTool}, choose restored ground near the helper habitat, then press Enter. Keep growing more if you want to shape the full corner.`,
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
