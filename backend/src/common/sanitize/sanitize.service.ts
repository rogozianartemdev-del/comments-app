import { BadRequestException, Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['a', 'code', 'i', 'strong'];

@Injectable()
export class SanitizeService {
  private assertBalancedTags(html: string): void {
    const re = /<\/?([a-z]+)[^>]*>/gi;
    const stack: string[] = [];
    let m: RegExpExecArray | null;

    while ((m = re.exec(html)) !== null) {
      const tag = m[1].toLowerCase();
      if (!ALLOWED_TAGS.includes(tag)) continue;
      if (m[0].startsWith('</')) {
        if (stack.pop() !== tag) {
          throw new BadRequestException('Tags are not closed or closed in the wrong order');
        }
      } else {
        stack.push(tag);
      }
    }
    if (stack.length > 0) {
      throw new BadRequestException('Tags are not closed or closed in the wrong order');
    }
  }

  sanitize(raw: string): string {
    this.assertBalancedTags(raw);
    return sanitizeHtml(raw, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: { a: ['href', 'title', 'rel', 'target'] },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        }),
      },
    });
  }
}