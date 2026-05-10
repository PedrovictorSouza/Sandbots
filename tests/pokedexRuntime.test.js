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
  it("keeps the Pokedex locked until discovery, then opens the discovered entry", () => {
    const { alertButton, calls, clearGameFlowInput, runtime } = createRuntime();

    const lockedOpenResult = runtime.setOpen(true, {
      entryId: "squirtle"
    });

    expect(lockedOpenResult).toBe(false);
    expect(runtime.state.open).toBe(false);
    expect(alertButton.hidden).toBe(true);
    expect(calls).toHaveLength(0);
    expect(clearGameFlowInput).not.toHaveBeenCalled();

    runtime.unlock();
    expect(alertButton.hidden).toBe(false);
    expect(alertButton.dataset.pulse).toBe("true");

    runtime.setOpen(true, {
      entryId: "squirtle"
    });

    expect(runtime.state.open).toBe(true);
    expect(runtime.state.seen).toBe(true);
    expect(alertButton.hidden).toBe(false);
    expect(alertButton.dataset.pulse).toBe("false");
    expect(clearGameFlowInput).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      {
        methodName: "setOpen",
        args: [
          true,
          {
            page: "details",
            entryId: "squirtle"
          }
        ]
      }
    ]);
  });

  it("reveals the alert button after unlock and opens from it", () => {
    const { alertButton, runtime } = createRuntime();

    runtime.unlock();
    runtime.setSeen(false);
    alertButton.click();

    expect(runtime.state.open).toBe(true);
    expect(runtime.state.seen).toBe(true);
    expect(alertButton.hidden).toBe(false);
    expect(alertButton.dataset.pulse).toBe("false");
  });

  it("does not bypass the locked state unless debug/test mode allows it", async () => {
    const onScriptedClose = vi.fn();
    const { calls, clearGameFlowInput, runtime } = createRuntime({
      onScriptedClose
    });

    runtime.setOpen(true, {
      allowLockedOpen: true,
      scripted: true
    });
    await Promise.resolve();

    expect(runtime.state.open).toBe(false);
    expect(runtime.state.scripted).toBe(false);
    expect(runtime.state.seen).toBe(false);
    expect(onScriptedClose).not.toHaveBeenCalled();
    expect(clearGameFlowInput).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it("allows explicit debug/test locked opens for scripted flow tests", async () => {
    const onScriptedClose = vi.fn();
    const { calls, runtime } = createRuntime({
      allowDebugLockedOpen: true,
      onScriptedClose
    });

    runtime.setOpen(true, {
      allowLockedOpen: true,
      scripted: true
    });
    await Promise.resolve();

    expect(runtime.state.open).toBe(true);
    expect(runtime.state.scripted).toBe(true);
    expect(onScriptedClose).not.toHaveBeenCalled();
    expect(calls).toEqual([
      {
        methodName: "setOpen",
        args: [
          true,
          {
            page: "details",
            entryId: null
          }
        ]
      }
    ]);
  });
});
