import {
    BadGatewayException,
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Res,
  } from '@nestjs/common';
  import type { Response } from 'express';
  import { FileStatus, FileType } from './comment-file.entity';
  import { FilesService } from './files.service';
  
  @Controller('files')
  export class FilesController {
    constructor(private readonly files: FilesService) {}
  
    @Get(':id')
    async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
      const file = await this.files.findById(id);
      if (!file) throw new NotFoundException('Файл не найден');
  
      let upstream;
      try {
        upstream = await this.files.openStream(file);
      } catch {
        throw new BadGatewayException('Файловый сервис недоступен');
      }
  
      res.set({
        'Content-Type': file.type === FileType.TXT ? 'text/plain; charset=utf-8' : file.mimeType,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cache-Control': file.status === FileStatus.PROCESSED ? 'public, max-age=86400' : 'no-store',
      });
      upstream.data.pipe(res);
    }
  }