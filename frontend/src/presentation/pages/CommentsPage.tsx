import { useState } from 'react';
import { AuthBar } from '../components/AuthBar/AuthBar';
import { CommentForm } from '../components/CommentForm/CommentForm';
import { CommentTable } from '../components/CommentTable/CommentTable';
import { Pagination } from '../components/Pagination/Pagination';
import { useComments } from '../hooks/useComments';

export function CommentsPage() {
  const { data, page, setPage, sortBy, order, toggleSort, loading, error, connected, reload } =
    useComments();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="comments-page">
      <AuthBar />
      <h1>Комментарии</h1>

      <p className={`status ${connected ? 'status--on' : 'status--off'}`}>
        {connected ? 'Обновления в реальном времени: подключено' : 'Нет соединения с сервером, переподключаемся...'}
      </p>

      <button onClick={() => setShowForm((v) => !v)}>
        {showForm ? 'Скрыть форму' : 'Добавить комментарий'}
      </button>

      {showForm && (
        <CommentForm
          onSuccess={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}

      {error && (
        <div className="banner-error">
          {error} <button onClick={reload}>Повторить</button>
        </div>
      )}

      {!data && loading && <p>Загрузка...</p>}

      {data && (
        <>
          <CommentTable data={data} sortBy={sortBy} order={order} onSort={toggleSort} onChanged={reload} />
          <Pagination page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
    </div>
  );
}