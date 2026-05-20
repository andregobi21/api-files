import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AppConfig, MonitorState } from '../../shared';
import logoIcon from './assets/logo-icone.png';
import './styles.css';

const emptyConfig: AppConfig = {
  apiUrl: '',
  username: '',
  password: '',
  intervalSeconds: 15,
  downloadFolder: ''
};

const emptyState: MonitorState = {
  isRunning: false,
  status: 'Carregando',
  lastError: null,
  history: []
};

function App() {
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [monitor, setMonitor] = useState<MonitorState>(emptyState);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void window.apiFiles.getConfig().then(setConfig);
    void window.apiFiles.getMonitorState().then(setMonitor);
    return window.apiFiles.onMonitorState(setMonitor);
  }, []);

  const canStart = useMemo(() => {
    return Boolean(config.apiUrl && config.username && config.password && config.downloadFolder && config.intervalSeconds >= 1);
  }, [config]);

  function updateConfig<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  async function saveConfig() {
    const result = await window.apiFiles.saveConfig(config);
    if (!result.ok) {
      setMessage(result.error ?? 'Não foi possível salvar.');
      return;
    }
    if (result.config) setConfig(result.config);
    setMessage('Configuração salva.');
  }

  async function chooseFolder() {
    const result = await window.apiFiles.selectFolder();
    if (!result.canceled && result.path) {
      updateConfig('downloadFolder', result.path);
    }
  }

  async function toggleMonitor() {
    if (monitor.isRunning) {
      setMonitor(await window.apiFiles.stopMonitor());
      return;
    }

    const result = await window.apiFiles.startMonitor(config);
    if (!result.ok) {
      setMessage(result.error ?? 'Não foi possível iniciar.');
      return;
    }
    if (result.state) setMonitor(result.state);
  }

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div className="brand-lockup">
          <img src={logoIcon} alt="Gobi software" className="brand-logo" />
          <div>
            <div className="company-name">Gobi software</div>
            <h1>Sincronizador de arquivos</h1>
            <p>Monitore o endpoint, baixe arquivos autenticados e organize por impressora.</p>
          </div>
        </div>
        <div className={`status-pill ${monitor.isRunning ? 'running' : 'stopped'}`}>
          <span />
          {monitor.isRunning ? 'Ativo' : 'Parado'}
        </div>
      </section>

      <section className="layout">
        <form className="panel config-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="panel-header">
            <h2>Configuração</h2>
            <p>Ao abrir o app, o monitor inicia automaticamente se estes dados estiverem completos.</p>
          </div>

          <label>
            URL do servidor
            <input
              value={config.apiUrl}
              onChange={(event) => updateConfig('apiUrl', event.target.value)}
              placeholder="https://servidor/ords/app/job"
              type="url"
            />
          </label>

          <div className="field-row">
            <label>
              Usuário
              <input value={config.username} onChange={(event) => updateConfig('username', event.target.value)} />
            </label>
            <label>
              Senha
              <input
                value={config.password}
                onChange={(event) => updateConfig('password', event.target.value)}
                type="password"
              />
            </label>
          </div>

          <label>
            Intervalo entre consultas
            <div className="inline-input">
              <input
                min={1}
                value={config.intervalSeconds}
                onChange={(event) => updateConfig('intervalSeconds', Number(event.target.value))}
                type="number"
              />
              <span>segundos</span>
            </div>
          </label>

          <label>
            Pasta de destino
            <div className="folder-picker">
              <input value={config.downloadFolder} readOnly placeholder="Escolha uma pasta" />
              <button type="button" className="secondary" onClick={chooseFolder}>
                Escolher
              </button>
            </div>
          </label>

          {message && <div className="message">{message}</div>}

          <div className="actions">
            <button type="button" className="secondary" onClick={saveConfig}>
              Salvar
            </button>
            <button type="button" onClick={toggleMonitor} disabled={!monitor.isRunning && !canStart}>
              {monitor.isRunning ? 'Parar' : 'Iniciar'}
            </button>
          </div>
        </form>

        <section className="panel activity-panel">
          <div className="panel-header">
            <h2>Monitoramento</h2>
            <p>{monitor.status}</p>
          </div>

          {monitor.lastError && <div className="error-box">{monitor.lastError}</div>}

          <div className="history-header">
            <h3>Últimos arquivos</h3>
            <span>{monitor.history.length}/10</span>
          </div>

          <div className="history-table">
            <div className="history-row heading">
              <span>Data</span>
              <span>Arquivo</span>
              <span>Printer</span>
            </div>
            {monitor.history.length === 0 ? (
              <div className="empty-state">Nenhum arquivo recebido nesta sessão.</div>
            ) : (
              monitor.history.map((item) => (
                <div className="history-row" key={`${item.id}-${item.receivedAt}`}>
                  <span>{formatDate(item.receivedAt)}</span>
                  <span title={item.savedPath}>{item.fileName}</span>
                  <span>printer{item.printer}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <footer className="app-footer">
        Software exclusivo Gobi software. Uso autorizado somente mediante contratação paga.
      </footer>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(value));
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
