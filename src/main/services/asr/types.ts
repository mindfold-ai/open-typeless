/**
 * ASR Volcengine protocol types and Zod schemas.
 * Defines the WebSocket message format for Volcengine BigModel ASR.
 */

import { z } from 'zod';

// ============================================================================
// Volcengine WebSocket Protocol Schemas
// ============================================================================

/**
 * Message header schema for Volcengine protocol.
 */
export const volcengineHeaderSchema = z.object({
  message_id: z.string(),
  task_id: z.string(),
  namespace: z.string(),
  name: z.string(),
  status: z.number().optional(),
  status_message: z.string().optional(),
});

/**
 * Generic Volcengine message schema.
 */
export const volcengineMessageSchema = z.object({
  header: volcengineHeaderSchema,
  payload: z.record(z.string(), z.unknown()),
});

export type VolcengineHeader = z.infer<typeof volcengineHeaderSchema>;
export type VolcengineMessage = z.infer<typeof volcengineMessageSchema>;

// ============================================================================
// Transcription Result Schemas
// ============================================================================

/**
 * Single sentence result from ASR.
 */
export const sentenceResultSchema = z.object({
  text: z.string(),
  begin_time: z.number().optional(),
  end_time: z.number().optional(),
  confidence: z.number().optional(),
});

/**
 * Transcription result payload.
 */
export const transcriptionResultPayloadSchema = z.object({
  result: z.object({
    text: z.string().optional(),
    sentences: z.array(sentenceResultSchema).optional(),
    is_complete: z.boolean().optional(),
  }).optional(),
});

export type SentenceResult = z.infer<typeof sentenceResultSchema>;
export type TranscriptionResultPayload = z.infer<typeof transcriptionResultPayloadSchema>;

// ============================================================================
// Client Configuration Types
// ============================================================================

/**
 * Configuration for VolcengineClient.
 */
export interface VolcengineClientConfig {
  appId: string;
  accessToken: string;
  resourceId: string;
}

/**
 * Connection state for the WebSocket client.
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// ============================================================================
// Internal Message Types (for building outgoing messages)
// ============================================================================

/**
 * Audio configuration for session start.
 */
export interface AudioConfig {
  format: 'pcm';
  sample_rate: 16000;
  channel: 1;
  bits: 16;
  codec: 'raw';
}

/**
 * Session start message payload.
 */
export interface StartTranscriptionPayload {
  audio: AudioConfig;
  user: Record<string, unknown>;
  request: {
    model_name: string;
  };
}

/**
 * Audio data message payload.
 */
export interface AudioDataPayload {
  audio: string; // base64 encoded
  index: number;
  is_end: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const VOLCENGINE_CONSTANTS = {
  /** WebSocket endpoint for Volcengine BigModel ASR */
  ENDPOINT: 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel',

  /** Default resource ID */
  DEFAULT_RESOURCE_ID: 'volc.bigasr.sauc.duration',

  /** Namespace for speech transcription */
  NAMESPACE: 'SpeechTranscriber',

  /** Model name */
  MODEL_NAME: 'bigmodel',

  /** Message names */
  MESSAGE_NAMES: {
    START: 'StartTranscription',
    AUDIO_DATA: 'AudioData',
    STOP: 'StopTranscription',
    TRANSCRIPTION_RESULT_CHANGED: 'TranscriptionResultChanged',
    TRANSCRIPTION_COMPLETED: 'TranscriptionCompleted',
    TASK_FAILED: 'TaskFailed',
  },

  /** Reconnection settings */
  RECONNECT: {
    MAX_ATTEMPTS: 5,
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 30000,
  },
} as const;
