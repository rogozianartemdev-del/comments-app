export type FileStatus = 'pending' | 'processed' | 'failed';

export interface CommentFile {
  id: string;
  type: 'image' | 'txt';
  originalName: string;
  status: FileStatus;
}

export interface Comment {
  id: string;
  parentId: string | null;
  username: string;
  email: string;
  homePage: string | null;
  text: string;
  score: number;
  depth: number;
  createdAt: string;
  files: CommentFile[];
  replies: Comment[];
}

export interface CommentsPage {
  items: Comment[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortField = 'username' | 'email' | 'createdAt';
export type SortOrder = 'asc' | 'desc';