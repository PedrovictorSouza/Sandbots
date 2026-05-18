// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createWorkbenchModalController } from "../app/bootstrap/createApplicationRuntime.js";

function createController() {
  const mount = document.createElement("div");
    const controller = createWorkbenchModalController({
      mount,
      inventory: { wood: 3 },
      getItemLabel: (itemId) => ({
        wood: "Wood",
        leaves: "Leaves"
      }[itemId] || "Thermal Cabin"),
      formatRequirementSummary: () => "3 Wood",
      clearGameFlowInput: vi.fn()
    });

  return { controller, mount };
}

describe("createWorkbenchModalController", () => {
  it("does not leave the dark modal layer visible after crafting closes it", () => {
    const { controller, mount } = createController();

    controller.open({
      recipes: [
        {
          recipe: {
            id: "campfire",
            title: "Thermal Cabin",
            ingredients: { wood: 3 }
          },
          disabled: true,
          status: "Created",
          onConfirm: () => true
        }
      ]
    });

    const modal = mount.querySelector(".workbench-modal");
    const panel = mount.querySelector(".workbench-modal__panel");
    const header = mount.querySelector(".workbench-modal__header");
    const recipeGrid = mount.querySelector(".workbench-modal__recipe-grid");
    const recipeButton = mount.querySelector(".workbench-modal__recipe");
    const recipeArt = mount.querySelector(".workbench-modal__recipe-art");
    const requirement = mount.querySelector(".workbench-modal__recipe-requirement");

    expect(modal?.hidden).toBe(false);
    expect(modal?.style.display).toBe("grid");
    expect(panel?.style.position).toBe("relative");
    expect(panel?.style.padding).toBe("22px 24px");
    expect(header?.textContent).toContain("Workbench");
    expect(header?.textContent).toContain("Left/Right Select");
    expect(mount.querySelector(".workbench-modal__hint")?.textContent).not.toContain("Left/Right Select");
    expect(recipeGrid?.style.gap).toBe("24px");
    expect(recipeButton?.style.minHeight).toContain("clamp(220px");
    expect(recipeButton?.style.border).toContain("5px solid");
    expect(recipeButton?.style.backgroundImage).toContain("train-house.gif");
    expect(recipeButton?.style.backgroundImage).not.toContain("linear-gradient");
    expect(recipeButton?.style.opacity).toBe("1");
    expect(mount.querySelector(".workbench-modal__recipe-thumbnail")).toBeNull();
    expect(mount.querySelector(".workbench-modal__recipe-icon img")).toBeNull();
    expect(recipeButton?.firstElementChild).toBe(recipeArt);
    expect(mount.querySelector(".workbench-modal__recipe-copy")?.style.background).toBe("none");
    expect(mount.querySelector(".workbench-modal__recipe-protocol")?.textContent).toBe("Power Plans");
    expect(mount.querySelector(".workbench-modal__recipe-purpose")?.textContent).toContain("starter heat");
    expect(requirement?.textContent).toBe("Created");
    expect(requirement?.style.color).toBe("rgb(3, 169, 244)");
    expect(mount.querySelector(".workbench-modal__hint-action")?.textContent).toBe("Created");
    expect(mount.querySelector(".workbench-modal__hint-close")?.textContent).toBe("B / Esc Close");
    expect(mount.querySelector(".workbench-modal__hint-close")?.style.position).toBe("absolute");
    expect(mount.querySelector(".workbench-modal__hint-close")?.style.right).toBe("24px");
    expect(mount.querySelector(".workbench-modal__hint-close")?.style.bottom).toBe("18px");
    expect(mount.querySelector(".workbench-modal__hint")?.textContent).not.toContain("B / Esc Close");
    expect(mount.querySelector(".workbench-modal__hint-close")?.style.color).toBe("rgb(255, 77, 77)");
    expect(mount.querySelector(".workbench-modal__hint-close")?.style.animation).toContain("workbenchModalCloseHintBlink");

    controller.close();

    expect(controller.isOpen()).toBe(false);
    expect(modal?.hidden).toBe(true);
    expect(modal?.style.display).toBe("none");
  });

  it("shows the construction recipes and crafts the selected solar station recipe", () => {
    const { controller, mount } = createController();
    const craftCampfire = vi.fn(() => true);
    const craftStrawBed = vi.fn(() => true);
    const craftHouse = vi.fn(() => true);

    controller.open({
      recipes: [
        {
          recipe: {
            id: "campfire",
            title: "Thermal Cabin",
            ingredients: { wood: 3 }
          },
          onConfirm: craftCampfire
        },
        {
          recipe: {
            id: "strawBed",
            title: "Solar Station",
            ingredients: { leaves: 2 }
          },
          onConfirm: craftStrawBed
        },
        {
          recipe: {
            id: "leafDenKit",
            title: "House",
            ingredients: {}
          },
          onConfirm: craftHouse
        }
      ]
    });

    const recipeButtons = [...mount.querySelectorAll(".workbench-modal__recipe")];
    expect(recipeButtons).toHaveLength(3);
    expect(recipeButtons[0].textContent).toContain("Thermal Cabin");
    expect(recipeButtons[1].textContent).toContain("Solar Station");
    expect(recipeButtons[2].textContent).toContain("House");
    expect(recipeButtons[0].textContent).toContain("Wood 3/3");
    expect(recipeButtons[1].textContent).toContain("Leaves 0/2");
    expect(recipeButtons[0].dataset.selected).toBe("true");
    expect(recipeButtons[0].getAttribute("aria-pressed")).toBe("true");
    expect(recipeButtons[0].getAttribute("aria-disabled")).toBe("false");
    expect(recipeButtons[0].getAttribute("aria-label")).toContain("Selected: Thermal Cabin");
    expect(recipeButtons[0].getAttribute("aria-label")).toContain("Power Plans");
    expect(recipeButtons[0].style.border).toContain("rgb(137, 255, 0)");
    expect(recipeButtons[0].querySelector(".workbench-modal__recipe-copy")?.style.visibility).toBe("visible");
    expect(recipeButtons[0].querySelector(".workbench-modal__recipe-copy")?.style.opacity).toBe("1");
    expect(recipeButtons[1].dataset.selected).toBe("false");
    expect(recipeButtons[1].getAttribute("aria-pressed")).toBe("false");
    expect(recipeButtons[1].getAttribute("aria-label")).toContain("Water Plans");
    expect(recipeButtons[1].style.border).not.toContain("rgb(137, 255, 0)");
    expect(recipeButtons[1].querySelector(".workbench-modal__recipe-copy")?.style.visibility).toBe("hidden");
    expect(recipeButtons[1].querySelector(".workbench-modal__recipe-copy")?.style.opacity).toBe("0");
    expect(recipeButtons[0].style.backgroundImage).toContain("train-house.gif");
    expect(recipeButtons[1].style.backgroundImage).toContain("Solar-Station.gif");
    expect(recipeButtons[2].style.backgroundImage).toContain("house_2.png");
    expect(recipeButtons[0].textContent).toContain("Power Plans");
    expect(recipeButtons[1].textContent).toContain("Water Plans");
    expect(recipeButtons[2].textContent).toContain("Shelter Plans");
    expect(recipeButtons[1].textContent).toContain("local circulation");
    expect(mount.querySelector(".workbench-modal__hint-action")?.textContent).toContain("X / Enter");

    controller.handleKeydown({
      code: "ArrowRight",
      preventDefault() {}
    });

    const updatedRecipeButtons = [...mount.querySelectorAll(".workbench-modal__recipe")];
    expect(updatedRecipeButtons[0].dataset.selected).toBe("false");
    expect(updatedRecipeButtons[0].style.border).not.toContain("rgb(137, 255, 0)");
    expect(updatedRecipeButtons[0].querySelector(".workbench-modal__recipe-copy")?.style.visibility).toBe("hidden");
    expect(updatedRecipeButtons[0].querySelector(".workbench-modal__recipe-copy")?.style.opacity).toBe("0");
    expect(updatedRecipeButtons[1].dataset.selected).toBe("true");
    expect(updatedRecipeButtons[1].style.border).toContain("rgb(137, 255, 0)");
    expect(updatedRecipeButtons[1].querySelector(".workbench-modal__recipe-copy")?.style.visibility).toBe("visible");
    expect(updatedRecipeButtons[1].querySelector(".workbench-modal__recipe-copy")?.style.opacity).toBe("1");
    expect(updatedRecipeButtons[0].style.backgroundImage).toContain("train-house.gif");
    expect(updatedRecipeButtons[1].style.backgroundImage).toContain("Solar-Station.gif");
    expect(updatedRecipeButtons[2].style.backgroundImage).toContain("house_2.png");

    controller.handleKeydown({
      code: "KeyX",
      preventDefault() {}
    });

    expect(craftCampfire).not.toHaveBeenCalled();
    expect(craftStrawBed).toHaveBeenCalledTimes(1);
    expect(craftHouse).not.toHaveBeenCalled();
  });
});
