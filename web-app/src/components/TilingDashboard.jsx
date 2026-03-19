import { useState, useCallback, useEffect } from 'react';
import { useListMyBooks } from '../dataconnect-generated/react';
import BookTile from './BookTile';
import AdvancedSearchFilters from './AdvancedSearchFilters';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import GoodreadsImportModal from './GoodreadsImportModal';
import '../styles/tiling-dashboard.css';

/**
 * TilingDashboard - Main grid view component for browsing books
 * Manages state for filtering, sorting, and interactions
 */
export default function TilingDashboard() {
  const { data, loading, error } = useListMyBooks();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortBy, setSortBy] = useState('title');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    authors: [],
    yearMin: null,
    yearMax: null,
  });

  // Update books when data is fetched
  useEffect(() => {
    if (data?.books) {
      setBooks(data.books);
    }
  }, [data]);

  // Filter and sort books
  useEffect(() => {
    let result = books;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters - Author
    if (advancedFilters.authors.length > 0) {
      result = result.filter((book) =>
        advancedFilters.authors.includes(book.author)
      );
    }

    // Apply advanced filters - Year Range
    if (advancedFilters.yearMin !== null || advancedFilters.yearMax !== null) {
      result = result.filter((book) => {
        const bookYear = new Date(book.createdAt).getFullYear();
        if (isNaN(bookYear)) return true; // Include books with invalid dates

        if (advancedFilters.yearMin !== null && bookYear < advancedFilters.yearMin) {
          return false;
        }
        if (advancedFilters.yearMax !== null && bookYear > advancedFilters.yearMax) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredBooks(result);
  }, [books, searchQuery, sortBy, advancedFilters]);

  const handleBookClick = useCallback((bookId) => {
    setSelectedBook(bookId);
    // Dispatch custom event for navigation or other handling
    window.dispatchEvent(
      new CustomEvent('bookSelected', { detail: { bookId } })
    );
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  const handleAdvancedFiltersChange = useCallback((filters) => {
    setAdvancedFilters(filters);
  }, []);

  const handleToggleAdvancedFilters = useCallback(() => {
    setShowAdvancedFilters(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className="tiling-dashboard loading" aria-live="polite" aria-busy="true">
        <div className="spinner" role="status" aria-label="Loading"></div>
        <p>Loading books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tiling-dashboard">
        <ErrorState
          title="Unable to load library"
          message={error.message || 'There was a problem loading your library. Please try again.'}
          onRetry={() => window.location.reload()}
          testID="error-state"
        />
      </div>
    );
  }

  const hasBooks = filteredBooks.length > 0;

  return (
    <div className="tiling-dashboard" data-testid="tiling-dashboard">
      <div className="dashboard-header">
        <h1>My Library</h1>
        <div className="dashboard-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
              aria-label="Search books"
              data-testid="search-input"
            />
          </div>
          <div className="controls-right">
            <button
              className="import-button"
              onClick={() => setShowImportModal(true)}
              title="Import from Goodreads"
              aria-label="Import books from Goodreads"
            >
              📥 Import
            </button>
            <AdvancedSearchFilters
              books={books}
              onFiltersChange={handleAdvancedFiltersChange}
              onToggle={handleToggleAdvancedFilters}
              isOpen={showAdvancedFilters}
            />
            <div className="sort-box">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="sort-select"
                data-testid="sort-select"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {hasBooks ? (
        <>
          <div className="tiles-container" data-testid="tiles-container" role="list">
            {filteredBooks.map((book) => (
              <BookTile
                key={book.id}
                book={book}
                onClick={handleBookClick}
                isSelected={selectedBook === book.id}
              />
            ))}
          </div>
          <div className="dashboard-footer">
            <p className="book-count" aria-live="polite" aria-atomic="true">
              Showing {filteredBooks.length} of {books.length} books
            </p>
          </div>
        </>
      ) : books.length === 0 ? (
        <EmptyState
          title="No books in your library yet"
          subtitle="Add your first book by scanning a barcode or manually entering book details."
          icon="📚"
          testID="empty-state"
        />
      ) : (
        <EmptyState
          title="No books match your search"
          subtitle={`Try different search terms or filters. You have ${books.length} book${books.length === 1 ? '' : 's'} in your library.`}
          icon="🔍"
          actionLabel="Clear filters"
          onAction={() => {
            setSearchQuery('');
            setAdvancedFilters({ authors: [], yearMin: null, yearMax: null });
          }}
          testID="empty-state"
        />
      )}
      <GoodreadsImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
