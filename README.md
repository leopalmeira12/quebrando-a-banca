# 🏦 InvestSport - Sniper de Apostas Esportivas (V10.0)

> **Inteligência Artificial aplicada ao Trading Esportivo em Tempo Real.**

O **InvestSport** é uma plataforma de elite para análise de dados e automação de apostas, focada na plataforma Betano. Utilizando algoritmos de visão computacional e estatística avançada, o sistema monitora jogos de futebol 24/7 para encontrar "bugs" de valor e oportunidades matemáticas de lucro.

---

## 🚀 Novas Funcionalidades (Sessão Atual)

### 1. 📡 Scanner Ao Vivo "Sniper"
O scanner foi completamente remodelado para oferecer precisão milimétrica:
*   **Oportunidades Explícitas (95%+):** Quando a IA detecta uma probabilidade superior a 95%, o card **pisca em verde esmeralda** e é fixado no topo automaticamente.
*   **Manual Pinning:** O usuário agora pode "fixar" qualquer jogo que deseja monitorar de perto, mantendo-o no topo independentemente da ordem de prioridade.
*   **Legenda Visual Dinâmica:**
    *   🔴 **Fundo Vermelho:** Indica jogo na **Reta Final (75-90')** ou com **Volume Crítico**.
    *   🟢 **Piscando Verde:** Oportunidade Explícita de alta confiabilidade.
    *   🔒 **Overlay de Bloqueio:** Proteção automática quando o mercado é suspenso na Betano.

### 2. ⚡ Lógica de Escanteios Avançada
Implementamos um algoritmo de "Sniper de Cantos" para o 1º tempo:
*   **Filtro de Tempo:** Sugestões de escanteios ocorrem apenas até os **45 minutos**.
*   **Linha de Segurança:** A IA sugere no máximo **+2 escanteios** sobre o total atual, focando no mercado de "Mais de X.5".
*   **Detector de Volume (🔥 CANTO VOL.):** Ativação de alerta vermelho quando o volume de ataques e cantos no primeiro tempo foge da curva estatística normal.

### 3. 🛡️ Sistema Anti-Frustração (Availability Check)
O bot agora é capaz de "enxergar" o status real da casa de apostas:
*   **Detecção de Suspensão:** Se a Betano suspender o mercado (VAR, gol, etc.), o sistema exibe `🚨 ENTRADA SUSPENSA` e bloqueia os botões, evitando que o usuário abra links de apostas indisponíveis.
*   **Lock Automático:** Após os 88 minutos, o sistema tranca as sugestões para evitar o risco de flutuações de odds segundos antes do apito final.

### 4. 🧠 Pre-Game Intelligence (Dashboard)
A seção de pré-jogo agora conta com análise tática automatizada:
*   **Expert Insights:** Textos gerados por IA explicando o contexto do time (ex: "Alta dominância", "Equilíbrio tático").
*   **Value Bet suggestion:** Indicação direta do mercado mais lucrativo (Vitória Seca, Ambas Marcam, Under, etc).
*   **Risco por Cores:** Badge de risco (BAIXO, MÉDIO, ALTO) baseado na probabilidade estatística real.

---

## 🛠️ Tecnologias e Arquitetura

*   **Backend:** FastAPI (Python) + Playwright (Web Scraping de alta fidelidade) + Re-analytics.
*   **Frontend:** React 18 + TailwindCSS (Aesthetics Premium) + Framer Motion (Animações).
*   **IA de Análise:** Heurísticas personalizadas e processamento de linguagem natural para geração de insights táticos.

---

## 📖 Instalação Rápida

### Backend
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## ⚠️ Disclaimer
Este software é uma ferramenta de auxílio à decisão baseada em dados estatísticos. O trading esportivo envolve riscos financeiros. O uso da automação deve ser monitorado pelo usuário.

---
*Escrito por: Google Deepmind Agentic Coding Team - Antigravity Agent v1.2*
