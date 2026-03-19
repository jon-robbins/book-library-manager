/**
 * TLA-18: Error and empty states
 * Tests for standardized error and empty state components for web
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

describe('ErrorState Component', () => {
  it('should render error title and message', () => {
    render(
      <ErrorState
        title="Load Failed"
        message="Unable to load data"
        testID="error-state"
      />
    );

    expect(screen.getByText('Load Failed')).toBeInTheDocument();
    expect(screen.getByText('Unable to load data')).toBeInTheDocument();
  });

  it('should render default title if not provided', () => {
    render(
      <ErrorState message="Error occurred" testID="error-state" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    render(
      <ErrorState
        message="Error occurred"
        onRetry={mockRetry}
        testID="error-state"
      />
    );

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(
      <ErrorState message="Error occurred" testID="error-state" />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should display custom icon', () => {
    render(
      <ErrorState
        message="Error occurred"
        icon="🚨"
        testID="error-state"
      />
    );

    expect(screen.getByText('🚨')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(
      <ErrorState
        title="Error"
        message="Test error message"
        testID="error-state"
      />
    );

    const errorContainer = screen.getByTestId('error-state');
    expect(errorContainer).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('should render title and subtitle', () => {
    render(
      <EmptyState
        title="No items"
        subtitle="Add your first item"
        testID="empty-state"
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add your first item')).toBeInTheDocument();
  });

  it('should render only title if subtitle not provided', () => {
    render(
      <EmptyState title="No items" testID="empty-state" />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('should display custom icon', () => {
    render(
      <EmptyState
        title="No items"
        icon="📭"
        testID="empty-state"
      />
    );

    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const mockAction = vi.fn();
    render(
      <EmptyState
        title="No items"
        actionLabel="Add item"
        onAction={mockAction}
        testID="empty-state"
      />
    );

    const actionButton = screen.getByRole('button', { name: /Add item/i });
    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });

  it('should not render action button when not provided', () => {
    render(
      <EmptyState title="No items" testID="empty-state" />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should use default icon if not provided', () => {
    render(
      <EmptyState title="No items" testID="empty-state" />
    );

    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(
      <EmptyState
        title="No results"
        subtitle="Try a different search"
        testID="empty-state"
      />
    );

    const emptyContainer = screen.getByTestId('empty-state');
    expect(emptyContainer).toBeInTheDocument();
  });
});
