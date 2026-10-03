interface Props {
    page: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  }
  
  export function Pagination({ page, total, pageSize, onChange }: Props) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
    return (
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Вперёд
        </button>
      </div>
    );
  }