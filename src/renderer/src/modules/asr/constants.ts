/**
 * Audio configuration constants for ASR recording.
 * These values are optimized for speech recognition.
 */

/**
 * Audio configuration for microphone capture.
 */
export const AUDIO_CONFIG = {
  /** Sample rate in Hz - 16kHz is optimal for speech recognition */
  sampleRate: 16000,
  /** Number of audio channels - mono for speech */
  channelCount: 1,
  /** Bits per sample for PCM encoding */
  bitsPerSample: 16,
  /** ScriptProcessorNode buffer size (must be power of 2) */
  bufferSize: 4096,
  /** Target interval between audio chunks in milliseconds */
  chunkInterval: 100,
} as const;

/**
 * Audio error messages.
 */
export const AUDIO_ERRORS = {
  /** Microphone permission denied */
  PERMISSION_DENIED: 'Microphone permission denied',
  /** No microphone device available */
  DEVICE_NOT_AVAILABLE: 'No microphone device available',
  /** AudioContext not supported */
  AUDIO_CONTEXT_NOT_SUPPORTED: 'AudioContext is not supported in this browser',
  /** Recording already in progress */
  ALREADY_RECORDING: 'Recording is already in progress',
  /** Recording not started */
  NOT_RECORDING: 'Recording has not been started',
} as const;
