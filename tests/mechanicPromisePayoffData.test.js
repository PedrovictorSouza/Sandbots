import { describe, expect, it } from "vitest";
import {
  MECHANIC_PROMISE_PAYOFF_IDS,
  getMechanicPromisePayoffById,
  listMechanicPromisePayoffs,
  validateMechanicPromisePayoffMatrix
} from "../app/story/mechanicPromisePayoffData.js";

describe("mechanic promise/payoff data", () => {
  it("defines the current core mechanics in stable order", () => {
    expect(listMechanicPromisePayoffs().map((entry) => entry.id)).toEqual([
      MECHANIC_PROMISE_PAYOFF_IDS.BUILDER_CALLSIGN,
      MECHANIC_PROMISE_PAYOFF_IDS.HYDRO_JET,
      MECHANIC_PROMISE_PAYOFF_IDS.BIO_GROW,
      MECHANIC_PROMISE_PAYOFF_IDS.WORKBENCH,
      MECHANIC_PROMISE_PAYOFF_IDS.COLONY_TERMINAL,
      MECHANIC_PROMISE_PAYOFF_IDS.SOLAR_STATION,
      MECHANIC_PROMISE_PAYOFF_IDS.HOUSE_KIT
    ]);
    expect(Object.isFrozen(listMechanicPromisePayoffs())).toBe(true);
    expect(Object.isFrozen(listMechanicPromisePayoffs()[0])).toBe(true);
  });

  it("connects mechanics to player action, feedback, consequence and future dependency", () => {
    expect(getMechanicPromisePayoffById(MECHANIC_PROMISE_PAYOFF_IDS.BUILDER_CALLSIGN)).toMatchObject({
      playerAction: expect.stringContaining("confirm"),
      immediateFeedback: expect.stringContaining("logs"),
      futureDependency: expect.stringContaining("House")
    });
    expect(getMechanicPromisePayoffById(MECHANIC_PROMISE_PAYOFF_IDS.SOLAR_STATION)).toMatchObject({
      immediateFeedback: expect.stringContaining("blue cells"),
      systemConsequence: expect.stringContaining("House Kit")
    });
    expect(getMechanicPromisePayoffById(MECHANIC_PROMISE_PAYOFF_IDS.HYDRO_JET)).toMatchObject({
      futureDependency: expect.stringContaining("Bio-Grow")
    });
  });

  it("validates missing ids, duplicates, missing fields and missing required mechanics", () => {
    expect(validateMechanicPromisePayoffMatrix()).toEqual([]);

    expect(validateMechanicPromisePayoffMatrix({
      requiredIds: ["alpha", "missing"],
      matrix: [
        {
          id: "alpha",
          label: "Alpha",
          worldObject: "Object",
          playerAction: "Action",
          immediateFeedback: "Feedback",
          systemConsequence: "Consequence",
          narrativeMeaning: "Meaning",
          futureDependency: "Dependency"
        },
        {
          id: "alpha",
          label: "",
          worldObject: "Object",
          playerAction: "Action",
          immediateFeedback: "Feedback",
          systemConsequence: "Consequence",
          narrativeMeaning: "Meaning",
          futureDependency: "Dependency"
        },
        {
          label: "No id"
        }
      ]
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "duplicate-id", id: "alpha" }),
      expect.objectContaining({ type: "missing-id", index: 2 }),
      expect.objectContaining({ type: "missing-field", id: "alpha", field: "label" }),
      expect.objectContaining({ type: "missing-field", field: "worldObject" }),
      expect.objectContaining({ type: "missing-required-mechanic", id: "missing" })
    ]));
  });
});
