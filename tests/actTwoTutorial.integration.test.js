// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActTwoTutorial } from "../actTwoTutorial.js";

function pressKey(handler, { code, key, repeat = false, ctrlKey = false, metaKey = false, altKey = false } = {}) {
  const event = {
    code,
    key,
    repeat,
    ctrlKey,
    metaKey,
    altKey,
    preventDefault: vi.fn(),
  };

  const handled = handler(event);
  vi.advanceTimersByTime(2000);
  return { event, handled };
}

const fakeCamera = {
  project() {
    return { x: 160, y: 120, depth: 0.25 };
  },
};

describe("createActTwoTutorial integration", () => {
  let root;
  let uiLayer;
  let onAbilityUnlock;
  let onPokedexReveal;
  let onComplete;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    root = document.createElement("section");
    uiLayer = document.createElement("div");
    document.body.append(root, uiLayer);
    onAbilityUnlock = vi.fn();
    onPokedexReveal = vi.fn();
    onComplete = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reveals the pokedex, continues the new post-close story, and ends the tutorial there", () => {
    const tutorial = createActTwoTutorial({
      root,
      uiLayer,
      onAbilityUnlock,
      onPokedexReveal,
      onComplete,
    });

    tutorial.start({
      monsterPosition: [0, 0, 0],
      squirtlePosition: [2, 0, 0],
      inspectablePosition: [6, 0, 0],
      repairPlantPosition: [8, 0, 0],
    });

    tutorial.update(fakeCamera, 320, 240, [0, 0, 0], 0);

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Enter", key: "Enter" });

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    tutorial.update(fakeCamera, 320, 240, [2, 0, 0], 0);

    expect(root.textContent).toContain("Squirtle");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(root.textContent).toContain("Talk to Squirtle");

    pressKey(tutorial.handleKeydown, { code: "KeyE", key: "e" });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(onAbilityUnlock).toHaveBeenNthCalledWith(1, "transform");
    expect(onAbilityUnlock).toHaveBeenNthCalledWith(2, "waterGun");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(root.textContent).toContain("You learned Water gun!");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(root.textContent).toContain("I've seen better transformations");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(root.textContent).toContain("Use Water Gun");
    expect(root.textContent).toContain("Press");

    pressKey(tutorial.handleKeydown, { code: "KeyE", key: "e" });

    expect(root.textContent).toContain("Im saved, thank you!");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(onPokedexReveal).toHaveBeenCalledTimes(1);
    expect(root.hidden).toBe(false);

    tutorial.notifyPokedexClosed();
    vi.advanceTimersByTime(2000);

    expect(root.textContent).toContain("still works after all");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("long gone");

    pressKey(tutorial.handleKeydown, { code: "Enter", key: "Enter" });
    expect(root.textContent).toContain("Things have changed");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("don't really remember too well");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("Facinating");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("Forget about that");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("ground around here turned green");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("mysterious power");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    expect(root.textContent).toContain("Yeah, great idea!");

    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      foundPokedex: true,
      learnedWaterGun: true,
      pokedexReaction: "really",
    }));
    expect(root.hidden).toBe(true);
  });
});
