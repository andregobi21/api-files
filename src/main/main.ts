import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '../shared.js';
import { loadConfig, normalizeConfig, saveConfig, validateConfig } from './config.js';
import { Monitor } from './monitor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let currentConfig: AppConfig | null = null;

const monitor = new Monitor(() => mainWindow);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 720,
    minWidth: 900,
    minHeight: 620,
    title: 'API Files',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('config:get', async () => currentConfig ?? loadConfig());

ipcMain.handle('config:save', async (_event, input: Partial<AppConfig>) => {
  const config = normalizeConfig(input);
  const error = validateConfig(config);
  if (error) return { ok: false, error };

  await saveConfig(config);
  currentConfig = config;
  monitor.setConfig(config);
  return { ok: true, config };
});

ipcMain.handle('folder:select', async () => {
  const options: OpenDialogOptions = {
    properties: ['openDirectory', 'createDirectory']
  };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);

  return {
    canceled: result.canceled,
    path: result.filePaths[0]
  };
});

ipcMain.handle('monitor:start', async (_event, input: Partial<AppConfig>) => {
  const config = normalizeConfig(input);
  const error = validateConfig(config);
  if (error) return { ok: false, error };

  await saveConfig(config);
  currentConfig = config;
  monitor.start(config);
  return { ok: true, state: monitor.getState() };
});

ipcMain.handle('monitor:stop', () => {
  monitor.stop();
  return monitor.getState();
});

ipcMain.handle('monitor:state', () => monitor.getState());

app.whenReady().then(async () => {
  currentConfig = await loadConfig();
  monitor.setConfig(currentConfig);
  createWindow();

  mainWindow?.webContents.once('did-finish-load', () => {
    if (currentConfig && !validateConfig(currentConfig)) {
      monitor.start(currentConfig);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  monitor.stop();
  if (process.platform !== 'darwin') app.quit();
});
