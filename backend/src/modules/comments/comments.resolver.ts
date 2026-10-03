import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { CommentsPageType } from './graphql/comment.type';

@Resolver()
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => CommentsPageType, { name: 'comments' })
  getComments(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('sortBy', { type: () => String, defaultValue: 'createdAt' }) sortBy: string,
    @Args('order', { type: () => String, defaultValue: 'desc' }) order: string,
  ) {
    return this.commentsService.listPage({ page, sortBy, order });
  }
}