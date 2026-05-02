const MISSING_REQUIREMENT_NOTICE_PATTERN = /^(?:Missing|Faltando):\s*(.+)$/i;
const REQUIREMENT_SEPARATOR_PATTERN = /\s*(?:\u00b7|,)\s*/;
const REQUIREMENT_COUNT_SUFFIX_PATTERN = /\s+\d+\s*\/\s*\d+\s*$/;

function cleanRequirementName(requirementText) {
  return requirementText.replace(REQUIREMENT_COUNT_SUFFIX_PATTERN, "").trim();
}

function joinRequirementNames(requirementNames) {
  if (requirementNames.length <= 1) {
    return requirementNames[0] || "";
  }

  return `${requirementNames.slice(0, -1).join(", ")} and ${requirementNames.at(-1)}`;
}

export function createContextualPromptNotice(message) {
  const noticeText = typeof message === "string" ? message.trim() : "";
  const match = noticeText.match(MISSING_REQUIREMENT_NOTICE_PATTERN);

  if (!match) {
    return "";
  }

  const requirementNames = match[1]
    .split(REQUIREMENT_SEPARATOR_PATTERN)
    .map(cleanRequirementName)
    .filter(Boolean);
  const requirementCopy = joinRequirementNames(requirementNames);

  return requirementCopy ? `Need more ${requirementCopy}` : "";
}

export function resolveTransientNoticeRoute(message) {
  const worldPromptMessage = createContextualPromptNotice(message);

  return {
    hudMessage: worldPromptMessage ? "" : message || "",
    worldPromptMessage
  };
}
