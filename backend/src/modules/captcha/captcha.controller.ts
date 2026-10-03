import { BadRequestException, Controller, Get, Header, HttpException, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CaptchaService } from './captcha.service';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async getCaptcha(@Req() req: Request) {
    if (!(await this.captchaService.checkRateLimit(req.ip ?? 'unknown'))) {
      throw new HttpException('Too many captcha requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    const { id, svg } = await this.captchaService.generate();
    return { captchaId: id, svg }
  }
}