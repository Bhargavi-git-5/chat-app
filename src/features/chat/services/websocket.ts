import type { Message, MessageStatus } from '../types';
import type { SimulatorApi } from './simulator';

type ServerEvent =
  | { type: 'message'; message: Message }
  | { type: 'typing'; conversationId: string; userId: string; isTyping: boolean }
  | { type: 'presence'; userId: string; online: boolean }
  | { type: 'ack'; conversationId: string; messageId: string; status: MessageStatus };

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 500;
let stopped = true;
let activeApi: SimulatorApi | null = null;
let statusHandler: ((conversationId: string, messageId: string, status: MessageStatus) => void) | null = null;

function handleEvent(event: ServerEvent) {
  if (!activeApi) return;
  switch (event.type) {
    case 'message': activeApi.receive(event.message); break;
    case 'typing': activeApi.setTyping(event.conversationId, event.userId, event.isTyping); break;
    case 'presence': activeApi.setOnline(event.userId, event.online); break;
    case 'ack': statusHandler?.(event.conversationId, event.messageId, event.status); break;
  }
}

function connect(url: string) {
  if (stopped || typeof window === 'undefined') return;
  try {
    const next = new WebSocket(url);
    socket = next;
    next.onopen = () => { reconnectDelay = 500; };
    next.onmessage = (message) => {
      try { handleEvent(JSON.parse(String(message.data)) as ServerEvent); } catch { /* ignore malformed frames */ }
    };
    next.onclose = () => {
      if (socket === next) socket = null;
      if (!stopped) {
        reconnectTimer = setTimeout(() => connect(url), reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 10_000);
      }
    };
    next.onerror = () => next.close();
  } catch {
    if (!stopped) reconnectTimer = setTimeout(() => connect(url), reconnectDelay);
  }
}

export function startChatWebSocket(
  api: SimulatorApi,
  onStatus: (conversationId: string, messageId: string, status: MessageStatus) => void,
  url = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:3001',
): () => void {
  stopChatWebSocket();
  stopped = false;
  activeApi = api;
  statusHandler = onStatus;
  connect(url);
  return stopChatWebSocket;
}

export function publishOutgoingMessage(message: Message): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type: 'outgoing', message }));
  return true;
}

export function stopChatWebSocket() {
  stopped = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  const current = socket;
  socket = null;
  if (current) {
    current.onclose = null;
    current.close();
  }
  activeApi = null;
  statusHandler = null;
}
