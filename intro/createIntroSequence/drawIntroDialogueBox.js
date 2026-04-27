import dialogueFrameSrc from "../../app/ui/images/dialogue-box.png";

const DIALOGUE_BOX = Object.freeze({
  width: 280,
  height: 72,
  pixel: 1,
  speaker: "MEMORY GUIDE",
  hint: "SPACE",
  font: "\"Courier New\", monospace",
  colors: {
    shadow: "#0f1a30",
    borderDark: "#13213e",
    borderMid: "#2a4270",
    borderLight: "#79e1ff",
    panel: "#fff4d6",
    panelShade: "#e8cf93",
    text: "#ffffffff",
    speakerPanel: "#4f64d4",
    speakerText: "#f7fbff",
    hintPanel: "#ffd34f",
    hintText: "#5c4111",
    glitch: "#9ff3ff"
  }
});

let dialogueFrameImage = null;
let dialogueFrameReady = false;

function ensureDialogueFrameImage() {
  if (dialogueFrameImage) {
    return dialogueFrameImage;
  }

  const image = new Image();
  image.src = dialogueFrameSrc;
  image.onload = () => {
    dialogueFrameReady = true;
  };
  dialogueFrameImage = image;
  return dialogueFrameImage;
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getCanvasContext(canvas) {
  if (typeof CanvasRenderingContext2D === "undefined") {
    return null;
  }

  return canvas.getContext("2d");
}

function drawRect(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function splitWords(text) {
  return String(text).trim().split(/\s+/).filter(Boolean);
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  let line = "";

  splitWords(text).forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;

    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }

    if (line) {
      lines.push(line);
    }

    line = word;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function drawFrameImage(context) {
  const image = ensureDialogueFrameImage();

  if (!dialogueFrameReady || !image) {
    return;
  }

  context.drawImage(image, 0, 0, DIALOGUE_BOX.width, DIALOGUE_BOX.height);
}

function drawSpeakerTag(context, speaker) {
  const { pixel, colors, font } = DIALOGUE_BOX;
  const p = pixel;

  const tagX = p * 4;
  const tagY = 0;
  const tagW = 96;
  const tagH = 16;

  drawRect(context, tagX, tagY, tagW, tagH, colors.borderDark);
  drawRect(context, tagX + p, tagY + p, tagW - p * 2, tagH - p * 2, colors.speakerPanel);
  drawRect(context, tagX + tagW - p * 2, tagY + tagH - p * 2, p, p, colors.borderDark);

  context.fillStyle = colors.speakerText;
  context.font = `700 7px ${font}`;
  context.textBaseline = "top";
  context.fillText(speaker, tagX + 8, tagY + 5);
}

function drawDialogueText(context, text) {
  const { colors, font } = DIALOGUE_BOX;

  context.font = `700 9px ${font}`;
  context.fillStyle = colors.text;
  context.textBaseline = "top";

  const lines = wrapText(context, text, 220).slice(0, 3);

  lines.forEach((line, index) => {
    context.fillText(line, 14, 24 + index * 12);
  });
}

function drawAdvanceHint(context, tick = 0) {
  const { pixel, colors, font } = DIALOGUE_BOX;
  const p = pixel;
  const jitter = tick % 2 === 0 ? 0 : 1;

  const x = 226 + jitter;
  const y = 50;

  drawRect(context, x, y, 38, 12, colors.borderDark);
  drawRect(context, x + 2, y + 2, 34, 8, colors.hintPanel);

  context.fillStyle = colors.hintText;
  context.font = `700 6px ${font}`;
  context.textBaseline = "top";
  context.fillText(DIALOGUE_BOX.hint, x + 4, y + 3);
  context.fillText(tick % 3 === 0 ? ">>" : ">", x + 27, y + 3);
}

function drawBorderJitter(context, tick = 0) {
  const { pixel, colors, width, height } = DIALOGUE_BOX;
  const p = pixel;

  if (tick % 4 !== 0) {
    return;
  }

  const offsets = [
    [width - p * 8, p * 2],
    [p * 3, height - p * 4],
    [width - p * 6, height - p * 6]
  ];

  offsets.forEach(([x, y], index) => {
    const wobble = (tick + index) % 2 === 0 ? 0 : 1;
    drawRect(context, x + wobble, y, p, p, colors.glitch);
  });
}

export function renderIntroDialogueBox({
  text,
  showSpaceHint,
  speaker = DIALOGUE_BOX.speaker
}) {
  const label = `${speaker}: ${text}`;

  return `
    <div class="intro-dialogue" data-advance="${showSpaceHint ? "true" : "false"}" aria-label="${escapeAttribute(label)}">
      <canvas
        class="intro-dialogue__canvas"
        width="${DIALOGUE_BOX.width}"
        height="${DIALOGUE_BOX.height}"
        aria-hidden="true"
        data-intro-dialogue-canvas
        data-intro-dialogue-text="${escapeAttribute(text)}"
        data-intro-dialogue-visible-characters="${text.length}"
        data-intro-dialogue-speaker="${escapeAttribute(speaker)}"
        data-intro-dialogue-hint="${showSpaceHint ? "true" : "false"}"
      ></canvas>
    </div>
  `;
}

export function drawIntroDialogueBox(canvas, tick = 0) {
  const context = getCanvasContext(canvas);

  if (!context) {
    return;
  }

  ensureDialogueFrameImage();

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, DIALOGUE_BOX.width, DIALOGUE_BOX.height);

  drawFrameImage(context);
  drawSpeakerTag(context, canvas.dataset.introDialogueSpeaker || DIALOGUE_BOX.speaker);
  const text = canvas.dataset.introDialogueText || "";
  const visibleCharacters = Number(canvas.dataset.introDialogueVisibleCharacters);
  const visibleText = Number.isFinite(visibleCharacters) ? text.slice(0, visibleCharacters) : text;
  drawDialogueText(context, visibleText);
  drawBorderJitter(context, tick);

  if (canvas.dataset.introDialogueHint === "true") {
    drawAdvanceHint(context, tick);
  }
}

export function drawIntroDialogueBoxes(root, tick = 0) {
  ensureDialogueFrameImage();

  root.querySelectorAll("[data-intro-dialogue-canvas]").forEach((canvas) => {
    drawIntroDialogueBox(canvas, tick);
  });
}
