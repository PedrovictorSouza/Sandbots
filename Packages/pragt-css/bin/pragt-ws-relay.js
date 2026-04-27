#!/usr/bin/env node
// Simple WebSocket relay for Pragt Inspector
// Usage: node packages/pragt-css/bin/pragt-ws-relay.js [port]
const port = Number(process.argv[2] || process.env.PRAGT_WS_PORT || 8081);
try {
  const { WebSocketServer } = require('ws');
  const wss = new WebSocketServer({ port });
  console.log(`Pragt WS relay listening on ws://localhost:${port}`);

  wss.on('connection', (ws, req) => {
    console.log('client connected', req.socket.remoteAddress);
    ws.on('message', (data) => {
      // broadcast to others
      let msg = data;
      try { msg = data.toString(); } catch (e) {}
      for (const c of wss.clients) {
        if (c !== ws && c.readyState === 1) {
          try { c.send(msg); } catch (e) {}
        }
      }
    });
    ws.on('close', () => console.log('client disconnected'));
  });
} catch (err) {
  console.error('Please install ws: npm i -D ws');
  console.error(err && err.message ? err.message : String(err));
  process.exit(1);
}
