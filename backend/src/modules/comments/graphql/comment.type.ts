import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CommentFile')
export class CommentFileType {
  @Field(() => ID) id: string;
  @Field(() => String) type: string;
  @Field(() => String) originalName: string;
  @Field(() => String) status: string;
}

@ObjectType({ isAbstract: true })
abstract class CommentBaseType {
  @Field(() => ID) id: string;
  @Field(() => String, { nullable: true }) parentId: string | null;
  @Field(() => String) username: string;
  @Field(() => String) email: string;
  @Field(() => String, { nullable: true }) homePage: string | null;
  @Field(() => String) text: string;
  @Field(() => Int) score: number;
  @Field(() => Int) depth: number;
  @Field(() => String) createdAt: string;
  @Field(() => [CommentFileType]) files: CommentFileType[];
}

@ObjectType('Reply')
export class ReplyType extends CommentBaseType {}

@ObjectType('Comment')
export class CommentType extends CommentBaseType {
  @Field(() => [ReplyType]) thread: ReplyType[];
}

@ObjectType('CommentsPage')
export class CommentsPageType {
  @Field(() => [CommentType]) items: CommentType[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) pageSize: number;
}