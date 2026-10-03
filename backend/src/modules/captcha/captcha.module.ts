import { Module } from '@nestjs/common';
import { redisProvider } from '../../config/redis.provider';
import { CaptchaController } from './captcha.controller';
import { CaptchaService } from './captcha.service';

@Module({
    providers: [CaptchaService, redisProvider],
  controllers: [CaptchaController],
  exports: [CaptchaService],
})
export class CaptchaModule {}