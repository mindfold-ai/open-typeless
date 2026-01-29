/**
 * ASR (Automatic Speech Recognition) module.
 *
 * Provides audio recording capabilities using Web Audio API.
 * Captures microphone audio, converts to PCM 16-bit format,
 * and sends to the main process via IPC.
 *
 * @example
 * ```typescript
 * import { AudioRecorder } from './modules/asr';
 *
 * // Create recorder with audio chunk callback
 * const recorder = new AudioRecorder(
 *   (chunk) => {
 *     // Send audio chunk to main process for ASR processing
 *     window.api.asr.sendAudio(chunk);
 *   },
 *   (state) => {
 *     console.log('Recording:', state.isRecording);
 *     if (state.error) console.error('Error:', state.error);
 *   }
 * );
 *
 * // Start recording
 * await recorder.start();
 *
 * // Stop recording
 * recorder.stop();
 *
 * // Clean up when done
 * recorder.destroy();
 * ```
 */

// Library utilities and main AudioRecorder class
export {
  float32ToInt16,
  int16ToArrayBuffer,
  float32ToArrayBuffer,
  AudioRecorder,
} from './lib';

// Constants
export { AUDIO_CONFIG, AUDIO_ERRORS } from './constants';

// React hooks
export { useAudioRecorder } from './hooks';
export type { UseAudioRecorderReturn } from './hooks';

// Types
export type {
  AudioRecorderState,
  AudioChunkCallback,
  StateChangeCallback,
  AudioResources,
} from './types';
