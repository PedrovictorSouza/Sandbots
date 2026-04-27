// Selection bridge using WebSocket relay (for remote/mobile devices)
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const RELAY = window.__PRAGT_WS_RELAY || `ws://${location.hostname}:8081`;
  let socket = null;
  let pickerActive = false;

  function cssPath(el) {
    if (!el) return '';
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      let part = el.tagName.toLowerCase();
      if (el.id) { parts.unshift(part + `#${el.id}`); break; }
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\s+/).filter(Boolean)[0];
        if (cls) part += `.${cls}`;
      }
      const parent = el.parentNode;
      if (parent) {
        const idx = Array.from(parent.children).indexOf(el) + 1;
        part += `:nth-child(${idx})`;
      }
      parts.unshift(part);
      el = el.parentNode;
    }
    return parts.join(' > ');
  }

  function send(msg) {
    try {
      if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
    } catch (e) {}
  }

  function onSelect(e) {
    try { e.preventDefault(); e.stopPropagation(); } catch (er) {}
    const el = e.target;
    const selector = cssPath(el);
    const rect = el.getBoundingClientRect();
    send({ type: 'selected', selector, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, href: location.href });
    if (pickerActive) disablePicker();
  }

  function enablePicker() {
    if (pickerActive) return;
    pickerActive = true;
    document.addEventListener('click', onSelect, true);
    document.addEventListener('touchstart', onSelect, { capture: true, passive: false });
    send({ type: 'picker-activated' });
  }
  function disablePicker() {
    pickerActive = false;
    document.removeEventListener('click', onSelect, true);
    try { document.removeEventListener('touchstart', onSelect, { capture: true }); } catch (e) {}
    send({ type: 'picker-deactivated' });
  }

  function connect() {
    try {
      socket = new WebSocket(RELAY);
      socket.addEventListener('open', () => send({ type: 'hello', href: location.href }));
      socket.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (!msg || !msg.type) return;
          if (msg.type === 'activate-picker') enablePicker();
          if (msg.type === 'deactivate-picker') disablePicker();
          if (msg.type === 'highlight' && msg.selector) {
            try { const el = document.querySelector(msg.selector); if (el) el.style.outline = '3px solid rgba(255,200,50,0.9)'; setTimeout(()=>{ if(el) el.style.outline=''; },1500); } catch(e){}
          }
        } catch (e) {}
      });
      socket.addEventListener('close', () => setTimeout(connect, 2000));
    } catch (e) {
      // ignore
    }
  }

  connect();
  window.__pragtSelectionBridgeWS = { connect, enablePicker, disablePicker };
})();
