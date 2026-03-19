import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookTile from '../components/BookTile';

describe('BookTile Component', () => {
  const mockBook = {
    id: '1',
    title: 'Test Book',
    author: 'Test Author',
    coverUrl: 'https://example.com/cover.jpg',
  };

  describe('Rendering', () => {
    it('should render book tile with cover image', () => {
      render(<BookTile book={mockBook} onClick={vi.fn()} />);

      const image = screen.getByAltText('Test Book cover');
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/cover.jpg');
    });

    it('should render placeholder when no cover image', () => {
      const bookNoCover = { ...mockBook, coverUrl: null };
      render(<BookTile book={bookNoCover} onClick={vi.fn()} />);

      const placeholder = screen.getByText('📖');
      expect(placeholder).toBeInTheDocument();
    });

    it('should display book title and author', () => {
      render(<BookTile book={mockBook} onClick={vi.fn()} />);

      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
      render(<BookTile book={mockBook} onClick={vi.fn()} />);

      const button = screen.getByRole('button', {
        name: /Test Book by Test Author/i,
      });
      expect(button).toHaveAttribute('data-testid', 'book-tile-1');
    });

    it('should render as a button element', () => {
      render(<BookTile book={mockBook} onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<BookTile book={mockBook} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledWith('1');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Enter key is pressed', async () => {
      const handleClick = vi.fn();
      render(<BookTile book={mockBook} onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();

      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledWith('1');
    });

    it('should call onClick when Space key is pressed', async () => {
      const handleClick = vi.fn();
      render(<BookTile book={mockBook} onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();

      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalledWith('1');
    });

    it('should handle click when onClick is undefined', () => {
      render(<BookTile book={mockBook} />);

      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should apply focus visible styles', () => {
      render(<BookTile book={mockBook} onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  describe('Props', () => {
    it('should handle books with long titles', () => {
      const bookLongTitle = {
        ...mockBook,
        title: 'This is a Very Long Book Title That Should Wrap',
      };
      render(<BookTile book={bookLongTitle} onClick={vi.fn()} />);

      expect(screen.getByText(/This is a Very Long Book Title/)).toBeInTheDocument();
    });

    it('should handle books with long author names', () => {
      const bookLongAuthor = {
        ...mockBook,
        author: 'Very Long Author Name With Many Words',
      };
      render(<BookTile book={bookLongAuthor} onClick={vi.fn()} />);

      expect(
        screen.getByText('Very Long Author Name With Many Words')
      ).toBeInTheDocument();
    });

    it('should use book id as test id', () => {
      const bookWithDifferentId = { ...mockBook, id: 'abc-123' };
      render(<BookTile book={bookWithDifferentId} onClick={vi.fn()} />);

      expect(screen.getByTestId('book-tile-abc-123')).toBeInTheDocument();
    });
  });
});
