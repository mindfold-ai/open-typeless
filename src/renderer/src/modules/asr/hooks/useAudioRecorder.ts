/**
 * React hook for audio recording.
 * Wraps the AudioRecorder class with React state management.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../lib';
import type { AudioRecorderState } from '../types';

/**
 * Return type for the useAudioRecorder hook.
 */
export interface UseAudioRecorderReturn {
  /** Whether recording is currently in progress */
  isRecording: boolean;
  /** Error message if an error occurred, null otherwise */
  error: string | null;
  /** Starts recording from the microphone */
  startRecording: () => Promise<void>;
  /** Stops the current recording */
  stopRecording: () => void;
}

/**
 * React hook for audio recording using Web Audio API.
 *
 * Captures microphone audio, converts to PCM 16-bit format,
 * and sends chunks via the provided callback.
 *
 * @param onAudioChunk - Callback invoked with each audio chunk (PCM 16-bit ArrayBuffer)
 * @returns Recording state and control functions
 *
 * @example
 * ```tsx
 * function RecordingComponent() {
 *   const { isRecording, error, startRecording, stopRecording } = useAudioRecorder(
 *     (chunk) => {
 *       window.api.asr.sendAudio(chunk);
 *     }
 *   );
 *
 *   return (
 *     <div>
 *       {error && <p>Error: {error}</p>}
 *       <button onClick={isRecording ? stopRecording : startRecording}>
 *         {isRecording ? 'Stop' : 'Start'} Recording
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAudioRecorder(
  onAudioChunk: (chunk: ArrayBuffer) => void
): UseAudioRecorderReturn {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    error: null,
  });

  const recorderRef = useRef<AudioRecorder | null>(null);
  const onAudioChunkRef = useRef(onAudioChunk);

  // Keep the callback ref up to date
  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  // Create recorder instance on mount
  useEffect(() => {
    recorderRef.current = new AudioRecorder(
      (chunk) => onAudioChunkRef.current(chunk),
      setState
    );

    return () => {
      recorderRef.current?.destroy();
      recorderRef.current = null;
    };
  }, []);

  const startRecording = useCallback(async () => {
    await recorderRef.current?.start();
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  return {
    isRecording: state.isRecording,
    error: state.error,
    startRecording,
    stopRecording,
  };
}
