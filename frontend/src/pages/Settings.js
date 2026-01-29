import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, ArrowLeft, Bell, Wallet, Save, LogOut, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBetSettings, updateBetSettings } from '../api';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState({
        default_bet_amount: 10,
        max_bet_amount: 100,
        min_confidence: 75,
        max_games_combo: 5,
        min_odds: 1.1,
        max_odds: 5.0,
        min_minute: 65,
        max_minute: 88,
        enable_sound_alerts: true,
        enable_push_notifications: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getBetSettings();
                setSettings(data);
            } catch (err) {
                console.error("Failed to fetch settings", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateBetSettings(settings);
            setMessage({ type: 'success', text: 'CONFIGURAÇÕES SALVAS COM SUCESSO.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'ERRO AO SALVAR CONFIGURAÇÕES.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-[#030408] flex items-center justify-center font-black text-emerald-500 uppercase tracking-widest animate-pulse">Carregando Terminal...</div>;

    return (
        <div className="min-h-screen bg-[#030408] text-white p-6 lg:p-16 relative">
            <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:100%_40px]"></div>
            </div>

            <main className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                    {/* Header & Navigation */}
                    <div className="lg:w-1/3">
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] mb-12 hover:-translate-x-2 transition-transform group">
                            <ArrowLeft size={16} className="group-hover:scale-125 transition-transform" />
                            SAIR DO TERMINAL
                        </button>

                        <header className="mb-12">
                            <div className="flex items-center gap-2 text-emerald-500 mb-6 bg-emerald-500/5 px-4 py-1 border border-emerald-500/10 w-fit rounded-sm">
                                <Settings size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">SISTEMA DE OPERAÇÕES</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
                                Perfil <br />
                                <span className="text-emerald-500">Elite.</span>
                            </h1>
                            <p className="text-gray-500 text-sm mt-8 font-medium max-w-xs leading-relaxed">
                                Ajuste os parâmetros do seu algoritmo de análise e gerencie sua conexão com o servidor de apostas.
                            </p>
                        </header>

                        <div className="bg-[#0a0c12] border border-white/5 p-8 rounded-sm mb-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-16 w-16 bg-emerald-500 rounded-sm flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-emerald-500/20">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base truncate max-w-[150px] uppercase">{user?.email.split('@')[0]}</h3>
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">STATUS: OPERADOR PRO</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 py-4 hover:bg-red-500/5 transition-all rounded-sm"
                            >
                                <LogOut size={14} /> ENCERRAR SESSÃO
                            </button>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="lg:w-2/3 space-y-8">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-6 text-[10px] font-black uppercase tracking-[0.2em] border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}
                            >
                                {message.text}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Betting Parameters */}
                            <div className="brutalist-panel p-8">
                                <h3 className="flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-8 border-b border-white/5 pb-4">
                                    <Wallet size={14} className="text-emerald-500" /> Parâmetros de Banca
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Stake Padrão (R$)</label>
                                        <input
                                            type="number"
                                            className="brutalist-input py-3"
                                            value={settings.default_bet_amount}
                                            onChange={(e) => setSettings({ ...settings, default_bet_amount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Stake Máximo (R$)</label>
                                        <input
                                            type="number"
                                            className="brutalist-input py-3"
                                            value={settings.max_bet_amount}
                                            onChange={(e) => setSettings({ ...settings, max_bet_amount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Confiança Mínima IA (%)</label>
                                        <input
                                            type="number"
                                            className="brutalist-input py-3"
                                            value={settings.min_confidence}
                                            onChange={(e) => setSettings({ ...settings, min_confidence: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Game Filters */}
                            <div className="brutalist-panel p-8">
                                <h3 className="flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-8 border-b border-white/5 pb-4">
                                    <Activity size={14} className="text-emerald-500" /> Filtros de Jogo
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="space-y-2 flex-1">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Odd Min</label>
                                            <input
                                                type="number" step="0.1"
                                                className="brutalist-input py-3"
                                                value={settings.min_odds}
                                                onChange={(e) => setSettings({ ...settings, min_odds: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Odd Max</label>
                                            <input
                                                type="number" step="0.1"
                                                className="brutalist-input py-3"
                                                value={settings.max_odds}
                                                onChange={(e) => setSettings({ ...settings, max_odds: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="space-y-2 flex-1">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Tempo Inicial</label>
                                            <input
                                                type="number"
                                                className="brutalist-input py-3"
                                                value={settings.min_minute}
                                                onChange={(e) => setSettings({ ...settings, min_minute: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Tempo Final</label>
                                            <input
                                                type="number"
                                                className="brutalist-input py-3"
                                                value={settings.max_minute}
                                                onChange={(e) => setSettings({ ...settings, max_minute: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toggles & Actions */}
                        <div className="brutalist-panel p-8">
                            <h3 className="flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-8 border-b border-white/5 pb-4">
                                <Bell size={14} className="text-emerald-500" /> Preferências de Sistema
                            </h3>
                            <div className="flex flex-wrap gap-12 mb-10">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div onClick={() => setSettings({ ...settings, enable_sound_alerts: !settings.enable_sound_alerts })} className={`h-6 w-12 rounded-sm transition-all flex items-center px-1 ${settings.enable_sound_alerts ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                        <div className={`h-4 w-4 bg-black rounded-sm transition-all ${settings.enable_sound_alerts ? 'ml-auto' : ''}`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-emerald-500 transition-colors">Alertas Sonoros</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div onClick={() => setSettings({ ...settings, enable_push_notifications: !settings.enable_push_notifications })} className={`h-6 w-12 rounded-sm transition-all flex items-center px-1 ${settings.enable_push_notifications ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                        <div className={`h-4 w-4 bg-black rounded-sm transition-all ${settings.enable_push_notifications ? 'ml-auto' : ''}`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-emerald-500 transition-colors">Push Notificações</span>
                                </label>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="brutalist-button w-full flex items-center justify-center gap-3 active:scale-[0.99] transition-transform"
                            >
                                <Save size={18} />
                                {isSaving ? 'SALVANDO ALTERAÇÕES...' : 'SINCRONIZAR CONFIGURAÇÕES'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
