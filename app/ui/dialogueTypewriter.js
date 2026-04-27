export const DEFAULT_DIALOGUE_TYPEWRITER_CPS = 45;

let audioContext = null;
let lastBleepAt = 0;

function getAudioContext() {
  const AudioContextConstructor = globalThis.AudioContext || globalThis.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

export function playDialogueBleep() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const now = context.currentTime;
  if (now - lastBleepAt < 0.025) {
    return;
  }

  lastBleepAt = now;
  if (context.state === "suspended") {
    void context.resume?.();
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(560 + Math.random() * 70, now);
  gain.gain.setValueAtTime(0.025, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.04);
}

export function createDialogueTypewriter({
  charactersPerSecond = DEFAULT_DIALOGUE_TYPEWRITER_CPS,
  onTick = () => {},
  onBleep = playDialogueBleep
} = {}) {
  const state = {
    text: "",
    visibleCharacters: 0,
    timerId: 0
  };
  const intervalMs = Math.max(1, Math.round(1000 / charactersPerSecond));

  function clearTimer() {
    if (state.timerId) {
      globalThis.clearInterval(state.timerId);
      state.timerId = 0;
    }
  }

  function notify() {
    onTick({
      text: state.text,
      visibleCharacters: state.visibleCharacters,
      visibleText: state.text.slice(0, state.visibleCharacters),
      complete: state.visibleCharacters >= state.text.length
    });
  }

  function step() {
    if (state.visibleCharacters >= state.text.length) {
      clearTimer();
      notify();
      return;
    }

    state.visibleCharacters += 1;
    const character = state.text[state.visibleCharacters - 1];
    if (character && !/\s/.test(character)) {
      onBleep(character);
    }
    notify();
  }

  return {
    start(text = "") {
      clearTimer();
      state.text = String(text);
      state.visibleCharacters = 0;
      notify();

      if (!state.text.length) {
        return;
      }

      state.timerId = globalThis.setInterval(step, intervalMs);
    },

    complete() {
      clearTimer();
      state.visibleCharacters = state.text.length;
      notify();
    },

    stop() {
      clearTimer();
    },

    isComplete() {
      return state.visibleCharacters >= state.text.length;
    },

    getVisibleText() {
      return state.text.slice(0, state.visibleCharacters);
    },

    getVisibleCharacters() {
      return state.visibleCharacters;
    }
  };
}
