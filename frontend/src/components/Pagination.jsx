export default function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, total, limit } = pagination;
  if (!totalPages || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total} tasks
      </span>
      <div className="pagination-buttons">
        <button
          className="btn btn-sm btn-outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="btn btn-sm btn-outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          ›
        </button>
      </div>
    </div>
  );
}
