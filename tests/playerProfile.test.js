import { describe, expect, it } from "vitest";
import {
  PLAYER_DISPLAY_NAME_FALLBACK,
  applySavedPlayerProfile,
  clonePlayerProfileState,
  confirmPlayerName,
  createPlayerProfileState,
  formatBuilderCallsignAcknowledgement,
  formatBuilderCallsignRegisteredNotice,
  formatHouseRegisteredNotice,
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

  it("formats Builder callsign registration notices from profile state", () => {
    expect(formatBuilderCallsignRegisteredNotice({
      playerName: "Ada"
    })).toBe("Chopper will call you Ada.");

    expect(formatBuilderCallsignRegisteredNotice()).toBe(
      "Chopper will call you Operator."
    );
  });

  it("formats Chopper acknowledgement from the Builder callsign", () => {
    expect(formatBuilderCallsignAcknowledgement({
      playerName: "Ada"
    })).toBe("Logged, Ada. I will pretend the registry always said that.");

    expect(formatBuilderCallsignAcknowledgement()).toBe(
      "Logged, Operator. I will pretend the registry always said that."
    );
  });

  it("formats House registration notices from the Builder callsign", () => {
    expect(formatHouseRegisteredNotice({
      playerName: "Ada"
    })).toBe("Ada's first house is registered.");

    expect(formatHouseRegisteredNotice()).toBe(
      "Operator's first house is registered."
    );
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
