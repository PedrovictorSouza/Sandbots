export function createOnboardingHintController({
  titleElement,
  bodyElement
}) {
  function setHint({ title = "", bodyHtml = "" } = {}) {
    if (titleElement) {
      titleElement.textContent = title;
    }

    if (bodyElement) {
      bodyElement.innerHTML = bodyHtml;
    }
  }

  return {
    setHint
  };
}
