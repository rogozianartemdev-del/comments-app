export interface CaptchaChallenge {
    captchaId: string;
    svg: string;
  }
  
  export interface CaptchaRepository {
    generate(): Promise<CaptchaChallenge>;
  }