import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { FilesModule } from '../files/files.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ImageResizeProcessor } from './image-resize.processor';
import { IMAGE_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: IMAGE_QUEUE }),
    FilesModule,
    RealtimeModule,
    CacheModule,
  ],
  providers: [ImageResizeProcessor],
  exports: [BullModule],
})
export class QueueModule {}