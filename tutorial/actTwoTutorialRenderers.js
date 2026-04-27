function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderApproachPanel(playerNearMonster) {
  return `
    <aside class="act-two-tutorial__panel" data-ready="${playerNearMonster ? "true" : "false"}">
      <span class="act-two-tutorial__eyebrow">First Contact</span>
      <strong class="act-two-tutorial__title">${playerNearMonster ? "Talk" : "Approach"}</strong>
      <p class="act-two-tutorial__copy">
        ${
          playerNearMonster
            ? 'You are close enough. Press <span>Space</span> to talk.'
            : 'Use <span>W</span><span>A</span><span>S</span><span>D</span> to run toward the creature, then press <span>Space</span> to talk.'
        }
      </p>
    </aside>
  `;
}

function renderSquirtleSpeech(squirtleHelpLine) {
  return `
    <div class="act-two-tutorial__speech act-two-tutorial__speech--squirtle" id="act-two-squirtle-speech">
      <div class="act-two-tutorial__speech-bubble">${squirtleHelpLine}</div>
    </div>
  `;
}

function renderSquirtleHintPanel(playerNearSquirtleTalk) {
  if (playerNearSquirtleTalk) {
    return `
      <aside class="act-two-tutorial__panel" data-ready="true">
        <span class="act-two-tutorial__eyebrow">Interact</span>
        <strong class="act-two-tutorial__title">Talk to Squirtle</strong>
        <p class="act-two-tutorial__copy">You are close enough. Press <span>E</span> to talk to Squirtle.</p>
      </aside>
    `;
  }

  return `
    <aside class="act-two-tutorial__panel">
      <span class="act-two-tutorial__eyebrow">Hint</span>
      <strong class="act-two-tutorial__title">Speech Bubbles</strong>
      <div class="act-two-tutorial__copy-group">
        <p class="act-two-tutorial__copy">Did you notice the speech bubble that popped up over Squirtle's head?</p>
        <p class="act-two-tutorial__copy">When a Pokemon wants to tell you something, a speech bubble will appear above them.</p>
        <p class="act-two-tutorial__copy">It looks like Squirtle may have a pretty serious problem- you should try talking to them!</p>
      </div>
    </aside>
  `;
}

function renderWaterGunPanel(playerNearSquirtleTalk) {
  return `
    <aside class="act-two-tutorial__panel" data-ready="${playerNearSquirtleTalk ? "true" : "false"}">
      <span class="act-two-tutorial__eyebrow">Ability</span>
      <strong class="act-two-tutorial__title">Use Water Gun</strong>
      <p class="act-two-tutorial__copy">
        ${
          playerNearSquirtleTalk
            ? 'Squirtle is close enough. Press <span>E</span> to use Water Gun.'
            : 'Move close to Squirtle and press <span>E</span> to use Water Gun.'
        }
      </p>
    </aside>
  `;
}

function renderPlayerThoughtBubble(playerIdeaVisible) {
  if (!playerIdeaVisible) {
    return "";
  }

  return `
    <div class="act-two-tutorial__thought" id="act-two-player-thought">
      <div class="act-two-tutorial__thought-bubble">!</div>
    </div>
  `;
}

function renderCameraPanel(cameraLookRegistered) {
  return `
    <div class="act-two-tutorial__badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M6 5h7a4 4 0 0 1 4 4v9H9a3 3 0 0 0-3 3z"></path>
        <path d="M18 5h-7a4 4 0 0 0-4 4v9h8a3 3 0 0 1 3 3z"></path>
      </svg>
    </div>
    <aside
      class="act-two-tutorial__panel"
      data-variant="camera"
      data-ready="${cameraLookRegistered ? "true" : "false"}"
    >
      <strong class="act-two-tutorial__title">Camera Controls</strong>
      <p class="act-two-tutorial__copy">
        Use <span>&larr;</span><span>&rarr;</span> to look around.
      </p>
    </aside>
  `;
}

function renderInspectPanel(playerNearInspectable) {
  return `
    <aside class="act-two-tutorial__panel" data-ready="${playerNearInspectable ? "true" : "false"}">
      <span class="act-two-tutorial__eyebrow">Discovery</span>
      <strong class="act-two-tutorial__title">${playerNearInspectable ? "Inspect" : "Curious Cache"}</strong>
      <p class="act-two-tutorial__copy">
        ${
          playerNearInspectable
            ? 'The box is right there. Press <span>E</span> to inspect it.'
            : 'Walk to the nearby box and press <span>E</span> to inspect it.'
        }
      </p>
    </aside>
  `;
}

function renderFollowPanel(followTarget, isReady) {
  if (!followTarget) {
    return "";
  }

  return `
    <aside class="act-two-tutorial__panel" data-ready="${isReady ? "true" : "false"}">
      <span class="act-two-tutorial__eyebrow">${followTarget.eyebrow}</span>
      <strong class="act-two-tutorial__title">${followTarget.title}</strong>
      <p class="act-two-tutorial__copy">${followTarget.copy}</p>
    </aside>
  `;
}

function renderRepairPanel(playerNearRepairPlant) {
  return `
    <aside class="act-two-tutorial__panel" data-ready="${playerNearRepairPlant ? "true" : "false"}">
      <span class="act-two-tutorial__eyebrow">Restore</span>
      <strong class="act-two-tutorial__title">${playerNearRepairPlant ? "Fix Plant" : "Broken Plant"}</strong>
      <p class="act-two-tutorial__copy">
        ${
          playerNearRepairPlant
            ? 'You are close enough. Press <span>E</span> to fix it.'
            : 'Walk up to the broken plant unit and press <span>E</span> to repair it.'
        }
      </p>
    </aside>
  `;
}

