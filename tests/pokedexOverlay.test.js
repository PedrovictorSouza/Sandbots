// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createPokedexOverlay } from "../pokedexOverlay.js";
import {
  BULBASAUR_POKEDEX_ENTRY_ID,
  FLOWER_BED_POKEDEX_ENTRY_ID,
  TALL_GRASS_POKEDEX_ENTRY_ID,
  TIMBURR_POKEDEX_ENTRY_ID
} from "../pokedexEntries.js";
import {
  BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID,
  NEW_HABITAT_CHALLENGES_ID,
  SQUIRTLE_LEPPA_BERRY_REQUEST_ID
} from "../pokedexRequests.js";

function createOverlayRoot() {
  const root = document.createElement("section");
  root.innerHTML = `
    <article class="pokedex-entry">
      <div data-pokedex-field="number"></div>
      <div data-pokedex-field="name"></div>
      <div data-pokedex-field="details-eyebrow"></div>
      <div data-pokedex-field="species"></div>
      <div data-pokedex-field="description"></div>
      <div data-pokedex-field="detail-stat-label-0"></div>
      <div data-pokedex-field="detail-stat-value-0"></div>
      <div data-pokedex-field="detail-stat-label-1"></div>
      <div data-pokedex-field="detail-stat-value-1"></div>
      <div data-pokedex-field="detail-stat-label-2"></div>
      <div data-pokedex-field="detail-type-icon"></div>
      <div data-pokedex-field="detail-type-label"></div>
      <div data-pokedex-field="where-eyebrow"></div>
      <div data-pokedex-field="where-pin"></div>
      <div data-pokedex-field="where-island"></div>
      <div data-pokedex-field="where-count"></div>
      <div data-pokedex-field="where-stat-label-0"></div>
      <div data-pokedex-field="where-stat-value-0"></div>
      <div data-pokedex-field="where-stat-label-1"></div>
      <div data-pokedex-field="where-stat-value-1"></div>
      <div data-pokedex-field="specialties-eyebrow"></div>
      <div data-pokedex-field="specialty-title"></div>
      <div data-pokedex-field="specialty-icon"></div>
      <div data-pokedex-field="specialty-label"></div>
      <div data-pokedex-field="favorites-title"></div>
      <ul data-pokedex-field="favorites-list"></ul>
      <div data-pokedex-field="habitat-title"></div>
      <div data-pokedex-field="habitat-copy"></div>
      <div data-pokedex-field="art-card-title"></div>
      <div data-pokedex-field="art-time"></div>
      <div data-pokedex-field="art-rarity"></div>
      <div data-pokedex-field="drawer-icon"></div>
      <div data-pokedex-field="drawer-label"></div>
      <div data-pokedex-field="drawer-count"></div>
      <div data-pokedex-field="request-status"></div>
      <div data-pokedex-field="request-giver"></div>
      <div data-pokedex-field="request-title"></div>
      <div data-pokedex-field="request-description"></div>
      <div data-pokedex-field="request-objective"></div>
      <div data-pokedex-field="request-reward"></div>
      <button data-pokedex-page-target="details"></button>
      <button data-pokedex-page-target="where-to-find"></button>
      <button data-pokedex-page-target="specialties"></button>
      <button data-pokedex-page-target="requests"></button>
      <section data-pokedex-page-panel="details"></section>
      <section data-pokedex-page-panel="where-to-find"></section>
      <section data-pokedex-page-panel="specialties"></section>
      <section data-pokedex-page-panel="requests"></section>
      <div data-pokedex-art-scene="squirtle"></div>
      <div data-pokedex-art-scene="bulbasaur" hidden></div>
      <div data-pokedex-art-scene="flower-bed" hidden></div>
      <div data-pokedex-art-scene="tall-grass" hidden></div>
      <div data-pokedex-art-scene="timburr" hidden></div>
    </article>
  `;
  return root;
}

