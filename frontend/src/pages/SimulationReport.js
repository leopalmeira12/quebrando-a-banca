
import React, { useState, useEffect } from 'react';
import { getBetHistory, updateBetStatus } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, TrendingUp, AlertTriangle, Trash2, Eye } from 'lucide-react';

const SimulationReport = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, profit: 0, roi: 0 });
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        setLoading(true);
        try {
            // Fetch ALL history, then filter for simulated in frontend or use endpoint filter if added
            // Assuming endpoint handles is_simulated=true filtering
            // For now, let's assume we fetch all and filter client side if the API update didn't include a filter param
            // But we DID update the API to accept is_simulated, so let's pass it!
            // Wait, we updated backend to ACCEPT it, but we need to check how to pass query params in axios.
            // frontend/src/api.js `getBetHistory` takes `limit`. We might need to update that too or just fetch all.
            // Current `getBetHistory` implementation: `api.get(\`/bet-history?limit=${limit}\`)`
            // We should update api.js to accept params properly, but for now I can patch it here or assume mixed content.

            // Let's rely on fetching mixed content and filtering
            const response = await getBetHistory(100);
            // Filter only simulated bets
            const simulated = response.bets.filter(b => b.is_simulated);
            setHistory(simulated);
            calculateStats(simulated);
        } catch (error) {
            console.error("Erro ao carregar histórico simulado", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (bets) => {
        let total = bets.length;
        let won = 0;
        let lost = 0;
        let pending = 0;
        let profit = 0;

        bets.forEach(bet => {
            if (bet.status === 'won') {
                won++;
                // Simulated profit (assuming flat stake of 10 for calculation or stored bet_amount)
                profit += (bet.potential_return - bet.bet_amount);
            } else if (bet.status === 'lost') {
                lost++;
                profit -= bet.bet_amount;
            } else if (bet.status === 'pending') {
                pending++;
            }
        });

        const roi = total > 0 ? ((profit / (total * 10)) * 100).toFixed(1) : 0; // Approx

        setStats({ total, won, lost, pending, profit: profit.toFixed(2), roi });
    };

    const handleUpdateStatus = async (betId, status) => {
        try {
            // For simulation, we allow manual check
            // In a real app, this would be auto-checked by backend
            const amount = status === 'won' ? 0 : 0; // Amount doesn't technically matter for internal calc here unless we parse it
            await updateBetStatus(betId, status, 0);
            loadHistory();
        } catch (e) {
            console.error("Erro ao atualizar status", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm"
            >
                <div className="bg-zinc-950 border border-zinc-900 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                    {/* HEADER */}
                    <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                                <Eye className="text-emerald-500" />
                                Relatório de Simulação
                            </h2>
                            <p className="text-xs text-zinc-500">Acompanhe o desempenho das entradas monitoradas sem risco</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* STATS BAR */}
                    <div className="grid grid-cols-4 gap-4 p-6 bg-zinc-900/30 border-b border-zinc-900">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                            <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Entradas Monitoradas</p>
                            <span className="text-2xl font-black text-white">{stats.total}</span>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                            <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Taxa de Acerto</p>
                            <span className={`text-2xl font-black ${stats.won > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                {stats.total > 0 ? Math.round((stats.won / (stats.won + stats.lost || 1)) * 100) : 0}%
                            </span>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                            <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Lucro Virtual</p>
                            <span className={`text-2xl font-black ${parseFloat(stats.profit) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                R$ {stats.profit}
                            </span>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center">
                            <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">ROI Projetado</p>
                            <span className="text-2xl font-black text-blue-500">{stats.roi}%</span>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {loading ? (
                            <div className="text-center py-10 text-zinc-600 animate-pulse">Carregando histórico...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-10 text-zinc-600">
                                Nenhum jogo monitorado ainda. Use o botão <Eye size={14} className="inline mx-1" /> nos cards para começar.
                            </div>
                        ) : (
                            history.map(bet => (
                                <motion.div
                                    key={bet.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 ${bet.status === 'won' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        bet.status === 'lost' ? 'bg-red-500/5 border-red-500/20' :
                                            'bg-zinc-900/50 border-zinc-800'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${bet.status === 'won' ? 'bg-emerald-500 text-black' :
                                                bet.status === 'lost' ? 'bg-red-500 text-white' :
                                                    'bg-yellow-500 text-black'
                                                }`}>
                                                {bet.status === 'won' ? 'LUCRO' : bet.status === 'lost' ? 'LOSS' : 'PENDENTE'}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">{new Date(bet.created_at).toLocaleString()}</span>
                                        </div>

                                        {/* Games List in Bet */}
                                        <div className="space-y-1">
                                            {(bet.games_data || bet.games || []).map((g, gi) => (
                                                <div key={gi}>
                                                    <div className="text-[12px] font-bold text-white">
                                                        {g.home} vs {g.away} <span className="text-zinc-500 font-normal">• {g.recommendation || g.bet_type} (@{g.odds})</span>
                                                    </div>
                                                    {bet.status === 'pending' && (
                                                        <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono mt-0.5 animate-pulse">
                                                            <span>🔴 {g.current_minute || g.minute}'</span>
                                                            <span>{g.current_score?.home || 0} - {g.current_score?.away || 0}</span>
                                                            {g.current_corners > 0 && <span>(Cantos: {g.current_corners})</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Retorno Potencial</p>
                                        <p className="text-lg font-black text-white">R$ {bet.potential_return.toFixed(2)}</p>
                                    </div>

                                    {/* ACTIONS (Manual Check for Simulation) */}
                                    {bet.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(bet.id, 'won')}
                                                className="p-2 bg-zinc-900 hover:bg-emerald-500 text-zinc-500 hover:text-black rounded-full transition-all"
                                                title="Marcar como GREEN"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(bet.id, 'lost')}
                                                className="p-2 bg-zinc-900 hover:bg-red-500 text-zinc-500 hover:text-white rounded-full transition-all"
                                                title="Marcar como RED"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SimulationReport;
// force update report
