import type { CommentRepository } from "../../domain/repositories/CommentRepository";

export class VoteComment {
    constructor(private readonly repo: CommentRepository) {}
  
    execute(commentId: string, type: 'like' | 'dislike') {
      return this.repo.vote(commentId, type);
    }
  }