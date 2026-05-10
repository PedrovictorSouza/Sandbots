const HELPER_ROBOT_IDS = new Set(["squirtle", "bulbasaur", "charmander", "timburr"]);

const HELPER_FOLLOW_FLAGS = Object.freeze({
  squirtle: "squirtleFollowing",
  bulbasaur: "bulbasaurFollowing",
  charmander: "charmanderFollowing",
  timburr: "timburrFollowing"
});

function getFlags(storyState = {}) {
  storyState.flags ||= {};
  return storyState.flags;
}

function toFlagPrefix(robotId) {
  return `${robotId}Robot`;
}

export function markHelperRobotDetected(storyState, robotId, {
  source = "discovery"
} = {}) {
  if (!HELPER_ROBOT_IDS.has(robotId)) {
    return false;
  }

  const flags = getFlags(storyState);
  const prefix = toFlagPrefix(robotId);

  flags[`${prefix}Detected`] = true;
  flags[`${prefix}DiscoverySource`] ||= source;
  return true;
}

export function reactivateHelperRobot(storyState, robotId, {
  source = "repair",
  follow = true
} = {}) {
  if (!HELPER_ROBOT_IDS.has(robotId)) {
    return false;
  }

  const flags = getFlags(storyState);
  const prefix = toFlagPrefix(robotId);

  markHelperRobotDetected(storyState, robotId, { source });
  flags[`${prefix}Reactivated`] = true;
  flags[`${prefix}ReactivationSource`] ||= source;
  flags.reactivatedHelperRobotIds ||= [];
  if (!flags.reactivatedHelperRobotIds.includes(robotId)) {
    flags.reactivatedHelperRobotIds.push(robotId);
  }

  if (follow && HELPER_FOLLOW_FLAGS[robotId]) {
    flags[HELPER_FOLLOW_FLAGS[robotId]] = true;
  }

  return true;
}

export function isHelperRobotReactivated(storyState = {}, robotId) {
  if (!HELPER_ROBOT_IDS.has(robotId)) {
    return false;
  }

  return Boolean(storyState.flags?.[`${toFlagPrefix(robotId)}Reactivated`]);
}
