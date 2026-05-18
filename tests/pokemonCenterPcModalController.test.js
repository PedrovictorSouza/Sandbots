// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  createPokemonCenterPcModalController,
  createTerminalMissionCardViewModel,
  createTerminalModalMusicController,
  getInitialTerminalMissionIndex,
  getTerminalMissionStatusType,
  getTerminalStatusLegendItems,
  getVisibleTerminalMissionIndexes,
  getWrappedTerminalMissionIndex,
  resolveTerminalModalCommand,
  resolveTerminalModalPointerCommand
} from "../app/ui/pokemonCenterPcModalController.js";

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
  it("shares terminal status legend display data", () => {
    expect(getTerminalStatusLegendItems()).toEqual([
      { label: "Green complete", color: "#9cffb1" },
      { label: "Yellow ready/to do", color: "#ffe28a" },
      { label: "Dark locked", color: "#9aa1ad" }
    ]);
  });

  it("shares terminal mission status type rules", () => {
    expect(getTerminalMissionStatusType("completed")).toMatchObject({
      confirmHint: "Read only",
      guidance: "Completed and archived in the terminal.",
      label: "Complete",
      placeholderLabel: "OK"
    });
    expect(getTerminalMissionStatusType("locked")).toMatchObject({
      confirmHint: "Locked",
      guidance: "Recover more terminal data to reveal this check.",
      label: "Locked",
      placeholderLabel: "?"
    });
    expect(getTerminalMissionStatusType("unknown")).toMatchObject({
      label: "Available",
      palette: { border: "#ffd66d" }
    });
  });

  it("resolves physical keys into terminal modal commands", () => {
    expect(resolveTerminalModalCommand("ArrowRight")).toBe("next");
    expect(resolveTerminalModalCommand("ArrowDown")).toBe("next");
    expect(resolveTerminalModalCommand("ArrowLeft")).toBe("previous");
    expect(resolveTerminalModalCommand("KeyX")).toBe("confirm");
    expect(resolveTerminalModalCommand("Enter")).toBe("confirm");
    expect(resolveTerminalModalCommand("KeyB")).toBe("close");
    expect(resolveTerminalModalCommand("Escape")).toBe("close");
    expect(resolveTerminalModalCommand("KeyQ")).toBe("consume");
  });

  it("resolves pointer actions into terminal modal commands", () => {
    expect(resolveTerminalModalPointerCommand("next")).toBe("next");
    expect(resolveTerminalModalPointerCommand("previous")).toBe("previous");
    expect(resolveTerminalModalPointerCommand("unknown")).toBe("consume");
  });

  it("creates mission card view models before rendering card HTML", () => {
    const viewModel = createTerminalMissionCardViewModel({
      id: "field:boulder",
      title: "Boulder-Shaded Tall Grass",
      description: "Return to the Colony Terminal to log viability.",
      status: "available",
      source: "request",
      actionId: "claim-boulder-reward",
      actionLabel: "Log Viability",
      progress: "1/1",
      imageSrc: "/missions/boulder.png",
      imageAlt: "Boulder check"
    }, 2, 2);

    expect(viewModel).toMatchObject({
      cardMode: "detail",
      detailRows: ["1/1", "X / Enter Log Viability"],
      guidance: "Press X / Enter to Log Viability.",
      imageAlt: "Boulder check",
      imageSrc: "/missions/boulder.png",
      missionSource: "request",
      placeholderLabel: "GO",
      selected: true,
      statusLabel: "Reward Ready"
    });
    expect(viewModel.palette.border).toBe("#ffd66d");
  });

  it("keeps terminal carousel selection rules independent from DOM rendering", () => {
    expect(getWrappedTerminalMissionIndex(3, 3)).toBe(0);
    expect(getWrappedTerminalMissionIndex(-1, 3)).toBe(2);
    expect(getWrappedTerminalMissionIndex(4, 0)).toBe(0);
    expect(getInitialTerminalMissionIndex([
      { status: "locked" },
      { status: "available", actionId: "issue-kit" },
      { status: "available" }
    ])).toBe(1);
    expect(getInitialTerminalMissionIndex([
      { status: "locked" },
      { status: "available" }
    ])).toBe(1);
    expect(getVisibleTerminalMissionIndexes({
      selectedMissionIndex: 0,
      totalMissions: 5
    })).toEqual([0, 1, 2]);
    expect(getVisibleTerminalMissionIndexes({
      selectedMissionIndex: 2,
      totalMissions: 5
    })).toEqual([1, 2, 3]);
    expect(getVisibleTerminalMissionIndexes({
      selectedMissionIndex: 4,
      totalMissions: 5
    })).toEqual([2, 3, 4]);
  });

  it("controls terminal modal music through an isolated component", () => {
    const audio = {
      currentTime: 12,
      loop: false,
      pause: vi.fn(),
      play: vi.fn(() => Promise.resolve()),
      preload: "",
      volume: 0
    };
    const audioFactory = vi.fn(() => audio);
    const musicController = createTerminalModalMusicController({
      audioFactory,
      musicSrc: "/terminal.mp3",
      musicVolume: 0.42
    });

    musicController.play();
    musicController.stop();

    expect(audioFactory).toHaveBeenCalledTimes(1);
    expect(audioFactory).toHaveBeenCalledWith("/terminal.mp3");
    expect(audio.preload).toBe("auto");
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(0.42);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
  });

  it("opens a carousel and confirms the selected actionable mission", () => {
    const { audioFactory, controller, mount, musicAudio } = createController();
    const onConfirm = vi.fn(() => true);

    controller.open({
      builderCallsign: "Ada",
      missions: [
        {
          id: "field:locked",
          title: "????",
          description: "Check data has not been recovered yet.",
          status: "locked",
          source: "request"
        },
        {
          id: "field:boulder",
          title: "Boulder-Shaded Tall Grass",
          description: "Return to the Colony Terminal to log viability.",
          status: "available",
          source: "request",
          actionId: "claim-boulder-reward",
          actionLabel: "Log Viability"
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
    expect(mount.textContent).toContain("Builder Ada");
    expect(mount.textContent).toContain("2/2");
    expect(mount.textContent).toContain("Check 2");
    expect(mount.textContent).toContain("Press X / Enter to Log Viability.");
    expect(mount.textContent).toContain("X / Enter Log Viability");
    expect(mount.textContent).toContain("B / Esc Close");
    expect(modal?.querySelector('[data-pc-action="previous"]')?.getAttribute("aria-label")).toBe("Previous habitat check");
    expect(modal?.querySelector('[data-pc-action="next"]')?.getAttribute("aria-label")).toBe("Next habitat check");

    controller.handleKeydown({ code: "KeyX", preventDefault() {} });

    expect(onConfirm).toHaveBeenCalledWith("claim-boulder-reward", expect.objectContaining({
      id: "field:boulder"
    }));
    expect(controller.isOpen()).toBe(false);
    expect(musicAudio.pause).toHaveBeenCalledTimes(1);
    expect(musicAudio.currentTime).toBe(0);
  });

  it("uses silent audio when the terminal music factory cannot create browser audio", () => {
    const mount = document.createElement("div");
    const audioFactory = vi.fn(() => null);
    const controller = createPokemonCenterPcModalController({
      mount,
      audioFactory,
      musicSrc: "/soundFx/center-computer.mp3"
    });

    expect(() => {
      controller.open({
        missions: [
          {
            id: "field:known",
            title: "Known Mission",
            description: "A visible mission.",
            status: "available",
            source: "request"
          }
        ]
      });
      controller.close();
    }).not.toThrow();

    expect(audioFactory).toHaveBeenCalledWith("/soundFx/center-computer.mp3");
    expect(controller.isOpen()).toBe(false);
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
          description: "Check data has not been recovered yet.",
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

  it("browses missions through delegated nav button commands", () => {
    const { controller, mount } = createController();

    controller.open({
      missions: [
        {
          id: "field:first",
          title: "First Mission",
          description: "The first visible mission.",
          status: "available",
          source: "request"
        },
        {
          id: "field:second",
          title: "Second Mission",
          description: "The second visible mission.",
          status: "available",
          source: "request"
        }
      ]
    });

    mount.querySelector('[data-pc-action="next"]')?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));

    expect(mount.textContent).toContain("2/2");
    expect(mount.querySelector('[aria-selected="true"]')?.textContent).toContain("Second Mission");
  });

  it("does not rerender when selecting the already selected habitat check", () => {
    const { controller, mount } = createController();

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
          id: "field:next",
          title: "Next Mission",
          description: "Another visible mission.",
          status: "available",
          source: "request"
        }
      ]
    });

    const panelBefore = mount.querySelector(".pokemon-center-pc-modal__panel");
    mount.querySelector('[data-pc-mission-index="0"]')?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));

    expect(mount.querySelector(".pokemon-center-pc-modal__panel")).toBe(panelBefore);

    controller.handleKeydown({ code: "ArrowRight", preventDefault() {} });

    expect(mount.querySelector(".pokemon-center-pc-modal__panel")).not.toBe(panelBefore);
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
          description: "Check data has not been recovered yet.",
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
    expect(cards[0]?.getAttribute("role")).toBe("option");
    expect(cards[0]?.getAttribute("aria-selected")).toBe("true");
    expect(cards[0]?.getAttribute("style")).toContain("minmax(136px, 168px)");
    expect(cards[1]?.getAttribute("data-pc-card-mode")).toBe("summary");
    expect(mount.querySelector(".pokemon-center-pc-modal__cards")?.getAttribute("role")).toBe("listbox");
    expect(cards[0]?.querySelector(".pokemon-center-pc-modal__card-image")?.getAttribute("src")).toBe("/missions/done.png");
    expect(cards[1]?.querySelector("[data-pc-mission-image-slot]")).not.toBeNull();
    expect(mount.querySelector(".pokemon-center-pc-modal__panel")?.getAttribute("style")).toContain("max-width: 1180px");
    expect(mount.textContent).toContain("0/3");
  });
});
