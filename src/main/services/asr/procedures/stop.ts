/**
 * Stop ASR procedure.
 * Stops the current ASR session and returns the final result.
 */

import log from 'electron-log';
import { asrService } from '../asr.service';
import type { ASRResult } from '../../../../shared/types/asr';

const logger = log.scope('asr:stop');

/**
 * Response type for stopASR procedure.
 */
export interface StopASRResponse {
  success: boolean;
  result?: ASRResult;
  error?: string;
}

/**
 * Stop the current ASR session.
 *
 * @returns Success status with final result or error message
 */
export async function stopASR(): Promise<StopASRResponse> {
  try {
    logger.info('Stopping ASR session');
    const result = await asrService.stop();
    logger.info('ASR session stopped', {
      hasResult: !!result,
      textLength: result?.text.length,
    });
    return { success: true, result: result ?? undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to stop ASR session', { error: message });
    return { success: false, error: message };
  }
}
