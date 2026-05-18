export const FIELD_ABILITY_COMPANION_BY_ID = {
  waterGun: "squirtle",
  leafage: "bulbasaur",
  fire: "charmander",
} as const;

export type FieldAbilityId = keyof typeof FIELD_ABILITY_COMPANION_BY_ID;
export type FieldAbilityCompanionId =
  (typeof FIELD_ABILITY_COMPANION_BY_ID)[FieldAbilityId];

export type FieldAbilityPair = {
  [AbilityId in FieldAbilityId]: {
    abilityId: AbilityId;
    companionId: (typeof FIELD_ABILITY_COMPANION_BY_ID)[AbilityId];
  };
}[FieldAbilityId];

export type FieldAbilityPairFor<AbilityId extends FieldAbilityId> = Extract<
  FieldAbilityPair,
  { abilityId: AbilityId }
>;

export type ActiveFieldMoveState =
  | { kind: "inactive" }
  | ({ kind: "active" } & FieldAbilityPair);

export function createInactiveFieldMoveState(): ActiveFieldMoveState {
  return { kind: "inactive" };
}

export function isFieldAbilityId(value: unknown): value is FieldAbilityId {
  return (
    typeof value === "string" &&
    Object.hasOwn(FIELD_ABILITY_COMPANION_BY_ID, value)
  );
}

export function createActiveFieldMoveState(
  abilityId: FieldAbilityId
): ActiveFieldMoveState {
  return {
    kind: "active",
    abilityId,
    companionId: FIELD_ABILITY_COMPANION_BY_ID[abilityId],
  };
}

export function getActiveFieldMoveStateFromAbilityId(
  abilityId: unknown
): ActiveFieldMoveState {
  if (!isFieldAbilityId(abilityId)) {
    return createInactiveFieldMoveState();
  }

  return createActiveFieldMoveState(abilityId);
}

export function getActiveFieldMoveAbilityId(
  state: ActiveFieldMoveState
): FieldAbilityId | null {
  return state.kind === "active" ? state.abilityId : null;
}
