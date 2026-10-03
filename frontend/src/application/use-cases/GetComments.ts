import type { CommentRepository, ListParams } from "../../domain/repositories/CommentRepository";


export class GetComments {
  constructor(private readonly repo: CommentRepository) {}

  execute(params: ListParams) {
    return this.repo.list(params);
  }
}