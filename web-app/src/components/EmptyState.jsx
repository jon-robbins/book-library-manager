import React from 'react';
import '../styles/empty-state.css';

/**
 * Standardized empty state component for web
 * Displays when no data is available with optional action button
 */
export default function EmptyState({
  title,
  subtitle,
  icon = '📚',
  actionLabel,
  onAction,
  testID = 'empty-state',
}) {
  return (
    <div className="empty-state" data-testid={testID} role="status">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h2 className="empty-state-title">{title}</h2>
      {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          className="empty-state-button"
          onClick={onAction}
          data-testid={`${testID}-action`}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
