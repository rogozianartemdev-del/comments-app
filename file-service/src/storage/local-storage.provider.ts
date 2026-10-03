import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { STORED_NAME_RE, StorageProvider } from './storage.provider';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;

  constructor(config: ConfigService) {
    this.basePath = config.getOrThrow<string>('STORAGE_PATH');
  }

  private resolve(storedName: string): string {
    if (!STORED_NAME_RE.test(storedName)) {
      throw new BadRequestException('Incorrect file name');
    }
    return join(this.basePath, storedName);
  }

  async save(buffer: Buffer, storedName: string): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.writeFile(this.resolve(storedName), buffer);
  }

  read(storedName: string): Promise<Buffer> {
    return fs.readFile(this.resolve(storedName));
  }

  async delete(storedName: string): Promise<void> {
    await fs.unlink(this.resolve(storedName)).catch(() => undefined);
  }

  async exists(storedName: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(storedName));
      return true;
    } catch {
      return false;
    }
  }
}