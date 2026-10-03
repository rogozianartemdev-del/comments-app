import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, WebSocket } from 'ws';
import { CommentCreatedEvent } from '../comments/events/comment-created.event';

const CHANNEL = 'realtime:events';

@WebSocketGateway({ path: '/ws' })
export class RealtimeGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server: Server;

  private pub: Redis;
  private sub: Redis;
  private pingTimer?: NodeJS.Timeout;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.getOrThrow<string>('REDIS_URL');
    this.pub = new Redis(url);
    this.sub = new Redis(url);
    await this.sub.subscribe(CHANNEL);
    this.sub.on('message', (_channel, raw) => this.broadcastLocal(raw));

    this.pingTimer = setInterval(() => {
      this.server?.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) c.ping();
      });
    }, 30_000);
  }

  async onModuleDestroy() {
    clearInterval(this.pingTimer);
    this.pub?.disconnect();
    this.sub?.disconnect();
  }

  @OnEvent('comment.created')
  onCommentCreated(event: CommentCreatedEvent) {
    return this.publish('comment:created', {
      id: event.comment.id,
      parentId: event.comment.parentId,
    });
  }

  publish(event: string, data: unknown) {
    return this.pub.publish(CHANNEL, JSON.stringify({ event, data }));
  }

  private broadcastLocal(raw: string) {
    this.server?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(raw);
    });
  }
}