import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { container } from '../../../di/container';
import type { CaptchaChallenge } from '../../../domain/repositories/CaptchaRepository';
import { useAuth } from '../../context/AuthContext';
import { captchaSrc } from '../../security/html';
import { extractError } from '../../utils/extractError';
import { MAX_FILES, validateFiles, validateForm } from '../../validation/commentValidation';
import { CommentPreview } from './CommentPreview';
import { FormattingToolbar } from './FormattingToolbar';

interface Props {
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}
const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function CommentForm({ parentId, onSuccess, onCancel }: Props) {
  const { user } = useAuth();
  const [usernameInput, setUsername] = useState('');
  const [emailInput, setEmail] = useState('');
  const [homePage, setHomePage] = useState('');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const username = user ? user.username : usernameInput;
  const email = user ? user.email : emailInput;

  const loadCaptcha = useCallback(async () => {
    setCaptchaError(null);
    setCaptchaAnswer('');
    try {
      setCaptcha(await container.getCaptcha.execute());
    } catch (err) {
      setCaptcha(null);
      setCaptchaError(extractError(err, 'Не удалось загрузить капчу. Проверьте, что backend запущен'));
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const insertTag = (open: string, close: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    setText(value.slice(0, selectionStart) + open + selected + close + value.slice(selectionEnd));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = selectionStart + open.length;
      el.selectionEnd = selectionStart + open.length + selected.length;
    });
  };

  const onFilesPicked = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files, ...Array.from(picked)];
    const problem = validateFiles(next);
    if (problem) {
      setError(problem);
    } else {
      setError(null);
      setFiles(next);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const problem = validateForm({ username, email, homePage, text, captchaAnswer });
    if (problem) return setError(problem);
    if (!captcha) return setError('Капча не загружена');

    setSubmitting(true);
    try {
      await container.createComment.execute({
        username,
        email,
        homePage: homePage || undefined,
        text,
        captchaId: captcha.captchaId,
        captchaAnswer,
        parentId,
        files: files.length ? files : undefined
      });
      setText('');
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess();
    } catch (err) {
      setError(extractError(err, 'Не удалось отправить комментарий'));
    } finally {
      await loadCaptcha();
      setSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit} noValidate>
      <div className="comment-form__row">
        <input
          placeholder="User Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={!!user}
          maxLength={50}
        />
        <input
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!user}
          maxLength={255}
        />
        <input
          placeholder="Home page (необязательно)"
          value={homePage}
          onChange={(e) => setHomePage(e.target.value)}
          maxLength={255}
        />
      </div>

      <FormattingToolbar onInsert={insertTag} />

      <textarea
        ref={textareaRef}
        placeholder="Текст комментария"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={5000}
      />

      <CommentPreview text={text} />

      <div className="comment-form__row">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,.txt,text/plain"
          onChange={(e) => onFilesPicked(e.target.files)}
          disabled={files.length >= MAX_FILES}
        />
      </div>
      <p className="file-hint">До {MAX_FILES} файлов: JPG, PNG, GIF (до 5 МБ) и TXT (до 100 КБ)</p>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span>{f.name}</span>
              <span className="file-list__size">{formatSize(f.size)}</span>
              <button type="button" onClick={() => removeFile(i)} aria-label={`Убрать ${f.name}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="comment-form__captcha">
        {captcha && <img className="captcha-img" src={captchaSrc(captcha.svg)} alt="CAPTCHA" />}
        {captchaError && <span className="comment-form__error">{captchaError}</span>}
        <button type="button" onClick={loadCaptcha}>
          Обновить капчу
        </button>
        <input
          placeholder="Символы с картинки"
          value={captchaAnswer}
          onChange={(e) => setCaptchaAnswer(e.target.value)}
          maxLength={10}
          autoComplete="off"
        />
      </div>

      {error && <p className="comment-form__error">{error}</p>}

      <div className="comment-form__actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Отправка...' : 'Отправить'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}