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

describe('TilingDashboard Component', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'Book One',
      author: 'Author One',
      coverUrl: 'url1.jpg',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      title: 'Book Two',
      author: 'Author Two',
      coverUrl: 'url2.jpg',
      createdAt: '2024-01-02',
    },
    {
      id: '3',
      title: 'Another Book',
      author: 'Author Three',
      coverUrl: 'url3.jpg',
      createdAt: '2024-01-03',
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

  describe('Rendering', () => {
    it('should render dashboard container with header', () => {
      render(<TilingDashboard />);

      expect(screen.getByTestId('tiling-dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Library')).toBeInTheDocument();
    });

    it('should render all books when loaded', async () => {
      render(<TilingDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-3')).toBeInTheDocument();
      });
    });

    it('should render search input and sort select', () => {
      render(<TilingDashboard />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    });

    it('should display book count in footer', () => {
      render(<TilingDashboard />);

      expect(screen.getByText(/Showing 3 of 3 books/)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      useListMyBooks.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<TilingDashboard />);

      expect(screen.getByText('Loading books...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const error = new Error('Failed to fetch books');
      useListMyBooks.mockReturnValue({
        data: null,
        loading: false,
        error,
      });

      render(<TilingDashboard />);

      expect(screen.getByText('Unable to load library')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('should show empty state when no books', () => {
      useListMyBooks.mockReturnValue({
        data: { books: [] },
        loading: false,
        error: null,
      });

      render(<TilingDashboard />);

      expect(screen.getByText('No books in your library yet')).toBeInTheDocument();
    });

    it('should render tiles container', () => {
      render(<TilingDashboard />);

      expect(screen.getByTestId('tiles-container')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter books by title', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Book One');

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-3')).not.toBeInTheDocument();
      });
    });

    it('should filter books by author', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Author Two');

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.queryByTestId('book-tile-1')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'book');

      await waitFor(() => {
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-3')).toBeInTheDocument();
      });
    });

    it('should show no results message when search has no matches', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Nonexistent Book');

      await waitFor(() => {
        expect(
          screen.getByText('No books match your search')
        ).toBeInTheDocument();
      });
    });

    it('should show clear search button when searching', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Nonexistent Book');

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Clear filters/i })
        ).toBeInTheDocument();
      });
    });

    it('should clear search when clear button is clicked', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Nonexistent Book');

      const clearButton = await screen.findByRole('button', {
        name: /Clear filters/i,
      });
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(searchInput.value).toBe('');
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by title by default', async () => {
      render(<TilingDashboard />);

      await waitFor(() => [
        screen.getByTestId('book-tile-1'),
        screen.getByTestId('book-tile-2'),
        screen.getByTestId('book-tile-3'),
      ]);

      const container = screen.getByTestId('tiles-container');
      const children = Array.from(container.children);

      // Check that books are in correct order by title
      expect(children[0]).toHaveTextContent('Another Book');
      expect(children[1]).toHaveTextContent('Book One');
      expect(children[2]).toHaveTextContent('Book Two');
    });

    it('should sort by author when selected', async () => {
      render(<TilingDashboard />);

      const sortSelect = screen.getByTestId('sort-select');
      await userEvent.selectOptions(sortSelect, 'author');

      await waitFor(() => {
        const container = screen.getByTestId('tiles-container');
        const children = Array.from(container.children);

        expect(children[0]).toHaveTextContent('Author One');
        expect(children[1]).toHaveTextContent('Author Three');
        expect(children[2]).toHaveTextContent('Author Two');
      });
    });

    it('should sort by recent when selected', async () => {
      render(<TilingDashboard />);

      const sortSelect = screen.getByTestId('sort-select');
      await userEvent.selectOptions(sortSelect, 'recent');

      await waitFor(() => {
        const container = screen.getByTestId('tiles-container');
        const children = Array.from(container.children);

        // Most recent (newest date) should be first
        expect(children[0]).toHaveAttribute('data-testid', 'book-tile-3');
        expect(children[1]).toHaveAttribute('data-testid', 'book-tile-2');
        expect(children[2]).toHaveAttribute('data-testid', 'book-tile-1');
      });
    });
  });

  describe('Book Selection Interactions', () => {
    it('should dispatch event when book is clicked', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(<TilingDashboard />);

      const bookTile = await screen.findByTestId('book-tile-1');
      await userEvent.click(bookTile);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bookSelected',
          detail: { bookId: '1' },
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should track selected book via emitted event', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      render(<TilingDashboard />);

      const bookTile1 = await screen.findByTestId('book-tile-1');
      await userEvent.click(bookTile1);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ bookId: '1' }),
        })
      );
      dispatchEventSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should maintain search state while sorting', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Book');

      const sortSelect = screen.getByTestId('sort-select');
      await userEvent.selectOptions(sortSelect, 'author');

      await waitFor(() => {
        expect(searchInput.value).toBe('Book');
        expect(screen.getByTestId('book-tile-1')).toBeInTheDocument();
        expect(screen.getByTestId('book-tile-2')).toBeInTheDocument();
      });
    });

    it('should update book count when filtering', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Book One');

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 of 3 books/)).toBeInTheDocument();
      });
    });

    it('should update book count when clearing search', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'Nonexistent');

      let clearButton = await screen.findByRole('button', {
        name: /Clear filters/i,
      });
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3 books/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show retry button on error', () => {
      const error = new Error('Test error');
      useListMyBooks.mockReturnValue({
        data: null,
        loading: false,
        error,
      });

      render(<TilingDashboard />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should render retry action in error state', () => {
      const error = new Error('Test error');
      useListMyBooks.mockReturnValue({
        data: null,
        loading: false,
        error,
      });

      render(<TilingDashboard />);

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });
});