describe("createPokedexOverlay", () => {
  it("switches content and art scene when a new pokedex entry is selected", () => {
    const root = createOverlayRoot();
    const overlay = createPokedexOverlay({ root });

    overlay.setOpen(true, {
      entryId: FLOWER_BED_POKEDEX_ENTRY_ID
    });

    expect(root.querySelector('[data-pokedex-field="number"]')?.textContent).toBe("No. 008");
    expect(root.querySelector('[data-pokedex-field="name"]')?.textContent).toBe("Pretty flower bed");
    expect(root.querySelector('[data-pokedex-field="description"]')?.innerHTML).toContain("wildflowers");
    expect(root.querySelector(".pokedex-entry")?.dataset.pokedexDrawer).toBe("visible");
    expect(root.querySelector('[data-pokedex-field="drawer-label"]')?.textContent).toBe("Grass");
    expect(root.querySelector('[data-pokedex-field="drawer-count"]')?.textContent).toBe("x2");
    expect(root.querySelector('[data-pokedex-art-scene="squirtle"]')?.hidden).toBe(true);
    expect(root.querySelector('[data-pokedex-art-scene="flower-bed"]')?.hidden).toBe(false);
  });

  it("switches to the tall grass entry when that discovery is unlocked", () => {
    const root = createOverlayRoot();
    const overlay = createPokedexOverlay({ root });

    overlay.setOpen(true, {
      entryId: TALL_GRASS_POKEDEX_ENTRY_ID
    });

    expect(root.querySelector('[data-pokedex-field="number"]')?.textContent).toBe("No. 001");
    expect(root.querySelector('[data-pokedex-field="name"]')?.textContent).toBe("Tall grass");
    expect(root.querySelector('[data-pokedex-field="description"]')?.innerHTML).toContain("Four tufts of tall grass");
    expect(root.querySelector(".pokedex-entry")?.dataset.pokedexDrawer).toBe("hidden");
    expect(root.querySelector('[data-pokedex-art-scene="tall-grass"]')?.hidden).toBe(false);
    expect(root.querySelector('[data-pokedex-art-scene="flower-bed"]')?.hidden).toBe(true);
  });

  it("switches to the Bulbasaur entry when that encounter is unlocked", () => {
    const root = createOverlayRoot();
    const overlay = createPokedexOverlay({ root });

    overlay.setOpen(true, {
      entryId: BULBASAUR_POKEDEX_ENTRY_ID
    });

    expect(root.querySelector('[data-pokedex-field="number"]')?.textContent).toBe("No. 001");
    expect(root.querySelector('[data-pokedex-field="name"]')?.textContent).toBe("Bulbasaur");
    expect(root.querySelector('[data-pokedex-field="species"]')?.textContent).toBe("Seed Pokemon");
    expect(root.querySelector('[data-pokedex-field="description"]')?.innerHTML).toContain("It carries a seed on its back");
    expect(root.querySelector('[data-pokedex-field="detail-type-label"]')?.textContent).toBe("Grass / Poison");
    expect(root.querySelector('[data-pokedex-field="where-pin"]')?.textContent).toBe("Tall grass");
    expect(root.querySelector('[data-pokedex-field="where-count"]')?.textContent).toBe("1/2");
    expect(root.querySelector('[data-pokedex-field="where-island"]')?.innerHTML).toContain("pokedex-entry__where-preview--tall-grass");
    expect(root.querySelector('[data-pokedex-field="where-stat-value-0"]')?.innerHTML).toContain("pokedex-entry__where-token--night");
    expect(root.querySelector('[data-pokedex-field="where-stat-value-1"]')?.innerHTML).toContain("pokedex-entry__where-token--rainy");
    expect(root.querySelector('[data-pokedex-field="specialty-label"]')?.textContent).toBe("Grow");
    expect(root.querySelector('[data-pokedex-field="habitat-copy"]')?.textContent).toBe("Bright");
    expect(root.querySelector('[data-pokedex-field="favorites-list"]')?.textContent).toContain("Lots of nature");
    expect(root.querySelector('[data-pokedex-field="favorites-list"]')?.textContent).toContain("Sweet flavors");
    expect(root.querySelector(".pokedex-entry")?.dataset.pokedexTheme).toBe("forest");
    expect(root.querySelector('[data-pokedex-art-scene="bulbasaur"]')?.hidden).toBe(false);
    expect(root.querySelector('[data-pokedex-art-scene="squirtle"]')?.hidden).toBe(true);
  });

  it("opens the request menu with a Squirtle request", () => {
    const root = createOverlayRoot();
    const overlay = createPokedexOverlay({ root });

    overlay.setOpen(true, {
      page: "requests",
      requestId: SQUIRTLE_LEPPA_BERRY_REQUEST_ID
    });

    expect(overlay.getPage()).toBe("requests");
    expect(root.querySelector('[data-pokedex-field="request-status"]')?.textContent).toBe("New Request");
    expect(root.querySelector('[data-pokedex-field="request-giver"]')?.textContent).toBe("Squirtle");
    expect(root.querySelector('[data-pokedex-field="request-title"]')?.textContent).toBe("A Leppa Berry for Bulbasaur");
    expect(root.querySelector('[data-pokedex-field="request-objective"]')?.textContent).toContain("Use Water Gun on the dead tree");
    expect(root.querySelector('[data-pokedex-page-panel="requests"]')?.hidden).toBe(false);
  });

  it("treats X as a close shortcut while the Pokedesk is open", () => {
    const root = createOverlayRoot();
    const onClose = vi.fn();
    const overlay = createPokedexOverlay({ root, onClose });
    const event = {
      code: "KeyX",
      key: "x",
      preventDefault: vi.fn()
    };

    overlay.setOpen(true);

    expect(overlay.handleKeydown(event)).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("renders Timburr and the Boulder-Shaded Tall Grass challenge request", () => {
    const root = createOverlayRoot();
    const overlay = createPokedexOverlay({ root });

    overlay.setOpen(true, {
      entryId: TIMBURR_POKEDEX_ENTRY_ID
    });

    expect(root.querySelector('[data-pokedex-field="name"]')?.textContent).toBe("Timburr");
    expect(root.querySelector('[data-pokedex-field="habitat-copy"]')?.textContent).toBe("Boulder shade");
    expect(root.querySelector('[data-pokedex-art-scene="timburr"]')?.hidden).toBe(false);

    overlay.setOpen(true, {
      page: "requests",
      requestId: BOULDER_SHADED_TALL_GRASS_CHALLENGE_ID
    });

    expect(root.querySelector('[data-pokedex-field="request-status"]')?.textContent).toBe("Challenge");
    expect(root.querySelector('[data-pokedex-field="request-title"]')?.textContent).toBe("Boulder-Shaded Tall Grass");
    expect(root.querySelector('[data-pokedex-field="request-reward"]')?.textContent).toBe("Life Coins.");
  });

  it("renders the new Habitat Challenges request from the PC", () => {
    const root = createOverlayRoot();
    const overlay = createPokedexOverlay({ root });

    overlay.setOpen(true, {
      page: "requests",
      requestId: NEW_HABITAT_CHALLENGES_ID
    });

    expect(root.querySelector('[data-pokedex-field="request-status"]')?.textContent).toBe("New Challenges");
    expect(root.querySelector('[data-pokedex-field="request-giver"]')?.textContent).toBe("Pokemon Center PC");
    expect(root.querySelector('[data-pokedex-field="request-title"]')?.textContent).toBe("New Habitat Challenges");
    expect(root.querySelector('[data-pokedex-field="request-objective"]')?.textContent).toContain("Review the new Challenges");
  });
});
