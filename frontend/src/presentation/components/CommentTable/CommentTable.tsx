import type { CommentsPage, SortField, SortOrder } from '../../../domain/entities/Comment';
import { CommentNode } from '../CommentTree/CommentNode';

interface Props {
  data: CommentsPage | null;
  sortBy: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  onChanged: () => void;
}

const COLUMNS: { field: SortField; label: string }[] = [
  { field: 'username', label: 'User Name' },
  { field: 'email', label: 'E-mail' },
  { field: 'createdAt', label: 'Дата' },
];

export function CommentTable({ data, sortBy, order, onSort, onChanged }: Props) {
  if (!data) return <p>Загрузка...</p>;

  return (
    <div className="comment-table">
      <div className="comment-table__header">
        {COLUMNS.map((col) => (
          <button key={col.field} onClick={() => onSort(col.field)}>
            {col.label} {sortBy === col.field ? (order === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      {data.items.map((comment) => (
        <CommentNode key={comment.id} comment={comment} onChanged={onChanged} />
      ))}

      {data.items.length === 0 && <p>Комментариев пока нет</p>}
    </div>
  );
}