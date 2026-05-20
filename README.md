# Sincronizador de arquivos

Aplicativo desktop para consultar um endpoint REST, baixar arquivos retornados pela API e salvar em uma pasta local por impressora.

## Funcionalidades

- Interface para configurar URL do servidor, usuário, senha, intervalo e pasta de destino.
- Basic Auth no endpoint de consulta.
- Download pela URL retornada pela API, sem reenviar Basic Auth.
- Polling automático ao abrir o app quando a configuração salva estiver válida.
- Botão para iniciar/parar o monitoramento.
- Histórico dos últimos 10 arquivos recebidos na sessão atual.
- Build para macOS arm64 e Windows x64.

## Retorno esperado da API

O endpoint deve retornar HTTP `200` com o JSON abaixo quando houver arquivo:

```json
{
  "id": 123,
  "nome": "arquivo.pdf",
  "url": "https://servidor/arquivo-assinado.pdf",
  "printer": "1"
}
```

Qualquer status diferente de `200` e tratado como ausencia de arquivo pendente.

## Destino dos arquivos

Os arquivos são salvos em:

```text
{pasta_base}/printer{printer}/{nome}
```

Exemplo:

```text
/Users/usuário/Downloads/printer1/arquivo.pdf
```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação

```bash
npm run typecheck
npm run build
```

## Builds

macOS arm64:

```bash
npm run dist:mac
```

Windows x64:

```bash
npm run dist:win
```

Os artefatos são gerados na pasta `release/`.
