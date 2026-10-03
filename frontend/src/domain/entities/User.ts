export interface User {
    id: string;
    username: string;
    email: string;
  }
  
  export interface AuthResult {
    accessToken: string;
    user: User;
  }