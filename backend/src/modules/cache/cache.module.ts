import { Module } from '@nestjs/common';
import { CommentsCacheService } from './comments-cache.service';

@Module({
  providers: [CommentsCacheService],
  exports: [CommentsCacheService],
})
export class CacheModule {}