import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "./app/story/sandbotsLexicon.js";

export const SQUIRTLE_LEPPA_BERRY_REQUEST_ID = "squirtle-leppa-berry";
export const SQUIRTLE_LEAFAGE_REQUEST_ID = SQUIRTLE_LEPPA_BERRY_REQUEST_ID;
export const BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID = "boulder-shaded-tall-grass-challenge";
export const NEW_HABITAT_CHALLENGES_ID = "new-habitat-challenges";

export const POKEDEX_REQUESTS = Object.freeze({
  [SQUIRTLE_LEPPA_BERRY_REQUEST_ID]: {
    id: SQUIRTLE_LEPPA_BERRY_REQUEST_ID,
    status: "New Request",
    giver: SANDBOTS_BOT_NAMES.hydro,
    title: `A Pulse Berry for ${SANDBOTS_BOT_NAMES.grow}`,
    description: `${SANDBOTS_BOT_NAMES.hydro} thinks a Pulse Berry from the old dead tree might stabilize ${SANDBOTS_BOT_NAMES.grow} after all that habitat work.`,
    objective: `Use ${SANDBOTS_ITEM_NAMES.hydroTool} on the dead tree, bump it loose, pick up the Pulse Berry, then show it to ${SANDBOTS_BOT_NAMES.hydro} or ${SANDBOTS_BOT_NAMES.grow}.`,
    reward: `${SANDBOTS_BOT_NAMES.grow} will trust your habitat care even more.`
  },
  [BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID]: {
    id: BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID,
    status: "Habitat Check",
    giver: SANDBOTS_WORLD_TERMS.terminal,
    title: "Boulder-Shaded Tall Grass",
    description: "The restored terminal is checking whether specialized habitats can support returning bots and future colony work.",
    objective: `Use ${SANDBOTS_ITEM_NAMES.growTool} near the boulder to grow four tall grass patches, inspect the rustling habitat, then return to the ${SANDBOTS_WORLD_TERMS.terminal}.`,
    reward: "Viability logged."
  },
  [NEW_HABITAT_CHALLENGES_ID]: {
    id: NEW_HABITAT_CHALLENGES_ID,
    status: "New Habitat Checks",
    giver: SANDBOTS_WORLD_TERMS.terminal,
    title: "New Habitat Checks",
    description: `The terminal added a fresh set of habitat checks after ${SANDBOTS_BOT_NAMES.grow}'s tall grass home improved.`,
    objective: "Review the new habitat checks, then keep restoring habitats around the island.",
    reward: "More habitat recovery routes."
  }
});

export function getPokedexRequest(requestId) {
  return POKEDEX_REQUESTS[requestId] || null;
}
