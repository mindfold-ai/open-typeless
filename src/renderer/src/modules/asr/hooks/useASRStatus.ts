/**
 * Hook for subscribing to ASR status, results, and errors.
 * Used by the floating window to display real-time ASR state.
 */

import { useEffect, useState, useCallback } from 'react';
import type { ASRResult, ASRStatus } from '../../../../../shared/types/asr';

/**
 * Return type for useASRStatus hook.
 */
export interface UseASRStatusReturn {
  /** Current ASR status */
  status: ASRStatus;
  /** Latest ASR result (interim or final) */
  result: ASRResult | null;
  /** Error message if any */
  error: string | null;
  /** Clear the current result and error */
  clear: () => void;
}

/**
 * Hook that subscribes to ASR status, results, and errors via IPC.
 *
 * @example
 * ```tsx
 * function FloatingWindow() {
 *   const { status, result, error } = useASRStatus();
 *
 *   return (
 *     <div>
 *       <StatusIndicator status={status} />
 *       {result && <TranscriptDisplay text={result.text} interim={!result.isFinal} />}
 *       {error && <ErrorDisplay message={error} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useASRStatus(): UseASRStatusReturn {
  const [status, setStatus] = useState<ASRStatus>('idle');
  const [result, setResult] = useState<ASRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear state
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // Subscribe to ASR events
  useEffect(() => {
    // Clear error when status changes (except to error state)
    const unsubscribeStatus = window.api.asr.onStatus((newStatus) => {
      setStatus(newStatus);
      if (newStatus !== 'error') {
        setError(null);
      }
      // Clear result when starting a new session
      if (newStatus === 'connecting') {
        setResult(null);
      }
    });

    const unsubscribeResult = window.api.asr.onResult((newResult) => {
      setResult(newResult);
    });

    const unsubscribeError = window.api.asr.onError((errorMessage) => {
      setError(errorMessage);
      setStatus('error');
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeStatus();
      unsubscribeResult();
      unsubscribeError();
    };
  }, []);

  return {
    status,
    result,
    error,
    clear,
  };
}
