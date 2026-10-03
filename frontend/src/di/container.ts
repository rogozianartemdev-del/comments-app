import { Authenticate } from '../application/use-cases/Authenticate';
import { CreateComment } from '../application/use-cases/CreateComment';
import { GetCaptcha } from '../application/use-cases/GetCaptcha';
import { GetComments } from '../application/use-cases/GetComments';
import { SubscribeToUpdates } from '../application/use-cases/SubscribeToUpdates';
import { VoteComment } from '../application/use-cases/VoteComment';
import { GraphqlCommentRepository } from '../infrastructure/repositories/GraphqlCommentRepository';
import { HttpAuthRepository } from '../infrastructure/repositories/HttpAuthRepository';
import { HttpCaptchaRepository } from '../infrastructure/repositories/HttpCaptchaRepository';
import { WebSocketEventStream } from '../infrastructure/realtime/WebSocketEventStream';

const commentRepository = new GraphqlCommentRepository();
const authRepository = new HttpAuthRepository();
const captchaRepository = new HttpCaptchaRepository();
const eventStream = new WebSocketEventStream();

export const container = {
  getComments: new GetComments(commentRepository),
  createComment: new CreateComment(commentRepository),
  voteComment: new VoteComment(commentRepository),
  authenticate: new Authenticate(authRepository),
  getCaptcha: new GetCaptcha(captchaRepository),
  subscribeToUpdates: new SubscribeToUpdates(eventStream),
};