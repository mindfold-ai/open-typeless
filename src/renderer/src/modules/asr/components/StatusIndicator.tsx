/**
 * Status Indicator Component.
 * Displays the current ASR status with appropriate visual feedback.
 */

import type { ReactNode } from 'react';
import type { ASRStatus } from '../../../../../shared/types/asr';

interface StatusIndicatorProps {
  /** Current ASR status */
  status: ASRStatus;
}

/**
 * Status configuration for display.
 */
const STATUS_CONFIG: Record<ASRStatus, { label: string; className: string }> = {
  idle: { label: '', className: 'status-indicator--idle' },
  connecting: { label: 'Connecting...', className: 'status-indicator--connecting' },
  listening: { label: 'Listening...', className: 'status-indicator--listening' },
  processing: { label: 'Processing...', className: 'status-indicator--processing' },
  done: { label: 'Done', className: 'status-indicator--done' },
  error: { label: 'Error', className: 'status-indicator--error' },
};

/**
 * Displays the current ASR status with an animated indicator.
 *
 * @example
 * ```tsx
 * <StatusIndicator status="listening" />
 * ```
 */
export function StatusIndicator({ status }: StatusIndicatorProps): ReactNode {
  const config = STATUS_CONFIG[status];

  // Don't render anything for idle status
  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`status-indicator ${config.className}`}>
      <span className="status-indicator__dot" />
      <span className="status-indicator__label">{config.label}</span>
    </div>
  );
}
