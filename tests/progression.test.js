import { describe, expect, it } from "vitest";
import {
  LEAF_DEN_BUILD_REQUIREMENTS,
  LEAVES_ITEM_ID
} from "../gameplayContent.js";
import { consumeItems } from "../story/progression.js";

describe("progression inventory helpers", () => {
  it("consumes Leaf Den repair materials once and refuses a duplicate turn-in", () => {
    const inventory = {
      wood: LEAF_DEN_BUILD_REQUIREMENTS.wood,
      [LEAVES_ITEM_ID]: LEAF_DEN_BUILD_REQUIREMENTS[LEAVES_ITEM_ID]
    };

    expect(consumeItems(inventory, LEAF_DEN_BUILD_REQUIREMENTS)).toBe(true);
    expect(inventory).toEqual({
      wood: 0,
      [LEAVES_ITEM_ID]: 0
    });

    expect(consumeItems(inventory, LEAF_DEN_BUILD_REQUIREMENTS)).toBe(false);
    expect(inventory).toEqual({
      wood: 0,
      [LEAVES_ITEM_ID]: 0
    });
  });
});
