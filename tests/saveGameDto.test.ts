import { describe, expect, it } from "vitest";
import { createActiveFieldMoveState } from "../app/gameplay/content/activeFieldMoveState.ts";
import {
  mapActiveFieldMoveStateToSaveGameDto,
  mapSaveGameDtoToActiveFieldMoveState
} from "../app/save/saveGameDto.ts";

describe("saveGameDto", () => {
  it("maps active field move state to the saved activeFieldMoveId DTO", () => {
    expect(
      mapActiveFieldMoveStateToSaveGameDto(createActiveFieldMoveState("waterGun"))
    ).toEqual({
      activeFieldMoveId: "waterGun"
    });
  });

  it("maps saved activeFieldMoveId DTO values back to internal state", () => {
    expect(mapSaveGameDtoToActiveFieldMoveState({
      activeFieldMoveId: "fire"
    })).toEqual({
      kind: "active",
      abilityId: "fire",
      companionId: "charmander"
    });
  });

  it("treats missing or unknown saved activeFieldMoveId values as inactive", () => {
    expect(mapSaveGameDtoToActiveFieldMoveState(null)).toEqual({ kind: "inactive" });
    expect(mapSaveGameDtoToActiveFieldMoveState({})).toEqual({ kind: "inactive" });
    expect(mapSaveGameDtoToActiveFieldMoveState({
      activeFieldMoveId: "squirtle"
    })).toEqual({ kind: "inactive" });
  });
});
