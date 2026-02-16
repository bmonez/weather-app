# weather-app

Aplicativo web estático de previsão do tempo com HTML, CSS e JavaScript puro, consumindo APIs públicas da Open-Meteo.

## Arquivos

- `index.html`
- `styles.css`
- `app.js`

## Funcionalidades

- Busca por cidade (sem geolocalização)
- Persistência da última cidade no `localStorage`
- Carregamento automático ao abrir a página
- Estado de loading durante requisições
- Mensagem de erro amigável para cidade não encontrada
- Clima atual + previsão horária + previsão diária de 7 dias

## APIs utilizadas

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

## Como rodar localmente (Live Server)

1. Abra a pasta `weather-app` no VS Code.
2. Instale a extensão **Live Server** (se ainda não tiver).
3. Clique com o botão direito em `index.html`.
4. Selecione **Open with Live Server**.
5. O app será aberto no navegador.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos da pasta `weather-app`.
2. No GitHub, abra **Settings** do repositório.
3. Vá em **Pages**.
4. Em **Build and deployment**, escolha:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (ou `master`) e pasta `/root`
5. Salve e aguarde alguns segundos.
6. A URL pública aparecerá na seção de Pages.
