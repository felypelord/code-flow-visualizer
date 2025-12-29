const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { makeSnapshots } = require('./debugBridgeMock');

const app = express();
app.use(express.json({ limit: '1mb' }));

const sessions = new Map();

app.post('/api/exec/create', (req, res) => {
  const { language, code } = req.body || {};
  const id = uuidv4();
  sessions.set(id, { id, language, code, createdAt: Date.now(), snapshotIndex: 0, snapshots: makeSnapshots(code) });
  res.json({ sessionId: id });
});

app.post('/api/exec/:id/run', (req, res) => {
  const id = req.params.id;
  const s = sessions.get(id);
  if (!s) return res.status(404).json({ error: 'not found' });
  s.snapshotIndex = 0;
  // optionally trigger immediate broadcast
  res.json({ ok: true });
});

app.post('/api/exec/:id/step', (req, res) => {
  const id = req.params.id;
  const s = sessions.get(id);
  if (!s) return res.status(404).json({ error: 'not found' });
  const idx = s.snapshotIndex++;
  const snap = s.snapshots[idx] || { event: 'end' };
  // if there is a ws connected for this session, send it
  broadcastToSession(id, { type: 'snapshot', payload: snap });
  res.json({ ok: true, snapshot: snap });
});

app.post('/api/exec/:id/resume', (req, res) => {
  const id = req.params.id;
  const s = sessions.get(id);
  if (!s) return res.status(404).json({ error: 'not found' });
  // send remaining snapshots slowly
  const remaining = s.snapshots.slice(s.snapshotIndex);
  remaining.forEach((snap, i) => {
    setTimeout(() => broadcastToSession(id, { type: 'snapshot', payload: snap }), i * 200);
  });
  s.snapshotIndex = s.snapshots.length;
  res.json({ ok: true });
});

app.post('/api/exec/:id/terminate', (req, res) => {
  const id = req.params.id;
  sessions.delete(id);
  res.json({ ok: true });
});

const server = app.listen(process.env.PORT || 4001, () => console.log('exec-prototype running on', server.address().port));

const wss = new WebSocket.Server({ server, path: '/ws/exec' });

function broadcastToSession(sessionId, msg) {
  const raw = JSON.stringify({ sessionId, ...msg });
  wss.clients.forEach((c) => {
    try {
      if (c.readyState === WebSocket.OPEN) c.send(raw);
    } catch (e) {}
  });
}

wss.on('connection', (ws, req) => {
  ws.on('message', (m) => {
    try {
      const data = JSON.parse(m.toString());
      if (data && data.subscribe) {
        // noop for mock: client will receive broadcasts
      }
    } catch (e) {}
  });
});

module.exports = { app };
