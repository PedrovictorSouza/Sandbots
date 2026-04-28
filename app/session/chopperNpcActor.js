const CHOPPER_NPC_BASE_Y = 1.35;
const CHOPPER_NPC_SCALE = 0.575;
const CHOPPER_NPC_YAW = 0.65;
const CHOPPER_NPC_PROPELLER_SPEED = 26;
const CHOPPER_NPC_PROPELLER_PIVOT = [0.125, 2, 0];
const CHOPPER_NPC_FLIGHT_LIFT = 0.78;

function getNpcPosition(npcActor) {
  return npcActor?.character?.getPosition?.() || npcActor?.position || [0, 0, 0];
}

function setNpcPosition(npcActor, position) {
  if (typeof npcActor?.character?.setPosition === "function") {
    npcActor.character.setPosition(position);
    return;
  }

  if (npcActor) {
    npcActor.position = [...position];
  }
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function getYawToward(fromPosition, toPosition) {
  const deltaX = toPosition[0] - fromPosition[0];
  const deltaZ = toPosition[2] - fromPosition[2];
  return Math.atan2(deltaX, deltaZ);
}

function syncChopperNpcInstances(actor, {
  idleYaw = 0,
  idlePitch = 0,
  idleRoll = 0,
  idleX = 0,
  idleY = 0,
  idleZ = 0
} = {}) {
  const position = getNpcPosition(actor.npcActor);
  const baseYaw = Number.isFinite(actor.npcActor?.faceYaw) ?
    actor.npcActor.faceYaw :
    CHOPPER_NPC_YAW;
  const offset = [
    position[0] + idleX,
    position[1] + CHOPPER_NPC_BASE_Y + actor.flightLift + idleY,
    position[2] + idleZ
  ];
  const yaw = baseYaw + idleYaw;

  actor.bodyInstance.offset = offset;
  actor.bodyInstance.scale = CHOPPER_NPC_SCALE;
  actor.bodyInstance.yaw = yaw;
  actor.bodyInstance.pitch = idlePitch;
  actor.bodyInstance.roll = idleRoll;
  actor.bodyInstance.active = actor.active;

  actor.propellerInstance.offset = offset;
  actor.propellerInstance.scale = CHOPPER_NPC_SCALE;
  actor.propellerInstance.yaw = yaw;
  actor.propellerInstance.pitch = idlePitch;
  actor.propellerInstance.roll = idleRoll;
  actor.propellerInstance.localYaw = actor.propellerAngle;
  actor.propellerInstance.localPivot = CHOPPER_NPC_PROPELLER_PIVOT;
  actor.propellerInstance.active = actor.active;
}

export function createChopperNpcActor({ npcActor }) {
  const actor = {
    id: "chopper-npc",
    sourceNpcId: npcActor.id,
    npcActor,
    active: true,
    elapsed: 0,
    flightLift: 0,
    scriptedFlight: null,
    propellerAngle: 0,
    bodyInstance: {
      offset: [...getNpcPosition(npcActor)],
      scale: CHOPPER_NPC_SCALE,
      yaw: CHOPPER_NPC_YAW,
      pitch: 0,
      roll: 0,
      active: true
    },
    propellerInstance: {
      offset: [...getNpcPosition(npcActor)],
      scale: CHOPPER_NPC_SCALE,
      yaw: CHOPPER_NPC_YAW,
      pitch: 0,
      roll: 0,
      localYaw: 0,
      localPivot: CHOPPER_NPC_PROPELLER_PIVOT,
      active: true
    }
  };

  syncChopperNpcInstances(actor);
  return actor;
}

export function startChopperNpcFlight(actor, {
  targetPosition,
  duration = 0.95,
  onComplete = null
} = {}) {
  if (!actor || !Array.isArray(targetPosition)) {
    return false;
  }

  const startPosition = getNpcPosition(actor.npcActor);
  actor.scriptedFlight = {
    startPosition: [...startPosition],
    targetPosition: [...targetPosition],
    duration: Math.max(0.001, duration),
    elapsed: 0,
    onComplete
  };
  actor.flightLift = 0;
  actor.npcActor.faceYaw = getYawToward(startPosition, targetPosition);
  return true;
}

function updateScriptedFlight(actor, deltaTime) {
  const flight = actor.scriptedFlight;
  if (!flight) {
    actor.flightLift = 0;
    return;
  }

  flight.elapsed = Math.min(flight.duration, flight.elapsed + deltaTime);
  const progress = flight.elapsed / flight.duration;
  const easedProgress = easeOutCubic(progress);
  const nextPosition = [
    flight.startPosition[0] + (flight.targetPosition[0] - flight.startPosition[0]) * easedProgress,
    flight.startPosition[1] + (flight.targetPosition[1] - flight.startPosition[1]) * easedProgress,
    flight.startPosition[2] + (flight.targetPosition[2] - flight.startPosition[2]) * easedProgress
  ];

  actor.flightLift = Math.sin(progress * Math.PI) * CHOPPER_NPC_FLIGHT_LIFT;
  actor.npcActor.faceYaw = getYawToward(nextPosition, flight.targetPosition);
  setNpcPosition(actor.npcActor, nextPosition);

  if (progress < 1) {
    return;
  }

  const onComplete = flight.onComplete;
  actor.scriptedFlight = null;
  actor.flightLift = 0;
  setNpcPosition(actor.npcActor, flight.targetPosition);
  if (typeof onComplete === "function") {
    onComplete();
  }
}

export function updateChopperNpcActor(actor, {
  deltaTime = 0,
  storyState,
  isNpcActive
} = {}) {
  if (!actor) {
    return;
  }

  actor.elapsed += deltaTime;
  actor.propellerAngle =
    (actor.propellerAngle + deltaTime * CHOPPER_NPC_PROPELLER_SPEED) % (Math.PI * 2);
  updateScriptedFlight(actor, deltaTime);
  actor.active = typeof isNpcActive === "function" ?
    isNpcActive(actor.npcActor, storyState) :
    true;

  const time = actor.elapsed;
  syncChopperNpcInstances(actor, {
    idleYaw: Math.sin(time * 1.35) * 0.035,
    idlePitch: Math.sin(time * 1.2 + 0.4) * 0.025,
    idleRoll: Math.sin(time * 1.45 + 0.8) * 0.045,
    idleX: Math.sin(time * 1.05) * 0.055,
    idleY: Math.sin(time * 2.15) * 0.085,
    idleZ: Math.cos(time * 0.95) * 0.035
  });
}
