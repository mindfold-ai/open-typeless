/**
 * ASR IPC handlers.
 * Connects IPC channels to ASR service and forwards events to renderer.
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/channels';
import { asrService } from '../services/asr/asr.service';
import { startASR, stopASR } from '../services/asr/procedures';
import type { ASRConfig } from '../../shared/types/asr';

const logger = log.scope('asr-handler');

/**
 * Get the main window for sending events.
 * Returns the focused window or the first available window.
 */
function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

/**
 * Setup ASR IPC handlers.
 * Registers handlers for start/stop requests and forwards service events to renderer.
 */
export function setupASRHandlers(): void {
  // Handle ASR start request
  ipcMain.handle(IPC_CHANNELS.ASR.START, async (_event, config?: Partial<ASRConfig>) => {
    logger.info('Received ASR start request', { hasConfig: !!config });
    return startASR(config);
  });

  // Handle ASR stop request
  ipcMain.handle(IPC_CHANNELS.ASR.STOP, async () => {
    logger.info('Received ASR stop request');
    return stopASR();
  });

  // Handle incoming audio data from renderer
  ipcMain.on(IPC_CHANNELS.ASR.SEND_AUDIO, (_event, chunk: ArrayBuffer) => {
    asrService.processAudioChunk(chunk);
  });

  // Forward service events to renderer
  setupServiceEventForwarding();
}

/**
 * Setup event forwarding from ASR service to renderer process.
 */
function setupServiceEventForwarding(): void {
  // Forward status changes to renderer
  asrService.on('status', (status) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.ASR.STATUS, status);
    }
  });

  // Forward results to renderer
  asrService.on('result', (result) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.ASR.RESULT, result);
    }
  });

  // Forward errors to renderer
  asrService.on('error', (error) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.ASR.ERROR, error.message);
    }
  });

  logger.info('ASR service event forwarding configured');
}
