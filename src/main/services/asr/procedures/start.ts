/**
 * Start ASR procedure.
 * Initializes and starts an ASR session.
 */

import log from 'electron-log';
import { asrService } from '../asr.service';
import type { ASRConfig } from '../../../../shared/types/asr';

const logger = log.scope('asr:start');

/**
 * Response type for startASR procedure.
 */
export interface StartASRResponse {
  success: boolean;
  error?: string;
}

/**
 * Start an ASR session.
 *
 * @param config - Optional partial configuration to override environment variables
 * @returns Success status and optional error message
 */
export async function startASR(config?: Partial<ASRConfig>): Promise<StartASRResponse> {
  try {
    logger.info('Starting ASR session', { hasConfig: !!config });
    await asrService.start(config);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to start ASR session', { error: message });
    return { success: false, error: message };
  }
}
