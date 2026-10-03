const USERNAME_RE = /^[a-zA-Z0-9]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_TAGS = ['a', 'code', 'i', 'strong'];

export function hasUnbalancedTags(html: string): boolean {
  const re = /<\/?([a-z]+)[^>]*>/gi;
  const stack: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();

    if (!ALLOWED_TAGS.includes(tag)) continue;

    if (m[0].startsWith('</')) {
      if (stack.pop() !== tag) return true;
    } else {
      stack.push(tag);
    }
  }

  return stack.length > 0;
}

export function validateForm(v: {
  username: string;
  email: string;
  homePage: string;
  text: string;
  captchaAnswer: string;
}): string | null {
  if (!USERNAME_RE.test(v.username)) {
    return 'User Name: only Latin letters and digits';
  }

  if (v.username.length > 50) {
    return 'User Name: no longer than 50 characters';
  }

  if (!EMAIL_RE.test(v.email)) {
    return 'Invalid e-mail address';
  }

  if (v.homePage) {
    try {
      const url = new URL(v.homePage);

      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'Home page: an http(s) URL is required';
      }
    } catch {
      return 'Home page: invalid URL';
    }
  }

  if (!v.text.trim()) {
    return 'Please enter text';
  }

  if (v.text.length > 5000) {
    return 'Text must not exceed 5000 characters';
  }

  if (hasUnbalancedTags(v.text)) {
    return 'Tags are not properly closed or are in the wrong order';
  }

  if (!v.captchaAnswer.trim()) {
    return 'Please enter the CAPTCHA';
  }

  return null;
}

export function validateFile(file: File): string | null {
  const isTxt = file.name.toLowerCase().endsWith('.txt');
  const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);

  if (!isTxt && !isImage) {
    return 'Allowed file types: JPG, PNG, GIF, and TXT';
  }

  if (isTxt && file.size > 100 * 1024) {
    return 'TXT file must not exceed 100 KB';
  }

  if (isImage && file.size > 5 * 1024 * 1024) {
    return 'Image must not exceed 5 MB';
  }

  return null;
}

export const MAX_FILES = 5;

export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) return `You can attach no more than ${MAX_FILES} files.`;
  for (const f of files) {
    const problem = validateFile(f);
    if (problem) return `${f.name}: ${problem}`;
  }
  return null;
}
