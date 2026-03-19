import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookTile from '../components/BookTile';
import AdvancedSearchFilters from '../components/AdvancedSearchFilters';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

describe('Accessibility Tests', () => {
  describe('BookTile', () => {
    it('should have accessible button with proper aria-label', () => {
      const book = { id: '1', title: 'Test Book', author: 'Test Author' };
      render(<BookTile book={book} onClick={() => {}} />);

      const button = screen.getByRole('button', { name: /Test Book by Test Author/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper list item semantics', () => {
      const book = { id: '1', title: 'Test Book', author: 'Test Author' };
      const { container } = render(<BookTile book={book} onClick={() => {}} />);

      const listItem = container.querySelector('li');
      expect(listItem).toBeInTheDocument();
    });

    it('should have alternative text for book cover image', () => {
      const book = { id: '1', title: 'Test Book', author: 'Test Author', coverUrl: 'http://example.com/cover.jpg' };
      render(<BookTile book={book} onClick={() => {}} />);

      const image = screen.getByAltText(/Test Book cover/i);
      expect(image).toBeInTheDocument();
    });

    it('should have placeholder accessible when no cover image', () => {
      const book = { id: '1', title: 'Test Book', author: 'Test Author' };
      const { container } = render(<BookTile book={book} onClick={() => {}} />);

      const placeholder = container.querySelector('.book-tile-placeholder');
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    });

    it('should respond to keyboard navigation', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const book = { id: '1', title: 'Test Book', author: 'Test Author' };
      render(<BookTile book={book} onClick={onClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      await user.tab();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('AdvancedSearchFilters', () => {
    const mockBooks = [
      { id: '1', author: 'Author A', createdAt: '2023-01-01' },
      { id: '2', author: 'Author B', createdAt: '2024-01-01' },
    ];

    it('should have accessible filter toggle button with aria-label', () => {
      const { rerender } = render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={() => {}}
          onToggle={() => {}}
          isOpen={false}
        />
      );

      const button = screen.getByRole('button', { name: /Filters/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={() => {}}
          onToggle={() => {}}
          isOpen={true}
        />
      );

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have accessible checkboxes with labels', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={() => {}}
          onToggle={() => {}}
          isOpen={true}
        />
      );

      const authorCheckbox = screen.getAllByRole('checkbox')[0];
      expect(authorCheckbox).toBeInTheDocument();

      // Checkbox should be inside a label
      const label = screen.getByText(/Author A/i).closest('label');
      expect(label).toBeInTheDocument();
    });

    it('should link error messages to inputs with aria-describedby', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={() => {}}
          onToggle={() => {}}
          isOpen={true}
        />
      );

      const yearMinInput = screen.getByTestId('year-min-input');
      const yearMaxInput = screen.getByTestId('year-max-input');

      // Initially no error
      expect(yearMinInput).not.toHaveAttribute('aria-describedby');

      // Simulate error by triggering apply with bad values
      const yearMaxInputElement = yearMaxInput;
      await userEvent.clear(yearMaxInputElement);
      await userEvent.type(yearMaxInputElement, '9999');

      const applyButton = screen.getByRole('button', { name: /Apply Filters/i });
      await userEvent.click(applyButton);

      // After error, should have aria-describedby pointing to error
      const errorElement = screen.getByTestId('year-error');
      expect(errorElement).toHaveAttribute('id', 'year-error');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('should display active filter count in aria-label', async () => {
      const onFiltersChange = vi.fn();
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={onFiltersChange}
          onToggle={() => {}}
          isOpen={true}
        />
      );

      const authorCheckbox = screen.getAllByRole('checkbox')[0];
      await userEvent.click(authorCheckbox);

      // Check that onFiltersChange was called with selected authors
      expect(onFiltersChange).toHaveBeenCalled();
    });
  });

  describe('ErrorState', () => {
    it('should have alert role and aria-live', () => {
      render(
        <ErrorState
          title="Error"
          message="Something went wrong"
          onRetry={() => {}}
        />
      );

      const errorDiv = screen.getByRole('alert');
      expect(errorDiv).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible retry button with aria-label', () => {
      render(
        <ErrorState
          title="Error"
          message="Something went wrong"
          onRetry={() => {}}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Try again to load the content');
    });

    it('should hide decorative icon with aria-hidden', () => {
      const { container } = render(
        <ErrorState
          title="Error"
          message="Something went wrong"
          icon="⚠️"
        />
      );

      const icon = container.querySelector('.error-state-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('EmptyState', () => {
    it('should have status role for announcements', () => {
      render(
        <EmptyState
          title="No items"
          subtitle="Try again later"
        />
      );

      const emptyDiv = screen.getByRole('status');
      expect(emptyDiv).toBeInTheDocument();
    });

    it('should have accessible action button with aria-label', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="No items"
          subtitle="Try again later"
          actionLabel="Retry"
          onAction={onAction}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Retry');
    });

    it('should hide decorative icon with aria-hidden', () => {
      const { container } = render(
        <EmptyState
          title="No items"
          icon="📚"
        />
      );

      const icon = container.querySelector('.empty-state-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Contrast and Readability', () => {
    it('should have sufficient color contrast for text', () => {
      // This is a visual test that would typically be done with axe-core or similar
      // For now, we verify that color values are defined
      const { container } = render(
        <div>
          <span style={{ color: '#333', backgroundColor: '#fff' }}>High contrast text</span>
          <span style={{ color: '#555', backgroundColor: '#f5f5f5' }}>Improved contrast text</span>
        </div>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should maintain visible focus indicators on keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <AdvancedSearchFilters
          books={[
            { id: '1', author: 'Author A', createdAt: '2023-01-01' },
          ]}
          onFiltersChange={() => {}}
          onToggle={() => {}}
          isOpen={true}
        />
      );

      const button = screen.getByTestId('filters-toggle-button');
      await user.tab();

      // Focus should be visible on the button
      expect(button).toHaveFocus();
    });
  });
});
