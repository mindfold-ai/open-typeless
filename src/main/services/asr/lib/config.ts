/**
 * ASR configuration loader.
 * Loads Volcengine ASR credentials from environment variables.
 */

import { VOLCENGINE_CONSTANTS } from '../types';

/**
 * ASR environment configuration.
 */
export interface ASREnvConfig {
  appId: string;
  accessToken: string;
  resourceId: string;
}

/**
 * Configuration error when required environment variables are missing.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Load ASR configuration from environment variables.
 *
 * Required environment variables:
 * - VOLCENGINE_APP_ID: Application ID from Volcengine console
 * - VOLCENGINE_ACCESS_TOKEN: Access token for authentication
 *
 * Optional environment variables:
 * - VOLCENGINE_RESOURCE_ID: Resource ID (default: "volc.bigasr.sauc.duration")
 *
 * @returns ASR configuration object
 * @throws ConfigurationError if required variables are missing
 */
export function loadASRConfig(): ASREnvConfig {
  const appId = process.env.VOLCENGINE_APP_ID;
  const accessToken = process.env.VOLCENGINE_ACCESS_TOKEN;
  const resourceId =
    process.env.VOLCENGINE_RESOURCE_ID ?? VOLCENGINE_CONSTANTS.DEFAULT_RESOURCE_ID;

  const missingVars: string[] = [];

  if (!appId) {
    missingVars.push('VOLCENGINE_APP_ID');
  }

  if (!accessToken) {
    missingVars.push('VOLCENGINE_ACCESS_TOKEN');
  }

  if (missingVars.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    appId: appId as string,
    accessToken: accessToken as string,
    resourceId,
  };
}

/**
 * Check if ASR configuration is available without throwing.
 *
 * @returns true if all required environment variables are set
 */
export function isASRConfigured(): boolean {
  return Boolean(process.env.VOLCENGINE_APP_ID && process.env.VOLCENGINE_ACCESS_TOKEN);
}
