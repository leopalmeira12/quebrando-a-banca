import React, { useState, useEffect } from 'react';
import { Target, Zap, Activity, History } from 'lucide-react';

interface SignalData {
    game: string;
    prediction: string;
    confidence?: number;
    last_multipliers: number[];
    message: string;
}

const App: React.FC = () => {
    const [game, setGame] = useState<'aviator' | 'jetx'>('aviator');
    const [data, setData] = useState<SignalData | null>(null);

    const fetchSignal = async () => {
        try {
            const resp = await fetch(`http://localhost:5000/get_signal/${game}`);
            const json = await resp.json();
            setData(json);
        } catch (e) {
            console.error("Error fetching signal:", e);
        }
    };

    useEffect(() => {
        fetchSignal();
        const interval = setInterval(fetchSignal, 3000);
        return () => clearInterval(interval);
    }, [game]);

    return (
        <div className="app-container">
            <div className="header">
                <h1 className="gradient-text">SINAIS PRO</h1>
                <div className="status-badge">
                    <Activity size={12} className="animate-pulse" />
                    ML ACTIVE
                </div>
            </div>

            <div className="game-tabs">
                {(['aviator', 'jetx'] as const).map((g) => (
                    <button
                        key={g}
                        onClick={() => setGame(g)}
                        className={`tab-btn ${game === g ? 'active' : ''}`}
                    >
                        {g.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="prediction-card">
                <div className="card-label">Probabilidade de 2.0x+</div>

                <div className={`prediction-value ${data?.prediction === 'ENTRADA CONFIRMADA' ? 'confirmed' : ''
                    }`}>
                    {data?.confidence !== undefined ? `${data.confidence}%` : '--%'}
                </div>

                <div className="confidence-pct">
                    Recomendação: {data?.prediction || 'ANALISANDO...'}
                </div>

                <div className="status-msg">
                    {data?.message || 'Coletando dados do servidor...'}
                </div>
            </div>

            <div className="history-section">
                <div className="section-title">
                    <Zap size={14} className="text-yellow-400" />
                    ANÁLISE DE ENTRADAS
                </div>
                <div className="space-y-2 mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    <div className="prediction-card" style={{ padding: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #4ade80', marginBottom: '0' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Estratégia 2.0x (Conservadora)</span>
                        <span style={{ color: '#4ade80', fontWeight: '900', fontSize: '12px' }}>{data?.confidence}%</span>
                    </div>
                </div>

                <div className="section-title">
                    <History size={14} />
                    ÚLTIMOS RESULTADOS
                </div>
                <div className="history-grid">
                    {data?.last_multipliers.slice(0, 5).map((m, i) => (
                        <div
                            key={i}
                            className={`hist-item ${m < 2 ? 'mult-low' :
                                m < 5 ? 'mult-mid' :
                                    'mult-high'
                                }`}
                        >
                            {m.toFixed(2)}x
                        </div>
                    ))}
                </div>
            </div>

            <div className="footer-tag">
                SISTEMA FLUTUANTE ATIVADO NO CHROME
            </div>
        </div>
    );
};

export default App;
