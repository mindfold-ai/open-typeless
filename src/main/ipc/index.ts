/**
 * IPC handler registration.
 * Central place to register all IPC handlers.
 */

import { setupASRHandlers } from './asr.handler';
import { setupFloatingWindowHandlers } from './floating-window.handler';

/**
 * Setup all IPC handlers.
 * Call this during app initialization, before creating windows.
 */
export function setupAllIpcHandlers(): void {
  setupASRHandlers();
  setupFloatingWindowHandlers();
}
