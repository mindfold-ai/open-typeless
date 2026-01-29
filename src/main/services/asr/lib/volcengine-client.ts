/**
 * Volcengine BigModel ASR WebSocket client.
 * Handles streaming speech recognition with Volcengine service.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import log from 'electron-log';
import type { ASRResult, ASRStatus } from '../../../../shared/types';
import {
  type VolcengineClientConfig,
  type VolcengineMessage,
  type ConnectionState,
  volcengineMessageSchema,
  transcriptionResultPayloadSchema,
  VOLCENGINE_CONSTANTS,
} from '../types';

const logger = log.scope('volcengine-client');

/**
 * Generate a UUID v4 string.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Event types emitted by VolcengineClient.
 */
export interface VolcengineClientEvents {
  result: (result: ASRResult) => void;
  status: (status: ASRStatus) => void;
  error: (error: Error) => void;
}

/**
 * Type-safe event emitter interface.
 */
export interface VolcengineClient {
  on<K extends keyof VolcengineClientEvents>(
    event: K,
    listener: VolcengineClientEvents[K]
  ): this;
  off<K extends keyof VolcengineClientEvents>(
    event: K,
    listener: VolcengineClientEvents[K]
  ): this;
  emit<K extends keyof VolcengineClientEvents>(
    event: K,
    ...args: Parameters<VolcengineClientEvents[K]>
  ): boolean;
}

/**
 * Volcengine BigModel ASR WebSocket client.
 *
 * Handles the WebSocket connection to Volcengine's streaming ASR service,
 * including session management, audio data transmission, and result parsing.
 *
 * @example
 * ```typescript
 * const client = new VolcengineClient({
 *   appId: 'your-app-id',
 *   accessToken: 'your-token',
 *   resourceId: 'volc.bigasr.sauc.duration',
 * });
 *
 * client.on('result', (result) => {
 *   console.log(result.text);
 * });
 *
 * client.on('status', (status) => {
 *   console.log('Status:', status);
 * });
 *
 * client.on('error', (error) => {
 *   console.error('Error:', error);
 * });
 *
 * await client.connect();
 * client.sendAudio(audioBuffer);
 * client.finishAudio();
 * ```
 */
export class VolcengineClient extends EventEmitter {
  private readonly config: VolcengineClientConfig;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private taskId = '';
  private connectId = '';
  private audioIndex = 0;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private sessionStarted = false;

  constructor(config: VolcengineClientConfig) {
    super();
    this.config = config;
  }

  /**
   * Get current connection status.
   */
  get isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state.
   */
  get state(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Connect to Volcengine ASR service.
   * Establishes WebSocket connection and sends session start message.
   *
   * @returns Promise that resolves when connection is established and session started
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Already connected');
      return;
    }

    this.reset();
    this.updateState('connecting');
    this.emitStatus('connecting');

