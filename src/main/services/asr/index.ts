/**
 * ASR module exports.
 * Re-exports the ASR service, procedures, and library utilities.
 */

// Service
export { ASRService, asrService } from './asr.service';
export type { ASRServiceEvents } from './asr.service';

// Procedures
export { startASR, stopASR, getASRStatus } from './procedures';
export type { StartASRResponse, StopASRResponse } from './procedures';

// Types
export type {
  VolcengineClientConfig,
  ConnectionState,
  VolcengineMessage,
  VolcengineHeader,
} from './types';
export { VOLCENGINE_CONSTANTS } from './types';

// Library utilities
export {
  VolcengineClient,
  loadASRConfig,
  isASRConfigured,
  ConfigurationError,
} from './lib';
export type { VolcengineClientEvents, ASREnvConfig } from './lib';
