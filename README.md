# Roulette Dozen Tracker 🎯

Monitor de ausência de dúzias em roletas da Betano. Rastreia **todas as salas** em tempo real e alerta quando uma dúzia fica ausente por muitas rodadas consecutivas.

## Como Funciona

### Dúzias Monitoradas
- **D1** (1-12) — Primeira dúzia
- **D2** (13-24) — Segunda dúzia
- **D3** (25-36) — Terceira dúzia

A extensão verifica em cada sala: **quantas rodadas consecutivas cada dúzia NÃO apareceu**. Quando ultrapassa o threshold configurado, emite um **alerta na tela + notificação** para que você entre na sala e faça a aposta.

### Métricas
Após cada sinal, o sistema continua monitorando e registra **quantas rodadas extras** foram necessárias até a dúzia ausente retornar. Isso cria um histórico estatístico para você saber a melhor oportunidade.

---

## Tecnologias
- **Backend**: Python (FastAPI) + SQLite para persistência
- **Extensão**: Chrome Extension (Manifest V3) com scraping em tempo real
- **HUD Flutuante**: Overlay na página da Betano mostrando sinais ativos com link direto para a sala

## Como Usar

### 1. Iniciar o Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
O servidor inicia em `http://127.0.0.1:5000`

### 2. Instalar a Extensão no Chrome
1. Abra `chrome://extensions/`
2. Ative o **Modo do desenvolvedor**
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `/extension`

### 3. Abrir a Betano
1. Navegue até a página de **Roleta Brasileira** (ou qualquer lobby de roletas)
2. A extensão detecta automaticamente as salas e números
3. O **HUD flutuante** aparece no canto superior direito da tela
4. Abra o **popup** da extensão para configurar o threshold e ver métricas

### 4. Configurar Threshold
- No popup, defina "Alertar após: X ausências"
- Quando qualquer dúzia em qualquer sala ultrapassar esse valor → **ALERTA!**
