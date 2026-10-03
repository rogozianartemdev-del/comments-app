import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { extname } from 'path';
import { STORAGE_PROVIDER,  STORED_NAME_RE } from '../storage/storage.provider';
import type { StorageProvider } from '../storage/storage.provider';
import { ImageProcessor } from './image-processor.service';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8',
};

@Controller('files')
export class FilesController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly images: ImageProcessor,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    const ext = extname(file.originalname).toLowerCase();
    if (!MIME_BY_EXT[ext]) throw new BadRequestException('Недопустимое расширение');

    const storedName = `${randomUUID()}${ext}`;
    await this.storage.save(file.buffer, storedName);
    return { storedName };
  }

  @Post(':storedName/process')
  async process(@Param('storedName') storedName: string) {
    this.assertName(storedName);
    if (!/\.(jpg|png|gif)$/.test(storedName)) {
      throw new BadRequestException('Обработка доступна только для изображений');
    }
    if (!(await this.storage.exists(storedName))) throw new NotFoundException('Файл не найден');

    const original = await this.storage.read(storedName);
    const resized = await this.images.resizeToFit(original, 320, 240);
    await this.storage.save(resized, storedName);
    return { status: 'processed' };
  }

  @Get(':storedName')
  async download(@Param('storedName') storedName: string, @Res() res: Response) {
    this.assertName(storedName);
    if (!(await this.storage.exists(storedName))) throw new NotFoundException('Файл не найден');

    res.set({
      'Content-Type': MIME_BY_EXT[extname(storedName)],
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(await this.storage.read(storedName));
  }

  @Delete(':storedName')
  async remove(@Param('storedName') storedName: string) {
    this.assertName(storedName);
    await this.storage.delete(storedName);
    return { status: 'deleted' };
  }

  private assertName(name: string) {
    if (!STORED_NAME_RE.test(name)) throw new BadRequestException('Некорректное имя файла');
  }
}