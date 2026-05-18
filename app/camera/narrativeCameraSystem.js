export const NARRATIVE_CAMERA_BEAT_TYPES = Object.freeze({
  CONFIRM: "confirm",
  CONVERSATION: "conversation",
  ESTABLISH: "establish",
  FOCUS: "focus",
  FOLLOW: "follow",
  RETURN: "return",
  REVEAL: "reveal"
});

export const NARRATIVE_CAMERA_IMPORTANCE = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

export const NARRATIVE_CAMERA_INTENT_TYPES = Object.freeze({
  CONVERSATION: "conversation",
  FALLBACK: "fallback",
  FOCUS: "focus",
  FOLLOW: "follow",
  RETURN: "return"
});

export const NARRATIVE_CAMERA_GRAMMAR = Object.freeze({
  follow: {
    question: "Where am I, what can I touch, and what changed?",
    control: "gameplay"
  },
  focus: {
    question: "What object should I notice next?",
    duration: 1.2,
    height: 0.9,
    zoom: 4.45,
    distance: 6.2,
    control: "soft"
  },
  reveal: {
    question: "What appeared, woke up, or changed state?",
    duration: 2.4,
    height: 1.05,
    zoom: 4.2,
    distance: 5.8,
    control: "locked"
  },
  confirm: {
    question: "What consequence did my action create?",
    duration: 1.1,
    height: 0.9,
    zoom: 4.55,
    distance: 6,
    control: "soft"
  },
  establish: {
    question: "Where is this new area or structure in the colony?",
    duration: 1.6,
    height: 1.1,
    zoom: 3.65,
    distance: 7.2,
    control: "soft"
  },
  conversation: {
    question: "Who is talking to me, and what do they need?",
    duration: 0.45,
    control: "dialogue"
  },
  return: {
    question: "Can I act again?",
    duration: 0.45,
    control: "gameplay"
  }
});

const VALID_BEAT_TYPES = new Set(Object.values(NARRATIVE_CAMERA_BEAT_TYPES));
const VALID_IMPORTANCE = new Set(Object.values(NARRATIVE_CAMERA_IMPORTANCE));
const SUBJECT_REQUIRED_TYPES = new Set([
  NARRATIVE_CAMERA_BEAT_TYPES.CONFIRM,
  NARRATIVE_CAMERA_BEAT_TYPES.CONVERSATION,
  NARRATIVE_CAMERA_BEAT_TYPES.ESTABLISH,
  NARRATIVE_CAMERA_BEAT_TYPES.FOCUS,
  NARRATIVE_CAMERA_BEAT_TYPES.REVEAL
]);

