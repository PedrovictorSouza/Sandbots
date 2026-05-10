// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createPokemonCenterPcModalController } from "../app/ui/pokemonCenterPcModalController.js";

function createController() {
  const mount = document.createElement("div");
  const clearGameFlowInput = vi.fn();
  const musicAudio = {
    currentTime: 0,
    loop: false,
    pause: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    preload: "",
    volume: 0
  };
  const audioFactory = vi.fn(() => musicAudio);
  const controller = createPokemonCenterPcModalController({
    mount,
    clearGameFlowInput,
    musicSrc: "/soundFx/center-computer.mp3",
    musicVolume: 0.5,
    audioFactory
  });

  return { audioFactory, clearGameFlowInput, controller, mount, musicAudio };
}

describe("createPokemonCenterPcModalController", () => {
  it("opens a carousel and confirms the selected actionable mission", () => {
    const { audioFactory, controller, mount, musicAudio } = createController();
    const onConfirm = vi.fn(() => true);

    controller.open({
      missions: [
        {
          id: "field:locked",
          title: "????",
          description: "Mission data has not been recovered yet.",
          status: "locked",
          source: "request"
        },
        {
          id: "field:boulder",
          title: "Boulder-Shaded Tall Grass",
          description: "Return to the Pokemon Center PC to receive Life Coins.",
          status: "available",
          source: "request",
          actionId: "claim-boulder-reward",
          actionLabel: "Claim Life Coins"
        }
      ],
      onConfirm
    });

    const modal = mount.querySelector(".pokemon-center-pc-modal");
    expect(modal?.hidden).toBe(false);
    expect(modal?.style.display).toBe("grid");
    expect(audioFactory).toHaveBeenCalledWith("/soundFx/center-computer.mp3");
    expect(musicAudio.loop).toBe(true);
    expect(musicAudio.preload).toBe("auto");
    expect(musicAudio.volume).toBe(0.5);
    expect(musicAudio.play).toHaveBeenCalledTimes(1);
    expect(mount.textContent).toContain("Boulder-Shaded Tall Grass");
    expect(mount.textContent).toContain("2/2");

    controller.handleKeydown({ code: "KeyX", preventDefault() {} });

    expect(onConfirm).toHaveBeenCalledWith("claim-boulder-reward", expect.objectContaining({
      id: "field:boulder"
    }));
    expect(controller.isOpen()).toBe(false);
    expect(musicAudio.pause).toHaveBeenCalledTimes(1);
    expect(musicAudio.currentTime).toBe(0);
  });

  it("browses missions with arrows and keeps locked missions non-actionable", () => {
    const { controller, mount } = createController();
    const onConfirm = vi.fn(() => true);

    controller.open({
      missions: [
        {
          id: "field:known",
          title: "Known Mission",
          description: "A visible mission.",
          status: "available",
          source: "request"
        },
        {
          id: "field:locked",
          title: "????",
          description: "Mission data has not been recovered yet.",
          status: "locked",
          source: "request"
        }
      ],
      onConfirm
    });

    controller.handleKeydown({ code: "ArrowRight", preventDefault() {} });

    expect(mount.textContent).toContain("????");

    controller.handleKeydown({ code: "KeyX", preventDefault() {} });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(controller.isOpen()).toBe(true);
  });

  it("shows multiple mission cards with status colors", () => {
    const { controller, mount } = createController();

    controller.open({
      missions: [
        {
          id: "field:done",
          title: "Done Mission",
          description: "Already restored.",
          status: "completed",
          source: "request",
          imageSrc: "/missions/done.png",
          imageAlt: "Done mission preview"
        },
        {
          id: "field:todo",
          title: "Open Mission",
          description: "Needs player action.",
          status: "available",
          source: "request",
          progress: "0/3"
        },
        {
          id: "field:locked",
          title: "????",
          description: "Mission data has not been recovered yet.",
          status: "locked",
          source: "request"
        }
      ]
    });

    const cards = mount.querySelectorAll(".pokemon-center-pc-modal__cards .pokemon-center-pc-modal__card");
    expect(cards).toHaveLength(3);
    expect(cards[0]?.getAttribute("style")).toContain("#89ff00");
    expect(cards[1]?.getAttribute("style")).toContain("#ffd66d");
    expect(cards[2]?.getAttribute("style")).toContain("#5d6470");
    expect(cards[0]?.getAttribute("style")).toContain("124px");
    expect(cards[0]?.querySelector(".pokemon-center-pc-modal__card-image")?.getAttribute("src")).toBe("/missions/done.png");
    expect(cards[1]?.querySelector("[data-pc-mission-image-slot]")).not.toBeNull();
    expect(mount.querySelector(".pokemon-center-pc-modal__panel")?.getAttribute("style")).toContain("max-width: 1120px");
    expect(mount.textContent).toContain("0/3");
  });
});
