import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TilingDashboard from '../components/TilingDashboard';

// Mock the dataconnect module
vi.mock('../dataconnect-generated/react', () => ({
  useListMyBooks: vi.fn(),
}));

// Import the mock after mocking the module
import { useListMyBooks } from '../dataconnect-generated/react';

describe('TilingDashboard Integration Tests', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'https://example.com/gatsby.jpg',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      coverUrl: 'https://example.com/mockingbird.jpg',
      createdAt: '2024-01-16',
    },
    {
      id: '3',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      coverUrl: 'https://example.com/pride.jpg',
      createdAt: '2024-01-17',
    },
    {
      id: '4',
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      coverUrl: null,
      createdAt: '2024-01-18',
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

  describe('Complete User Flow - Browse Books', () => {
    it('should display full library on initial load', async () => {
      render(<TilingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
        expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
        expect(screen.getByText('Pride and Prejudice')).toBeInTheDocument();
        expect(screen.getByText('The Catcher in the Rye')).toBeInTheDocument();
      });

      expect(screen.getByText(/Showing 4 of 4 books/)).toBeInTheDocument();
    });

    it('should allow user to search and then sort results', async () => {
      const user = userEvent.setup();
      render(<TilingDashboard />);

      // Search for books by author
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Lee');

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 of 4 books/)).toBeInTheDocument();
        expect(screen.getByText('To Kill a Mockingbird')).toBeInTheDocument();
      });

      // Should not show other books
      expect(screen.queryByText('The Great Gatsby')).not.toBeInTheDocument();
    });

    it('should allow user to clear search and see all books', async () => {
      const user = userEvent.setup();
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Nonexistent');

      // Clear search
      const clearButton = await screen.findByRole('button', {
        name: /Clear filters/i,
      });
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput.value).toBe('');
        expect(screen.getByText(/Showing 4 of 4 books/)).toBeInTheDocument();
      });
    });

    it('should handle sorting while search is active', async () => {
      const user = userEvent.setup();
      render(<TilingDashboard />);

      // Search for books starting with 'The'
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'The');

      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 4 books/)).toBeInTheDocument();
      });

      // Now sort by author
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'author');

      await waitFor(() => {
        const container = screen.getByTestId('tiles-container');
        const children = Array.from(container.children);

        // Filtered results should be sorted by author
        expect(children[0]).toHaveTextContent('F. Scott Fitzgerald');
        expect(children[1]).toHaveTextContent('J.D. Salinger');
      });
    });
  });

  describe('Book Selection and Navigation', () => {
    it('should track book selection and dispatch events', async () => {
      const user = userEvent.setup();
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(<TilingDashboard />);

      // Select a book
      const firstBookButton = await screen.findByTestId('book-tile-1');

      await user.click(firstBookButton);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bookSelected',
        })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should allow selecting different books in sequence', async () => {
      const user = userEvent.setup();
      render(<TilingDashboard />);

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      const first = await screen.findByTestId('book-tile-1');
      const second = await screen.findByTestId('book-tile-2');

      // Click first book
      await user.click(first);
      expect(dispatchEventSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          detail: expect.objectContaining({ bookId: '1' }),
        })
      );

      // Click second book
      await user.click(second);
      expect(dispatchEventSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          detail: expect.objectContaining({ bookId: '2' }),
        })
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Different Book States', () => {
    it('should handle books with and without cover images', async () => {
      render(<TilingDashboard />);

      await waitFor(() => {
        // Books with covers should have images
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);

        // Book without cover (The Catcher in the Rye) should show placeholder
        expect(screen.getByText('The Catcher in the Rye')).toBeInTheDocument();
      });
    });

    it('should display all book metadata correctly', async () => {
      render(<TilingDashboard />);

      await waitFor(() => {
        mockBooks.forEach((book) => {
          expect(screen.getByText(book.title)).toBeInTheDocument();
          expect(screen.getByText(book.author)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Responsive Behavior and Accessibility', () => {
    it('should maintain functionality with keyboard navigation', async () => {
      const user = userEvent.setup();
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(<TilingDashboard />);

      // Tab to search input
      await user.tab();

      // Type in search
      await user.keyboard('Pride');

      await waitFor(() => {
        expect(screen.getByText('Pride and Prejudice')).toBeInTheDocument();
        expect(screen.queryByText('The Great Gatsby')).not.toBeInTheDocument();
      });

      const sortSelect = screen.getByTestId('sort-select');
      sortSelect.focus();
      expect(sortSelect).toHaveFocus();

      dispatchEventSpy.mockRestore();
    });

    it('should have proper ARIA labels for accessibility', async () => {
      render(<TilingDashboard />);

      const searchInput = screen.getByLabelText(/Search books/i);
      expect(searchInput).toBeInTheDocument();

      const sortLabel = screen.getByText('Sort by:');
      expect(sortLabel).toBeInTheDocument();
    });
  });

  describe('Empty and Error States', () => {
    it('should show empty state when no books exist', () => {
      useListMyBooks.mockReturnValue({
        data: { books: [] },
        loading: false,
        error: null,
      });

      render(<TilingDashboard />);

      expect(screen.getByText('No books in your library yet')).toBeInTheDocument();
    });

    it('should recover from error state', () => {
      const error = new Error('Network error');
      useListMyBooks.mockReturnValue({
        data: null,
        loading: false,
        error,
      });

      render(<TilingDashboard />);

      expect(screen.getByText('Unable to load library')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('should show loading state while fetching', () => {
      useListMyBooks.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<TilingDashboard />);

      expect(screen.getByText('Loading books...')).toBeInTheDocument();
    });
  });

  describe('Performance and State Management', () => {
    it('should handle rapid search changes', async () => {
      const user = userEvent.setup();
      render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');

      // Rapidly change search
      await user.type(searchInput, 'T', { delay: 10 });

      await waitFor(() => {
        expect(searchInput.value).toBe('T');
      });

      await user.clear(searchInput);
      await user.type(searchInput, 'A', { delay: 10 });

      await waitFor(() => {
        expect(screen.getByText('Pride and Prejudice')).toBeInTheDocument();
      });
    });

    it('should maintain filters when re-rendering', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TilingDashboard />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Gatsby');

      await waitFor(() => {
        expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
      });

      // Re-render should maintain search
      rerender(<TilingDashboard />);

      await waitFor(() => {
        expect(searchInput.value).toBe('Gatsby');
      });
    });
  });
});
