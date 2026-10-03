export interface StorageProvider {
    save(buffer: Buffer, storedName: string): Promise<void>;
    read(storedName: string): Promise<Buffer>;
    delete(storedName: string): Promise<void>;
    exists(storedName: string): Promise<boolean>;
  }
  export const STORED_NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|gif|txt)$/;
  export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';