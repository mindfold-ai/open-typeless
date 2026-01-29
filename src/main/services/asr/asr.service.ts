/**
 * ASR Service.
 * Manages the end-to-end ASR flow including WebSocket connection,
 * audio processing, and floating window display.
 */

import { EventEmitter } from 'events';
import log from 'electron-log';
import { VolcengineClient } from './lib/volcengine-client';
import { loadASRConfig, ConfigurationError } from './lib/config';
import { floatingWindow } from '../../windows';
import type { ASRConfig, ASRResult, ASRStatus } from '../../../shared/types/asr';

const logger = log.scope('asr-service');

/**
 * Event types emitted by ASRService.
 */
export interface ASRServiceEvents {
  status: (status: ASRStatus) => void;
  result: (result: ASRResult) => void;
  error: (error: Error) => void;
}

/**
 * Type-safe event emitter interface for ASRService.
 */
export interface ASRService {
  on<K extends keyof ASRServiceEvents>(event: K, listener: ASRServiceEvents[K]): this;
  off<K extends keyof ASRServiceEvents>(event: K, listener: ASRServiceEvents[K]): this;
  emit<K extends keyof ASRServiceEvents>(
    event: K,
    ...args: Parameters<ASRServiceEvents[K]>
  ): boolean;
}

/**
 * ASR Service manages the complete ASR flow.
 *
 * State machine:
 * ```
 * idle → connecting → listening → processing → done
 *                         ↓
 *                       error
 * ```
 *
 * @example
 * ```typescript
 * // Start ASR
 * await asrService.start();
 *
 * // Send audio chunks
 * asrService.processAudioChunk(audioBuffer);
 *
 * // Stop and get result
 * const result = await asrService.stop();
 * ```
 */
export class ASRService extends EventEmitter {
  private client: VolcengineClient | null = null;
  private status: ASRStatus = 'idle';
  private finalResult: ASRResult | null = null;
  private lastResult: ASRResult | null = null;

  /**
   * Get current ASR status.
   */
  get currentStatus(): ASRStatus {
    return this.status;
  }

  /**
   * Start ASR session.
   *
   * @param config - Optional partial configuration to override environment variables
   * @throws ConfigurationError if required credentials are missing
   * @throws Error if connection fails after retries
   */
  async start(config?: Partial<ASRConfig>): Promise<void> {
    if (this.status !== 'idle') {
      logger.warn('ASR session already active, stopping previous session');
      await this.stop();
    }

    logger.info('Starting ASR session');
    this.reset();

    // Load configuration from environment
    let envConfig;
    try {
      envConfig = loadASRConfig();
    } catch (error) {
      if (error instanceof ConfigurationError) {
        logger.error('ASR configuration error', { message: error.message });
        this.updateStatus('error');
        this.emit('error', error);
        floatingWindow.sendError(error.message);
        throw error;
      }
      throw error;
    }

    // Merge with optional runtime config
    const clientConfig = {
      appId: config?.appId ?? envConfig.appId,
      accessToken: config?.accessToken ?? envConfig.accessToken,
      resourceId: config?.resourceId ?? envConfig.resourceId,
    };

    // Create Volcengine client
    this.client = new VolcengineClient(clientConfig);

    // Setup event forwarding
    this.setupClientListeners();

    // Show floating window and update status
    this.updateStatus('connecting');

    // Connect to Volcengine service
    try {
      await this.client.connect();
      logger.info('ASR session started successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to connect to ASR service', { error: err.message });
      this.updateStatus('error');
      this.emit('error', err);
      floatingWindow.sendError(`Connection failed: ${err.message}`);
      this.cleanup();
      throw err;
    }
  }

  /**
   * Stop ASR session.
   *
   * @returns The final ASR result, or null if no result was received
   */
  async stop(): Promise<ASRResult | null> {
    if (!this.client || this.status === 'idle') {
      logger.warn('No active ASR session to stop');
      return null;
    }

    logger.info('Stopping ASR session');

    // Signal end of audio to get final result
    if (this.client.isConnected) {
      this.client.finishAudio();

      // Wait for final result with timeout
      const result = await this.waitForFinalResult();
      this.cleanup();
      return result;
    }

    this.cleanup();
    return this.finalResult;
  }

  /**
   * Process an audio chunk.
   * The chunk should be PCM 16-bit, 16kHz, mono format.
   *
   * @param chunk - Audio data as ArrayBuffer
   */
  processAudioChunk(chunk: ArrayBuffer): void {
    if (!this.client || !this.client.isConnected) {
      logger.warn('Cannot process audio: no active connection');
      return;
    }

    if (this.status !== 'listening') {
      logger.warn('Cannot process audio: not in listening state', { status: this.status });
      return;
    }

    this.client.sendAudio(chunk);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Reset service state for a new session.
   */
  private reset(): void {
    this.finalResult = null;
    this.lastResult = null;
    this.status = 'idle';
  }

  /**
   * Update status and emit event.
   */
  private updateStatus(status: ASRStatus): void {
    this.status = status;
    this.emit('status', status);
    floatingWindow.sendStatus(status);
    logger.debug('Status updated', { status });
  }

  /**
   * Setup event listeners on the Volcengine client.
   */
  private setupClientListeners(): void {
    if (!this.client) return;

    this.client.on('status', (status) => {
      this.updateStatus(status);
    });

    this.client.on('result', (result) => {
      this.lastResult = result;

      if (result.isFinal) {
        this.finalResult = result;
      }

      this.emit('result', result);
      floatingWindow.sendResult(result);
    });

    this.client.on('error', (error) => {
      logger.error('Volcengine client error', { message: error.message });
      this.updateStatus('error');
      this.emit('error', error);
      floatingWindow.sendError(error.message);
    });
  }

  /**
   * Wait for final result with timeout.
   */
  private waitForFinalResult(): Promise<ASRResult | null> {
    return new Promise((resolve) => {
      // If we already have a final result, return it
      if (this.finalResult) {
        resolve(this.finalResult);
        return;
      }

      const TIMEOUT_MS = 10000; // 10 seconds timeout
      let resolved = false;

      const resultHandler = (result: ASRResult): void => {
        if (result.isFinal && !resolved) {
          resolved = true;
          this.client?.off('result', resultHandler);
          clearTimeout(timeoutId);
          resolve(result);
        }
      };

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.client?.off('result', resultHandler);
          logger.warn('Timeout waiting for final result, returning last result');
          // Return last result or final result, whichever is available
          resolve(this.finalResult ?? this.lastResult);
        }
      }, TIMEOUT_MS);

      this.client?.on('result', resultHandler);

      // Also listen for done status as backup
      const statusHandler = (status: ASRStatus): void => {
        if (status === 'done' && !resolved) {
          // Give a small delay for the final result to come through
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              this.client?.off('result', resultHandler);
              this.client?.off('status', statusHandler);
              clearTimeout(timeoutId);
              resolve(this.finalResult ?? this.lastResult);
            }
          }, 500);
        }
      };

      this.client?.on('status', statusHandler);
    });
  }

  /**
   * Cleanup resources.
   */
  private cleanup(): void {
    if (this.client) {
      this.client.removeAllListeners();
      this.client.disconnect();
      this.client = null;
    }

    this.updateStatus('idle');
    logger.info('ASR session cleaned up');
  }
}

/**
 * Singleton instance of the ASR service.
 */
export const asrService = new ASRService();
