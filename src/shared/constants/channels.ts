/**
 * IPC channel constants.
 * Used by both main process and renderer process for communication.
 */

export const IPC_CHANNELS = {
  ASR: {
    /** Start ASR session */
    START: 'asr:start',
    /** Stop ASR session */
    STOP: 'asr:stop',
    /** Send audio data (Renderer -> Main) */
    SEND_AUDIO: 'asr:send-audio',
    /** ASR result (Main -> Renderer) */
    RESULT: 'asr:result',
    /** ASR status change (Main -> Renderer) */
    STATUS: 'asr:status',
    /** ASR error (Main -> Renderer) */
    ERROR: 'asr:error',
  },
  FLOATING_WINDOW: {
    /** Show floating window (Renderer -> Main) */
    SHOW: 'floating-window:show',
    /** Hide floating window (Renderer -> Main) */
    HIDE: 'floating-window:hide',
  },
} as const;
