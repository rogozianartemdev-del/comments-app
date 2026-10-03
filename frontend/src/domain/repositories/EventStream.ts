export type RealtimeEvent = 'comment:created' | 'comment:voted' | 'file:processed';

export interface EventStream {
  subscribe(
    onEvent: (event: RealtimeEvent) => void,
    onStatus?: (connected: boolean) => void,
  ): () => void;
}