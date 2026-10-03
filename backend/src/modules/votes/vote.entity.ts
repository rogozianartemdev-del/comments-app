import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Comment } from '../comments/comment.entity';

export enum VoteType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

@Entity('votes')
@Index('uq_votes_user_comment', ['userId', 'commentId'], { unique: true })
@Index('idx_votes_comment', ['commentId'])
export class Vote {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'comment_id', type: 'char', length: 36 })
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ name: 'vote_type', type: 'enum', enum: VoteType })
  voteType: VoteType;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = randomUUID();
  }
}