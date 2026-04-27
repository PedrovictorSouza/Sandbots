"use client";

import React, { useState } from "react";
import PragtGridTool from "./PragtGridTool.jsx";
import PragtSpecificityTool from "./PragtSpecificityTool.jsx";
import PragtInspector from "./PragtInspector.jsx";

export default function PragtCssTool(props) {
  const [active, setActive] = useState("grid");

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div>
      <div style={{ position: "fixed", right: 12, top: 12, zIndex: 9999, display: "flex", gap: 8 }}>
        <button onClick={() => setActive("grid")} style={{ padding: "6px 8px" }}>
          Grid
        </button>
        <button onClick={() => setActive("specificity")} style={{ padding: "6px 8px" }}>
          Specificity
        </button>
        <button onClick={() => setActive("inspector")} style={{ padding: "6px 8px" }}>
          Inspector
        </button>
      </div>

      <div
        style={{
          position: "fixed",
          right: 12,
          top: 52,
          zIndex: 9998,
          width: "min(1480px, calc(100vw - 24px))",
          maxWidth: "calc(100vw - 24px)",
          display: "flex",
          justifyContent: "flex-end"
        }}
      >
        {active === "grid" && <PragtGridTool {...props} />}
        {active === "specificity" && <PragtSpecificityTool {...props} />}
        {active === "inspector" && <PragtInspector {...props} />}
      </div>
    </div>
  );
}
