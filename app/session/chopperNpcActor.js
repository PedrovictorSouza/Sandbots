const CHOPPER_NPC_BASE_Y = 1.35;
const CHOPPER_NPC_SCALE = 0.575;
const CHOPPER_NPC_YAW = 0.65;
const CHOPPER_NPC_PROPELLER_SPEED = 26;
const CHOPPER_NPC_PROPELLER_PIVOT = [0.125, 2, 0];

function getNpcPosition(npcActor) {
  return npcActor?.character?.getPosition?.() || npcActor?.position || [0, 0, 0];
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
  const offset = [
    position[0] + idleX,
    position[1] + CHOPPER_NPC_BASE_Y + idleY,
    position[2] + idleZ
  ];
  const yaw = CHOPPER_NPC_YAW + idleYaw;

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
