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
  it("keeps the Pokedex screen hidden even after unlock", () => {
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

    expect(runtime.state.open).toBe(false);
    expect(runtime.state.seen).toBe(true);
    expect(alertButton.hidden).toBe(true);
    expect(alertButton.dataset.pulse).toBe("false");
    expect(clearGameFlowInput).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(0);
  });

  it("keeps the alert button disabled after unlock", () => {
    const { alertButton, runtime } = createRuntime();

    runtime.unlock();
    runtime.setSeen(false);
    alertButton.click();

    expect(runtime.state.open).toBe(false);
    expect(runtime.state.seen).toBe(true);
    expect(alertButton.hidden).toBe(true);
    expect(alertButton.dataset.pulse).toBe("false");
  });

  it("resumes scripted tutorial flow without opening the disabled screen", async () => {
    const onScriptedClose = vi.fn();
    const { calls, runtime } = createRuntime({
      onScriptedClose
    });

    runtime.setOpen(true, {
      force: true,
      scripted: true
    });
    await Promise.resolve();

    expect(runtime.state.open).toBe(false);
    expect(runtime.state.scripted).toBe(false);
    expect(onScriptedClose).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(0);
  });
});
