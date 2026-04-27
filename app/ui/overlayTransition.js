const OVERLAY_TRANSITION_CLASSES = [
  "overlay-transition",
  "overlay-transition--active",
  "overlay-transition--enter",
  "overlay-transition--exit"
];

function parseTimeList(value = "") {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.endsWith("ms")) {
        return Number.parseFloat(part) || 0;
      }

      if (part.endsWith("s")) {
        return (Number.parseFloat(part) || 0) * 1000;
      }

      return Number.parseFloat(part) || 0;
    });
}

function getMaxTime(durations, delays) {
  const itemCount = Math.max(durations.length, delays.length);
  let maxTime = 0;

  for (let index = 0; index < itemCount; index += 1) {
    const duration = durations[index % durations.length] || 0;
    const delay = delays[index % delays.length] || 0;
    maxTime = Math.max(maxTime, duration + delay);
  }

  return maxTime;
}

function hasActiveMotion(element) {
  const windowRef = element.ownerDocument?.defaultView || window;
  const style = windowRef.getComputedStyle(element);
  const transitionDuration = getMaxTime(
    parseTimeList(style.transitionDuration),
    parseTimeList(style.transitionDelay)
  );
  const animationDuration = style.animationName && style.animationName !== "none" ?
    getMaxTime(
      parseTimeList(style.animationDuration),
      parseTimeList(style.animationDelay)
    ) :
    0;

  return Math.max(transitionDuration, animationDuration) > 0;
}

function waitForFrame(element) {
  const windowRef = element.ownerDocument?.defaultView || window;

  return new Promise((resolve) => {
    if (typeof windowRef.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(() => resolve());
      return;
    }

    queueMicrotask(resolve);
  });
}

export function clearOverlayTransition(element) {
  if (element instanceof HTMLElement) {
    element.classList.remove(...OVERLAY_TRANSITION_CLASSES);
  }
}

export async function playOverlayTransition(element, {
  direction = "exit"
} = {}) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const directionClass = direction === "enter" ?
    "overlay-transition--enter" :
    "overlay-transition--exit";
  const oppositeDirectionClass = direction === "enter" ?
    "overlay-transition--exit" :
    "overlay-transition--enter";

  element.classList.add("overlay-transition", "overlay-transition--active");
  if (direction === "enter") {
    element.classList.add(oppositeDirectionClass);
  }

  await waitForFrame(element);
  element.classList.remove(oppositeDirectionClass);
  element.classList.add(directionClass);

  if (!hasActiveMotion(element)) {
    element.classList.remove("overlay-transition--active");
    return;
  }

  await new Promise((resolve) => {
    let settled = false;

    function finish(event) {
      if (event.target !== element || settled) {
        return;
      }

      settled = true;
      element.removeEventListener("transitionend", finish);
      element.removeEventListener("transitioncancel", finish);
      element.removeEventListener("animationend", finish);
      element.removeEventListener("animationcancel", finish);
      resolve();
    }

    element.addEventListener("transitionend", finish);
    element.addEventListener("transitioncancel", finish);
    element.addEventListener("animationend", finish);
    element.addEventListener("animationcancel", finish);
  });

  element.classList.remove("overlay-transition--active");
}

export function createOverlayVeil({ root } = {}) {
  let transitionToken = 0;

  async function show() {
    if (!(root instanceof HTMLElement)) {
      return;
    }

    const token = transitionToken + 1;
    transitionToken = token;
    root.hidden = false;
    root.setAttribute("aria-hidden", "true");
    clearOverlayTransition(root);
    await playOverlayTransition(root, {
      direction: "enter"
    });

    if (token !== transitionToken) {
      return;
    }

    root.classList.add("overlay-transition", "overlay-transition--enter");
  }

  async function hide() {
    if (!(root instanceof HTMLElement) || root.hidden) {
      return;
    }

    const token = transitionToken + 1;
    transitionToken = token;
    await playOverlayTransition(root, {
      direction: "exit"
    });

    if (token !== transitionToken) {
      return;
    }

    root.hidden = true;
    clearOverlayTransition(root);
  }

  function reset() {
    transitionToken += 1;
    if (root instanceof HTMLElement) {
      root.hidden = true;
      clearOverlayTransition(root);
    }
  }

  return {
    hide,
    reset,
    show
  };
}
