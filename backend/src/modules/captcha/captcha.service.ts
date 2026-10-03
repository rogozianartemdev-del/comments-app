import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.module';

const ANSWER_TTL_SECONDS = 300; 
const RATE_LIMIT_TTL_SECONDS = 900; 
const RATE_LIMIT_MAX_ATTEMPTS = 20;

@Injectable()
export class CaptchaService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async generate(): Promise<{ id: string; svg: string }> {
    const captcha = svgCaptcha.create({
      size: 5,
      noise: 3,
      color: true,
      ignoreChars: '0oO1ilI',
    });

    const id = randomUUID();
    await this.redis.set(
      `captcha:${id}`,
      captcha.text.toLowerCase(),
      'EX',
      ANSWER_TTL_SECONDS,
    );

    return { id, svg: captcha.data };
  }

  async checkRateLimit(ip: string): Promise<boolean> {
    const key = `rate:captcha:${ip}`;
    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, RATE_LIMIT_TTL_SECONDS);
    }
    return attempts <= RATE_LIMIT_MAX_ATTEMPTS;
  }

  async verify(id: string, answer: string): Promise<boolean> {
    const stored = await this.redis.getdel(`captcha:${id}`);
    return !!stored && stored === answer.trim().toLowerCase();
  }
}