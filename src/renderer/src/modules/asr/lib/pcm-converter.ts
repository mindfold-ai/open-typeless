/**
 * PCM (Pulse Code Modulation) conversion utilities.
 * Converts audio data between Float32 (Web Audio API format) and Int16 (PCM format).
 */

/**
 * Converts Float32Array audio samples to Int16Array.
 * Web Audio API uses Float32 samples in range [-1.0, 1.0].
 * PCM 16-bit uses Int16 samples in range [-32768, 32767].
 *
 * @param float32Array - Audio samples in Float32 format (-1.0 to 1.0)
 * @returns Audio samples converted to Int16 format
 */
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp value to [-1.0, 1.0] range
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer range
    // Use 0x7fff (32767) instead of 0x8000 (32768) to avoid overflow
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return int16Array;
}

/**
 * Converts Int16Array to ArrayBuffer for IPC transmission.
 * This creates a copy of the underlying buffer to ensure safe transfer.
 *
 * @param int16Array - Audio samples in Int16 format
 * @returns ArrayBuffer containing the Int16 data
 */
export function int16ToArrayBuffer(int16Array: Int16Array): ArrayBuffer {
  // Create a copy to ensure we have a clean ArrayBuffer for transfer
  const buffer = new ArrayBuffer(int16Array.byteLength);
  const view = new Int16Array(buffer);
  view.set(int16Array);
  return buffer;
}

/**
 * Combines Float32 to Int16 conversion and ArrayBuffer creation in one step.
 * Use this when you need to send audio data over IPC.
 *
 * @param float32Array - Audio samples in Float32 format (-1.0 to 1.0)
 * @returns ArrayBuffer ready for IPC transmission
 */
export function float32ToArrayBuffer(float32Array: Float32Array): ArrayBuffer {
  const int16Array = float32ToInt16(float32Array);
  return int16ToArrayBuffer(int16Array);
}
