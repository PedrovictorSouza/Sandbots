import type {
  ActiveFieldMoveState,
  FieldAbilityId
} from "../gameplay/content/activeFieldMoveState";
import {
  getActiveFieldMoveAbilityId,
  getActiveFieldMoveStateFromAbilityId
} from "../gameplay/content/activeFieldMoveState";

export type SaveGameDto = {
  activeFieldMoveId: FieldAbilityId | null;
};

export type SaveGameDtoLike =
  | { activeFieldMoveId?: unknown }
  | null
  | undefined;

export function mapActiveFieldMoveStateToSaveGameDto(
  activeFieldMoveState: ActiveFieldMoveState
): SaveGameDto {
  return {
    activeFieldMoveId: getActiveFieldMoveAbilityId(activeFieldMoveState)
  };
}

export function mapSaveGameDtoToActiveFieldMoveState(
  saveGameDto: SaveGameDtoLike
): ActiveFieldMoveState {
  return getActiveFieldMoveStateFromAbilityId(saveGameDto?.activeFieldMoveId ?? null);
}
