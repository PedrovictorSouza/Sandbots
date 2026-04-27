import { describe, expect, it, vi } from "vitest";
import { createGameFlowController, GAME_FLOW } from "../gameFlow.js";

describe("createGameFlowController", () => {
  it("walks the canonical game boot flow", () => {
    const onChange = vi.fn();
    const flow = createGameFlowController({ onChange });

    expect(flow.getCurrent()).toBe(GAME_FLOW.START);
    expect(flow.is(GAME_FLOW.START)).toBe(true);
    expect(flow.canTransition(GAME_FLOW.INTRO)).toBe(true);

    flow.transition(GAME_FLOW.INTRO);
    flow.transition(GAME_FLOW.CINEMATIC);
    flow.transition(GAME_FLOW.TUTORIAL);
    flow.transition(GAME_FLOW.GAMEPLAY);

    expect(flow.getCurrent()).toBe(GAME_FLOW.GAMEPLAY);
    expect(onChange).toHaveBeenNthCalledWith(1, { previous: null, current: GAME_FLOW.START });
    expect(onChange).toHaveBeenNthCalledWith(2, { previous: GAME_FLOW.START, current: GAME_FLOW.INTRO });
    expect(onChange).toHaveBeenNthCalledWith(3, { previous: GAME_FLOW.INTRO, current: GAME_FLOW.CINEMATIC });
    expect(onChange).toHaveBeenNthCalledWith(4, { previous: GAME_FLOW.CINEMATIC, current: GAME_FLOW.TUTORIAL });
    expect(onChange).toHaveBeenNthCalledWith(5, { previous: GAME_FLOW.TUTORIAL, current: GAME_FLOW.GAMEPLAY });
  });

  it("rejects invalid transitions", () => {
    const flow = createGameFlowController();

    expect(() => flow.transition(GAME_FLOW.CINEMATIC)).toThrow("Transicao de fluxo invalida");
    expect(() => flow.transition("unknown")).toThrow("Fluxo desconhecido");
  });

  it("allows direct start to gameplay for debug boot modes", () => {
    const flow = createGameFlowController();

    expect(flow.canTransition(GAME_FLOW.GAMEPLAY)).toBe(true);
    flow.transition(GAME_FLOW.GAMEPLAY);

    expect(flow.getCurrent()).toBe(GAME_FLOW.GAMEPLAY);
  });

  it("allows cinematic workbench handoff directly into gameplay", () => {
    const flow = createGameFlowController({ initialFlow: GAME_FLOW.CINEMATIC });

    expect(flow.canTransition(GAME_FLOW.GAMEPLAY)).toBe(true);
    flow.transition(GAME_FLOW.GAMEPLAY);

    expect(flow.getCurrent()).toBe(GAME_FLOW.GAMEPLAY);
  });
});
