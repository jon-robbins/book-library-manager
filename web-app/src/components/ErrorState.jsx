import React from 'react';
import '../styles/error-state.css';

/**
 * Standardized error state component for web
 * Displays error message with optional retry button
 */
export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  icon = '⚠️',
  testID = 'error-state',
}) {
  return (
    <div className="error-state" data-testid={testID} role="alert" aria-live="assertive">
      <div className="error-state-icon" aria-hidden="true">{icon}</div>
      <h2 className="error-state-title">{title}</h2>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button
          className="error-state-button"
          onClick={onRetry}
          data-testid={`${testID}-retry`}
          aria-label="Try again to load the content"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
