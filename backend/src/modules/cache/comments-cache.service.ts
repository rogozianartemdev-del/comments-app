import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.provider';

const PAGE_TTL_SECONDS = 120;

@Injectable()
export class CommentsCacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  private async getVersion(): Promise<number> {
    const v = await this.redis.get('comments:version');
    return v ? Number(v) : 0;
  }

  private buildKey(version: number, page: number, sort: string, dir: string): string {
    return `comments:page:${version}:${page}:${sort}:${dir}`;
  }

  async getPage<T>(page: number, sort: string, dir: string): Promise<T | null> {
    const version = await this.getVersion();
    const raw = await this.redis.get(this.buildKey(version, page, sort, dir));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setPage<T>(page: number, sort: string, dir: string, data: T): Promise<void> {
    const version = await this.getVersion();
    await this.redis.set(
      this.buildKey(version, page, sort, dir),
      JSON.stringify(data),
      'EX',
      PAGE_TTL_SECONDS,
    );
  }

  async bumpVersion(): Promise<void> {
    await this.redis.incr('comments:version');
  }
}