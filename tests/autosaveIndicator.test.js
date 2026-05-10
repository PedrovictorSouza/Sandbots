// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createAutosaveIndicator } from "../app/bootstrap/createApplicationRuntime.js";

describe("createAutosaveIndicator", () => {
  it("shows Saving without blocking or replacing dialogue-critical UI", () => {
    const mount = document.createElement("div");
    const dialogue = document.createElement("section");
    const setTimeout = vi.fn(() => 1);
    const clearTimeout = vi.fn();

    dialogue.className = "gameplay-dialogue";
    dialogue.textContent = "Dialogue line";
    mount.append(dialogue);

    const indicator = createAutosaveIndicator({
      documentRef: document,
      mount,
      windowRef: {
        setTimeout,
        clearTimeout
      }
    });

    indicator.show();

    const savingElement = [...mount.children].find((element) => {
      return element.textContent === "Saving...";
    });

    expect(savingElement).toBeTruthy();
    expect(mount.contains(dialogue)).toBe(true);
    expect(savingElement).not.toBe(dialogue);
    expect(savingElement?.getAttribute("aria-live")).toBe("polite");
    expect(savingElement?.style.pointerEvents).toBe("none");
    expect(savingElement?.style.opacity).toBe("1");
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 900);
  });
});
