import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageProcessor {
  resizeToFit(buffer: Buffer, maxWidth: number, maxHeight: number): Promise<Buffer> {
    return sharp(buffer, { animated: true })
      .rotate()
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  }
}