/**
 * Transcript Display Component.
 * Displays transcribed text with different styles for interim and final results.
 */

import type { ReactNode } from 'react';

interface TranscriptDisplayProps {
  /** Transcribed text to display */
  text?: string;
  /** Whether this is an interim (not final) result */
  interim?: boolean;
}

/**
 * Displays transcription text with visual distinction for interim vs final results.
 *
 * @example
 * ```tsx
 * // Interim result (gray text)
 * <TranscriptDisplay text="Hello wor" interim={true} />
 *
 * // Final result (black text)
 * <TranscriptDisplay text="Hello world" interim={false} />
 * ```
 */
export function TranscriptDisplay({ text, interim = false }: TranscriptDisplayProps): ReactNode {
  // Don't render if no text
  if (!text) {
    return null;
  }

  const className = interim ? 'transcript-text transcript-text--interim' : 'transcript-text transcript-text--final';

  return (
    <div className={className}>
      {text}
    </div>
  );
}
