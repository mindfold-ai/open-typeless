/**
 * Floating Window Component.
 * The main component for the ASR floating window that displays status and transcription.
 */

import type { ReactNode } from 'react';
import { useASRStatus } from '../hooks';
import { StatusIndicator } from './StatusIndicator';
import { TranscriptDisplay } from './TranscriptDisplay';
import { ErrorDisplay } from './ErrorDisplay';

/**
 * Main floating window component that displays ASR status and transcription results.
 *
 * The window shows:
 * - Status indicator (connecting, listening, processing, done)
 * - Transcript text (interim in gray, final in black)
 * - Error messages when something goes wrong
 *
 * @example
 * ```tsx
 * // In the floating window entry point
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <FloatingWindow />
 * );
 * ```
 */
export function FloatingWindow(): ReactNode {
  const { status, result, error } = useASRStatus();

  // Determine what to show based on status
  const isListening = status === 'listening';
  const isProcessingOrDone = status === 'processing' || status === 'done';
  const hasTranscriptText = Boolean(result?.text) && isProcessingOrDone;

  // Show status indicator for: connecting, listening, error, or when no transcript
  const showStatusIndicator = !hasTranscriptText || isListening;

  return (
    <div className="floating-window">
      <div className="floating-window__content">
        {/* Status indicator */}
        {showStatusIndicator && (
          <StatusIndicator status={status} />
        )}

        {/* Transcript display */}
        {hasTranscriptText && result && (
          <TranscriptDisplay
            text={result.text}
            interim={!result.isFinal}
          />
        )}

        {/* Error display */}
        {error && <ErrorDisplay message={error} />}
      </div>
    </div>
  );
}
