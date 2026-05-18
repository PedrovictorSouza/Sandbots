import { AUTOSAVE_EVENT } from "../runtime/autosaveRuntime.js";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "./sandbotsLexicon.js";

export const SHORT_EXPEDITION_RETURN_AID = Object.freeze({
  RADIO_COMPLETION: "radio-completion",
  LANDMARK_RETURN: "landmark-return",
  BOT_ASSIST: "bot-assist"
});

export const SHORT_EXPEDITION_DISCOVERY_KIND = Object.freeze({
  ROUTE_CLUE: "route-clue",
  RESOURCE_CLUE: "resource-clue",
  BOT_SIGNAL: "bot-signal"
});

const FORBIDDEN_MINECRAFT_LENS_TERMS = Object.freeze([
  "hunger",
  "hostile mob",
  "mining layer",
  "torch"
]);

function freezeDiscovery(discovery) {
  return Object.freeze({ ...discovery });
}

function freezeExpedition(expedition) {
  return Object.freeze({
    ...expedition,
    discoveries: Object.freeze(expedition.discoveries.map(freezeDiscovery)),
    returnAid: Object.freeze({ ...expedition.returnAid }),
    reward: Object.freeze({ ...expedition.reward })
  });
}

export const SHORT_EXPEDITIONS = Object.freeze([
  freezeExpedition({
    id: "water-route-scout",
    title: "Scout the Water Route",
    startLandmarkId: "colony-cache",
    startsFromBase: true,
    requiredReadiness: [
      SANDBOTS_ITEM_NAMES.hydroTool,
      "Colony Cache has at least one protected supply."
    ],
    hook:
      `${SANDBOTS_WORLD_TERMS.terminal} can see a broken water route, but not where the soil still holds.`,
    discoveries: [
      {
        id: "dry-channel-edge",
        kind: SHORT_EXPEDITION_DISCOVERY_KIND.ROUTE_CLUE,
        label: "Dry channel edge",
        payoff: `${SANDBOTS_BOT_NAMES.hydro} can mark the first safe restoration line.`
      },
      {
        id: "pulse-tree-supply",
        kind: SHORT_EXPEDITION_DISCOVERY_KIND.RESOURCE_CLUE,
        label: "Pulse Tree supply",
        payoff: "The living tree becomes a repeatable orientation and supply clue."
      }
    ],
    returnAid: {
      type: SHORT_EXPEDITION_RETURN_AID.RADIO_COMPLETION,
      label: `${SANDBOTS_BOT_NAMES.scout} radio check`,
      description:
        `${SANDBOTS_BOT_NAMES.scout} confirms the route by radio so the player does not walk back through an empty path.`
    },
    reward: {
      visibleWorldChange: "Water route clue marked near the base.",
      unlockHint: "Next restoration target becomes easier to read from the Colony Cache route.",
      autosaveType: AUTOSAVE_EVENT.TASK_COMPLETED
    }
  })
]);

export function listShortExpeditions() {
  return SHORT_EXPEDITIONS;
}

export function getShortExpeditionById(expeditionId) {
  return SHORT_EXPEDITIONS.find((expedition) => expedition.id === expeditionId) || null;
}

export function validateShortExpedition(expedition) {
  const errors = [];

  if (!expedition?.id) errors.push({ type: "missing-id" });
  if (!expedition?.title) errors.push({ type: "missing-title", expeditionId: expedition?.id || null });
  if (!expedition?.startsFromBase) errors.push({ type: "missing-base-start", expeditionId: expedition?.id || null });
  if (!Array.isArray(expedition?.discoveries) || expedition.discoveries.length < 2) {
    errors.push({ type: "missing-two-discoveries", expeditionId: expedition?.id || null });
  }
  if (!expedition?.returnAid?.type) errors.push({ type: "missing-return-aid", expeditionId: expedition?.id || null });
  if (!expedition?.reward?.visibleWorldChange) {
    errors.push({ type: "missing-visible-world-change", expeditionId: expedition?.id || null });
  }
  if (!expedition?.reward?.autosaveType) {
    errors.push({ type: "missing-autosave", expeditionId: expedition?.id || null });
  }

  const searchableCopy = [
    expedition?.title,
    expedition?.hook,
    ...(expedition?.requiredReadiness || []),
    ...(expedition?.discoveries || []).flatMap((discovery) => [
      discovery?.label,
      discovery?.payoff
    ]),
    expedition?.returnAid?.label,
    expedition?.returnAid?.description,
    expedition?.reward?.visibleWorldChange,
    expedition?.reward?.unlockHint
  ].filter(Boolean).join("\n").toLowerCase();

  FORBIDDEN_MINECRAFT_LENS_TERMS.forEach((term) => {
    if (searchableCopy.includes(term)) {
      errors.push({
        type: "forbidden-source-mechanic",
        expeditionId: expedition?.id || null,
        term
      });
    }
  });

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}

export function validateShortExpeditions(expeditions = SHORT_EXPEDITIONS) {
  return Object.freeze(expeditions.flatMap(validateShortExpedition));
}
