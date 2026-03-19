/**
 * BookTile - Displays a single book in tile format
 */
export default function BookTile({ book, onClick }) {
  const { id, title, author, coverUrl } = book;

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <li role="listitem">
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="book-tile"
        aria-label={`${title} by ${author}`}
        data-testid={`book-tile-${id}`}
      >
        <div className="book-tile-cover">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${title} cover`}
              className="book-tile-image"
              loading="lazy"
            />
          ) : (
            <div className="book-tile-placeholder" aria-hidden="true">📖</div>
          )}
        </div>
        <div className="book-tile-info">
          <h3 className="book-tile-title" title={title}>
            {title}
          </h3>
          <p className="book-tile-author" title={author}>
            {author}
          </p>
        </div>
      </button>
    </li>
  );
}
