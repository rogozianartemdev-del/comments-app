import type { CommentRepository, CreateCommentPayload } from "../../domain/repositories/CommentRepository";

export class CreateComment {
  constructor(private readonly repo: CommentRepository) {}

  execute(payload: CreateCommentPayload) {
    return this.repo.create(payload);
  }
}