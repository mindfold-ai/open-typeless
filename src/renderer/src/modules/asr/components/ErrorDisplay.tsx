/**
 * Error Display Component.
 * Displays error messages in a visually distinct style.
 */

import type { ReactNode } from 'react';

interface ErrorDisplayProps {
  /** Error message to display */
  message?: string;
}

/**
 * Displays an error message with error styling.
 *
 * @example
 * ```tsx
 * <ErrorDisplay message="Connection failed. Please try again." />
 * ```
 */
export function ErrorDisplay({ message }: ErrorDisplayProps): ReactNode {
  // Don't render if no message
  if (!message) {
    return null;
  }

  return (
    <div className="error-display">
      <span className="error-display__icon">!</span>
      <span className="error-display__message">{message}</span>
    </div>
  );
}
