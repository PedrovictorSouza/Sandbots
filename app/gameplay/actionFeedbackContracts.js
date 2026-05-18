export const ACTION_FEEDBACK_ACTION = Object.freeze({
  CANCEL: "cancel",
  CONFIRM: "confirm",
  INTERACT: "interact",
  OPEN_MENU: "open-menu",
  PLACE_KIT: "place-kit",
  USE_FIELD_TOOL: "use-field-tool"
});

export const ACTION_FEEDBACK_RESULT = Object.freeze({
  BLOCKED: "blocked",
  NO_TARGET: "no-target",
  VALID: "valid"
});

const ACTION_FEEDBACK_CONTRACTS = Object.freeze({
  [ACTION_FEEDBACK_ACTION.INTERACT]: Object.freeze({
    action: ACTION_FEEDBACK_ACTION.INTERACT,
    playerIntent: "Talk to a bot, inspect a machine, or use a nearby marker.",
    responses: Object.freeze({
      [ACTION_FEEDBACK_RESULT.VALID]: Object.freeze({
        channels: Object.freeze(["worldPrompt", "dialogue", "objectReaction"]),
        message: "Interact"
      }),
      [ACTION_FEEDBACK_RESULT.BLOCKED]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "The interaction path is blocked."
      }),
      [ACTION_FEEDBACK_RESULT.NO_TARGET]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "Nothing to talk to nearby. Move closer to a marker or bot, then press E / X.",
        repeatMessage: "Still nothing nearby. Look for an interaction marker or move closer, then press A / E / X."
      })
    })
  }),
  [ACTION_FEEDBACK_ACTION.USE_FIELD_TOOL]: Object.freeze({
    action: ACTION_FEEDBACK_ACTION.USE_FIELD_TOOL,
    playerIntent: "Use the selected bot function on a visible world target.",
    responses: Object.freeze({
      [ACTION_FEEDBACK_RESULT.VALID]: Object.freeze({
        channels: Object.freeze(["worldPrompt", "botAnimation", "worldChange"]),
        message: "Tool target confirmed."
      }),
      [ACTION_FEEDBACK_RESULT.BLOCKED]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "The bot cannot reach that target."
      }),
      [ACTION_FEEDBACK_RESULT.NO_TARGET]: Object.freeze({
        channels: Object.freeze(["notice", "worldPrompt"]),
        message: "Still no target. Move until a tile outline or interaction marker appears, then press X / Enter."
      })
    })
  }),
  [ACTION_FEEDBACK_ACTION.PLACE_KIT]: Object.freeze({
    action: ACTION_FEEDBACK_ACTION.PLACE_KIT,
    playerIntent: "Place a selected build kit on valid ground.",
    responses: Object.freeze({
      [ACTION_FEEDBACK_RESULT.VALID]: Object.freeze({
        channels: Object.freeze(["worldPrompt", "groundHighlight", "placementPreview"]),
        message: "Place kit"
      }),
      [ACTION_FEEDBACK_RESULT.BLOCKED]: Object.freeze({
        channels: Object.freeze(["worldPrompt", "groundHighlight"]),
        message: "Blocked. Move away from objects or invalid ground."
      }),
      [ACTION_FEEDBACK_RESULT.NO_TARGET]: Object.freeze({
        channels: Object.freeze(["notice", "worldPrompt"]),
        message: "Select a build kit before placing."
      })
    })
  }),
  [ACTION_FEEDBACK_ACTION.CANCEL]: Object.freeze({
    action: ACTION_FEEDBACK_ACTION.CANCEL,
    playerIntent: "Back out of the current preview, modal, or held action.",
    responses: Object.freeze({
      [ACTION_FEEDBACK_RESULT.VALID]: Object.freeze({
        channels: Object.freeze(["notice", "stateChange"]),
        message: "Canceled."
      }),
      [ACTION_FEEDBACK_RESULT.BLOCKED]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "Finish the current confirmation first."
      }),
      [ACTION_FEEDBACK_RESULT.NO_TARGET]: Object.freeze({
        channels: Object.freeze(["none"]),
        message: ""
      })
    })
  }),
  [ACTION_FEEDBACK_ACTION.CONFIRM]: Object.freeze({
    action: ACTION_FEEDBACK_ACTION.CONFIRM,
    playerIntent: "Accept the focused dialogue, menu option, placement, or confirmation.",
    responses: Object.freeze({
      [ACTION_FEEDBACK_RESULT.VALID]: Object.freeze({
        channels: Object.freeze(["stateChange"]),
        message: "Confirm"
      }),
      [ACTION_FEEDBACK_RESULT.BLOCKED]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "Choose a valid option first."
      }),
      [ACTION_FEEDBACK_RESULT.NO_TARGET]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "Nothing selected."
      })
    })
  }),
  [ACTION_FEEDBACK_ACTION.OPEN_MENU]: Object.freeze({
    action: ACTION_FEEDBACK_ACTION.OPEN_MENU,
    playerIntent: "Open the player menu without disrupting active gameplay state.",
    responses: Object.freeze({
      [ACTION_FEEDBACK_RESULT.VALID]: Object.freeze({
        channels: Object.freeze(["menu", "focus"]),
        message: "Open menu"
      }),
      [ACTION_FEEDBACK_RESULT.BLOCKED]: Object.freeze({
        channels: Object.freeze(["notice"]),
        message: "Menu is unavailable during this scene."
      }),
      [ACTION_FEEDBACK_RESULT.NO_TARGET]: Object.freeze({
        channels: Object.freeze(["menu", "focus"]),
        message: "Open menu"
      })
    })
  })
});

export function getActionFeedbackContract(actionId) {
  return ACTION_FEEDBACK_CONTRACTS[actionId] || null;
}

export function getActionFeedbackResponse(actionId, resultId) {
  return getActionFeedbackContract(actionId)?.responses?.[resultId] || null;
}

export function listActionFeedbackContracts() {
  return Object.values(ACTION_FEEDBACK_CONTRACTS);
}

export function getActionFeedbackContractGaps(contracts = listActionFeedbackContracts()) {
  return contracts
    .map((contract) => ({
      action: contract.action,
      missingResults: Object.values(ACTION_FEEDBACK_RESULT).filter(
        (resultId) => !contract.responses?.[resultId]
      )
    }))
    .filter((entry) => entry.missingResults.length > 0);
}
