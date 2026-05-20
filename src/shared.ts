export type AppConfig = {
  apiUrl: string;
  username: string;
  password: string;
  intervalSeconds: number;
  downloadFolder: string;
};

export type JobResponse = {
  id: number | string;
  nome: string;
  url: string;
  printer: string | number;
};

export type HistoryItem = {
  id: string;
  receivedAt: string;
  fileName: string;
  printer: string;
  savedPath: string;
};

export type MonitorState = {
  isRunning: boolean;
  status: string;
  lastError: string | null;
  history: HistoryItem[];
};

export type SaveConfigResult = {
  ok: boolean;
  config?: AppConfig;
  error?: string;
};

export type SelectFolderResult = {
  canceled: boolean;
  path?: string;
};
