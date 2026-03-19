/**
 * TLA-18: Error and empty states in TilingDashboard
 * Tests for error and empty state handling in library dashboard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TilingDashboard from '../components/TilingDashboard';

// Mock the useListMyBooks hook
vi.mock('../dataconnect-generated/react', () => ({
  useListMyBooks: vi.fn(),
}));

import { useListMyBooks } from '../dataconnect-generated/react';

describe('TilingDashboard Error States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display error state when loading fails', () => {
    useListMyBooks.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error'),
    });

    render(<TilingDashboard />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Unable to load library')).toBeInTheDocument();
  });

  it('should display error message in error state', () => {
    const errorMessage = 'Failed to fetch books from server';
    useListMyBooks.mockReturnValue({
      data: null,
      loading: false,
      error: new Error(errorMessage),
    });

    render(<TilingDashboard />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should display retry button in error state', () => {
    useListMyBooks.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error'),
    });

    render(<TilingDashboard />);

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should render retry action', () => {
    useListMyBooks.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error'),
    });

    render(<TilingDashboard />);

    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });
});

describe('TilingDashboard Empty States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display empty state when library has no books', () => {
    useListMyBooks.mockReturnValue({
      data: { books: [] },
      loading: false,
      error: null,
    });

    render(<TilingDashboard />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No books in your library yet')).toBeInTheDocument();
  });

  it('should display helpful subtitle in empty state', () => {
    useListMyBooks.mockReturnValue({
      data: { books: [] },
      loading: false,
      error: null,
    });

    render(<TilingDashboard />);

    expect(
      screen.getByText(
        'Add your first book by scanning a barcode or manually entering book details.'
      )
    ).toBeInTheDocument();
  });

  it('should display empty state when search returns no results', async () => {
    const mockBooks = [
      { id: '1', title: 'Test Book', author: 'Test Author' },
    ];

    useListMyBooks.mockReturnValue({
      data: { books: mockBooks },
      loading: false,
      error: null,
    });

    render(<TilingDashboard />);

    const searchInput = screen.getByPlaceholderText(
      /Search by title or author/i
    );
    await userEvent.type(searchInput, 'Nonexistent Book');

    // Wait for empty state to appear
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No books match your search')).toBeInTheDocument();
  });

  it('should show books count in empty search results state', async () => {
    const mockBooks = [
      { id: '1', title: 'Test Book', author: 'Test Author' },
      { id: '2', title: 'Another Book', author: 'Another Author' },
    ];

    useListMyBooks.mockReturnValue({
      data: { books: mockBooks },
      loading: false,
      error: null,
    });

    render(<TilingDashboard />);

    const searchInput = screen.getByPlaceholderText(
      /Search by title or author/i
    );
    await userEvent.type(searchInput, 'Nonexistent Book');

    expect(
      screen.getByText(/You have 2 books in your library/)
    ).toBeInTheDocument();
  });

  it('should provide clear filters button in search empty state', async () => {
    const mockBooks = [
      { id: '1', title: 'Test Book', author: 'Test Author' },
    ];

    useListMyBooks.mockReturnValue({
      data: { books: mockBooks },
      loading: false,
      error: null,
    });

    render(<TilingDashboard />);

    const searchInput = screen.getByPlaceholderText(
      /Search by title or author/i
    );
    await userEvent.type(searchInput, 'Nonexistent Book');

    const clearButton = screen.getByRole('button', { name: /Clear filters/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    // After clearing, books should reappear
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  it('should display books when data is available', () => {
    const mockBooks = [
      {
        id: '1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
      },
    ];

    useListMyBooks.mockReturnValue({
      data: { books: mockBooks },
      loading: false,
      error: null,
    });

    render(<TilingDashboard />);

    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

describe('TilingDashboard Loading State', () => {
  it('should display loading spinner while fetching data', () => {
    useListMyBooks.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    render(<TilingDashboard />);

    expect(screen.getByText('Loading books...')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});
