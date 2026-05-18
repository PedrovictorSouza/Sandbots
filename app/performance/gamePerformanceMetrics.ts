import type { FieldAbilityId } from "../gameplay/content/activeFieldMoveState";

export type GamePerformanceMetricName = "field_move_switch_to_paint";

export type FieldMoveSwitchToPaintMetric = {
  name: "field_move_switch_to_paint";
  value: number;
  activeFieldMoveId: FieldAbilityId | null;
  previousFieldMoveId: FieldAbilityId | null;
  startedAt: number;
  paintedAt: number;
};

export type GamePerformanceMetric = FieldMoveSwitchToPaintMetric;
export type GamePerformanceReporter = (metric: GamePerformanceMetric) => void;

export type MeasureFieldMoveSwitchToPaintOptions = {
  activeFieldMoveId: FieldAbilityId | null;
  previousFieldMoveId: FieldAbilityId | null;
  now: () => number;
  requestAnimationFrame?: ((callback: (timestamp: number) => void) => unknown) | null;
  report?: GamePerformanceReporter | null;
};

export function measureFieldMoveSwitchToPaint({
  activeFieldMoveId,
  previousFieldMoveId,
  now,
  requestAnimationFrame,
  report
}: MeasureFieldMoveSwitchToPaintOptions): boolean {
  if (typeof requestAnimationFrame !== "function" || typeof report !== "function") {
    return false;
  }

  const startedAt = now();

  requestAnimationFrame((timestamp) => {
    const paintedAt = Number.isFinite(timestamp) ? timestamp : now();

    report({
      name: "field_move_switch_to_paint",
      value: Math.max(0, paintedAt - startedAt),
      activeFieldMoveId,
      previousFieldMoveId,
      startedAt,
      paintedAt
    });
  });

  return true;
}

export function createConsoleGamePerformanceReporter({
  enabled = false,
  consoleRef = globalThis.console
}: {
  enabled?: boolean;
  consoleRef?: Pick<Console, "debug"> | null;
} = {}): GamePerformanceReporter | null {
  if (!enabled || typeof consoleRef?.debug !== "function") {
    return null;
  }

  return (metric) => {
    consoleRef.debug("[game-performance]", metric);
  };
}
