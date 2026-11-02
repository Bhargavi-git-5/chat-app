import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.CHAT_WS_PORT || 3001);
const wss = new WebSocketServer({ port: PORT });
const conversations = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
const members = ['u1', 'u2', 'u3'];
const replies = ['WebSocket event received 👋', 'I have added an update to the thread.', 'That looks good to me!', 'Let us sync on this shortly.'];
const broadcast = (payload) => {
  const frame = JSON.stringify(payload);
  for (const client of wss.clients) if (client.readyState === 1) client.send(frame);
};

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'connected', message: 'Mock chat WebSocket connected' }));
  socket.on('message', (raw) => {
    let event;
    try { event = JSON.parse(raw.toString()); } catch { return; }
    if (event.type === 'outgoing' && event.message?.id) {
      const { id, conversationId } = event.message;
      for (const [status, delay] of [['sent', 150], ['delivered', 500], ['read', 1200]]) {
        setTimeout(() => socket.readyState === 1 && socket.send(JSON.stringify({ type: 'ack', conversationId, messageId: id, status })), delay);
      }
    }
  });
});

const timer = setInterval(() => {
  const conversationId = conversations[Math.floor(Math.random() * conversations.length)];
  const senderId = members[Math.floor(Math.random() * members.length)];
  const message = {
    id: `ws-${randomUUID()}`, conversationId, senderId,
    text: replies[Math.floor(Math.random() * replies.length)], createdAt: Date.now(),
    status: 'delivered', reactions: [],
  };
  broadcast({ type: 'typing', conversationId, userId: senderId, isTyping: true });
  setTimeout(() => {
    broadcast({ type: 'typing', conversationId, userId: senderId, isTyping: false });
    broadcast({ type: 'message', message });
  }, 1100);
}, 15_000);

console.log(`Mock chat WebSocket server listening on ws://localhost:${PORT}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { clearInterval(timer); wss.close(); process.exit(0); });
