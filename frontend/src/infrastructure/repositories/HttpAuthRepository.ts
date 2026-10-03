import type { AuthResult } from "../../domain/entities/User";
import type { AuthRepository } from "../../domain/repositories/AuthRepository";
import { apiClient } from "../http/apiClient";



export class HttpAuthRepository implements AuthRepository{

    async register(username: string, email: string, password: string): Promise<AuthResult> {
        const { data } = await apiClient.post<AuthResult>('/auth/register', {
            username,
            email,
            password,
          });
          return data;
    }

    async login(usernameOrEmail: string, password: string): Promise<AuthResult> {
        const { data } = await apiClient.post<AuthResult>('/auth/login', {
            usernameOrEmail,
            password,
          });
          return data;
    }
}