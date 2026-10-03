import type { AuthRepository } from "../../domain/repositories/AuthRepository";

export class Authenticate {
    constructor(private readonly repo: AuthRepository) {}
  
    register(username: string, email: string, password: string) {
      return this.repo.register(username, email, password);
    }
  
    login(usernameOrEmail: string, password: string) {
      return this.repo.login(usernameOrEmail, password);
    }
  }