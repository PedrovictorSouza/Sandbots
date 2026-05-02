import { describe, expect, it } from "vitest";
import {
  createContextualPromptNotice,
  resolveTransientNoticeRoute
} from "../app/runtime/contextualPromptNotice.js";

describe("contextual prompt notice", () => {
  it("turns missing resource notices into friendly world prompt copy", () => {
    expect(createContextualPromptNotice("Missing: Wood 0/3")).toBe("Need more Wood");
    expect(createContextualPromptNotice("Faltando: Wood 1/3 \u00b7 Stone 0/2")).toBe(
      "Need more Wood and Stone"
    );
  });

  it("does not reroute unrelated notices", () => {
    expect(resolveTransientNoticeRoute("+1 Wood")).toEqual({
      hudMessage: "+1 Wood",
      worldPromptMessage: ""
    });
  });

  it("rents the world prompt for missing resource notices", () => {
    expect(resolveTransientNoticeRoute("Missing: Wood 0/3")).toEqual({
      hudMessage: "",
      worldPromptMessage: "Need more Wood"
    });
  });
});
