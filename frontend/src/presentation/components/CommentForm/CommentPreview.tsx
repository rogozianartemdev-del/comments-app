import { SafeHtml } from '../../security/html';

export function CommentPreview({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="comment-preview">
      <span className="comment-preview__label">Превью:</span>
      <SafeHtml html={text} />
    </div>
  );
}