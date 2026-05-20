import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../shared.js';

const DEFAULT_INTERVAL_SECONDS = 15;

const defaultConfig: AppConfig = {
  apiUrl: '',
  username: '',
  password: '',
  intervalSeconds: DEFAULT_INTERVAL_SECONDS,
  downloadFolder: ''
};

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

export function normalizeConfig(input: Partial<AppConfig>): AppConfig {
  return {
    apiUrl: String(input.apiUrl ?? '').trim(),
    username: String(input.username ?? '').trim(),
    password: String(input.password ?? ''),
    intervalSeconds: Math.max(1, Number(input.intervalSeconds || DEFAULT_INTERVAL_SECONDS)),
    downloadFolder: String(input.downloadFolder ?? '').trim()
  };
}

export function validateConfig(config: AppConfig): string | null {
  if (!config.apiUrl) return 'Informe a URL do servidor.';

  try {
    new URL(config.apiUrl);
  } catch {
    return 'Informe uma URL válida.';
  }

  if (!config.username) return 'Informe o usuário da API.';
  if (!config.password) return 'Informe a senha da API.';
  if (!config.downloadFolder) return 'Escolha a pasta de destino.';
  if (!Number.isFinite(config.intervalSeconds) || config.intervalSeconds < 1) {
    return 'O intervalo deve ser maior ou igual a 1 segundo.';
  }

  return null;
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const content = await fs.readFile(configPath(), 'utf8');
    return normalizeConfig({ ...defaultConfig, ...JSON.parse(content) });
  } catch {
    return { ...defaultConfig };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), 'utf8');
}
