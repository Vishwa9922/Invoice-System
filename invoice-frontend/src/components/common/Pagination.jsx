import Button from './Button';

const Pagination = ({ pageNumber, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, i) => Math.max(0, Math.min(pageNumber - 2, totalPages - 5)) + i
  );

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-500">
        Page {pageNumber + 1} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary" size="sm"
          disabled={pageNumber === 0}
          onClick={() => onPageChange(pageNumber - 1)}
        >
          ← Prev
        </Button>
        {pages.map(p => (
          <Button
            key={p}
            variant={p === pageNumber ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </Button>
        ))}
        <Button
          variant="secondary" size="sm"
          disabled={pageNumber >= totalPages - 1}
          onClick={() => onPageChange(pageNumber + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default Pagination;