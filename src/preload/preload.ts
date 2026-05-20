import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig, MonitorState, SaveConfigResult, SelectFolderResult } from '../shared.js';

const api = {
  getConfig: () => ipcRenderer.invoke('config:get') as Promise<AppConfig>,
  saveConfig: (config: AppConfig) => ipcRenderer.invoke('config:save', config) as Promise<SaveConfigResult>,
  selectFolder: () => ipcRenderer.invoke('folder:select') as Promise<SelectFolderResult>,
  startMonitor: (config: AppConfig) => ipcRenderer.invoke('monitor:start', config) as Promise<{ ok: boolean; error?: string; state?: MonitorState }>,
  stopMonitor: () => ipcRenderer.invoke('monitor:stop') as Promise<MonitorState>,
  getMonitorState: () => ipcRenderer.invoke('monitor:state') as Promise<MonitorState>,
  onMonitorState: (callback: (state: MonitorState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: MonitorState) => callback(state);
    ipcRenderer.on('monitor:state', listener);
    return () => {
      ipcRenderer.removeListener('monitor:state', listener);
    };
  }
};

contextBridge.exposeInMainWorld('apiFiles', api);

export type ApiFilesBridge = typeof api;