function isVector3(value) {
  return Array.isArray(value) &&
    value.length >= 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function normalizeSubject(subject = {}) {
  if (!subject || typeof subject !== "object") {
    return null;
  }

  return {
    id: typeof subject.id === "string" ? subject.id : null,
    position: isVector3(subject.position) ? [...subject.position] : null,
    role: typeof subject.role === "string" ? subject.role : "primary"
  };
}

function normalizeSubjects(subjects) {
  if (!Array.isArray(subjects)) {
    return [];
  }

  return subjects
    .map(normalizeSubject)
    .filter(Boolean);
}

function getPrimarySubject(beat) {
  return beat.subjects.find((subject) => isVector3(subject.position)) || null;
}

function getBeatDuration(beat, grammar) {
  const explicitDuration =
    typeof beat.maxDuration === "number" && Number.isFinite(beat.maxDuration) ?
      beat.maxDuration :
      null;
  const defaultDuration = grammar?.duration || 0.45;

  if (explicitDuration === null) {
    return defaultDuration;
  }

  return Math.max(0.05, Math.min(defaultDuration, explicitDuration));
}

function shouldLockControl(beat, grammar) {
  if (beat.type === NARRATIVE_CAMERA_BEAT_TYPES.REVEAL) {
    return beat.importance === NARRATIVE_CAMERA_IMPORTANCE.HIGH;
  }

  if (grammar?.control === "locked") {
    return beat.importance !== NARRATIVE_CAMERA_IMPORTANCE.LOW;
  }

  return false;
}

export function createNarrativeCameraBeat({
  id,
  type,
  importance = NARRATIVE_CAMERA_IMPORTANCE.MEDIUM,
  subjects = [],
  reason = null,
  interruptible = true,
  maxDuration = null,
  next = null,
  metadata = {}
} = {}) {
  return {
    id: typeof id === "string" && id.trim() ? id : "anonymous-camera-beat",
    type,
    importance,
    subjects: normalizeSubjects(subjects),
    reason,
    interruptible: Boolean(interruptible),
    maxDuration,
    next,
    metadata: metadata && typeof metadata === "object" ? { ...metadata } : {}
  };
}

export function validateNarrativeCameraBeat(beatInput = {}) {
  const beat = createNarrativeCameraBeat(beatInput);
  const warnings = [];

  if (!VALID_BEAT_TYPES.has(beat.type)) {
    warnings.push({
      code: "narrative-camera:unknown-type",
      message: `Unknown narrative camera beat type "${beat.type}".`
    });
  }

  if (!VALID_IMPORTANCE.has(beat.importance)) {
    warnings.push({
      code: "narrative-camera:unknown-importance",
      message: `Unknown narrative camera importance "${beat.importance}".`
    });
  }

  if (SUBJECT_REQUIRED_TYPES.has(beat.type) && !getPrimarySubject(beat)) {
    warnings.push({
      code: "narrative-camera:missing-subject",
      message: `Camera beat "${beat.id}" needs at least one subject with a position.`
    });
  }

  if (
    beat.importance === NARRATIVE_CAMERA_IMPORTANCE.HIGH &&
    beat.interruptible === false &&
    typeof beat.maxDuration !== "number"
  ) {
    warnings.push({
      code: "narrative-camera:missing-max-duration",
      message: `Locked high-importance camera beat "${beat.id}" needs maxDuration.`
    });
  }

  if (
    beat.type === NARRATIVE_CAMERA_BEAT_TYPES.REVEAL &&
    !["conversation", "return"].includes(beat.next)
  ) {
    warnings.push({
      code: "narrative-camera:reveal-needs-return",
      message: `Reveal beat "${beat.id}" should end in conversation or return.`
    });
  }

  if (
    beat.type === NARRATIVE_CAMERA_BEAT_TYPES.CONFIRM &&
    typeof beat.maxDuration === "number" &&
    beat.maxDuration > 1.5
  ) {
    warnings.push({
      code: "narrative-camera:confirm-too-long",
      message: `Confirm beat "${beat.id}" should stay brief.`
    });
  }

  return warnings;
}

export function warnForInvalidNarrativeCameraBeat(beatInput, {
  enabled = true,
  logger = console
} = {}) {
  const warnings = validateNarrativeCameraBeat(beatInput);

  if (!enabled || warnings.length === 0) {
    return warnings;
  }

  for (const warning of warnings) {
    logger.warn?.(`[${warning.code}] ${warning.message}`);
  }

  return warnings;
}

export function resolveNarrativeCameraIntent(beatInput = {}) {
  const beat = createNarrativeCameraBeat(beatInput);
  const grammar = NARRATIVE_CAMERA_GRAMMAR[beat.type];
  const subject = getPrimarySubject(beat);
  const warnings = validateNarrativeCameraBeat(beat);

  if (!grammar || (SUBJECT_REQUIRED_TYPES.has(beat.type) && !subject)) {
    return {
      type: NARRATIVE_CAMERA_INTENT_TYPES.FALLBACK,
      beat,
      warnings,
      lockControl: false,
      restore: true,
      reason: "missing-camera-subject"
    };
  }

  if (beat.type === NARRATIVE_CAMERA_BEAT_TYPES.FOLLOW) {
    return {
      type: NARRATIVE_CAMERA_INTENT_TYPES.FOLLOW,
      beat,
      warnings,
      lockControl: false,
      restore: false,
      question: grammar.question
    };
  }

  if (beat.type === NARRATIVE_CAMERA_BEAT_TYPES.RETURN) {
    return {
      type: NARRATIVE_CAMERA_INTENT_TYPES.RETURN,
      beat,
      warnings,
      lockControl: false,
      restore: true,
      duration: grammar.duration,
      question: grammar.question
    };
  }

  if (beat.type === NARRATIVE_CAMERA_BEAT_TYPES.CONVERSATION) {
    return {
      type: NARRATIVE_CAMERA_INTENT_TYPES.CONVERSATION,
      beat,
      warnings,
      lockControl: beat.importance === NARRATIVE_CAMERA_IMPORTANCE.HIGH,
      restore: false,
      subject,
      duration: getBeatDuration(beat, grammar),
      question: grammar.question
    };
  }

  return {
    type: NARRATIVE_CAMERA_INTENT_TYPES.FOCUS,
    beat,
    warnings,
    lockControl: shouldLockControl(beat, grammar),
    restore: true,
    subject,
    duration: getBeatDuration(beat, grammar),
    height: grammar.height,
    zoom: grammar.zoom,
    distance: grammar.distance,
    question: grammar.question
  };
}

export function createNarrativeCameraTargetSmoother({
  epsilon = 0.04,
  verticalStrength = 0.35
} = {}) {
  let current = null;

  function sample(position) {
    if (!isVector3(position)) {
      return current ? [...current] : null;
    }

    if (!current) {
      current = [...position];
      return [...current];
    }

    const delta = Math.hypot(
      position[0] - current[0],
      position[1] - current[1],
      position[2] - current[2]
    );

    if (delta < epsilon) {
      return [...current];
    }

    current = [
      position[0],
      current[1] + (position[1] - current[1]) * verticalStrength,
      position[2]
    ];
    return [...current];
  }

  function reset(position = null) {
    current = isVector3(position) ? [...position] : null;
  }

  return {
    sample,
    reset
  };
}

export function createNarrativeCinematographerAdapter({
  camera = null,
  cameraOrbit = null,
  dialogueCameraController = null,
  transitionDuration = 0.45,
  targetSmoother = createNarrativeCameraTargetSmoother()
} = {}) {
  function focusSubject(intent) {
    const sampledPosition = targetSmoother.sample(intent.subject?.position);

    if (!sampledPosition) {
      return {
        executed: false,
        reason: "missing-camera-subject"
      };
    }

    if (dialogueCameraController?.focusWorldPoint) {
      dialogueCameraController.focusWorldPoint({
        position: sampledPosition,
        height: intent.height
      });
      return {
        executed: true,
        mode: "dialogue-world-point"
      };
    }

    const currentPose = camera?.getPose?.() || {};
    const pose = {
      target: [sampledPosition[0], intent.height || 0.9, sampledPosition[2]],
      direction: currentPose.direction,
      zoom: intent.zoom,
      distance: intent.distance
    };

    camera?.startPoseTransition?.(pose, {
      duration: Math.min(transitionDuration, intent.duration || transitionDuration)
    });
    if (pose.direction) {
      cameraOrbit?.sync?.(pose.direction);
    }

    return {
      executed: Boolean(camera?.startPoseTransition),
      mode: "pose-transition"
    };
  }

  function executeIntent(intent, {
    playerPosition = null,
    conversation = {}
  } = {}) {
    if (!intent || intent.type === NARRATIVE_CAMERA_INTENT_TYPES.FALLBACK) {
      if (playerPosition && camera?.follow) {
        camera.follow(playerPosition);
      }
      return {
        executed: Boolean(playerPosition && camera?.follow),
        mode: "fallback"
      };
    }

    if (intent.type === NARRATIVE_CAMERA_INTENT_TYPES.CONVERSATION) {
      dialogueCameraController?.focusNpcConversation?.({
        ...conversation,
        targetPosition: intent.subject?.position
      });
      return {
        executed: Boolean(dialogueCameraController?.focusNpcConversation),
        mode: "conversation"
      };
    }

    if (intent.type === NARRATIVE_CAMERA_INTENT_TYPES.FOCUS) {
      return focusSubject(intent);
    }

    if (
      intent.type === NARRATIVE_CAMERA_INTENT_TYPES.RETURN ||
      intent.type === NARRATIVE_CAMERA_INTENT_TYPES.FOLLOW
    ) {
      dialogueCameraController?.restoreGameplayCamera?.();
      if (playerPosition && camera?.follow) {
        camera.follow(playerPosition);
      }
      return {
        executed: Boolean(dialogueCameraController?.restoreGameplayCamera || (playerPosition && camera?.follow)),
        mode: intent.type
      };
    }

    return {
      executed: false,
      mode: "unknown"
    };
  }

  return {
    executeIntent
  };
}
