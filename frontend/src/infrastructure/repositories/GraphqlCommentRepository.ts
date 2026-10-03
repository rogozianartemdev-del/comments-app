import type{ Comment, CommentsPage } from '../../domain/entities/Comment';
import type{
  CommentRepository,
  CreateCommentPayload,
  ListParams,
} from '../../domain/repositories/CommentRepository';
import { apiClient } from '../http/apiClient';
import { gqlRequest } from '../http/graphqlClient';

const FIELDS = `
  id parentId username email homePage text score depth createdAt
  files { id type originalName status }
`;

const COMMENTS_QUERY = `
  query Comments($page: Int!, $sortBy: String!, $order: String!) {
    comments(page: $page, sortBy: $sortBy, order: $order) {
      total page pageSize
      items { ${FIELDS} thread { ${FIELDS} } }
    }
  }
`;

type Raw = Omit<Comment, 'replies'>;
type RawRoot = Raw & { thread: Raw[] };

function buildTree(root: RawRoot): Comment {
  const nodes = new Map<string, Comment>();
  const { thread, ...rootFields } = root;
  nodes.set(root.id, { ...rootFields, replies: [] });
  thread.forEach((t) => nodes.set(t.id, { ...t, replies: [] }));
  thread.forEach((t) => {
    if (t.parentId) nodes.get(t.parentId)?.replies.push(nodes.get(t.id)!);
  });
  return nodes.get(root.id)!;
}

export class GraphqlCommentRepository implements CommentRepository {
  async list(params: ListParams): Promise<CommentsPage> {
    const data = await gqlRequest<{
      comments: { items: RawRoot[]; total: number; page: number; pageSize: number };
    }>(COMMENTS_QUERY, { ...params });

    return {
      total: data.comments.total,
      page: data.comments.page,
      pageSize: data.comments.pageSize,
      items: data.comments.items.map(buildTree),
    };
  }

  async create(payload: CreateCommentPayload): Promise<void> {
    const form = new FormData();
    form.append('username', payload.username);
    form.append('email', payload.email);
    if (payload.homePage) form.append('homePage', payload.homePage);
    form.append('text', payload.text);
    form.append('captchaId', payload.captchaId);
    form.append('captchaAnswer', payload.captchaAnswer);
    if (payload.parentId) form.append('parentId', payload.parentId);
    payload.files?.forEach((f) => form.append('files', f));

    await apiClient.post('/comments', form);
  }

  async vote(commentId: string, type: 'like' | 'dislike'): Promise<number> {
    const { data } = await apiClient.post<{ score: number }>(`/comments/${commentId}/votes`, {
      voteType: type,
    });
    return data.score;
  }
  
}