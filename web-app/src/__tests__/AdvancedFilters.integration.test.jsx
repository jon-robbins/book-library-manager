import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TilingDashboard from '../components/TilingDashboard';

// Mock the dataconnect module
vi.mock('../dataconnect-generated/react', () => ({
  useListMyBooks: vi.fn(),
}));

// Mock BookTile to simplify testing
vi.mock('../components/BookTile', () => ({
  default: ({ book, onClick }) => (
    <button
      data-testid={`book-tile-${book.id}`}
      onClick={() => onClick(book.id)}
      aria-label={`${book.title} by ${book.author}`}
    >
      {book.title} - {book.author}
    </button>
  ),
}));

import { useListMyBooks } from '../dataconnect-generated/react';

describe('Advanced Filters Integration with TilingDashboard', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'url1.jpg',
      createdAt: '2020-01-15',
    },
    {
      id: '2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      coverUrl: 'url2.jpg',
      createdAt: '2021-06-20',
    },
    {
      id: '3',
      title: '1984',
      author: 'George Orwell',
      coverUrl: 'url3.jpg',
      createdAt: '2022-03-10',
    },
    {
      id: '4',
      title: 'Brave New World',
      author: 'Aldous Huxley',
      coverUrl: 'url4.jpg',
      createdAt: '2023-11-05',
    },
    {
      id: '5',
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      coverUrl: 'url5.jpg',
      createdAt: '2024-01-20',
    },
    {
      id: '6',
      title: 'Foundation',
      author: 'Isaac Asimov',
      coverUrl: 'url6.jpg',
      createdAt: '2020-09-30',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useListMyBooks.mockReturnValue({
      data: { books: mockBooks },
      loading: false,
      error: null,
    });
  });

  describe('Author Filter Integration', () => {
    it('should filter books by single author', async () => {
      render(<TilingDashboard />);

      // Open advanced filters
      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      // Select an author
      const authorCheckbox = screen.getByTestId('author-checkbox-Harper Lee');
      await userEvent.click(authorCheckbox);

      // Apply filters
      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-3')).not.toBeInTheDocument();
      });
    });

    it('should filter books by multiple authors', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const checkbox1 = screen.getByTestId('author-checkbox-Harper Lee');
      const checkbox2 = screen.getByTestId('author-checkbox-George Orwell');
      await userEvent.click(checkbox1);
      await userEvent.click(checkbox2);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-3')).toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-4')).not.toBeInTheDocument();
      });
    });

    it('should update book count when author filter is applied', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const authorCheckbox = screen.getByTestId('author-checkbox-F. Scott Fitzgerald');
      await userEvent.click(authorCheckbox);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 of 6 books/)).toBeInTheDocument();
      });
    });

    it('should show no results when author filter has no matches', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const authorCheckbox = screen.getByTestId('author-checkbox-Isaac Asimov');
      await userEvent.click(authorCheckbox);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      // Isaac Asimov only has one book, so it should show
      await waitFor(() => {
        expect(screen.getByTestId('book-tile-6')).toBeInTheDocument();
      });
    });
  });

  describe('Year Range Filter Integration', () => {
    it('should filter books by minimum year', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const minYearInput = screen.getByTestId('year-min-input');
      await userEvent.type(minYearInput, '2022');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        // Books from 2022 onwards: 3, 4, 5
        expect(screen.getByTestId('book-tile-3')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-4')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-5')).toBeInTheDocument();
        // Books before 2022: 1, 2, 6
        expect(screen.queryByTestId('book-tile-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-6')).not.toBeInTheDocument();
      });
    });

    it('should filter books by maximum year', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const maxYearInput = screen.getByTestId('year-max-input');
      await userEvent.type(maxYearInput, '2021');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        // Books from 2021 and earlier: 1, 2, 6
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-6')).toBeInTheDocument();
        // Books after 2021: 3, 4, 5
        expect(screen.queryByTestId('book-tile-3')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-4')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-5')).not.toBeInTheDocument();
      });
    });

    it('should filter books by year range', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const minYearInput = screen.getByTestId('year-min-input');
      const maxYearInput = screen.getByTestId('year-max-input');
      await userEvent.type(minYearInput, '2021');
      await userEvent.type(maxYearInput, '2023');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        // Books from 2021-2023: 2, 3, 4
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-3')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-4')).toBeInTheDocument();
        // Books outside range: 1, 5, 6
        expect(screen.queryByTestId('book-tile-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-5')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-6')).not.toBeInTheDocument();
      });
    });

    it('should update book count when year filter is applied', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const maxYearInput = screen.getByTestId('year-max-input');
      await userEvent.type(maxYearInput, '2020');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        // Books from 2020: 1, 6
        expect(screen.getByText(/Showing 2 of 6 books/)).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    it('should combine author and year range filters', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      // Filter by author
      const authorCheckbox = screen.getByTestId('author-checkbox-F. Scott Fitzgerald');
      await userEvent.click(authorCheckbox);

      // Filter by year
      const minYearInput = screen.getByTestId('year-min-input');
      await userEvent.type(minYearInput, '2020');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-2')).not.toBeInTheDocument();
      });
    });

    it('should combine filters with search query', async () => {
      render(<TilingDashboard />);

      // Set search query
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'The');

      // Apply filters
      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const authorCheckbox = screen.getByTestId('author-checkbox-Harper Lee');
      await userEvent.click(authorCheckbox);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        // No Harper Lee title contains "The", so this should empty.
        expect(screen.getByText('No books match your search')).toBeInTheDocument();
      });
    });

    it('should maintain filters while sorting', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const checkbox1 = screen.getByTestId('author-checkbox-Harper Lee');
      const checkbox2 = screen.getByTestId('author-checkbox-George Orwell');
      await userEvent.click(checkbox1);
      await userEvent.click(checkbox2);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      // Change sort
      const sortSelect = screen.getByTestId('sort-select');
      await userEvent.selectOptions(sortSelect, 'author');

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-3')).toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-1')).not.toBeInTheDocument();
      });
    });

    it('should show no results for impossible filter combination', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      // Select an author
      const authorCheckbox = screen.getByTestId('author-checkbox-Harper Lee');
      await userEvent.click(authorCheckbox);

      // Filter to year before that author's book
      const maxYearInput = screen.getByTestId('year-max-input');
      await userEvent.type(maxYearInput, '2020');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      // Harper Lee's book is from 2021, so no results
      await waitFor(() => {
        expect(screen.getByText('No books match your search')).toBeInTheDocument();
        expect(
          screen.getByText(/Try different search terms or filters\./)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Filter State Management', () => {
    it('should clear filters when clear button is clicked', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const authorCheckbox = screen.getByTestId('author-checkbox-Harper Lee');
      const minYearInput = screen.getByTestId('year-min-input');
      await userEvent.click(authorCheckbox);
      await userEvent.type(minYearInput, '2021');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      // All 6 books should be visible initially after clear
      await waitFor(() => {
        expect(screen.getByText(/Showing 1 of 6 books/)).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByTestId('clear-filters-button');
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText(/Showing 6 of 6 books/)).toBeInTheDocument();
      });
    });

    it('should maintain filter state when toggling filter panel', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const authorCheckbox = screen.getByTestId('author-checkbox-Harper Lee');
      await userEvent.click(authorCheckbox);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      // Close filters panel
      await userEvent.click(filtersButton);

      // Reopen filters panel
      await userEvent.click(filtersButton);

      // Author should still be selected
      await waitFor(() => {
        expect(authorCheckbox).toBeChecked();
      });
    });
  });

  describe('Edge Cases and Boundaries', () => {
    it('should handle exact year match', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const minYearInput = screen.getByTestId('year-min-input');
      const maxYearInput = screen.getByTestId('year-max-input');
      await userEvent.type(minYearInput, '2021');
      await userEvent.type(maxYearInput, '2021');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByText(/Showing 1 of 6 books/)).toBeInTheDocument();
      });
    });

    it('should handle single year on boundary', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const minYearInput = screen.getByTestId('year-min-input');
      await userEvent.type(minYearInput, '2024');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-5')).toBeInTheDocument();
        expect(screen.getByText(/Showing 1 of 6 books/)).toBeInTheDocument();
      });
    });

    it('should handle all books with same author', async () => {
      useListMyBooks.mockReturnValue({
        data: {
          books: [
            {
              id: '1',
              title: 'Book 1',
              author: 'Same Author',
              coverUrl: 'url1.jpg',
              createdAt: '2020-01-01',
            },
            {
              id: '2',
              title: 'Book 2',
              author: 'Same Author',
              coverUrl: 'url2.jpg',
              createdAt: '2021-01-01',
            },
          ],
        },
        loading: false,
        error: null,
      });

      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      const authorCheckbox = screen.getByTestId('author-checkbox-Same Author');
      await userEvent.click(authorCheckbox);

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByText(/Showing 2 of 2 books/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle rapid filter changes efficiently', async () => {
      render(<TilingDashboard />);

      const filtersButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(filtersButton);

      // Rapidly click multiple checkboxes
      for (const checkbox of screen.getAllByRole('checkbox')) {
        await userEvent.click(checkbox);
      }

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      // Should complete without errors
      await waitFor(() => {
        expect(screen.getByTestId('tiling-dashboard')).toBeInTheDocument();
      });
    });
  });
});
