export const SQUIRTLE_LEPPA_BERRY_REQUEST_ID = "squirtle-leppa-berry";
export const SQUIRTLE_LEAFAGE_REQUEST_ID = SQUIRTLE_LEPPA_BERRY_REQUEST_ID;
export const BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID = "boulder-shaded-tall-grass-challenge";
export const NEW_HABITAT_CHALLENGES_ID = "new-habitat-challenges";

export const POKEDEX_REQUESTS = Object.freeze({
  [SQUIRTLE_LEPPA_BERRY_REQUEST_ID]: {
    id: SQUIRTLE_LEPPA_BERRY_REQUEST_ID,
    status: "New Request",
    giver: "Squirtle",
    title: "A Leppa Berry for Bulbasaur",
    description: "Squirtle thinks a Leppa Berry from the old dead tree might perk Bulbasaur up after all that work.",
    objective: "Use Water Gun on the dead tree, headbutt it, pick up the Leppa Berry, then show it to Squirtle or Bulbasaur.",
    reward: "Bulbasaur will trust your habitat care even more."
  },
  [BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID]: {
    id: BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID,
    status: "Challenge",
    giver: "Pokemon Center PC",
    title: "Boulder-Shaded Tall Grass",
    description: "The restored PC is checking whether new Pokemon are returning to specialized habitats.",
    objective: "Use Leafage near the boulder to grow four tall grass patches, inspect the rustling habitat, then return to the PC.",
    reward: "Life Coins."
  },
  [NEW_HABITAT_CHALLENGES_ID]: {
    id: NEW_HABITAT_CHALLENGES_ID,
    status: "New Challenges",
    giver: "Pokemon Center PC",
    title: "New Habitat Challenges",
    description: "The PC added a fresh set of habitat checks after Bulbasaur's tall grass home improved.",
    objective: "Review the new Challenges, then keep restoring habitats around the island.",
    reward: "More habitat recovery routes."
  }
});

export function getPokedexRequest(requestId) {
  return POKEDEX_REQUESTS[requestId] || null;
}
