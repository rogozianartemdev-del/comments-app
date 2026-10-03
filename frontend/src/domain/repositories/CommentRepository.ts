import type { CommentsPage, SortField, SortOrder } from '../entities/Comment';

export interface ListParams {
  page: number;
  sortBy: SortField;
  order: SortOrder;
}

export interface CreateCommentPayload {
  username: string;
  email: string;
  homePage?: string;
  text: string;
  captchaId: string;
  captchaAnswer: string;
  parentId?: string;
  files?: File[];
}

export interface CommentRepository {
  list(params: ListParams): Promise<CommentsPage>;
  create(payload: CreateCommentPayload): Promise<void>;
  vote(commentId: string, type: 'like' | 'dislike'): Promise<number>;
}