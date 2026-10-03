import DOMPurify from 'dompurify';
import { useMemo } from 'react';

const CONFIG = {
  ALLOWED_TAGS: ['a', 'code', 'i', 'strong'],
  ALLOWED_ATTR: ['href', 'title', 'rel', 'target'],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
};

let hooked = false;
function setup() {
  if (hooked) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('rel', 'noopener noreferrer nofollow');
      node.setAttribute('target', '_blank');
    }
  });
  hooked = true;
}

export function sanitizeHtml(dirty: string): string {
  setup();
  return DOMPurify.sanitize(dirty, CONFIG);
}

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}

export function safeHttpUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}


export function captchaSrc(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}