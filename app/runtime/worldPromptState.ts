import { normalizeSandbotsVisibleText } from "../story/sandbotsTerminologyNormalizer.js";

export type WorldPosition = [number, number, number];

export type WorldPromptState =
  | { kind: "hidden" }
  | {
      kind: "placement";
      target: "solarStation" | "houseKit";
      valid: boolean;
      text: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "workbenchRotation";
      text: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "counter";
      text: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "fieldMoveSwitch";
      html: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "charging";
      companionId: "squirtle";
      abilityId: "waterGun";
      worldPosition: WorldPosition;
    }
  | {
      kind: "invalidMoveTarget";
      abilityId: "leafage" | "fire";
      message: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "transientNotice";
      text: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "repairBox";
      text: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "firstUse";
      abilityId: "leafage" | "waterGun";
      text: string;
      worldPosition: WorldPosition;
    }
  | {
      kind: "text";
      text: string;
      worldPosition: WorldPosition;
    };

export type LegacyWorldPrompt = {
  visible: boolean;
  text: string;
  worldPosition: WorldPosition | null;
};

export function getWorldPromptLegacyText(prompt: WorldPromptState): string {
  switch (prompt.kind) {
    case "hidden":
      return "";
    case "fieldMoveSwitch":
      return normalizeSandbotsVisibleText(prompt.html);
    case "charging":
      return "charging";
    case "invalidMoveTarget":
      return normalizeSandbotsVisibleText(prompt.message);
    default:
      return normalizeSandbotsVisibleText(prompt.text);
  }
}

export function toLegacyWorldPrompt(prompt: WorldPromptState): LegacyWorldPrompt {
  if (prompt.kind === "hidden") {
    return {
      visible: false,
      text: "",
      worldPosition: null,
    };
  }

  return {
    visible: true,
    text: getWorldPromptLegacyText(prompt),
    worldPosition: prompt.worldPosition,
  };
}
