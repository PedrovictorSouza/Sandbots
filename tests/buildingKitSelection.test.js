// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { LEAF_DEN_KIT_ITEM_ID } from "../gameplayContent.js";
import { resolveSelectableBuildingKit } from "../app/bootstrap/createApplicationRuntime.js";

describe("building kit inventory selection", () => {
  it("selects an owned House Kit when building placement is available", () => {
    expect(resolveSelectableBuildingKit({
      storyState: {
        flags: {
          leafDenBuildAvailable: true,
          leafDenKitPlaced: false
        }
      },
      inventory: {
        [LEAF_DEN_KIT_ITEM_ID]: 1
      }
    })).toMatchObject({
      itemId: LEAF_DEN_KIT_ITEM_ID,
      name: "House Kit"
    });
  });

  it("does not select a building kit that is missing", () => {
    expect(resolveSelectableBuildingKit({
      storyState: {
        flags: {
          leafDenBuildAvailable: true,
          leafDenKitPlaced: false
        }
      },
      inventory: {}
    })).toBeNull();
  });

  it("selects another House Kit after the first house is already placed", () => {
    expect(resolveSelectableBuildingKit({
      storyState: {
        flags: {
          leafDenBuildAvailable: true,
          leafDenKitPlaced: true
        }
      },
      inventory: {
        [LEAF_DEN_KIT_ITEM_ID]: 1
      }
    })).toMatchObject({
      itemId: LEAF_DEN_KIT_ITEM_ID,
      name: "House Kit"
    });
  });
});
