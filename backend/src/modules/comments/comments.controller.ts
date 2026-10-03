import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { AuthedUser, CommentsService } from './comments.service';
import { CreateCommentDto, ListCommentsDto } from './dto/create-comment.dto';
import { MAX_FILES_PER_COMMENT } from '../files/files.constants';

type AuthedRequest = Request & { user?: AuthedUser | null };

@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) { }

  @Post()
  @UseGuards(OptionalJwtGuard)
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_COMMENT, {
      limits: { fileSize: 5 * 1024 * 1024, files: MAX_FILES_PER_COMMENT },
    }),
  )
  create(
    @Body() dto: CreateCommentDto,
    @Req() req: AuthedRequest,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.comments.create(
      dto,
      {
        ip: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? null,
        authUser: req.user ?? null,
      },
      files ?? [],
    );
  }

  @Get()
  list(@Query() query: ListCommentsDto) {
    return this.comments.listPage(query);
  }
}