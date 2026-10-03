import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { Comment } from '../comments/comment.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { Vote } from './vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, Comment]), RealtimeModule, CacheModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}