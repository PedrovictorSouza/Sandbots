// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createBagDetailsController } from "../app/ui/bagDetailsController.js";

describe("createBagDetailsController", () => {
  it("renders the focused bag item fields", () => {
    const iconElement = document.createElement("span");
    const nameElement = document.createElement("span");
    const countElement = document.createElement("span");
    const descriptionElement = document.createElement("div");
    const controller = createBagDetailsController({
      iconElement,
      nameElement,
      countElement,
      descriptionElement
    });

    controller.setItem({
      id: "wood",
      label: "Wood",
      bagLabel: "Sturdy stick",
      glyph: "W",
      color: "#8c5a34",
      ink: "#fff1e8",
      description: "A branch that fell off a tree somewhere."
    }, 1);

    expect(iconElement.textContent).toBe("W");
    expect(iconElement.style.getPropertyValue("--bag-icon-color")).toBe("#8c5a34");
    expect(iconElement.style.getPropertyValue("--bag-icon-ink")).toBe("#fff1e8");
    expect(nameElement.textContent).toBe("Sturdy stick");
    expect(countElement.textContent).toBe("x 1");
    expect(descriptionElement.textContent).toBe("A branch that fell off a tree somewhere.");
  });
});
