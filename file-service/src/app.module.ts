import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from './storage/files.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FilesModule],
  controllers: [HealthController],
})
export class AppModule {}