    return new Promise((resolve, reject) => {
      this.connectId = generateUUID();
      this.taskId = generateUUID();

      const headers = {
        'X-Api-App-Key': this.config.appId,
        'X-Api-Access-Key': this.config.accessToken,
        'X-Api-Resource-Id': this.config.resourceId,
        'X-Api-Connect-Id': this.connectId,
      };

      logger.info('Connecting to Volcengine ASR', {
        endpoint: VOLCENGINE_CONSTANTS.ENDPOINT,
        connectId: this.connectId,
      });

      try {
        this.ws = new WebSocket(VOLCENGINE_CONSTANTS.ENDPOINT, { headers });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to create WebSocket', { error: err.message });
        this.updateState('error');
        this.emitStatus('error');
        this.emit('error', err);
        reject(err);
        return;
      }

      const connectionTimeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          const err = new Error('Connection timeout');
          logger.error('Connection timeout');
          this.cleanup();
          this.updateState('error');
          this.emitStatus('error');
          this.emit('error', err);
          reject(err);
        }
      }, 30000);

      this.ws.on('open', () => {
        logger.info('WebSocket connected', { connectId: this.connectId });
        this.updateState('connected');
        this.sendStartTranscription();
        clearTimeout(connectionTimeout);
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error: Error) => {
        logger.error('WebSocket error', { error: error.message });
        clearTimeout(connectionTimeout);
        this.emit('error', error);

        if (this.connectionState === 'connecting') {
          reject(error);
        } else {
          this.handleDisconnection();
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        logger.info('WebSocket closed', {
          code,
          reason: reason.toString(),
          connectId: this.connectId,
        });
        clearTimeout(connectionTimeout);
        this.handleDisconnection();
      });
    });
  }

  /**
   * Disconnect from Volcengine ASR service.
   * Sends stop message if session is active, then closes connection.
   */
  disconnect(): void {
    logger.info('Disconnecting', { connectId: this.connectId });
    this.cancelReconnect();

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sessionStarted) {
      this.sendStopTranscription();
    }

    this.cleanup();
    this.updateState('disconnected');
    this.emitStatus('idle');
  }

  /**
   * Send audio data to ASR service.
   * Audio should be PCM 16-bit, 16kHz, Mono format.
   *
   * @param chunk - Audio data as ArrayBuffer
   */
  sendAudio(chunk: ArrayBuffer): void {
    if (!this.isConnected || !this.sessionStarted) {
      logger.warn('Cannot send audio: not connected or session not started');
      return;
    }

    const base64Audio = this.arrayBufferToBase64(chunk);
    const message = this.buildMessage(VOLCENGINE_CONSTANTS.MESSAGE_NAMES.AUDIO_DATA, {
      audio: base64Audio,
      index: this.audioIndex++,
      is_end: false,
    });

    this.sendMessage(message);
  }

  /**
   * Signal end of audio stream.
   * Call this when audio recording is complete to receive final results.
   */
  finishAudio(): void {
    if (!this.isConnected || !this.sessionStarted) {
      logger.warn('Cannot finish audio: not connected or session not started');
      return;
    }

    logger.info('Finishing audio stream', { audioIndex: this.audioIndex });
    this.emitStatus('processing');

    // Send final audio chunk with is_end flag
    const message = this.buildMessage(VOLCENGINE_CONSTANTS.MESSAGE_NAMES.AUDIO_DATA, {
      audio: '',
      index: this.audioIndex++,
      is_end: true,
    });

    this.sendMessage(message);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Reset client state for new connection.
   */
  private reset(): void {
    this.audioIndex = 0;
    this.sessionStarted = false;
    this.taskId = '';
    this.connectId = '';
  }

  /**
   * Update connection state.
   */
  private updateState(state: ConnectionState): void {
    this.connectionState = state;
  }

  /**
   * Emit status change to listeners.
   */
  private emitStatus(status: ASRStatus): void {
    this.emit('status', status);
  }

  /**
   * Clean up WebSocket connection.
   */
  private cleanup(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.sessionStarted = false;
  }

  /**
   * Handle WebSocket disconnection.
   */
  private handleDisconnection(): void {
    this.cleanup();

    if (this.connectionState !== 'disconnected' && this.connectionState !== 'error') {
      this.updateState('disconnected');
      this.emitStatus('idle');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= VOLCENGINE_CONSTANTS.RECONNECT.MAX_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      this.updateState('error');
      this.emitStatus('error');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(
      VOLCENGINE_CONSTANTS.RECONNECT.BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      VOLCENGINE_CONSTANTS.RECONNECT.MAX_DELAY_MS
    );

    logger.info('Scheduling reconnection', {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: VOLCENGINE_CONSTANTS.RECONNECT.MAX_ATTEMPTS,
      delayMs: delay,
    });

    this.updateState('reconnecting');
    this.reconnectAttempts++;

    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectAttempts = 0;
      } catch (error) {
        logger.error('Reconnection failed', {
          attempt: this.reconnectAttempts,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, delay);
  }

  /**
   * Cancel pending reconnection.
   */
  private cancelReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Send start transcription message.
   */
  private sendStartTranscription(): void {
    const message = this.buildMessage(VOLCENGINE_CONSTANTS.MESSAGE_NAMES.START, {
      audio: {
        format: 'pcm',
        sample_rate: 16000,
        channel: 1,
        bits: 16,
        codec: 'raw',
      },
      user: {},
      request: {
        model_name: VOLCENGINE_CONSTANTS.MODEL_NAME,
      },
    });

    this.sendMessage(message);
    this.sessionStarted = true;
    this.emitStatus('listening');
    logger.info('Started transcription session', { taskId: this.taskId });
  }

  /**
   * Send stop transcription message.
   */
  private sendStopTranscription(): void {
    const message = this.buildMessage(VOLCENGINE_CONSTANTS.MESSAGE_NAMES.STOP, {});
    this.sendMessage(message);
    logger.info('Sent stop transcription', { taskId: this.taskId });
  }

  /**
   * Build a Volcengine protocol message.
   */
  private buildMessage(name: string, payload: Record<string, unknown>): VolcengineMessage {
    return {
      header: {
        message_id: generateUUID(),
        task_id: this.taskId,
        namespace: VOLCENGINE_CONSTANTS.NAMESPACE,
        name,
      },
      payload,
    };
  }

  /**
   * Send message through WebSocket.
   */
  private sendMessage(message: VolcengineMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message: WebSocket not open');
      return;
    }

    const json = JSON.stringify(message);
    this.ws.send(json);

    // Only log non-audio messages to avoid log spam
    if (message.header.name !== VOLCENGINE_CONSTANTS.MESSAGE_NAMES.AUDIO_DATA) {
      logger.debug('Sent message', {
        name: message.header.name,
        messageId: message.header.message_id,
      });
    }
  }

  /**
   * Handle incoming WebSocket message.
   */
  private handleMessage(data: Buffer): void {
    try {
      const jsonStr = data.toString('utf-8');
      const raw = JSON.parse(jsonStr);

      const parseResult = volcengineMessageSchema.safeParse(raw);
      if (!parseResult.success) {
        logger.warn('Invalid message format', {
          error: parseResult.error.issues[0]?.message,
        });
        return;
      }

      const message = parseResult.data;
      logger.debug('Received message', {
        name: message.header.name,
        status: message.header.status,
      });

      this.processMessage(message);
    } catch (error) {
      logger.error('Failed to parse message', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Process parsed Volcengine message.
   */
  private processMessage(message: VolcengineMessage): void {
    const { name, status, status_message } = message.header;

    // Check for error status
    if (status !== undefined && status !== 0 && status !== 20000000) {
      const errorMsg = status_message ?? `Error status: ${status}`;
      logger.error('Server error', { status, message: errorMsg });
      this.emit('error', new Error(errorMsg));
      return;
    }

    switch (name) {
      case VOLCENGINE_CONSTANTS.MESSAGE_NAMES.TRANSCRIPTION_RESULT_CHANGED:
        this.handleTranscriptionResult(message, false);
        break;

      case VOLCENGINE_CONSTANTS.MESSAGE_NAMES.TRANSCRIPTION_COMPLETED:
        this.handleTranscriptionResult(message, true);
        this.emitStatus('done');
        break;

      case VOLCENGINE_CONSTANTS.MESSAGE_NAMES.TASK_FAILED:
        logger.error('Task failed', { payload: message.payload });
        this.emit('error', new Error(status_message ?? 'Task failed'));
        this.emitStatus('error');
        break;

      default:
        logger.debug('Unhandled message type', { name });
    }
  }

  /**
   * Handle transcription result message.
   */
  private handleTranscriptionResult(message: VolcengineMessage, isFinal: boolean): void {
    const payloadResult = transcriptionResultPayloadSchema.safeParse(message.payload);

    if (!payloadResult.success) {
      logger.warn('Invalid transcription result payload', {
        error: payloadResult.error.issues[0]?.message,
      });
      return;
    }

    const payload = payloadResult.data;
    const result = payload.result;

    if (!result) {
      return;
    }

    // Extract text from result
    let text = result.text ?? '';

    // If no direct text, try to concatenate sentences
    if (!text && result.sentences) {
      text = result.sentences.map((s) => s.text).join('');
    }

    if (text) {
      const asrResult: ASRResult = {
        type: isFinal ? 'final' : 'interim',
        text,
        isFinal,
      };

      logger.debug('ASR result', {
        type: asrResult.type,
        textLength: text.length,
      });

      this.emit('result', asrResult);
    }
  }

  /**
   * Convert ArrayBuffer to base64 string.
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
  }
}
