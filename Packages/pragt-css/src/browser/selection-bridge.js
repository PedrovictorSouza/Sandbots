// Simple selection bridge for Pragt Inspector using BroadcastChannel
// Inject this script into the target page (same-origin) to enable cross-tab selection.
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const CHANNEL_NAME = 'pragt-inspector';
  const channel = new BroadcastChannel(CHANNEL_NAME);

  let pickerActive = false;
  let lastOverlay = null;

  function cssPath(el) {
    if (!el) return '';
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      let part = el.tagName.toLowerCase();
      if (el.id) {
        part += `#${el.id}`;
        parts.unshift(part);
        break;
      }
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\s+/).filter(Boolean)[0];
        if (cls) part += `.${cls}`;
      }
      const parent = el.parentNode;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
        if (siblings.length > 1) {
          const idx = Array.from(parent.children).indexOf(el) + 1;
          part += `:nth-child(${idx})`;
        }
      }
      parts.unshift(part);
      el = el.parentNode;
    }
    return parts.join(' > ');
  }

  function makeOverlay(rect) {
    const ov = document.createElement('div');
    ov.style.position = 'absolute';
    ov.style.left = `${rect.left + window.scrollX}px`;
    ov.style.top = `${rect.top + window.scrollY}px`;
    ov.style.width = `${rect.width}px`;
    ov.style.height = `${rect.height}px`;
    ov.style.background = 'rgba(255,200,50,0.12)';
    ov.style.border = '2px solid rgba(255,200,50,0.9)';
    ov.style.zIndex = 999999999;
    ov.style.pointerEvents = 'none';
    return ov;
  }

  function highlightElement(el) {
    removeOverlay();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    lastOverlay = makeOverlay(rect);
    document.body.appendChild(lastOverlay);
  }

  function removeOverlay() {
    if (lastOverlay && lastOverlay.parentNode) lastOverlay.parentNode.removeChild(lastOverlay);
    lastOverlay = null;
  }

  function onSelect(e) {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (er) {}
    const el = e.target;
    const selector = cssPath(el);
    const rect = el.getBoundingClientRect();
    channel.postMessage({ type: 'selected', selector, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, href: location.href });
    // briefly highlight
    highlightElement(el);
    setTimeout(removeOverlay, 1500);
    if (pickerActive) disablePicker();
  }

  function enablePicker() {
    if (pickerActive) return;
    pickerActive = true;
    document.addEventListener('click', onSelect, true);
    document.addEventListener('touchstart', onSelect, { capture: true, passive: false });
  }

  function disablePicker() {
    pickerActive = false;
    document.removeEventListener('click', onSelect, true);
    try { document.removeEventListener('touchstart', onSelect, { capture: true }); } catch (e) {}
  }

  channel.onmessage = (ev) => {
    const msg = ev.data || {};
    if (!msg || !msg.type) return;
    if (msg.type === 'activate-picker') {
      enablePicker();
    }
    if (msg.type === 'deactivate-picker') {
      disablePicker();
    }
    if (msg.type === 'highlight' && msg.selector) {
      try {
        const el = document.querySelector(msg.selector);
        if (el) highlightElement(el);
      } catch (e) {}
    }
    if (msg.type === 'clear-highlight') removeOverlay();
  };

  // expose for manual use
  window.__pragtSelectionBridge = { channel, enablePicker, disablePicker, highlightElement, removeOverlay };
})();
