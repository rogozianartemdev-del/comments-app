import type { AuthResult } from "../entities/User";

export interface AuthRepository {
  register(username: string, email: string, password: string): Promise<AuthResult>;
  login(usernameOrEmail: string, password: string): Promise<AuthResult>;
}