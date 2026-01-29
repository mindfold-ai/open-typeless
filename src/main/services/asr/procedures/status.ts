/**
 * Get ASR status procedure.
 * Returns the current ASR session status.
 */

import { asrService } from '../asr.service';
import type { ASRStatus } from '../../../../shared/types/asr';

/**
 * Get the current ASR session status.
 *
 * @returns Current ASR status
 */
export function getASRStatus(): ASRStatus {
  return asrService.currentStatus;
}
