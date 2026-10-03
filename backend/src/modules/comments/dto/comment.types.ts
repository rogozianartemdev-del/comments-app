export interface PublicFile {
    id: string;
    type: 'image' | 'txt';
    originalName: string;
    status: 'pending' | 'processed' | 'failed';
  }
  
  export interface PublicComment {
    id: string;
    parentId: string | null;
    username: string;
    email: string;
    homePage: string | null;
    text: string;
    score: number;
    depth: number;
    createdAt: string;
    files: PublicFile[];
  }
  
  export interface PublicRoot extends PublicComment {
    thread: PublicComment[];
  }
  
  export interface PublicPage {
    items: PublicRoot[];
    total: number;
    page: number;
    pageSize: number;
  }