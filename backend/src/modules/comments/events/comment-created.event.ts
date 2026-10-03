import { Comment } from '../comment.entity';
import { PublicComment } from '../dto/comment.types';

export class CommentCreatedEvent {
  constructor(public readonly comment: PublicComment) {}
}