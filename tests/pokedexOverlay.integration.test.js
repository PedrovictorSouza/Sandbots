// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPokedexOverlay } from "../pokedexOverlay.js";

function pressKey(handler, { code, key }) {
  const event = {
    code,
    key,
    preventDefault: vi.fn(),
  };

  const handled = handler(event);
  return { handled, event };
}

describe("createPokedexOverlay integration", () => {
  let root;
  let onClose;

  beforeEach(() => {
    document.body.innerHTML = `
      <section class="pokedex-overlay" id="pokedex-overlay" hidden aria-label="Pokedex entry">
        <article class="pokedex-entry">
          <div class="pokedex-entry__details">
            <header class="pokedex-entry__heading">
              <span>No. 007</span>
              <strong>Squirtle</strong>
            </header>
            <div class="pokedex-entry__tabs">
              <button type="button" data-pokedex-action="prev">L</button>
              <button type="button" data-pokedex-page-target="details">Details</button>
              <button type="button" data-pokedex-page-target="where-to-find">Where</button>
              <button type="button" data-pokedex-page-target="specialties">Likes</button>
              <button type="button" data-pokedex-action="next">R</button>
            </div>

            <section data-pokedex-page-panel="details">Details</section>
            <section data-pokedex-page-panel="where-to-find" hidden>Where to Find</section>
            <section data-pokedex-page-panel="specialties" hidden>Specialties & Likes</section>
          </div>
          <button id="pokedex-overlay-close" data-pokedex-action="close" type="button">Close</button>
        </article>
      </section>
    `;

    root = document.getElementById("pokedex-overlay");
    onClose = vi.fn();
  });

  it("cycles through the three Squirtle pages and only closes when the user asks", () => {
    const overlay = createPokedexOverlay({ root, onClose });

    overlay.setOpen(true);

    expect(root.hidden).toBe(false);
    expect(overlay.getPage()).toBe("details");
    expect(root.textContent).toContain("Details");

    const right = pressKey(overlay.handleKeydown, { code: "ArrowRight", key: "ArrowRight" });
    expect(right.handled).toBe(true);
    expect(right.event.preventDefault).toHaveBeenCalled();
    expect(overlay.getPage()).toBe("where-to-find");
    expect(root.querySelector('[data-pokedex-page-panel="details"]')?.hidden).toBe(true);
    expect(root.querySelector('[data-pokedex-page-panel="where-to-find"]')?.hidden).toBe(false);

    root.querySelector('[data-pokedex-page-target="specialties"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(overlay.getPage()).toBe("specialties");
    expect(root.querySelector('[data-pokedex-page-panel="specialties"]')?.hidden).toBe(false);

    const left = pressKey(overlay.handleKeydown, { code: "ArrowLeft", key: "ArrowLeft" });
    expect(left.handled).toBe(true);
    expect(overlay.getPage()).toBe("where-to-find");

    const space = pressKey(overlay.handleKeydown, { code: "Space", key: " " });
    expect(space.handled).toBe(true);
    expect(space.event.preventDefault).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    root.querySelector('[data-pokedex-action="close"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(2);

    const escape = pressKey(overlay.handleKeydown, { code: "Escape", key: "Escape" });
    expect(escape.handled).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
