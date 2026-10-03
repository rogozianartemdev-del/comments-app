import { CommentFile } from '../files/comment-file.entity';
import { Comment } from './comment.entity';
import { PublicComment, PublicFile } from './dto/comment.types';
import { ThreadRow } from './comments.repository';

export function toPublicFile(f: CommentFile): PublicFile {
  return { id: f.id, type: f.type, originalName: f.originalName, status: f.status };
}

export function toPublic(c: Comment, files: CommentFile[]): PublicComment {
  return {
    id: c.id,
    parentId: c.parentId,
    username: c.username,
    email: c.email,
    homePage: c.homePage,
    text: c.text,
    score: c.score,
    depth: c.depth,
    createdAt: (c.createdAt ?? new Date()).toISOString(),
    files: files.map(toPublicFile),
  };
}

export function rowToPublic(r: ThreadRow, files: CommentFile[]): PublicComment {
  return {
    id: r.id,
    parentId: r.parent_id,
    username: r.username,
    email: r.email,
    homePage: r.home_page,
    text: r.text,
    score: r.score,
    depth: r.depth,
    createdAt: new Date(r.created_at).toISOString(),
    files: files.map(toPublicFile),
  };
}