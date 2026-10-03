import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false })); 
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new WsAdapter(app)); 
  app.enableShutdownHooks();

  await app.listen(config.getOrThrow<number>('PORT'));
}
bootstrap();