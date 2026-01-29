/**
 * ASR library exports.
 * Re-exports client and configuration utilities.
 */

export { VolcengineClient } from './volcengine-client';
export type { VolcengineClientEvents } from './volcengine-client';

export {
  loadASRConfig,
  isASRConfigured,
  ConfigurationError,
} from './config';
export type { ASREnvConfig } from './config';
