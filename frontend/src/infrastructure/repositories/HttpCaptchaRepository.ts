import type { CaptchaChallenge, CaptchaRepository } from "../../domain/repositories/CaptchaRepository";
import { apiClient } from "../http/apiClient";



export class HttpCaptchaRepository implements CaptchaRepository {
    async generate(): Promise<CaptchaChallenge> {
        const { data } = await apiClient.get<CaptchaChallenge>('/captcha');
        return data;
      }
}