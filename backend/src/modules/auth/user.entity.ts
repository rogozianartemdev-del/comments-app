import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Comment } from '../comments/comment.entity';
import { Vote } from '../votes/vote.entity';

@Entity('users')
@Index('uq_users_username', ['username'], { unique: true })
@Index('uq_users_email', ['email'], { unique: true })
export class User {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = randomUUID();
  }
}