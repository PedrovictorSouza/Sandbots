// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createSettingsMenuController } from "../app/settings/createSettingsMenuController.js";
import { SETTINGS_SCHEMA, createDefaultSettingsState } from "../app/settings/settingsState.js";

describe("createSettingsMenuController", () => {
  it("renders expandable settings groups and opens/closes safely", () => {
    const mount = document.createElement("div");
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState()
    });

    expect(controller.isOpen()).toBe(false);
    const menu = mount.querySelector("[data-settings-menu]");
    expect(menu?.hidden).toBe(true);
    expect(menu?.style.display).toBe("none");

    controller.open();

    expect(controller.isOpen()).toBe(true);
    expect(menu?.hidden).toBe(false);
    expect(menu?.style.display).toBe("grid");
    expect(mount.querySelector('[data-settings-tab-panel="bag"]')?.hidden).toBe(false);
    expect(mount.querySelector('[data-settings-tab-panel="pokemons"]')?.hidden).toBe(true);
    expect(mount.querySelector('[data-settings-tab-panel="settings"]')?.hidden).toBe(true);
    expect(mount.querySelectorAll("[data-settings-tab]")).toHaveLength(3);
    expect(mount.querySelectorAll("[data-settings-group-button]")).toHaveLength(4);
    expect(mount.textContent).toContain("Camera");
    expect(mount.textContent).toContain("Follow Strength");

    mount.querySelector('[data-settings-tab="settings"]')?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(mount.querySelector('[data-settings-tab-panel="bag"]')?.hidden).toBe(true);
    expect(mount.querySelector('[data-settings-tab-panel="pokemons"]')?.hidden).toBe(true);
    expect(mount.querySelector('[data-settings-tab-panel="settings"]')?.hidden).toBe(false);

    mount.querySelector('[data-settings-group-button="volume"]')?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(mount.querySelector('[data-settings-group-panel="volume"]')?.hidden).toBe(false);
    expect(mount.querySelector('[data-settings-group-panel="camera"]')?.hidden).toBe(true);

    controller.close();

    expect(controller.isOpen()).toBe(false);
    expect(menu?.hidden).toBe(true);
    expect(menu?.style.display).toBe("none");
  });

  it("handles B, X and Escape as close/cancel inputs", () => {
    const mount = document.createElement("div");
    const onClose = vi.fn();
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      onClose
    });
    const event = new KeyboardEvent("keydown", { code: "KeyB" });

    controller.open();

    expect(controller.handleKeydown(event)).toBe(true);
    expect(controller.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);

    controller.open();

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX" }))).toBe(true);
    expect(controller.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(2);

    controller.open();

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "Escape" }))).toBe(true);
    expect(controller.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("shows a visible close button", () => {
    const mount = document.createElement("div");
    const onClose = vi.fn();
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      onClose
    });

    controller.open();
    mount.querySelector("[data-settings-action='close']")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(controller.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a restart button when a restart action is provided", () => {
    const mount = document.createElement("div");
    const onRestartGame = vi.fn(() => false);
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      onRestartGame
    });

    controller.open();
    const restartButton = mount.querySelector("[data-settings-action='restart-game']");
    restartButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(restartButton?.textContent).toBe("Restart Game");
    expect(onRestartGame).toHaveBeenCalledTimes(1);
    expect(controller.isOpen()).toBe(true);
  });

  it("navigates settings groups with vertical input", () => {
    const mount = document.createElement("div");
    document.body.append(mount);
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState()
    });
    const downEvent = new KeyboardEvent("keydown", { code: "ArrowDown" });
    const upEvent = new KeyboardEvent("keydown", { code: "ArrowUp" });

    controller.open();
    controller.setActiveTab("settings", { focus: true });

    expect(controller.handleKeydown(downEvent)).toBe(true);
    expect(mount.querySelector('[data-settings-group-panel="volume"]')?.hidden).toBe(false);
    expect(document.activeElement).toBe(mount.querySelector('[data-settings-group-button="volume"]'));

    expect(controller.handleKeydown(upEvent)).toBe(true);
    expect(mount.querySelector('[data-settings-group-panel="camera"]')?.hidden).toBe(false);
    expect(document.activeElement).toBe(mount.querySelector('[data-settings-group-button="camera"]'));
  });

  it("opens on the bag tab and renders the current inventory context", () => {
    const mount = document.createElement("div");
    document.body.append(mount);
    const inventory = {
      campfire: 1,
      wood: 3,
      leaves: 2,
      squirtleFollowing: 1
    };
    const itemDefs = {
      campfire: {
        id: "campfire",
        bagLabel: "Train House",
        bagDetailsEligible: true,
        glyph: "H",
        color: "#f07d38",
        ink: "#2a1205",
        slotRole: "placeable"
      },
      wood: {
        id: "wood",
        bagLabel: "Sturdy stick",
        bagDetailsEligible: true,
        glyph: "W",
        color: "#8c5a34",
        ink: "#fff1e8",
        slotRole: "material"
      },
      leaves: {
        id: "leaves",
        bagLabel: "Leaves",
        bagDetailsEligible: true,
        glyph: "L",
        color: "#72b95a",
        ink: "#10220c",
        slotRole: "material"
      },
      squirtleFollowing: {
        id: "squirtleFollowing",
        label: "Squirtle",
        slotRole: "pokemon"
      }
    };
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      inventory,
      inventoryOrder: ["wood", "leaves", "squirtleFollowing", "campfire"],
      itemDefs
    });

    controller.open();

    const bagGrid = mount.querySelector("[data-settings-bag-grid]");
    expect(mount.querySelector('[data-settings-tab-panel="bag"]')?.hidden).toBe(false);
    expect(bagGrid?.querySelectorAll('[data-filled="true"]')).toHaveLength(3);
    expect(bagGrid?.textContent).toContain("Train House");
    expect(bagGrid?.textContent).toContain("Sturdy stick");
    expect(bagGrid?.textContent).toContain("Leaves");
    expect(bagGrid?.textContent).toContain("3");
    expect(bagGrid?.textContent).not.toContain("Squirtle");
    expect(mount.querySelector(".settings-menu__bag-empty")?.hidden).toBe(true);

    mount.remove();
  });

  it("renders captured Pokemon in a dedicated Select menu tab", () => {
    const mount = document.createElement("div");
    const storyState = {
      flags: {
        squirtleRobotReactivated: true,
        squirtleFollowing: true,
        bulbasaurRevealed: true,
        reactivatedHelperRobotIds: ["bulbasaur"]
      }
    };
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      storyState
    });

    controller.open();
    controller.setActiveTab("pokemons");

    const pokemonPanel = mount.querySelector('[data-settings-tab-panel="pokemons"]');
    const pokemonGrid = mount.querySelector("[data-settings-pokemon-grid]");
    expect(pokemonPanel?.hidden).toBe(false);
    expect(pokemonGrid?.querySelectorAll("[data-pokemon-id]")).toHaveLength(2);
    expect(pokemonGrid?.textContent).toContain("Squirtle");
    expect(pokemonGrid?.textContent).toContain("Bulbasaur");
    expect(pokemonGrid?.textContent).not.toContain("Habitat:");
    expect(pokemonGrid?.textContent).not.toContain("Following");
    expect(pokemonGrid?.textContent).not.toContain("Captured");
    expect(pokemonGrid?.textContent).not.toContain("Charmander");
    expect(pokemonGrid?.querySelector('[data-pokemon-id="squirtle"]')?.dataset.following).toBe("true");
    expect(mount.querySelector(".settings-menu__pokemon-empty")?.hidden).toBe(true);
  });

  it("shows the selected Pokemon ability description at the bottom of the Pokemon tab", () => {
    const mount = document.createElement("div");
    const storyState = {
      flags: {
        squirtleRobotReactivated: true,
        squirtleFollowing: true,
        charmanderRevealed: true
      }
    };
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      storyState
    });

    controller.open();
    controller.setActiveTab("pokemons");

    const abilityPanel = mount.querySelector("[data-settings-pokemon-ability]");
    expect(abilityPanel?.hidden).toBe(false);
    expect(mount.querySelector('[data-pokemon-id="squirtle"]')?.dataset.selected).toBe("true");
    expect(abilityPanel?.textContent).toContain("Squirtle · Water Gun");
    expect(abilityPanel?.textContent).toContain("revives thirsty trees");

    mount.querySelector('[data-pokemon-id="charmander"]')?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(mount.querySelector('[data-pokemon-id="charmander"]')?.dataset.selected).toBe("true");
    expect(abilityPanel?.textContent).toContain("Charmander · Fire");
    expect(abilityPanel?.textContent).toContain("Carbon charges");
  });

  it("dismisses a following Pokemon from the Select menu Pokemon tab", () => {
    const mount = document.createElement("div");
    const onDismissPokemonFollower = vi.fn();
    const onChange = vi.fn();
    const storyState = {
      flags: {
        squirtleRobotReactivated: true,
        squirtleFollowing: true
      }
    };
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      storyState,
      onChange,
      onDismissPokemonFollower
    });

    controller.open();
    controller.setActiveTab("pokemons");
    mount.querySelector('[data-pokemon-dismiss="squirtle"]')?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(storyState.flags.squirtleFollowing).toBe(false);
    expect(onDismissPokemonFollower).toHaveBeenCalledWith({
      pokemonId: "squirtle",
      followingFlag: "squirtleFollowing"
    });
    expect(onChange).toHaveBeenCalledWith({
      id: "pokemonFollower",
      value: {
        pokemonId: "squirtle",
        following: false
      }
    });
    expect(mount.querySelector('[data-pokemon-id="squirtle"]')?.dataset.following).toBe("false");
    expect(mount.querySelector('[data-pokemon-dismiss="squirtle"]')).toBeNull();
  });

  it("shows a move in action for captured Pokemon when the House is a valid home", () => {
    const mount = document.createElement("div");
    const storyState = {
      flags: {
        charmanderRevealed: true,
        leafDenBuilt: true,
        leafDenFurniturePlacedCount: 3
      }
    };
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      storyState
    });

    controller.open();
    controller.setActiveTab("pokemons");

    expect(mount.querySelector('[data-pokemon-id="charmander"]')?.dataset.currentHomeId).toBe("");
    expect(mount.querySelector('[data-pokemon-move-in="charmander"]')?.getAttribute("aria-label")).toBe(
      "Move Charmander into House"
    );
  });

  it("moves a captured Pokemon into the House from the Select menu", () => {
    const mount = document.createElement("div");
    const onMovePokemonIn = vi.fn();
    const onChange = vi.fn();
    const storyState = {
      flags: {
        charmanderRevealed: true,
        leafDenBuilt: true,
        leafDenFurniturePlacedCount: 3,
        creatureHomeAssignments: {
          charmander: "oldHome"
        }
      }
    };
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState(),
      storyState,
      onChange,
      onMovePokemonIn
    });

    controller.open();
    controller.setActiveTab("pokemons");
    mount.querySelector('[data-pokemon-move-in="charmander"]')?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );

    expect(storyState.flags.creatureHomeAssignments).toEqual({
      charmander: "leafDen"
    });
    expect(onMovePokemonIn).toHaveBeenCalledWith({
      pokemonId: "charmander",
      homeId: "leafDen"
    });
    expect(onChange).toHaveBeenCalledWith({
      id: "pokemonHome",
      value: {
        pokemonId: "charmander",
        homeId: "leafDen"
      }
    });
    expect(mount.querySelector('[data-pokemon-id="charmander"]')?.dataset.currentHomeId).toBe("leafDen");
    expect(mount.querySelector('[data-pokemon-move-in="charmander"]')).toBeNull();
  });

  it("switches between bag and settings tabs with shoulder key events", () => {
    const mount = document.createElement("div");
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState: createDefaultSettingsState()
    });

    controller.open();

    expect(mount.querySelector('[data-settings-tab-panel="bag"]')?.hidden).toBe(false);

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "PageDown" }))).toBe(true);
    expect(mount.querySelector('[data-settings-tab-panel="pokemons"]')?.hidden).toBe(false);

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "PageDown" }))).toBe(true);
    expect(mount.querySelector('[data-settings-tab-panel="settings"]')?.hidden).toBe(false);

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "PageUp" }))).toBe(true);
    expect(mount.querySelector('[data-settings-tab-panel="pokemons"]')?.hidden).toBe(false);
  });

  it("updates settings state and reports changes from controls", () => {
    const mount = document.createElement("div");
    const settingsState = createDefaultSettingsState();
    const onChange = vi.fn();
    createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState,
      onChange
    });

    mount.querySelector('[data-settings-control="accessibility.reduceMotion"]')?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    const masterInput = mount.querySelector('[data-settings-control="volume.master"]');
    masterInput.value = "0.34";
    masterInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(settingsState.accessibility.reduceMotion).toBe(true);
    expect(settingsState.volume.master).toBe(0.34);
    expect(onChange).toHaveBeenCalledWith(settingsState, expect.objectContaining({
      groupId: "accessibility",
      settingId: "reduceMotion",
      value: true
    }));
    expect(onChange).toHaveBeenCalledWith(settingsState, expect.objectContaining({
      groupId: "volume",
      settingId: "master",
      value: 0.34
    }));
  });

  it("lets left and right adjust focused volume sliders", () => {
    const mount = document.createElement("div");
    document.body.append(mount);
    const settingsState = createDefaultSettingsState();
    const onChange = vi.fn();
    const controller = createSettingsMenuController({
      mount,
      schema: SETTINGS_SCHEMA,
      settingsState,
      onChange
    });

    controller.open();
    controller.setActiveTab("settings", { focus: true });
    controller.setActiveGroup("volume", { focus: true });

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowRight" }))).toBe(true);
    expect(settingsState.volume.master).toBe(0.82);

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowDown" }))).toBe(true);
    expect(document.activeElement).toBe(mount.querySelector('[data-settings-control="volume.music"]'));

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowLeft" }))).toBe(true);
    expect(settingsState.volume.music).toBe(0.66);

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowDown" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowDown" }));
    expect(document.activeElement).toBe(mount.querySelector('[data-settings-control="volume.sfx"]'));

    expect(controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowLeft" }))).toBe(true);
    expect(settingsState.volume.sfx).toBe(0.8);
    expect(onChange).toHaveBeenCalledWith(settingsState, expect.objectContaining({
      groupId: "volume",
      settingId: "sfx",
      value: 0.8
    }));
  });
});
