import { useState } from 'react';
import { container } from '../../../di/container';
import type { Comment } from '../../../domain/entities/Comment';
import { useAuth } from '../../context/AuthContext';
import { SafeHtml, safeHttpUrl } from '../../security/html';
import { extractError } from '../../utils/extractError';
import { CommentForm } from '../CommentForm/CommentForm';
import { Lightbox } from '../Lightbox/Lightbox';

interface Props {
  comment: Comment;
  onChanged: () => void;
}

export function CommentNode({ comment, onChanged }: Props) {
  const { user, logout } = useAuth();
  const [replying, setReplying] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const homePage = safeHttpUrl(comment.homePage);

  const handleVote = async (type: 'like' | 'dislike') => {
    setVoteError(null);
    try {
      await container.voteComment.execute(comment.id, type);
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        logout();
        setVoteError('Сессия истекла, войдите снова');
      } else {
        setVoteError(extractError(err, 'Не удалось проголосовать'));
      }
    }
  };

  return (
    <div className="comment-node" style={{ marginLeft: comment.depth > 0 && comment.depth <= 10 ? 24 : 0 }}>
      <div className="comment-node__header">
        {homePage ? (
          <a href={homePage} target="_blank" rel="noopener noreferrer nofollow">
            <strong>{comment.username}</strong>
          </a>
        ) : (
          <strong>{comment.username}</strong>
        )}
        &#160;
        <span className="comment-node__date">
          {new Date(comment.createdAt).toLocaleString('ru-RU')}
        </span>
      </div>

      <SafeHtml className="comment-node__text" html={comment.text} />

      {comment.files.map((file) => {
        const url = `/api/files/${file.id}`;
        if (file.type === 'txt') {
          return (
            <a key={file.id} href={url} target="_blank" rel="noopener noreferrer">
              {file.originalName}
            </a>
          );
        }
        if (file.status === 'pending') {
          return <p key={file.id} className="comment-node__pending">Изображение обрабатывается...</p>;
        }
        if (file.status === 'failed') {
          return <p key={file.id} className="comment-form__error">Не удалось обработать изображение</p>;
        }
        return (
          <img
            key={file.id}
            className="comment-node__thumb"
            src={url}
            alt={file.originalName}
            onClick={() => setLightboxSrc(url)}
          />
        );
      })}

      <div className="comment-node__actions">
        <button onClick={() => handleVote('like')} disabled={!user} title={user ? '' : 'Войдите, чтобы голосовать'}>
          ↑
        </button>
        <span>{comment.score}</span>
        <button onClick={() => handleVote('dislike')} disabled={!user} title={user ? '' : 'Войдите, чтобы голосовать'}>
          ↓
        </button>
        <button onClick={() => setReplying((v) => !v)}>Ответить</button>
        {voteError && <span className="comment-form__error">{voteError}</span>}
      </div>

      {replying && (
        <CommentForm
          parentId={comment.id}
          onSuccess={() => {
            setReplying(false);
            onChanged();
          }}
          onCancel={() => setReplying(false)}
        />
      )}

      {comment.replies.map((reply) => (
        <CommentNode key={reply.id} comment={reply} onChanged={onChanged} />
      ))}

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}