function renderDialoguePanel({ currentLine, choices, playerIdeaVisible, selectedChoice }) {
  if (!currentLine) {
    return "";
  }

  return `
    ${renderPlayerThoughtBubble(playerIdeaVisible)}
    <div class="act-two-dialogue">
      ${currentLine.speaker ? `<div class="act-two-dialogue__speaker">${escapeHtml(currentLine.speaker)}</div>` : ""}
      <div class="act-two-dialogue__body" data-speakerless="${currentLine.speaker ? "false" : "true"}">
        <p class="act-two-dialogue__text">${escapeHtml(currentLine.text)}</p>
        ${
          choices
            ? `
              <div class="act-two-dialogue__choices">
                ${choices
                  .map(
                    (choice, index) => `
                      <button
                        class="act-two-dialogue__choice"
                        type="button"
                        data-choice-index="${index}"
                        data-selected="${selectedChoice === index ? "true" : "false"}"
                      >
                        <span class="act-two-dialogue__choice-arrow">${selectedChoice === index ? ">" : ""}</span>
                        <span>${escapeHtml(choice.label)}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="act-two-dialogue__hint">
                <span>Space</span>
                <span>Continue</span>
              </div>
            `
        }
      </div>
    </div>
  `;
}

function renderNameEntryPanel({ playerName, nameCharLimit, nameKeyboardRows }) {
  const displayName = playerName || "";
  const count = `${displayName.length}/${nameCharLimit}`;
  const canSubmit = displayName.trim().length > 0;

  return `
    <div class="name-entry">
      <div class="name-entry__scrim"></div>
      <div class="name-entry__shell">
        <div class="name-entry__prompt">
          <strong>What's your name?</strong>
          <span>You can't change this later.</span>
        </div>
        <div class="name-entry__field" data-empty="${displayName.length === 0 ? "true" : "false"}">
          <div class="name-entry__value">
            ${displayName ? `<span>${escapeHtml(displayName)}</span>` : ""}
            ${displayName.length < nameCharLimit ? '<span class="name-entry__caret" aria-hidden="true"></span>' : ""}
          </div>
          <span class="name-entry__count">${count}</span>
        </div>
      </div>
      <div class="name-entry__keyboard">
        <div class="name-entry__rows">
          ${nameKeyboardRows
            .map(
              (row) => `
                <div class="name-entry__row">
                  ${row
                    .map(
                      (key) => `
                        <button class="name-entry__key" type="button" data-name-key="${key}">
                          ${key}
                        </button>
                      `
                    )
                    .join("")}
                </div>
              `
            )
            .join("")}
        </div>
        <div class="name-entry__actions">
          <button class="name-entry__action" type="button" data-name-action="space">Space</button>
          <button class="name-entry__action" type="button" data-name-action="delete">Delete</button>
          <button
            class="name-entry__action name-entry__action--ok"
            type="button"
            data-name-action="submit"
            data-enabled="${canSubmit ? "true" : "false"}"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderActTwoTutorialMarkup({
  state,
  openingLine,
  squirtleHelpLine,
  currentLine,
  choices,
  followTarget,
  nameCharLimit,
  nameKeyboardRows
}) {
  if (!state.active) {
    return "";
  }

  const isFollowReady = state.followTargetReached && state.playerNearMonster;
  let phaseMarkup = renderDialoguePanel({
    currentLine,
    choices,
    playerIdeaVisible: state.playerIdeaVisible,
    selectedChoice: state.selectedChoice
  });

  if (state.phase === "approach") {
    phaseMarkup = `
      <div class="act-two-tutorial__speech" id="act-two-speech">
        <div class="act-two-tutorial__speech-bubble">${openingLine}</div>
      </div>
      ${renderApproachPanel(state.playerNearMonster)}
    `;
  } else if (state.phase === "squirtle-discovery") {
    phaseMarkup = renderSquirtleSpeech(squirtleHelpLine);
  } else if (state.phase === "squirtle-hint") {
    phaseMarkup = `
      ${renderSquirtleSpeech(squirtleHelpLine)}
      ${renderSquirtleHintPanel(state.playerNearSquirtleTalk)}
    `;
  } else if (state.phase === "squirtle-ability") {
    phaseMarkup = renderWaterGunPanel(state.playerNearSquirtleTalk);
  } else if (state.phase === "camera") {
    phaseMarkup = renderCameraPanel(state.cameraLookRegistered);
  } else if (state.phase === "inspect") {
    phaseMarkup = renderInspectPanel(state.playerNearInspectable);
  } else if (state.phase === "follow") {
    phaseMarkup = renderFollowPanel(followTarget, isFollowReady);
  } else if (state.phase === "repair") {
    phaseMarkup = renderRepairPanel(state.playerNearRepairPlant);
  } else if (state.phase === "name-entry") {
    phaseMarkup = renderNameEntryPanel({
      playerName: state.playerName,
      nameCharLimit,
      nameKeyboardRows
    });
  }

  return `
    <div class="act-two-tutorial" data-phase="${state.phase}">
      ${phaseMarkup}
    </div>
  `;
}
