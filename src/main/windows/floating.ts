/**
 * Floating Window Manager.
 * Manages the ASR status floating window that displays recording state and transcription.
 */

import { BrowserWindow } from 'electron';
import path from 'node:path';
import type { ASRResult, ASRStatus } from '../../shared/types/asr';
import { IPC_CHANNELS } from '../../shared/constants/channels';

/**
 * Floating window configuration constants.
 */
const FLOATING_WINDOW_CONFIG = {
  WIDTH: 300,
  HEIGHT: 100,
  /** Auto-hide delay after recognition is done (ms) */
  AUTO_HIDE_DELAY: 2000,
} as const;

/**
 * Manages the ASR floating window lifecycle and communication.
 */
export class FloatingWindowManager {
  private window: BrowserWindow | null = null;
  private autoHideTimer: NodeJS.Timeout | null = null;

  /**
   * Create the floating window.
   * The window is created hidden and shown when needed.
   */
  create(): void {
    if (this.window) {
      return;
    }

    this.window = new BrowserWindow({
      width: FLOATING_WINDOW_CONFIG.WIDTH,
      height: FLOATING_WINDOW_CONFIG.HEIGHT,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: true,
      show: false,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load the floating window HTML
    if (FLOATING_WINDOW_VITE_DEV_SERVER_URL) {
      this.window.loadURL(`${FLOATING_WINDOW_VITE_DEV_SERVER_URL}`);
    } else {
      this.window.loadFile(
        path.join(__dirname, `../renderer/${FLOATING_WINDOW_VITE_NAME}/index.html`),
      );
    }

    // Prevent the window from being closed, just hide it
    this.window.on('close', (event) => {
      event.preventDefault();
      this.hide();
    });

    // Clean up reference when window is destroyed
    this.window.on('closed', () => {
      this.window = null;
    });
  }

  /**
   * Show the floating window.
   */
  show(): void {
    if (!this.window) {
      this.create();
    }
    this.clearAutoHideTimer();
    this.window?.show();
  }

  /**
   * Hide the floating window.
   */
  hide(): void {
    this.clearAutoHideTimer();
    this.window?.hide();
  }

  /**
   * Destroy the floating window.
   */
  destroy(): void {
    this.clearAutoHideTimer();
    if (this.window) {
      this.window.removeAllListeners('close');
      this.window.destroy();
      this.window = null;
    }
  }

  /**
   * Send ASR status update to the floating window.
   * @param status - The current ASR status
   */
  sendStatus(status: ASRStatus): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    // Show window for active statuses
    if (status === 'connecting' || status === 'listening' || status === 'processing') {
      this.show();
    }

    // Auto-hide after recognition is done
    if (status === 'done') {
      this.scheduleAutoHide();
    }

    // Hide on idle or error (error will be handled separately)
    if (status === 'idle') {
      this.hide();
    }

    this.window.webContents.send(IPC_CHANNELS.ASR.STATUS, status);
  }

  /**
   * Send ASR result to the floating window.
   * @param result - The ASR result containing transcribed text
   */
  sendResult(result: ASRResult): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    this.window.webContents.send(IPC_CHANNELS.ASR.RESULT, result);
  }

  /**
   * Send error message to the floating window.
   * @param error - The error message
   */
  sendError(error: string): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    // Show window to display error
    this.show();
    this.window.webContents.send(IPC_CHANNELS.ASR.ERROR, error);
    // Auto-hide after showing error
    this.scheduleAutoHide();
  }

  /**
   * Check if the floating window is currently visible.
   */
  isVisible(): boolean {
    return this.window?.isVisible() ?? false;
  }

  /**
   * Get the BrowserWindow instance (for testing purposes).
   */
  getWindow(): BrowserWindow | null {
    return this.window;
  }

  /**
   * Schedule auto-hide of the window.
   */
  private scheduleAutoHide(): void {
    this.clearAutoHideTimer();
    this.autoHideTimer = setTimeout(() => {
      this.hide();
    }, FLOATING_WINDOW_CONFIG.AUTO_HIDE_DELAY);
  }

  /**
   * Clear the auto-hide timer.
   */
  private clearAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
}

/**
 * Singleton instance of the floating window manager.
 */
export const floatingWindow = new FloatingWindowManager();
