import axios from 'axios';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BrowserWindow } from 'electron';
import type { AppConfig, HistoryItem, JobResponse, MonitorState } from '../shared.js';

const HISTORY_LIMIT = 10;

export class Monitor {
  private config: AppConfig | null = null;
  private timer: NodeJS.Timeout | null = null;
  private inFlight = false;
  private state: MonitorState = {
    isRunning: false,
    status: 'Parado',
    lastError: null,
    history: []
  };

  constructor(private readonly getWindow: () => BrowserWindow | null) {}

  getState(): MonitorState {
    return { ...this.state, history: [...this.state.history] };
  }

  setConfig(config: AppConfig) {
    this.config = config;
    if (this.state.isRunning) {
      this.stop('Configuracao atualizada. Clique em iniciar para aplicar.');
    }
  }

  start(config: AppConfig) {
    this.config = config;
    if (this.timer) clearInterval(this.timer);

    this.state.isRunning = true;
    this.state.status = 'Monitorando';
    this.state.lastError = null;
    this.emit();

    void this.tick();
    this.timer = setInterval(() => void this.tick(), config.intervalSeconds * 1000);
  }

  stop(status = 'Parado') {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.inFlight = false;
    this.state.isRunning = false;
    this.state.status = status;
    this.emit();
  }

  private async tick() {
    if (!this.config || this.inFlight) return;

    this.inFlight = true;
    this.state.status = 'Consultando servidor';
    this.state.lastError = null;
    this.emit();

    try {
      const response = await axios.get<JobResponse>(this.config.apiUrl, {
        auth: {
          username: this.config.username,
          password: this.config.password
        },
        validateStatus: () => true,
        timeout: 30000
      });

      if (response.status !== 200) {
        this.state.status = `Aguardando arquivo (${response.status})`;
        return;
      }

      const job = response.data;
      if (!isValidJob(job)) {
        this.state.status = 'Aguardando arquivo';
        return;
      }

      this.state.status = `Baixando ${job.nome}`;
      this.emit();

      const printer = String(job.printer);
      const fileName = path.basename(job.nome || new URL(job.url).pathname);
      const folderPath = path.join(this.config.downloadFolder, `printer${printer}`);
      const savedPath = path.join(folderPath, fileName);

      const fileResponse = await axios.get<ArrayBuffer>(job.url, {
        responseType: 'arraybuffer',
        timeout: 120000
      });

      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(savedPath, Buffer.from(fileResponse.data));

      this.addHistory({
        id: String(job.id),
        receivedAt: new Date().toISOString(),
        fileName,
        printer,
        savedPath
      });
      this.state.status = `Arquivo salvo: ${fileName}`;
    } catch (error) {
      this.state.lastError = error instanceof Error ? error.message : String(error);
      this.state.status = 'Erro no processamento';
    } finally {
      this.inFlight = false;
      this.emit();
    }
  }

  private addHistory(item: HistoryItem) {
    this.state.history = [item, ...this.state.history].slice(0, HISTORY_LIMIT);
  }

  private emit() {
    this.getWindow()?.webContents.send('monitor:state', this.getState());
  }
}

function isValidJob(job: unknown): job is JobResponse {
  if (!job || typeof job !== 'object') return false;
  const value = job as Partial<JobResponse>;
  return value.id !== undefined && Boolean(value.nome) && Boolean(value.url) && value.printer !== undefined;
}
