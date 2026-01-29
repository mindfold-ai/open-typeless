/**
 * Floating Window IPC handlers.
 * Handles show/hide requests from the renderer process.
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/channels';
import { floatingWindow } from '../windows';

/**
 * Setup floating window IPC handlers.
 */
export function setupFloatingWindowHandlers(): void {
  // Handle show request
  ipcMain.handle(IPC_CHANNELS.FLOATING_WINDOW.SHOW, () => {
    floatingWindow.show();
    return { success: true };
  });

  // Handle hide request
  ipcMain.handle(IPC_CHANNELS.FLOATING_WINDOW.HIDE, () => {
    floatingWindow.hide();
    return { success: true };
  });
}
