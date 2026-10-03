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
import { Comment } from '../comments/comment.entity';

export enum FileType {
  IMAGE = 'image',
  TXT = 'txt',
}

export enum FileStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('files')
@Index('uq_files_stored_name', ['storedName'], { unique: true })
@Index('idx_files_comment', ['commentId'])
export class CommentFile {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'comment_id', type: 'char', length: 36 })
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ type: 'enum', enum: FileType })
  type: FileType;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'stored_name', type: 'varchar', length: 255 })
  storedName: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'int', unsigned: true })
  sizeBytes: number;

  @Column({ type: 'enum', enum: FileStatus, default: FileStatus.PENDING })
  status: FileStatus;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = randomUUID();
  }
}