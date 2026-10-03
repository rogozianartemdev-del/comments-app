import type { CaptchaRepository } from "../../domain/repositories/CaptchaRepository";

export class GetCaptcha {
    constructor(private readonly repo: CaptchaRepository) {}
  
    execute() {
      return this.repo.generate();
    }
  }