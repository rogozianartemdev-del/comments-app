import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { CommentsCacheService } from '../cache/comments-cache.service';
import { Comment } from '../comments/comment.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Vote, VoteType } from './vote.entity';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Comment) private readonly commentsRepo: Repository<Comment>,
    private readonly dataSource: DataSource,
    private readonly cache: CommentsCacheService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async vote(userId: string, commentId: string, type: VoteType): Promise<{ score: number }> {
    const exists = await this.commentsRepo.exists({ where: { id: commentId } });
    if (!exists) throw new NotFoundException('Комментарий не найден');

    const delta = type === VoteType.LIKE ? 1 : -1;

    let score: number;
    try {
      score = await this.dataSource.transaction(async (m) => {
        await m.insert(Vote, { id: randomUUID(), userId, commentId, voteType: type });
        await m.increment(Comment, { id: commentId }, 'score', delta);
        const updated = await m.findOneOrFail(Comment, { where: { id: commentId } });
        return updated.score;
      });
    } catch (err: any) {
      if ((err?.driverError?.code ?? err?.code) === 'ER_DUP_ENTRY') {
        throw new ConflictException('Вы уже голосовали за этот комментарий');
      }
      throw err;
    }

    await this.cache.bumpVersion();
    await this.realtime.publish('comment:voted', { commentId });
    return { score };
  }
}