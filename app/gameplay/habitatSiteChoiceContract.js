import { WORKBENCH_POSITION } from "../../gameplayContent.js";

export const HABITAT_SITE_CRITERION = Object.freeze({
  POWERED: "powered",
  CLEAR: "clear",
  STABLE_GROUND: "stable-ground",
  NEAR_WORKBENCH: "near-workbench",
  EXPANDABLE: "expandable"
});

export const HABITAT_SITE_REASON_STATE = Object.freeze({
  PASS: "pass",
  WARN: "warn",
  FAIL: "fail"
});

export const DEFAULT_HABITAT_SITE_THRESHOLDS = Object.freeze({
  workbenchRadius: 42,
  solarStationRadius: 28,
  expandableRadius: 5
});

function distance2d(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return Infinity;
  }

  return Math.hypot(Number(a[0]) - Number(b[0]), Number(a[2]) - Number(b[2]));
}

function hasPosition(position) {
  return Array.isArray(position) &&
    Number.isFinite(Number(position[0])) &&
    Number.isFinite(Number(position[2]));
}

function normalizeFootprint(footprint = [1, 1]) {
  return [
    Math.max(0.01, Number(footprint?.[0]) || 1),
    Math.max(0.01, Number(footprint?.[1]) || 1)
  ];
}

function overlapsFootprint(position, footprint, blocker, padding = 0.12) {
  if (!hasPosition(position) || !hasPosition(blocker?.position)) {
    return false;
  }

  const [width, depth] = normalizeFootprint(footprint);
  const [blockerWidth, blockerDepth] = normalizeFootprint(blocker.size);
  const dx = Math.abs(Number(position[0]) - Number(blocker.position[0]));
  const dz = Math.abs(Number(position[2]) - Number(blocker.position[2]));

  return dx < (width + blockerWidth) * 0.5 + padding &&
    dz < (depth + blockerDepth) * 0.5 + padding;
}

function createReason(criterion, state, label, detail) {
  return Object.freeze({ criterion, state, label, detail });
}

function isStableGround(groundState) {
  return ["stable", "restored", "grass", "soil", "clear"].includes(String(groundState || "stable"));
}

export function evaluateHabitatSiteChoice({
  position,
  footprint = [3, 3],
  blockers = [],
  groundState = "stable",
  requiresPower = false,
  solarStationPosition = null,
  workbenchPosition = WORKBENCH_POSITION,
  thresholds = DEFAULT_HABITAT_SITE_THRESHOLDS
} = {}) {
  const safeThresholds = {
    ...DEFAULT_HABITAT_SITE_THRESHOLDS,
    ...(thresholds || {})
  };
  const reasons = [];
  const collidingBlocker = (blockers || []).find((blocker) =>
    overlapsFootprint(position, footprint, blocker)
  );
  const nearbyBlocker = (blockers || []).find((blocker) =>
    distance2d(position, blocker?.position) < safeThresholds.expandableRadius
  );

  reasons.push(collidingBlocker ?
    createReason(
      HABITAT_SITE_CRITERION.CLEAR,
      HABITAT_SITE_REASON_STATE.FAIL,
      "Blocked",
      `Overlaps ${collidingBlocker.kind || collidingBlocker.id || "another object"}.`
    ) :
    createReason(
      HABITAT_SITE_CRITERION.CLEAR,
      HABITAT_SITE_REASON_STATE.PASS,
      "Clear",
      "No construction overlap."
    ));

  reasons.push(isStableGround(groundState) ?
    createReason(
      HABITAT_SITE_CRITERION.STABLE_GROUND,
      HABITAT_SITE_REASON_STATE.PASS,
      "Stable ground",
      "Ground can hold a habitat."
    ) :
    createReason(
      HABITAT_SITE_CRITERION.STABLE_GROUND,
      HABITAT_SITE_REASON_STATE.FAIL,
      "Unstable ground",
      "Restore or clear the ground before building here."
    ));

  if (requiresPower) {
    const solarDistance = distance2d(position, solarStationPosition);
    reasons.push(solarDistance <= safeThresholds.solarStationRadius ?
      createReason(
        HABITAT_SITE_CRITERION.POWERED,
        HABITAT_SITE_REASON_STATE.PASS,
        "Powered",
        "Inside Solar Station support radius."
      ) :
      createReason(
        HABITAT_SITE_CRITERION.POWERED,
        HABITAT_SITE_REASON_STATE.FAIL,
        "No power support",
        "Place inside a Solar Station support radius."
      ));
  }

  const workbenchDistance = distance2d(position, workbenchPosition);
  reasons.push(workbenchDistance <= safeThresholds.workbenchRadius ?
    createReason(
      HABITAT_SITE_CRITERION.NEAR_WORKBENCH,
      HABITAT_SITE_REASON_STATE.PASS,
      "Near Workbench",
      "Close enough for early building runs."
    ) :
    createReason(
      HABITAT_SITE_CRITERION.NEAR_WORKBENCH,
      HABITAT_SITE_REASON_STATE.WARN,
      "Far from Workbench",
      "Buildable, but return trips will take longer."
    ));

  reasons.push(nearbyBlocker && !collidingBlocker ?
    createReason(
      HABITAT_SITE_CRITERION.EXPANDABLE,
      HABITAT_SITE_REASON_STATE.WARN,
      "Tight site",
      "Valid, but expansion room is limited."
    ) :
    createReason(
      HABITAT_SITE_CRITERION.EXPANDABLE,
      HABITAT_SITE_REASON_STATE.PASS,
      "Expandable",
      "Enough room for the next colony object."
    ));

  return Object.freeze({
    valid: reasons.every((reason) => reason.state !== HABITAT_SITE_REASON_STATE.FAIL),
    reasons: Object.freeze(reasons),
    positiveReasons: Object.freeze(reasons.filter((reason) => reason.state === HABITAT_SITE_REASON_STATE.PASS)),
    warningReasons: Object.freeze(reasons.filter((reason) => reason.state === HABITAT_SITE_REASON_STATE.WARN)),
    blockingReasons: Object.freeze(reasons.filter((reason) => reason.state === HABITAT_SITE_REASON_STATE.FAIL))
  });
}
