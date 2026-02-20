console.log("Sinais Betano Vite: Content Script Ativado");

let lastDetectedMultiplier: number | null = null;
let floatingPanel: HTMLDivElement | null = null;

function createFloatingPanel() {
    if (floatingPanel) return;

    floatingPanel = document.createElement('div');
    floatingPanel.id = 'sinais-pro-floating';
    floatingPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 180px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border: 2px solid #0ea5e9;
        border-radius: 16px;
        padding: 12px;
        color: white;
        z-index: 99999;
        font-family: 'Outfit', sans-serif, system-ui;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        cursor: move;
        user-select: none;
    `;

    floatingPanel.innerHTML = `
        <div style="font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Probabilidade 2.0x</div>
        <div id="prob-value" style="font-size: 28px; font-weight: 900; color: #0ea5e9; margin: 5px 0;">--%</div>
        <div id="prob-status" style="font-size: 10px; font-weight: 600; color: #4ade80;">IA Analisando...</div>
        <div style="font-size: 8px; color: #64748b; margin-top: 8px; text-align: right;">SINAIS PRO VITE</div>
    `;

    document.body.appendChild(floatingPanel);

    // Basic drag logic
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    floatingPanel.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = floatingPanel!.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !floatingPanel) return;
        floatingPanel.style.left = (e.clientX - offsetX) + 'px';
        floatingPanel.style.top = (e.clientY - offsetY) + 'px';
        floatingPanel.style.right = 'auto';
        floatingPanel.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

async function updateFloatingProb(game: string) {
    try {
        const resp = await fetch(`http://localhost:8000/get_signal/${game}`);
        const data = await resp.json();

        const probEl = document.getElementById('prob-value');
        const statusEl = document.getElementById('prob-status');

        if (probEl && data.confidence !== undefined) {
            probEl.innerText = `${data.confidence}%`;

            if (data.confidence > 70) probEl.style.color = '#4ade80';
            else if (data.confidence > 50) probEl.style.color = '#fbbf24';
            else probEl.style.color = '#0ea5e9';
        }

        if (statusEl) statusEl.innerText = data.prediction;
    } catch (e) {
        console.error("Error updating floating prob:", e);
    }
}

function scrapeAviator() {
    createFloatingPanel();
    const items = document.querySelectorAll('.result-item, .multiplier, .bubble');
    if (items.length > 0) {
        const newestText = (items[0] as HTMLElement).innerText.replace('x', '').trim();
        const value = parseFloat(newestText);

        if (!isNaN(value) && value !== lastDetectedMultiplier) {
            lastDetectedMultiplier = value;
            sendToBackend('aviator', value);
        }
    }
    updateFloatingProb('aviator');
}

function scrapeJetX() {
    createFloatingPanel();
    const items = document.querySelectorAll('.history-item, .last-results');
    if (items.length > 0) {
        const newestText = (items[0] as HTMLElement).innerText.replace('x', '').trim();
        const value = parseFloat(newestText);

        if (!isNaN(value) && value !== lastDetectedMultiplier) {
            lastDetectedMultiplier = value;
            sendToBackend('jetx', value);
        }
    }
    updateFloatingProb('jetx');
}

function sendToBackend(game: string, multiplier: number) {
    fetch('http://localhost:8000/add_result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game, multiplier })
    }).catch(err => console.error("Erro ao enviar para o backend:", err));
}

const url = window.location.href;
if (url.includes('aviator')) {
    setInterval(scrapeAviator, 2500);
} else if (url.includes('jetx')) {
    setInterval(scrapeJetX, 2500);
}

export { }
