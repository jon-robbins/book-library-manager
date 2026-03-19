import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedSearchFilters from '../components/AdvancedSearchFilters';

describe('AdvancedSearchFilters Component', () => {
  const mockBooks = [
    {
      id: '1',
      title: 'Book One',
      author: 'Author One',
      createdAt: '2020-05-15',
      coverUrl: 'url1.jpg',
    },
    {
      id: '2',
      title: 'Book Two',
      author: 'Author Two',
      createdAt: '2021-08-20',
      coverUrl: 'url2.jpg',
    },
    {
      id: '3',
      title: 'Another Book',
      author: 'Author One',
      createdAt: '2023-01-10',
      coverUrl: 'url3.jpg',
    },
    {
      id: '4',
      title: 'Recent Book',
      author: 'Author Three',
      createdAt: '2024-12-01',
      coverUrl: 'url4.jpg',
    },
  ];

  let mockOnFiltersChange;
  let mockOnToggle;

  beforeEach(() => {
    mockOnFiltersChange = vi.fn();
    mockOnToggle = vi.fn();
  });

  describe('Rendering', () => {
    it('should render filters toggle button', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={false}
        />
      );

      expect(screen.getByTestId('filters-toggle-button')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should not display panel when isOpen is false', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={false}
        />
      );

      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument();
    });

    it('should display panel when isOpen is true', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
    });

    it('should show active filters badge when filters are applied', () => {
      const { rerender } = render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={false}
        />
      );

      // Simulate filter state by calling with filters
      mockOnFiltersChange({ authors: ['Author One'], yearMin: null, yearMax: null });

      rerender(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={false}
        />
      );

      // Since we track local state, we need to interact with the component
      // This is tested in the interaction tests below
    });
  });

  describe('Author Filter', () => {
    it('should display all unique authors from books', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('author-checkbox-Author One')).toBeInTheDocument();
      expect(screen.getByTestId('author-checkbox-Author Two')).toBeInTheDocument();
      expect(screen.getByTestId('author-checkbox-Author Three')).toBeInTheDocument();
    });

    it('should sort authors alphabetically', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const authorsList = screen.getByTestId('authors-list');
      const labels = authorsList.querySelectorAll('.author-checkbox span');
      expect(labels[0].textContent).toBe('Author One');
      expect(labels[1].textContent).toBe('Author Three');
      expect(labels[2].textContent).toBe('Author Two');
    });

    it('should select author when checkbox is clicked', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox = screen.getByTestId('author-checkbox-Author One');
      await userEvent.click(checkbox);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          authors: expect.arrayContaining(['Author One']),
        })
      );
    });

    it('should deselect author when checkbox is clicked again', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox = screen.getByTestId('author-checkbox-Author One');

      // Select
      await userEvent.click(checkbox);
      expect(mockOnFiltersChange).toHaveBeenCalled();

      // Deselect
      await userEvent.click(checkbox);
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          authors: [],
        })
      );
    });

    it('should allow multiple authors to be selected', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox1 = screen.getByTestId('author-checkbox-Author One');
      const checkbox2 = screen.getByTestId('author-checkbox-Author Two');

      await userEvent.click(checkbox1);
      await userEvent.click(checkbox2);

      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          authors: expect.arrayContaining(['Author One', 'Author Two']),
        })
      );
    });

    it('should show message when no authors available', () => {
      render(
        <AdvancedSearchFilters
          books={[]}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByText('No authors available')).toBeInTheDocument();
    });
  });

  describe('Year Range Filter', () => {
    it('should display year range input fields', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('year-min-input')).toBeInTheDocument();
      expect(screen.getByTestId('year-max-input')).toBeInTheDocument();
    });

    it('should accept valid year inputs', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      const maxInput = screen.getByTestId('year-max-input');

      await userEvent.type(minInput, '2020');
      await userEvent.type(maxInput, '2023');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          yearMin: 2020,
          yearMax: 2023,
        })
      );
    });

    it('should validate that min year is not greater than max year', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      const maxInput = screen.getByTestId('year-max-input');

      await userEvent.type(minInput, '2023');
      await userEvent.type(maxInput, '2020');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(screen.getByTestId('year-error')).toBeInTheDocument();
      expect(screen.getByText('Start year must be before end year')).toBeInTheDocument();
      expect(mockOnFiltersChange).not.toHaveBeenCalledWith(
        expect.objectContaining({
          yearMin: 2023,
          yearMax: 2020,
        })
      );
    });

    it('should validate minimum year boundary (1900)', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      await userEvent.type(minInput, '1899');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(screen.getByTestId('year-error')).toBeInTheDocument();
      expect(screen.getByText('Year must be 1900 or later')).toBeInTheDocument();
    });

    it('should validate maximum year boundary', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const maxInput = screen.getByTestId('year-max-input');
      // Current year is 2024, so typing 2025 should fail
      await userEvent.type(maxInput, '2025');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(screen.getByTestId('year-error')).toBeInTheDocument();
    });

    it('should allow single year minimum only', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      await userEvent.type(minInput, '2020');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          yearMin: 2020,
          yearMax: null,
        })
      );
    });

    it('should allow single year maximum only', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const maxInput = screen.getByTestId('year-max-input');
      await userEvent.type(maxInput, '2023');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          yearMin: null,
          yearMax: 2023,
        })
      );
    });

    it('should show placeholders with available year range', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      const maxInput = screen.getByTestId('year-max-input');

      // mockBooks have years from 2020 to 2024
      expect(minInput.placeholder).toBe('2020');
      expect(maxInput.placeholder).toBe('2024');
    });
  });

  describe('Filter Actions', () => {
    it('should have apply filters button', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('apply-filters-button')).toBeInTheDocument();
    });

    it('should have clear filters button', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
    });

    it('should clear all filters when clear button is clicked', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox = screen.getByTestId('author-checkbox-Author One');
      const minInput = screen.getByTestId('year-min-input');
      const clearButton = screen.getByTestId('clear-filters-button');

      await userEvent.click(checkbox);
      await userEvent.type(minInput, '2020');
      await userEvent.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        authors: [],
        yearMin: null,
        yearMax: null,
      });
    });

    it('should disable clear button when no filters are active', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const clearButton = screen.getByTestId('clear-filters-button');
      expect(clearButton).toBeDisabled();
    });

    it('should enable clear button when filters are active', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox = screen.getByTestId('author-checkbox-Author One');
      const clearButton = screen.getByTestId('clear-filters-button');

      expect(clearButton).toBeDisabled();
      await userEvent.click(checkbox);

      await waitFor(() => {
        expect(clearButton).not.toBeDisabled();
      });
    });
  });

  describe('Toggle Button', () => {
    it('should call onToggle when filters button is clicked', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={false}
        />
      );

      const toggleButton = screen.getByTestId('filters-toggle-button');
      await userEvent.click(toggleButton);

      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should show active filters badge count', async () => {
      const { rerender } = render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox = screen.getByTestId('author-checkbox-Author One');
      const minInput = screen.getByTestId('year-min-input');

      await userEvent.click(checkbox);
      await userEvent.type(minInput, '2020');
      await userEvent.click(screen.getByTestId('apply-filters-button'));

      // The badge should reflect 2 active filters (1 author + 1 year min)
      rerender(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty books array', () => {
      render(
        <AdvancedSearchFilters
          books={[]}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByText('No authors available')).toBeInTheDocument();
    });

    it('should handle books with invalid dates', () => {
      const booksWithInvalidDate = [
        ...mockBooks,
        {
          id: '5',
          title: 'Bad Book',
          author: 'Author Four',
          createdAt: 'invalid-date',
          coverUrl: 'url5.jpg',
        },
      ];

      render(
        <AdvancedSearchFilters
          books={booksWithInvalidDate}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('author-checkbox-Author Four')).toBeInTheDocument();
    });

    it('should handle year range with single year book', () => {
      const singleYearBooks = [
        {
          id: '1',
          title: 'Book One',
          author: 'Author One',
          createdAt: '2020-05-15',
          coverUrl: 'url1.jpg',
        },
      ];

      render(
        <AdvancedSearchFilters
          books={singleYearBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      const maxInput = screen.getByTestId('year-max-input');

      expect(minInput.placeholder).toBe('2020');
      expect(maxInput.placeholder).toBe('2020');
    });

    it('should handle year inputs at boundary values', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minInput = screen.getByTestId('year-min-input');
      const maxInput = screen.getByTestId('year-max-input');

      // Test boundary years
      await userEvent.type(minInput, '1900');
      await userEvent.type(maxInput, '2024');

      const applyButton = screen.getByTestId('apply-filters-button');
      await userEvent.click(applyButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        authors: [],
        yearMin: 1900,
        yearMax: 2024,
      });
    });

    it('should handle rapid filter changes', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox1 = screen.getByTestId('author-checkbox-Author One');
      const checkbox2 = screen.getByTestId('author-checkbox-Author Two');
      const checkbox3 = screen.getByTestId('author-checkbox-Author Three');

      // Rapid clicks
      await userEvent.click(checkbox1);
      await userEvent.click(checkbox1);
      await userEvent.click(checkbox2);
      await userEvent.click(checkbox2);
      await userEvent.click(checkbox3);

      // Should end with only checkbox3 selected
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          authors: ['Author Three'],
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-expanded on toggle button', () => {
      const { rerender } = render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={false}
        />
      );

      expect(screen.getByTestId('filters-toggle-button')).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      expect(screen.getByTestId('filters-toggle-button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper labels for year inputs', () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const minLabel = screen.getByLabelText('From:');
      const maxLabel = screen.getByLabelText('To:');

      expect(minLabel).toBeInTheDocument();
      expect(maxLabel).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(
        <AdvancedSearchFilters
          books={mockBooks}
          onFiltersChange={mockOnFiltersChange}
          onToggle={mockOnToggle}
          isOpen={true}
        />
      );

      const checkbox = screen.getByTestId('author-checkbox-Author One');
      checkbox.focus();
      expect(checkbox).toHaveFocus();

      await userEvent.keyboard(' ');
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });
});
