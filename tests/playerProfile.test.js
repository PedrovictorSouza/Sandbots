import { describe, expect, it } from "vitest";
import {
  PLAYER_DISPLAY_NAME_FALLBACK,
  applySavedPlayerProfile,
  clonePlayerProfileState,
  confirmPlayerName,
  createPlayerProfileState,
  getPlayerDisplayName,
  hasConfirmedPlayerName
} from "../app/player/playerProfile.js";

describe("playerProfile", () => {
  it("uses a safe fallback display name until a name is confirmed", () => {
    const profile = createPlayerProfileState();

    expect(getPlayerDisplayName(profile)).toBe(PLAYER_DISPLAY_NAME_FALLBACK);
    expect(hasConfirmedPlayerName(profile)).toBe(false);
  });

  it("stores confirmed player names in normalized profile state", () => {
    const profile = createPlayerProfileState();

    expect(confirmPlayerName(profile, {
      playerName: "  Ada Lovelace  ",
      nameConfirmation: "yes"
    })).toBe(true);

    expect(profile.playerName).toBe("Ada Lovelace");
    expect(getPlayerDisplayName(profile)).toBe("Ada Lovelace");
    expect(hasConfirmedPlayerName(profile)).toBe(true);
  });

  it("clones and restores persisted profile state", () => {
    const profile = createPlayerProfileState({
      playerName: "Ada",
      nameConfirmation: "yes",
      foundPokedex: true
    });
    const restored = createPlayerProfileState();

    expect(applySavedPlayerProfile(restored, clonePlayerProfileState(profile))).toBe(true);
    expect(restored).toMatchObject({
      playerName: "Ada",
      nameConfirmation: "yes",
      foundPokedex: true
    });
  });
});
