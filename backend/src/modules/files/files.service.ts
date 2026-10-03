import { HttpService } from '@nestjs/axios';
import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import FormData from 'form-data';
import { basename } from 'path';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { CommentFile, FileStatus, FileType } from './comment-file.entity';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TXT_BYTES = 100 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface DetectedFile {
  type: FileType;
  mime: string;
  ext: '.jpg' | '.png' | '.gif' | '.txt';
}

@Injectable()
export class FilesService {
  constructor(
    private readonly http: HttpService,
    @InjectRepository(CommentFile) private readonly filesRepo: Repository<CommentFile>,
  ) {}

  inspect(file: Express.Multer.File): DetectedFile {
    const b = file.buffer;
    if (!b || file.size === 0) throw new BadRequestException('Файл пустой');

    let detected: DetectedFile | null = null;
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
      detected = { type: FileType.IMAGE, mime: 'image/jpeg', ext: '.jpg' };
    } else if (b.subarray(0, 8).equals(PNG_SIGNATURE)) {
      detected = { type: FileType.IMAGE, mime: 'image/png', ext: '.png' };
    } else if (['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii'))) {
      detected = { type: FileType.IMAGE, mime: 'image/gif', ext: '.gif' };
    } else if (file.originalname.toLowerCase().endsWith('.txt') && !b.includes(0)) {
      detected = { type: FileType.TXT, mime: 'text/plain', ext: '.txt' };
    }

    if (!detected) {
      throw new BadRequestException('Допустимы только JPG, PNG, GIF и TXT');
    }
    if (detected.type === FileType.IMAGE && file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Изображение не должно быть больше 5 МБ');
    }
    if (detected.type === FileType.TXT && file.size > MAX_TXT_BYTES) {
      throw new BadRequestException('Текстовый файл не должен быть больше 100 КБ');
    }
    return detected;
  }

  cleanName(name: string): string {
    const utf8 = Buffer.from(name, 'latin1').toString('utf8');
    return basename(utf8).replace(/[\r\n"\\/]/g, '_').slice(0, 255) || 'file';
  }

  async uploadToStorage(file: Express.Multer.File, detected: DetectedFile): Promise<string> {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: `upload${detected.ext}`,
      contentType: detected.mime,
    });
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ storedName: string }>('/files', form, {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
        }),
      );
      return data.storedName;
    } catch {
      throw new BadGatewayException('Файловый сервис недоступен');
    }
  }

  async deleteFromStorage(storedName: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/files/${storedName}`)).catch(() => undefined);
  }

  async requestResize(storedName: string): Promise<void> {
    await firstValueFrom(this.http.post(`/files/${storedName}/process`));
  }

  markProcessed(id: string) {
    return this.filesRepo.update(id, { status: FileStatus.PROCESSED });
  }

  markFailed(id: string) {
    return this.filesRepo.update(id, { status: FileStatus.FAILED });
  }

  findById(id: string) {
    return this.filesRepo.findOne({ where: { id } });
  }

  openStream(file: CommentFile) {
    return this.http.axiosRef.get(`/files/${file.storedName}`, { responseType: 'stream' });
  }
  async uploadAll(files: Express.Multer.File[], detected: DetectedFile[]): Promise<string[]> {
    const stored: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        stored.push(await this.uploadToStorage(files[i], detected[i]));
      }
      return stored;
    } catch (err) {
      await Promise.all(stored.map((name) => this.deleteFromStorage(name)));
      throw err;
    }
  }
}