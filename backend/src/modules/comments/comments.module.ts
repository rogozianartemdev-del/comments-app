import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SanitizeModule } from '../../common/sanitize/sanitize.module';
import { User } from '../auth/user.entity';
import { CacheModule } from '../cache/cache.module';
import { CaptchaModule } from '../captcha/captcha.module';
import { CommentFile } from '../files/comment-file.entity';
import { FilesModule } from '../files/files.module';
import { QueueModule } from '../queue/queue.module';
import { Comment } from './comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, User, CommentFile]),
    SanitizeModule,
    CaptchaModule,
    FilesModule,
    CacheModule,
    QueueModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository, CommentsResolver],
})
export class CommentsModule {}