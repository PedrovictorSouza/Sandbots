// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createPokedexOverlay } from "../pokedexOverlay.js";
import {
  BULBASAUR_POKEDEX_ENTRY_ID,
  FLOWER_BED_POKEDEX_ENTRY_ID,
  TALL_GRASS_POKEDEX_ENTRY_ID
} from "../pokedexEntries.js";

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
      <button data-pokedex-page-target="details"></button>
      <button data-pokedex-page-target="where-to-find"></button>
      <button data-pokedex-page-target="specialties"></button>
      <section data-pokedex-page-panel="details"></section>
      <section data-pokedex-page-panel="where-to-find"></section>
      <section data-pokedex-page-panel="specialties"></section>
      <div data-pokedex-art-scene="squirtle"></div>
      <div data-pokedex-art-scene="bulbasaur" hidden></div>
      <div data-pokedex-art-scene="flower-bed" hidden></div>
      <div data-pokedex-art-scene="tall-grass" hidden></div>
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
});
