import { useState, useCallback } from 'react';
import '../styles/advanced-search-filters.css';

/**
 * AdvancedSearchFilters - Provides filtering by author, year range, and other criteria
 * Manages state for advanced filter controls
 */
export default function AdvancedSearchFilters({
  books = [],
  onFiltersChange,
  onToggle,
  isOpen = false
}) {
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [filterErrors, setFilterErrors] = useState({});

  // Extract unique authors from books and sort alphabetically
  const uniqueAuthors = [...new Set(books.map(b => b.author))].sort();

  // Extract year range from books
  const bookYears = books
    .map(b => new Date(b.createdAt).getFullYear())
    .filter(year => !isNaN(year));
  const minAvailableYear = bookYears.length > 0 ? Math.min(...bookYears) : new Date().getFullYear();
  const maxAvailableYear = bookYears.length > 0 ? Math.max(...bookYears) : new Date().getFullYear();

  // Validate year inputs
  const validateYearInputs = useCallback(() => {
    const errors = {};

    if (yearMin && yearMax) {
      const min = parseInt(yearMin, 10);
      const max = parseInt(yearMax, 10);

      if (isNaN(min) || isNaN(max)) {
        errors.year = 'Please enter valid years';
      } else if (min > max) {
        errors.year = 'Start year must be before end year';
      } else if (min < 1900) {
        errors.year = 'Year must be 1900 or later';
      } else if (max > maxAvailableYear) {
        errors.year = `Year must be ${maxAvailableYear} or earlier`;
      }
    } else if (yearMin && !yearMax) {
      const min = parseInt(yearMin, 10);
      if (isNaN(min)) {
        errors.year = 'Please enter a valid year';
      } else if (min < 1900) {
        errors.year = 'Year must be 1900 or later';
      }
    } else if (yearMax && !yearMin) {
      const max = parseInt(yearMax, 10);
      if (isNaN(max)) {
        errors.year = 'Please enter a valid year';
      } else if (max > maxAvailableYear) {
        errors.year = `Year must be ${maxAvailableYear} or earlier`;
      }
    }

    setFilterErrors(errors);
    return Object.keys(errors).length === 0;
  }, [yearMin, yearMax, maxAvailableYear]);

  // Handle author toggle
  const handleAuthorToggle = useCallback((author) => {
    setSelectedAuthors(prev => {
      const newAuthors = prev.includes(author)
        ? prev.filter(a => a !== author)
        : [...prev, author];

      // Notify parent of changes
      onFiltersChange({
        authors: newAuthors,
        yearMin: yearMin || null,
        yearMax: yearMax || null,
      });

      return newAuthors;
    });
  }, [yearMin, yearMax, onFiltersChange]);

  // Handle year range change
  const handleYearChange = useCallback((type, value) => {
    if (type === 'min') {
      setYearMin(value);
    } else {
      setYearMax(value);
    }
  }, []);

  // Apply filters when user confirms
  const handleApplyFilters = useCallback(() => {
    if (validateYearInputs()) {
      onFiltersChange({
        authors: selectedAuthors,
        yearMin: yearMin ? parseInt(yearMin, 10) : null,
        yearMax: yearMax ? parseInt(yearMax, 10) : null,
      });
    }
  }, [selectedAuthors, yearMin, yearMax, validateYearInputs, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedAuthors([]);
    setYearMin('');
    setYearMax('');
    setFilterErrors({});
    onFiltersChange({
      authors: [],
      yearMin: null,
      yearMax: null,
    });
  }, [onFiltersChange]);

  const hasActiveFilters = selectedAuthors.length > 0 || yearMin || yearMax;

  return (
    <div className="advanced-search-filters" data-testid="advanced-search-filters">
      <button
        onClick={onToggle}
        className="filters-toggle-button"
        data-testid="filters-toggle-button"
        aria-expanded={isOpen}
        aria-label={`Filters ${hasActiveFilters ? `, ${selectedAuthors.length + (yearMin ? 1 : 0) + (yearMax ? 1 : 0)} active` : ''}`}
      >
        Filters
        {hasActiveFilters && (
          <span className="active-filters-badge" data-testid="active-filters-badge" aria-label={`${selectedAuthors.length + (yearMin ? 1 : 0) + (yearMax ? 1 : 0)} filters active`}>
            {selectedAuthors.length + (yearMin ? 1 : 0) + (yearMax ? 1 : 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="filters-panel" data-testid="filters-panel">
          <div className="filters-section">
            <h3>Filter by Author</h3>
            <div className="authors-list" data-testid="authors-list">
              {uniqueAuthors.length > 0 ? (
                uniqueAuthors.map(author => (
                  <label key={author} className="author-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAuthors.includes(author)}
                      onChange={() => handleAuthorToggle(author)}
                      data-testid={`author-checkbox-${author}`}
                    />
                    <span>{author}</span>
                  </label>
                ))
              ) : (
                <p className="no-authors">No authors available</p>
              )}
            </div>
          </div>

          <div className="filters-section">
            <h3>Filter by Year Range</h3>
            <div className="year-range-inputs" data-testid="year-range-inputs">
              <div className="year-input-group">
                <label htmlFor="year-min">From:</label>
                <input
                  id="year-min"
                  type="number"
                  min="1900"
                  max={maxAvailableYear}
                  value={yearMin}
                  onChange={(e) => handleYearChange('min', e.target.value)}
                  placeholder={`${minAvailableYear}`}
                  data-testid="year-min-input"
                  className={filterErrors.year ? 'input-error' : ''}
                  aria-describedby={filterErrors.year ? 'year-error' : undefined}
                />
              </div>
              <div className="year-input-group">
                <label htmlFor="year-max">To:</label>
                <input
                  id="year-max"
                  type="number"
                  min="1900"
                  max={maxAvailableYear}
                  value={yearMax}
                  onChange={(e) => handleYearChange('max', e.target.value)}
                  placeholder={`${maxAvailableYear}`}
                  data-testid="year-max-input"
                  className={filterErrors.year ? 'input-error' : ''}
                  aria-describedby={filterErrors.year ? 'year-error' : undefined}
                />
              </div>
            </div>
            {filterErrors.year && (
              <p className="filter-error" data-testid="year-error" id="year-error" role="alert">
                {filterErrors.year}
              </p>
            )}
          </div>

          <div className="filters-actions">
            <button
              onClick={handleApplyFilters}
              className="apply-filters-button"
              data-testid="apply-filters-button"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="clear-filters-button"
              data-testid="clear-filters-button"
              disabled={!hasActiveFilters}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
