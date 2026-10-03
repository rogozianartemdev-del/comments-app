import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { DataSource, Repository } from 'typeorm';
import { SanitizeService } from '../../common/sanitize/sanitize.service';
import { REDIS_CLIENT } from '../../config/redis.module';
import { User } from '../auth/user.entity';
import { CommentsCacheService } from '../cache/comments-cache.service';
import { CaptchaService } from '../captcha/captcha.service';
import { CommentFile, FileStatus, FileType } from '../files/comment-file.entity';
import { FilesService } from '../files/files.service';
import { IMAGE_QUEUE, RESIZE_JOB_OPTIONS } from '../queue/queue.constants';
import type { ResizeJobData } from '../queue/image-resize.processor';
import { Comment } from './comment.entity';
import { rowToPublic, toPublic } from './comment.presenter';
import { PublicComment, PublicPage, PublicRoot } from './dto/comment.types';
import { CommentsRepository, SortField, SortOrder } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentCreatedEvent } from './events/comment-created.event';
import { MAX_FILES_PER_COMMENT } from '../files/files.constants';
export const PAGE_SIZE = 25;
const SORT_FIELDS: SortField[] = ['username', 'email', 'createdAt'];
const RATE_LIMIT_PER_MINUTE = 10;

export interface AuthedUser {
  userId: string;
  username: string;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepo: CommentsRepository,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly sanitize: SanitizeService,
    private readonly captcha: CaptchaService,
    private readonly files: FilesService,
    private readonly cache: CommentsCacheService,
    private readonly events: EventEmitter2,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectQueue(IMAGE_QUEUE) private readonly imageQueue: Queue<ResizeJobData>,
  ) {}

  async create(
    dto: CreateCommentDto,
    meta: { ip: string; userAgent: string | null; authUser: AuthedUser | null },
    files: Express.Multer.File[] = [],
  ): Promise<PublicComment> {
    await this.assertRateLimit(meta.authUser?.userId ?? meta.ip);
   
    if (files.length > MAX_FILES_PER_COMMENT) {
      throw new BadRequestException(`You can attach no more than ${MAX_FILES_PER_COMMENT} files.`);
    }

    const cleanText = this.sanitize.sanitize(dto.text);
    const detected = files.map((f) => this.files.inspect(f));

    if (!(await this.captcha.verify(dto.captchaId, dto.captchaAnswer))) {
      throw new BadRequestException('Incorrect captcha answer');
    }

    let username = dto.username;
    let email = dto.email;
    let userId: string | null = null;

    if (meta.authUser) {
      const account = await this.usersRepo.findOne({ where: { id: meta.authUser.userId } });
      if (!account) throw new UnauthorizedException();
    
      username = account.username;
      email = account.email;
      userId = account.id;
    } else {
      const clash = await this.usersRepo.findOne({
        where: [{ username: dto.username }, { email: dto.email }],
      });
      if (clash) {
        throw new ConflictException('This name or email belongs to a registered user, please log in to your account.');
      }
    }

    let parent: Comment | null = null;
    if (dto.parentId) {
      parent = await this.commentsRepo.findById(dto.parentId);
      if (!parent) throw new BadRequestException('The comment you are replying to was not found.');
    }

    
    const storedNames = await this.files.uploadAll(files, detected);

    let comment: Comment;
    let fileRecords: CommentFile[] = [];
    try {
      ({ comment, fileRecords } = await this.dataSource.transaction(async (m) => {
        const c = m.create(Comment, {
          userId,
          parentId: dto.parentId ?? null,
          username,
          email,
          homePage: dto.homePage ?? null,
          text: cleanText,
          ipAddress: meta.ip,
          userAgent: meta.userAgent?.slice(0, 512) ?? null,
          depth: parent ? parent.depth + 1 : 0,
        });
        await m.save(c);

        const records: CommentFile[] = [];
        for (let i = 0; i < files.length; i++) {
          const record = m.create(CommentFile, {
            commentId: c.id,
            type: detected[i].type,
            originalName: this.files.cleanName(files[i].originalname),
            storedName: storedNames[i],
            mimeType: detected[i].mime,
            sizeBytes: files[i].size,
            status: detected[i].type === FileType.IMAGE ? FileStatus.PENDING : FileStatus.PROCESSED,
          });
          await m.save(record);
          records.push(record);
        }
        return { comment: c, fileRecords: records };
      }));
    } catch (err) {
      await Promise.all(storedNames.map((name) => this.files.deleteFromStorage(name)));
      throw err;
    }

    for (const record of fileRecords) {
      if (record.type !== FileType.IMAGE) continue;
      try {
        await this.imageQueue.add(
          'resize',
          { fileId: record.id, storedName: record.storedName, commentId: comment.id },
          RESIZE_JOB_OPTIONS,
        );
      } catch {
        await this.files.markFailed(record.id);
        record.status = FileStatus.FAILED;
      }
    }

    await this.cache.bumpVersion();
    const result = toPublic(comment, fileRecords);
    this.events.emit('comment.created', new CommentCreatedEvent(result));
    return result;
  }

  async listPage(input: { page?: number; sortBy?: string; order?: string }): Promise<PublicPage> {
    const page = Number.isInteger(input.page) && (input.page as number) >= 1 ? (input.page as number) : 1;
    const sortBy: SortField = SORT_FIELDS.includes(input.sortBy as SortField)
      ? (input.sortBy as SortField)
      : 'createdAt';
    const order: SortOrder = input.order === 'asc' ? 'asc' : 'desc';

    const cached = await this.cache.getPage<PublicPage>(page, sortBy, order);
    if (cached) return cached;


    const { items: roots, total } = await this.commentsRepo.findRootPage(page, PAGE_SIZE, sortBy, order);
    const rootIds = roots.map((r) => r.id);
    const threadRows = await this.commentsRepo.findThreads(rootIds);
    const allFiles = await this.commentsRepo.findFilesByCommentIds([
      ...rootIds,
      ...threadRows.map((r) => r.id),
    ]);

    const filesByComment = new Map<string, CommentFile[]>();
    for (const f of allFiles) {
      const list = filesByComment.get(f.commentId) ?? [];
      list.push(f);
      filesByComment.set(f.commentId, list);
    }

    const threadByRoot = new Map<string, PublicComment[]>();
    for (const row of threadRows) {
      const list = threadByRoot.get(row.root_id) ?? [];
      list.push(rowToPublic(row, filesByComment.get(row.id) ?? []));
      threadByRoot.set(row.root_id, list);
    }

    const items: PublicRoot[] = roots.map((root) => ({
      ...toPublic(root, filesByComment.get(root.id) ?? []),
      thread: threadByRoot.get(root.id) ?? [],
    }));

    const result: PublicPage = { items, total, page, pageSize: PAGE_SIZE };
    await this.cache.setPage(page, sortBy, order, result);
    return result;
  }

  private async assertRateLimit(key: string) {
    const redisKey = `rate:comments:${key}`;
    const count = await this.redis.incr(redisKey);
    if (count === 1) await this.redis.expire(redisKey, 60);
    if (count > RATE_LIMIT_PER_MINUTE) {
      throw new HttpException('Too often, wait a minute', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}