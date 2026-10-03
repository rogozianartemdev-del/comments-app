import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { CommentFile } from '../files/comment-file.entity';
import { Vote } from '../votes/vote.entity';

@Entity('comments')
@Index('idx_comments_parent_created', ['parentId', 'createdAt'])
@Index('idx_comments_created', ['createdAt'])
@Index('idx_comments_username', ['username'])
@Index('idx_comments_email', ['email'])
export class Comment {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'user_id', type: 'char', length: 36, nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.comments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'parent_id', type: 'char', length: 36, nullable: true })
  parentId: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'home_page', type: 'varchar', length: 255, nullable: true })
  homePage: string | null;

  @Column({ type: 'text' })
  text: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  depth: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @OneToMany(() => Vote, (vote) => vote.comment)
  votes: Vote[];

  @OneToMany(() => CommentFile, (file) => file.comment)
  files: CommentFile[];

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = randomUUID();
  }
}