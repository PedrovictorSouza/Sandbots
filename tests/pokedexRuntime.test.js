// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createPokedexRuntime } from "../app/runtime/pokedexRuntime.js";

function createLazyUiModuleStub(calls) {
  return () => ({
    preload: vi.fn(),
    invoke(methodName, args) {
      calls.push({ methodName, args });
      return undefined;
    }
  });
}

function createRuntime(overrides = {}) {
  const calls = [];
  const alertButton = document.createElement("button");
  const clearGameFlowInput = vi.fn();
  const runtime = createPokedexRuntime({
    createLazyUiModule: createLazyUiModuleStub(calls),
    root: document.createElement("section"),
    alertButton,
    clearGameFlowInput,
    loadPokedexOverlay: async () => ({
      createPokedexOverlay: () => ({})
    }),
    ...overrides
  });

  return {
    alertButton,
    calls,
    clearGameFlowInput,
    runtime
  };
}

describe("createPokedexRuntime", () => {
  it("keeps the overlay locked until the Pokedex is unlocked", () => {
    const { alertButton, calls, clearGameFlowInput, runtime } = createRuntime();

    runtime.setOpen(true, {
      entryId: "squirtle"
    });

    expect(runtime.state.open).toBe(false);
    expect(calls).toHaveLength(0);
    expect(clearGameFlowInput).not.toHaveBeenCalled();

    runtime.unlock();
    runtime.setOpen(true, {
      entryId: "squirtle"
    });

    expect(runtime.state.open).toBe(true);
    expect(runtime.state.seen).toBe(true);
    expect(alertButton.hidden).toBe(false);
    expect(alertButton.dataset.pulse).toBe("false");
    expect(clearGameFlowInput).toHaveBeenCalledTimes(1);
    expect(calls[0]).toEqual({
      methodName: "setOpen",
      args: [
        true,
        {
          page: "details",
          entryId: "squirtle"
        }
      ]
    });
  });

  it("opens from the alert button after unlock", () => {
    const { alertButton, runtime } = createRuntime();

    runtime.unlock();
    runtime.setSeen(false);
    alertButton.click();

    expect(runtime.state.open).toBe(true);
    expect(runtime.state.seen).toBe(true);
    expect(alertButton.dataset.pulse).toBe("false");
  });

  it("resumes scripted tutorial flow after a scripted close", () => {
    const onScriptedClose = vi.fn();
    const { calls, runtime } = createRuntime({
      onScriptedClose
    });

    runtime.setOpen(true, {
      force: true,
      scripted: true
    });
    runtime.closeFromUser();

    expect(runtime.state.open).toBe(false);
    expect(runtime.state.scripted).toBe(false);
    expect(onScriptedClose).toHaveBeenCalledTimes(1);
    expect(calls.at(-1)).toEqual({
      methodName: "setOpen",
      args: [
        false,
        {
          preservePage: true
        }
      ]
    });
  });
});
