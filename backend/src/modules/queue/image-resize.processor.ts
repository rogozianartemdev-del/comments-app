import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CommentsCacheService } from '../cache/comments-cache.service';
import { FilesService } from '../files/files.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { IMAGE_QUEUE } from './queue.constants';

export interface ResizeJobData {
  fileId: string;
  storedName: string;
  commentId: string;
}

@Processor(IMAGE_QUEUE)
export class ImageResizeProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageResizeProcessor.name);

  constructor(
    private readonly files: FilesService,
    private readonly cache: CommentsCacheService,
    private readonly realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<ResizeJobData>): Promise<void> {
    await this.files.requestResize(job.data.storedName);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<ResizeJobData>) {
    await this.files.markProcessed(job.data.fileId);
    await this.cache.bumpVersion();
    await this.realtime.publish('file:processed', { commentId: job.data.commentId });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ResizeJobData> | undefined, err: Error) {
    if (!job) return;
    this.logger.error(`Resize failed (${job.data.storedName}): ${err.message}`);
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.files.markFailed(job.data.fileId);
      await this.cache.bumpVersion();
      await this.realtime.publish('file:processed', { commentId: job.data.commentId });
    }
  }
}