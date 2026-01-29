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
 * Get all windows for broadcasting events.
 * We need to send events to ALL windows because:
 * - Main window handles audio recording
 * - Floating window handles status display
 */
function getAllWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
}

/**
 * Send an event to all windows.
 */
function broadcastToAllWindows(channel: string, ...args: unknown[]): void {
  const windows = getAllWindows();
  for (const win of windows) {
    win.webContents.send(channel, ...args);
  }
  logger.debug('Broadcast to all windows', { channel, windowCount: windows.length });
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
  let audioChunkCount = 0;
  ipcMain.on(IPC_CHANNELS.ASR.SEND_AUDIO, (_event, chunk: ArrayBuffer) => {
    audioChunkCount++;
    if (audioChunkCount === 1 || audioChunkCount % 50 === 0) {
      logger.info('Received audio chunk from renderer', {
        count: audioChunkCount,
        size: chunk.byteLength,
      });
    }
    asrService.processAudioChunk(chunk);
  });

  // Forward service events to renderer
  setupServiceEventForwarding();
}

/**
 * Setup event forwarding from ASR service to renderer process.
 */
function setupServiceEventForwarding(): void {
  // Forward status changes to ALL windows
  // Main window needs 'listening' to start recording
  // Floating window needs status updates for display
  asrService.on('status', (status) => {
    logger.info('Broadcasting status to all windows', { status });
    broadcastToAllWindows(IPC_CHANNELS.ASR.STATUS, status);
  });

  // Forward results to all windows
  asrService.on('result', (result) => {
    broadcastToAllWindows(IPC_CHANNELS.ASR.RESULT, result);
  });

  // Forward errors to all windows
  asrService.on('error', (error) => {
    broadcastToAllWindows(IPC_CHANNELS.ASR.ERROR, error.message);
  });

  logger.info('ASR service event forwarding configured');
}
