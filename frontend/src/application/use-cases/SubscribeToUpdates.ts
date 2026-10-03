import type { EventStream, RealtimeEvent } from '../../domain/repositories/EventStream';

export class SubscribeToUpdates {
  constructor(private readonly stream: EventStream) {}

  execute(onEvent: (e: RealtimeEvent) => void, onStatus?: (connected: boolean) => void) {
    return this.stream.subscribe(onEvent, onStatus);
  }
}