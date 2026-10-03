import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CommentFile } from '../files/comment-file.entity';
import { Comment } from './comment.entity';

export type SortField = 'username' | 'email' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

const SORT_COLUMNS: Record<SortField, string> = {
  username: 'comment.username',
  email: 'comment.email',
  createdAt: 'comment.createdAt',
};

export interface ThreadRow {
  id: string;
  parent_id: string;
  root_id: string;
  username: string;
  email: string;
  home_page: string | null;
  text: string;
  score: number;
  depth: number;
  created_at: Date;
}

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment) private readonly repo: Repository<Comment>,
    @InjectRepository(CommentFile) private readonly filesRepo: Repository<CommentFile>,
  ) {}

  async findRootPage(page: number, pageSize: number, sortBy: SortField, order: SortOrder) {
    const [items, total] = await this.repo
      .createQueryBuilder('comment')
      .where('comment.parentId IS NULL')
      .orderBy(SORT_COLUMNS[sortBy], order === 'asc' ? 'ASC' : 'DESC')
      .addOrderBy('comment.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items, total };
  }


  async findThreads(rootIds: string[]): Promise<ThreadRow[]> {
    if (rootIds.length === 0) return [];
    const placeholders = rootIds.map(() => '?').join(',');
    return this.repo.query(
      `
      WITH RECURSIVE tree AS (
        SELECT c.*, c.parent_id AS root_id
          FROM comments c
         WHERE c.parent_id IN (${placeholders})
        UNION ALL
        SELECT c.*, t.root_id
          FROM comments c
         INNER JOIN tree t ON c.parent_id = t.id
      )
      SELECT id, parent_id, root_id, username, email, home_page,
             \`text\`, score, depth, created_at
        FROM tree
       ORDER BY created_at ASC
      `,
      rootIds,
    );
  }

  findFilesByCommentIds(ids: string[]): Promise<CommentFile[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.filesRepo.find({ where: { commentId: In(ids) } });
  }

  findById(id: string): Promise<Comment | null> {
    return this.repo.findOne({ where: { id } });
  }
}