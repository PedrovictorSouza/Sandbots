import { describe, expect, it } from "vitest";
import {
  resolveRuntimeFlags,
  SKIP_START_SCREEN_STORAGE_KEY
} from "../app/runtime/runtimeFlags.js";

describe("runtimeFlags", () => {
  it("resolves skip-start-screen from query, hash, and storage", () => {
    expect(
      resolveRuntimeFlags({
        searchParams: new URLSearchParams("skipStart=1")
      })
    ).toEqual({ skipStartScreen: true, introRoom: false, scene: null });

    expect(
      resolveRuntimeFlags({
        hash: "#skipStartScreen=true"
      })
    ).toEqual({ skipStartScreen: true, introRoom: false, scene: null });

    expect(
      resolveRuntimeFlags({
        storedSkipStartScreen: "on"
      })
    ).toEqual({ skipStartScreen: true, introRoom: false, scene: null });
  });

  it("resolves intro-room dev flag from query and hash", () => {
    expect(
      resolveRuntimeFlags({
        searchParams: new URLSearchParams("introRoom=1")
      })
    ).toEqual({ skipStartScreen: false, introRoom: true, scene: null });

    expect(
      resolveRuntimeFlags({
        hash: "#skipStartForIntro=true"
      })
    ).toEqual({ skipStartScreen: false, introRoom: true, scene: null });
  });

  it("resolves direct dev scene flags from query and hash", () => {
    expect(
      resolveRuntimeFlags({
        searchParams: new URLSearchParams("scene=gameplay")
      })
    ).toEqual({ skipStartScreen: false, introRoom: false, scene: "gameplay" });

    expect(
      resolveRuntimeFlags({
        hash: "#scene=intro"
      })
    ).toEqual({ skipStartScreen: false, introRoom: true, scene: "intro" });

    expect(
      resolveRuntimeFlags({
        searchParams: new URLSearchParams("scene=tutorial")
      })
    ).toEqual({ skipStartScreen: false, introRoom: false, scene: "tutorial" });

    expect(
      resolveRuntimeFlags({
        searchParams: new URLSearchParams("scene=unknown")
      })
    ).toEqual({ skipStartScreen: false, introRoom: false, scene: null });
  });

  it("defaults skip-start-screen to false", () => {
    expect(resolveRuntimeFlags()).toEqual({ skipStartScreen: false, introRoom: false, scene: null });
    expect(SKIP_START_SCREEN_STORAGE_KEY).toBe("small-island:skip-start-screen");
  });
});
