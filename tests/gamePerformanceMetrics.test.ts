import { describe, expect, it, vi } from "vitest";
import {
  createConsoleGamePerformanceReporter,
  measureFieldMoveSwitchToPaint
} from "../app/performance/gamePerformanceMetrics.ts";

describe("gamePerformanceMetrics", () => {
  it("measures field move switch time to the next paint frame", () => {
    const report = vi.fn();
    const requestAnimationFrame = vi.fn((callback: (timestamp: number) => void) => {
      callback(26);
      return 1;
    });

    const scheduled = measureFieldMoveSwitchToPaint({
      activeFieldMoveId: "leafage",
      previousFieldMoveId: "waterGun",
      now: () => 10,
      requestAnimationFrame,
      report
    });

    expect(scheduled).toBe(true);
    expect(report).toHaveBeenCalledWith({
      name: "field_move_switch_to_paint",
      value: 16,
      activeFieldMoveId: "leafage",
      previousFieldMoveId: "waterGun",
      startedAt: 10,
      paintedAt: 26
    });
  });

  it("does not schedule measurement without a reporter", () => {
    const requestAnimationFrame = vi.fn();

    expect(measureFieldMoveSwitchToPaint({
      activeFieldMoveId: "fire",
      previousFieldMoveId: "leafage",
      now: () => 10,
      requestAnimationFrame,
      report: null
    })).toBe(false);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("creates a console reporter only when enabled", () => {
    const consoleRef = { debug: vi.fn() };
    const disabledReporter = createConsoleGamePerformanceReporter({
      enabled: false,
      consoleRef
    });
    const enabledReporter = createConsoleGamePerformanceReporter({
      enabled: true,
      consoleRef
    });

    expect(disabledReporter).toBeNull();
    enabledReporter?.({
      name: "field_move_switch_to_paint",
      value: 12,
      activeFieldMoveId: "fire",
      previousFieldMoveId: "leafage",
      startedAt: 20,
      paintedAt: 32
    });
    expect(consoleRef.debug).toHaveBeenCalledWith("[game-performance]", {
      name: "field_move_switch_to_paint",
      value: 12,
      activeFieldMoveId: "fire",
      previousFieldMoveId: "leafage",
      startedAt: 20,
      paintedAt: 32
    });
  });
});
