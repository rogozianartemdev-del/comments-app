import type { EventStream, RealtimeEvent } from '../../domain/repositories/EventStream';

type EventHandler = (e: RealtimeEvent) => void;
type StatusHandler = (connected: boolean) => void;

const KNOWN: RealtimeEvent[] = ['comment:created', 'comment:voted', 'file:processed'];

export class WebSocketEventStream implements EventStream {
  private socket: WebSocket | null = null;
  private handlers = new Set<EventHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private retry = 0;
  private timer?: number;

  subscribe(onEvent: EventHandler, onStatus?: StatusHandler) {
    this.handlers.add(onEvent);
    if (onStatus) this.statusHandlers.add(onStatus);
    if (!this.socket) this.open();

    return () => {
      this.handlers.delete(onEvent);
      if (onStatus) this.statusHandlers.delete(onStatus);
      if (this.handlers.size === 0) this.close();
    };
  }

  private url() {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${location.host}/ws`;
  }

  private emitStatus(connected: boolean) {
    this.statusHandlers.forEach((h) => h(connected));
  }

  private open() {
    const ws = new WebSocket(this.url());
    this.socket = ws;

    ws.onopen = () => {
      if (this.socket !== ws) return;
      this.retry = 0;
      this.emitStatus(true);
    };

    ws.onmessage = (msg) => {
      if (this.socket !== ws) return;
      try {
        const parsed = JSON.parse(String(msg.data)) as { event?: RealtimeEvent };
        if (parsed.event && KNOWN.includes(parsed.event)) {
          this.handlers.forEach((h) => h(parsed.event as RealtimeEvent));
        }
      } catch {
      }
    };

    ws.onclose = () => {
      if (this.socket !== ws) return; 
      this.socket = null;
      this.emitStatus(false);
      if (this.handlers.size === 0) return;
      const delay = Math.min(1000 * 2 ** this.retry++, 10000);
      this.timer = window.setTimeout(() => this.open(), delay);
    };
  }

  private close() {
    window.clearTimeout(this.timer);
    const ws = this.socket;
    this.socket = null;
    ws?.close();
  }
}