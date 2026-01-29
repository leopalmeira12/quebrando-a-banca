import React, { useEffect, useState, useCallback } from 'react';
import { getDashboardData, createComboBet, getBetSettings, updateBetSettings, openBetanoBrowser, placeComboBetOnBetano, getBetanoStatus } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, RefreshCcw, LogOut,
    Calculator, Activity, UserCheck, LayoutDashboard,
    Settings, PieChart, ShieldCheck, Menu, X,
    Globe, Search, ArrowLeft, ExternalLink,
    Zap, Layers, Flame, Target, Link2, Radio,
    Clock, DollarSign, AlertTriangle, CheckCircle2, Ticket,
    Check, Plus, Minus, Trash2, Save, Volume2, Bell, Book, Key, Play, Shield, ShieldAlert, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import SimulationReport from './SimulationReport';

const Dashboard = () => {
    const [teamsData, setTeamsData] = useState([]);
    const [globalStats, setGlobalStats] = useState(null);
    const [liveOpportunities, setLiveOpportunities] = useState(null);
    const [loading, setLoading] = useState(true);
    const [focusedTeam, setFocusedTeam] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLivePanel, setShowLivePanel] = useState(false);
    const [pinnedGames, setPinnedGames] = useState([]);
    const [showSimulationReport, setShowSimulationReport] = useState(false);

    // ===== COMBO BUILDER STATE =====
    const [selectedGames, setSelectedGames] = useState([]);
    const [showComboBuilder, setShowComboBuilder] = useState(false);
    const [betAmount, setBetAmount] = useState(10);
    const [isCreatingBet, setIsCreatingBet] = useState(false);

    // ... (rest of the state) ...
    const [betSettings, setBetSettings] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);

    // ===== TUTORIAL & GUIDED TOUR =====
    const [showTutorial, setShowTutorial] = useState(false);
    const [tourStep, setTourStep] = useState(0);
    const [isTourActive, setIsTourActive] = useState(false);

    const startTour = () => {
        setTourStep(1);
        setIsTourActive(true);
        setShowLivePanel(true);
        setIsSidebarOpen(false);
        setShowTutorial(false);
    };

    const strategies = {
        conservative: {
            label: "🛡️ Conservador",
            desc: "Segurança máxima. Odds baixas (1.05-1.50), fim de jogo.",
            settings: { min_odds: 1.05, max_odds: 1.50, min_minute: 75, max_minute: 90, min_confidence: 85 }
        },
        balanced: {
            label: "⚖️ Moderado",
            desc: "Equilíbrio padrão. Odds (1.10-3.00), a partir dos 60min.",
            settings: { min_odds: 1.10, max_odds: 3.00, min_minute: 60, max_minute: 88, min_confidence: 75 }
        },
        aggressive: {
            label: "🚀 Agressivo",
            desc: "Alto retorno. Odds (1.50+), busca zebras e viradas.",
            settings: { min_odds: 1.50, max_odds: 10.00, min_minute: 45, max_minute: 90, min_confidence: 60 }
        }
    };

    const handleApplyStrategy = (key) => {
        const strat = strategies[key];
        setBetSettings({ ...betSettings, ...strat.settings });
    };

    const { logout } = useAuth();
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            const response = await getDashboardData();
            if (response && response.data) {
                setTeamsData(response.data);
                setGlobalStats(response.stats);
                setLiveOpportunities(response.live_opportunities);
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); loadSettings(); }, []);

    // Auto-refresh para jogos ao vivo (30 segundos)
    useEffect(() => {
        const interval = setInterval(() => {
            if (showLivePanel) {
                loadData();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [showLivePanel]);

    // ===== LOAD BET SETTINGS =====
    const loadSettings = async () => {
        try {
            const settings = await getBetSettings();
            setBetSettings(settings);
            setBetAmount(settings.default_bet_amount || 10);
        } catch (error) {
            console.log("Settings not loaded, using defaults");
        }
    };

    // ... (rest of the functions) ...

    const handleMonitorBet = async (game, e) => {
        e.stopPropagation();
        const confirmMonitor = window.confirm(`Deseja simular/monitorar essa entrada para ${game.team || game.home}?`);
        if (!confirmMonitor) return;

        try {
            // Build a safe object to avoid circular references or huge payloads
            const gameData = {
                game_id: game.id || `${game.home}_${game.away}`,
                home: game.home || game.team,
                away: game.away || (game.next_games && game.next_games[0] ? game.next_games[0].opponent : "Oponente"),
                bet_type: game.opportunity_type || game.best_opportunity?.type || "WINNER",
                recommendation: game.recommendation || (game.value_bet || `Vitória ${game.team || game.home}`),
                odds: game.odds?.home_win || 1.80,
                confidence: game.confidence || 0,
                minute: game.minute || 0,
                score: game.score || { home: 0, away: 0 },
                direct_link: game.direct_link || game.url
            };

            await createComboBet([gameData], 10, true);
            alert("✅ Jogo adicionado ao relatório de simulação!");
        } catch (error) {
            console.error(error);
            alert("Erro ao monitorar: " + (error.response?.data?.detail || error.message));
        }
    };

    // ===== COMBO BUILDER FUNCTIONS =====
    const toggleGameSelection = (game) => {
        const gameId = game.id || `${game.home}_${game.away}`;
        const isSelected = selectedGames.find(g => g.game_id === gameId);

        if (isSelected) {
            setSelectedGames(selectedGames.filter(g => g.game_id !== gameId));
        } else {
            // Check max games limit
            const maxGames = betSettings?.max_games_combo || 5;
            if (selectedGames.length >= maxGames) {
                alert(`Máximo de ${maxGames} jogos por combinada!`);
                return;
            }

            // Add game to selection
            setSelectedGames([...selectedGames, {
                game_id: gameId,
                home: game.home,
                away: game.away,
                bet_type: game.bet_type || game.type || "1X2",
                recommendation: game.recommendation || `${game.home} vence`,
                odds: game.odds?.home_win || 1.50,
                confidence: game.confidence || 75,
                minute: game.minute,
                score: game.score,
                direct_link: game.direct_link || game.url
            }]);
        }
    };

    const isGameSelected = (game) => {
        const gameId = game.id || `${game.home}_${game.away}`;
        return selectedGames.some(g => g.game_id === gameId);
    };

    const totalOdds = selectedGames.reduce((acc, g) => acc * g.odds, 1).toFixed(2);
    const potentialReturn = (betAmount * parseFloat(totalOdds)).toFixed(2);
    const profitPercent = ((parseFloat(totalOdds) - 1) * 100).toFixed(1);

    const togglePinGame = (gameId) => {
        setPinnedGames(prev =>
            prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
        );
    };

    // ===== BETANO BOT FUNCTIONS =====
    const [betanoStatus, setBetanoStatus] = useState(null);

    const handleOpenBetano = async () => {
        setIsCreatingBet(true);
        try {
            const result = await openBetanoBrowser();
            setBetanoStatus(result);
            if (result.is_logged_in) {
                alert("✅ Login automático na Betano! Cookies salvos detectados.");
            } else {
                alert("📌 Navegador aberto. Faça login manualmente - os cookies serão salvos para próximas sessões.");
            }
        } catch (error) {
            alert("Erro ao abrir Betano: " + error.message);
        } finally {
            setIsCreatingBet(false);
        }
    };

    const handleCreateComboBet = async () => {
        if (selectedGames.length === 0) {
            alert("Selecione pelo menos 1 jogo!");
            return;
        }

        setIsCreatingBet(true);
        try {
            // Primeiro, tenta usar o bot para montar a aposta automaticamente
            const botResult = await placeComboBetOnBetano(selectedGames, betAmount);

            if (botResult.status === "NOT_LOGGED_IN") {
                // Se não está logado, abre o navegador para login
                alert("⚠️ Você precisa fazer login na Betano primeiro. Abrindo navegador...");
                await handleOpenBetano();
                return;
            }

            if (botResult.status === "ready") {
                alert(`✅ ${botResult.games_added} jogos adicionados ao bilhete!\nValor: R$ ${betAmount}\nConfirme a aposta no navegador.`);
                setSelectedGames([]);
                setShowComboBuilder(false);
            } else if (botResult.status === "error") {
                // Fallback: apenas abrir Betano
                alert("Bot indisponível. Abrindo Betano manualmente...");
                window.open("https://www.betano.bet.br/live/", '_blank');
            } else {
                alert(botResult.message || "Aposta pronta para confirmação");
            }

            // Salvar no histórico também
            await createComboBet(selectedGames, betAmount);

        } catch (error) {
            console.error("Erro:", error);
            // Fallback: abrir Betano manualmente
            window.open("https://www.betano.bet.br/live/", '_blank');
            alert("Erro na automação. Betano aberta manualmente.");
        } finally {
            setIsCreatingBet(false);
        }
    };

    const clearSelection = () => {
        setSelectedGames([]);
    };

    const handleSaveSettings = async () => {
        if (!betSettings) return;
        setSettingsLoading(true);
        try {
            await updateBetSettings(betSettings);
            alert("✅ Configurações salvas com sucesso!");
            setShowSettings(false);
        } catch (error) {
            alert("Erro ao salvar configurações: " + error.message);
        } finally {
            setSettingsLoading(false);
        }
    };

    const filteredTeams = teamsData.filter(t =>
        t.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const menuItems = [
        { icon: LayoutDashboard, label: 'Painel', path: '/dashboard', active: true },
        { icon: Globe, label: 'Ligas', path: '/leagues' },
        { icon: PieChart, label: 'Estatísticas', path: '/stats' },
        { icon: ShieldCheck, label: 'Auditoria', path: '/audit' },
        { icon: Settings, label: 'Configurações', path: '/settings', onClick: () => setShowSettings(true) },
        { icon: Book, label: 'Tutorial', path: '#tutorial', onClick: () => setShowTutorial(true) },
    ];

    const bookmakers = ['Betano', 'Sportingbet', 'KTO', 'Superbet'];

    const generateCombos = (team) => {
        if (!team.markets || team.markets.length < 2) return [];
        const combos = [];

        if (team.markets.find(m => m.name === '+0.5 Gols')) {
            combos.push({ name: `${team.team} Vencer + Over 0.5`, odds: 1.15, confidence: 85, markets: ['+0.5 Gols', 'Resultado'] });
        }

        const over15 = team.markets.find(m => m.name === '+1.5 Gols');
        const btts = team.markets.find(m => m.name === 'Ambas Marcam');
        if (over15 && btts) {
            combos.push({ name: 'Over 1.5 + Ambas Marcam', odds: 2.35, confidence: Math.min(over15.confidence, btts.confidence), markets: ['+1.5 Gols', 'Ambas Marcam'] });
        }

        if (team.markets.find(m => m.name === '+0.5 Gols')) {
            combos.push({ name: 'Over 0.5 + Under 4.5 Gols', odds: 1.25, confidence: 92, markets: ['+0.5 Gols', 'Under 4.5'] });
        }

        return combos;
    };

    if (loading && !teamsData.length) return (
        <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
            <div className="h-6 w-6 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-600 text-[11px] font-medium tracking-wide">Carregando dados...</p>
        </div>
    );

    const liveCount = liveOpportunities?.total_opportunities || 0;

    return (
        <div className="min-h-screen bg-black text-white font-sans antialiased">

            {/* NAVBAR */}
            <nav className="h-12 border-b border-zinc-900 bg-black sticky top-0 z-[100] px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 hover:bg-zinc-900 rounded-md text-zinc-500 transition-colors">
                        <Menu size={16} />
                    </button>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setFocusedTeam(null); setShowLivePanel(false); navigate('/dashboard'); }}>
                        <TrendingUp size={16} className="text-emerald-500" />
                        <span className="font-semibold text-[13px] text-white uppercase tracking-tighter">Invest<span className="text-emerald-500">Sport</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* COMBO BUILDER BUTTON */}
                    {selectedGames.length > 0 && (
                        <button
                            onClick={() => setShowComboBuilder(!showComboBuilder)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-500 text-black animate-pulse"
                        >
                            <Ticket size={12} />
                            COMBO ({selectedGames.length})
                            <span className="bg-black/20 px-1.5 py-0.5 rounded text-[9px]">{totalOdds}x</span>
                        </button>
                    )}

                    {/* BOTÃO DE OPORTUNIDADES AO VIVO */}
                    <button
                        onClick={() => setShowLivePanel(!showLivePanel)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${showLivePanel ? 'bg-red-500 text-white' : liveCount > 0 ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' : 'bg-zinc-900 text-zinc-500'}`}
                    >
                        <Radio size={12} className={liveCount > 0 ? 'animate-ping' : ''} />
                        AO VIVO
                        {liveCount > 0 && (
                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">{liveCount}</span>
                        )}
                    </button>

                    <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-500">
                        <span>Precisão: <span className="text-emerald-500 font-medium">{globalStats?.accuracy || '93%'}</span></span>
                        <span className="text-zinc-800">|</span>
                        <span>ROI: <span className="text-white font-medium">+{globalStats?.roi || '28.5'}%</span></span>
                    </div>
                    <button onClick={logout} className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-zinc-900 rounded-md transition-colors">
                        <LogOut size={14} />
                    </button>
                </div>
            </nav>

            {/* SIDEBAR */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 z-[110]" />
                        <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed inset-y-0 left-0 w-52 bg-zinc-950 z-[120] border-r border-zinc-900 p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[13px] font-semibold text-white">Menu</span>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-zinc-600 hover:text-white rounded-md hover:bg-zinc-900"><X size={14} /></button>
                            </div>
                            <div className="space-y-0.5 flex-1">
                                {menuItems.map((item, i) => (
                                    <button key={i} onClick={() => { navigate(item.path); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] font-medium transition-colors ${item.active ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
                                        <item.icon size={14} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-zinc-900">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-700">
                                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span>Monitorando Betano Live</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <main className="max-w-6xl mx-auto px-4 py-5">

                <AnimatePresence mode='wait'>
                    {/* PAINEL DE OPORTUNIDADES AO VIVO */}
                    {showLivePanel && (
                        <motion.div key="live" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
                            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Radio size={16} className="text-red-500 animate-pulse" />
                                            <h2 className="text-[14px] font-bold text-white">Oportunidades AO VIVO - Betano</h2>
                                        </div>
                                        <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">MONITORANDO</span>
                                        <div className="hidden md:flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
                                            <div className="w-2 h-2 rounded bg-red-500/40 border border-red-500" />
                                            <span className="text-[8px] text-zinc-500 font-medium uppercase tracking-wider">
                                                Fundo Vermelho: Reta Final (75-90') ou Volume Crítico
                                            </span>
                                        </div>
                                        <div className="hidden lg:flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
                                            <div className="w-2 h-2 rounded bg-emerald-500 border border-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[8px] text-zinc-500 font-medium uppercase tracking-wider">
                                                Piscando Verde: Oportunidade Explícita (95%+)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                        <span>Meta diária: <span className="text-emerald-500 font-bold">3-5%</span></span>
                                        <span>Atualiza: 30s</span>
                                        <button onClick={loadData} className="p-1 bg-zinc-900 rounded hover:bg-zinc-800">
                                            <RefreshCcw size={10} className={loading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>

                                {liveOpportunities?.opportunities?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {[...liveOpportunities.opportunities]
                                            .sort((a, b) => {
                                                const idA = a.id || `${a.home}_${a.away}`;
                                                const idB = b.id || `${b.home}_${b.away}`;

                                                const weightA = (pinnedGames.includes(idA) ? 100 : 0) + (a.is_explicit ? 50 : 0) + (a.is_priority ? 10 : 0);
                                                const weightB = (pinnedGames.includes(idB) ? 100 : 0) + (b.is_explicit ? 50 : 0) + (b.is_priority ? 10 : 0);

                                                return weightB - weightA;
                                            })
                                            .map((game, idx) => {
                                                const gameId = game.id || `${game.home}_${game.away}`;
                                                const isPinned = pinnedGames.includes(gameId);

                                                return (
                                                    <motion.div
                                                        key={gameId}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className={`group relative p-3 rounded-lg border shadow-lg transition-all duration-[500ms] ${game.is_explicit
                                                            ? 'bg-emerald-500/10 border-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                            : isPinned
                                                                ? 'bg-emerald-500/5 border-emerald-500/50 shadow-emerald-500/10'
                                                                : game.is_priority
                                                                    ? 'bg-red-500/5 border-red-500/20 shadow-red-500/5'
                                                                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                                            }`}
                                                    >
                                                        {/* MONITOR BUTTON (Live Card) */}
                                                        <button
                                                            onClick={(e) => handleMonitorBet(game, e)}
                                                            className="absolute top-2 right-2 p-1.5 bg-zinc-900/90 hover:bg-emerald-500 border border-zinc-700 hover:border-emerald-500 rounded text-zinc-400 hover:text-black z-50 transition-all shadow-lg"
                                                            title="Monitorar Resultado (Simulação)"
                                                        >
                                                            <Eye size={12} />
                                                        </button>
                                                        {/* Header com Sinais Dinâmicos */}
                                                        <div className="flex items-center justify-between mb-3 pr-8">
                                                            <div className="flex flex-wrap gap-1 items-center">
                                                                {/* Pin Toggle */}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); togglePinGame(gameId); }}
                                                                    className={`p-1 rounded mr-1 transition-all ${isPinned ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-zinc-700 hover:text-zinc-500 hover:bg-white/5'}`}
                                                                    title={isPinned ? "Desafixar jogo" : "Fixar jogo no topo"}
                                                                >
                                                                    <Target size={12} className={isPinned ? 'animate-pulse' : ''} />
                                                                </button>

                                                                {game.all_opportunities && game.all_opportunities.length > 0 ? (
                                                                    game.all_opportunities.map((opp, oi) => (
                                                                        <div key={oi} className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${opp.label === '🔥 CANTO VOL.' ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                                                            opp.type === 'UNDER' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                                                opp.type === 'CORNERS' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                            }`}>
                                                                            {opp.label}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-2 py-0.5 rounded text-[8px] font-black bg-zinc-800 text-zinc-500 border border-zinc-700/50 uppercase">
                                                                        MONITORANDO
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Badge de 'Tempo Faltante' ou 'IA Online' */}
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/50 rounded-full border border-white/5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-[8px] font-bold text-zinc-400">{game.minute}'</span>
                                                            </div>
                                                        </div>

                                                        {/* Placar compacto */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold text-white truncate uppercase tracking-tighter">{game.home}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md mx-2 shadow-inner">
                                                                <span className="text-xl font-black text-white">{game.score.home}</span>
                                                                <span className="text-zinc-600 text-sm font-bold">:</span>
                                                                <span className="text-xl font-black text-white">{game.score.away}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-right">
                                                                <p className="text-[10px] font-bold text-white truncate uppercase tracking-tighter">{game.away}</p>
                                                            </div>
                                                        </div>

                                                        {/* Estatísticas Detalhadas */}
                                                        {game.stats && (
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 bg-black/40 p-2 rounded-lg border border-white/5">
                                                                {/* Corners */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase">
                                                                        <Layers size={9} className="text-emerald-500" />
                                                                        Escanteios
                                                                        {game.all_opportunities?.some(o => o.label === '🔥 CANTO VOL.') && (
                                                                            <span className="ml-1 text-[6px] bg-red-500 text-white px-1 rounded animate-pulse leading-tight">VOL 🔥</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-white">{game.stats.corners?.home || 0} - {game.stats.corners?.away || 0}</span>
                                                                </div>
                                                                {/* Possession */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase">
                                                                        <Activity size={9} className="text-emerald-500" />
                                                                        Posse
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-white">{game.stats.possession?.home}%</span>
                                                                </div>
                                                                {/* Dangerous Attacks */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase">
                                                                        <Flame size={9} className="text-orange-500" />
                                                                        Atq. Perigosos
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-white">{game.stats.dangerous_attacks?.home || 0} / {game.stats.dangerous_attacks?.away || 0}</span>
                                                                </div>
                                                                {/* Shots on Target */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase">
                                                                        <Target size={9} className="text-blue-500" />
                                                                        Chutes Gol
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-white">{game.stats.shots_on_target?.home || 0} / {game.stats.shots_on_target?.away || 0}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Info + Ação (Principais Sugestões) */}
                                                        <div className="relative">
                                                            {game.is_locked && (
                                                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded-lg border border-red-500/20">
                                                                    <div className="flex flex-col items-center animate-pulse">
                                                                        <ShieldCheck size={20} className="text-red-500 mb-1" />
                                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Entradas Fechadas</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className={`flex items-center justify-between mb-2 transition-all ${game.is_locked ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] text-zinc-500 uppercase font-black tracking-tighter">
                                                                        Sugestão Principal
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`text-[13px] font-black uppercase italic ${game.confidence >= 90 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                                            {game.recommendation}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {/* CHECKBOX PARA COMBO */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); toggleGameSelection(game); }}
                                                                        disabled={game.is_locked}
                                                                        className={`flex items-center justify-center w-7 h-7 rounded border transition-all ${isGameSelected(game)
                                                                            ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                                            : 'bg-black border-zinc-700 hover:border-emerald-500 text-zinc-600 hover:text-emerald-500'
                                                                            }`}
                                                                    >
                                                                        {isGameSelected(game) ? <Check size={16} /> : <Plus size={16} />}
                                                                    </button>

                                                                    <a
                                                                        href={game.is_locked ? "#" : (game.direct_link || "https://www.betano.bet.br/live/")}
                                                                        target={game.is_locked ? "_self" : "_blank"}
                                                                        rel="noopener noreferrer"
                                                                        className={`flex items-center gap-1 bg-white text-black px-4 py-1.5 rounded text-[10px] font-black hover:bg-emerald-400 transition-colors uppercase tracking-widest shadow-xl ${game.is_locked ? 'cursor-not-allowed opacity-50' : ''}`}
                                                                    >
                                                                        ABRIR <ExternalLink size={10} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Análise e Contexto da IA */}
                                                        <div className="mt-2 pt-2 border-t border-zinc-900 space-y-1.5">
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] text-white font-bold tracking-tight">
                                                                        {game.description}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                                        <span className="text-[9px] font-black text-emerald-500">{game.confidence}%</span>
                                                                    </div>
                                                                </div>
                                                                {game.detailed_stats && (
                                                                    <p className="text-[8px] text-zinc-500 font-medium uppercase tracking-widest italic">
                                                                        {game.detailed_stats}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {game.warning && (
                                                                <div className={`flex items-center gap-1.5 p-1.5 rounded border transition-all ${game.is_locked ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-amber-500/5 border-amber-500/10'}`}>
                                                                    <Zap size={9} className={game.is_locked ? 'text-red-500' : 'text-amber-500'} />
                                                                    <span className={`text-[8px] font-bold uppercase tracking-tighter ${game.is_locked ? 'text-red-500' : 'text-amber-500'}`}>
                                                                        {game.warning}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Radio size={28} className="text-zinc-700 mx-auto mb-3 animate-pulse" />
                                        <p className="text-[13px] text-zinc-400 font-medium">Nenhum jogo ao vivo no momento</p>
                                        <p className="text-[11px] text-zinc-600 mt-1">
                                            {liveOpportunities?.status === 'SEM_JOGOS_AO_VIVO'
                                                ? 'O scraper está ativo mas não encontrou jogos na Betano agora.'
                                                : liveOpportunities?.message || 'Aguardando jogos com placares favoráveis (2x0+ após 70min)'}
                                        </p>
                                        <p className="text-[10px] text-zinc-700 mt-2">
                                            Status: <span className="text-emerald-500">{liveOpportunities?.status || 'CONECTANDO'}</span>
                                        </p>
                                        <a
                                            href="https://www.betano.bet.br/live/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-3 text-[10px] text-zinc-500 hover:text-emerald-500 transition-colors"
                                        >
                                            Abrir Betano Live manualmente <ExternalLink size={10} />
                                        </a>
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[9px] text-zinc-600">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${liveOpportunities?.status === 'SCRAPING_REAL' || liveOpportunities?.status === 'SEM_JOGOS_AO_VIVO' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                        <span>Dados: {liveOpportunities?.source || 'Betano Live Scraper'}</span>
                                    </div>
                                    <span>Scan: {new Date(liveOpportunities?.last_scan).toLocaleTimeString('pt-BR')}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {!focusedTeam ? (
                        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

                            {/* HEADER */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-900">
                                <div>
                                    <h1 className="text-base font-semibold text-white">Painel de Análise</h1>
                                    <p className="text-[11px] text-zinc-600 flex items-center gap-1.5 mt-0.5">
                                        <Activity size={10} className="text-emerald-500" /> Odds reais via Google/Betano/Sportingbet
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => setShowSimulationReport(true)}
                                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-[11px] font-medium text-emerald-500 hover:bg-zinc-800 transition-colors"
                                    >
                                        <Eye size={12} />
                                        Relatório Simulação
                                    </button>

                                    <div className="relative flex-1 sm:w-48">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-700" size={12} />
                                        <input type="text" placeholder="Buscar..." className="w-full bg-zinc-950 border border-zinc-900 rounded-md py-1.5 pl-7 pr-2 text-[11px] text-white placeholder:text-zinc-700 focus:border-zinc-700 transition-all outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <button onClick={loadData} className="p-1.5 bg-zinc-950 border border-zinc-900 rounded-md text-zinc-600 hover:text-emerald-500 hover:border-zinc-700 transition-colors">
                                        <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            {/* GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredTeams.map((team, idx) => {
                                    const hasHotOpportunity = team.probability >= 70 || (team.hot_market && team.hot_market.confidence >= 70);

                                    return (
                                        <motion.div
                                            key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                                            className={`group bg-zinc-950 border rounded-lg p-4 transition-all hover:bg-zinc-900/50 cursor-pointer relative overflow-hidden ${hasHotOpportunity ? 'border-emerald-500/50 animate-pulse-subtle' : 'border-zinc-900 hover:border-zinc-800'}`}
                                            onClick={() => setFocusedTeam(team)}
                                        >
                                            {hasHotOpportunity && (
                                                <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full m-2 animate-ping" />
                                            )}

                                            {/* MONITOR BUTTON (Overlay on hover) */}
                                            <button
                                                onClick={(e) => handleMonitorBet(team, e)}
                                                className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 hover:bg-emerald-500 border border-zinc-700 hover:border-emerald-500 rounded text-zinc-400 hover:text-black z-20 transition-all opacity-0 group-hover:opacity-100"
                                                title="Monitorar Resultado (Simulação)"
                                            >
                                                <Eye size={12} />
                                            </button>

                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-black leading-none mb-1">{team.region || 'ANÁLISE PRÉ-JOGO'}</p>
                                                    <h3 className="text-[17px] font-black text-white leading-tight uppercase italic">{team.team}</h3>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${team.risk_level === 'BAIXO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                                        team.risk_level === 'ALTO' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                                                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        }`}>
                                                        Risco {team.risk_level || 'ANALISANDO'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Markets & Streak Area */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex items-center gap-0.5 bg-black/40 p-1 rounded border border-white/5">
                                                    {team.detailed_history && team.detailed_history.length > 0 ? (
                                                        team.detailed_history.slice(0, 5).map((h, i) => (
                                                            <div key={i} className={`h-3 w-3 rounded-full text-[6px] font-black flex items-center justify-center ${h.result === 'V' ? 'bg-emerald-500 text-black' : h.result === 'D' ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                                                {h.result}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[7px] text-zinc-700 font-bold px-1 uppercase tracking-tighter italic">Sem histórico</span>
                                                    )}
                                                </div>
                                                {team.markets && team.markets.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        {team.markets.slice(0, 2).map((m, mi) => (
                                                            <div key={mi} className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-zinc-500 uppercase`}>
                                                                {m.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expert Context */}
                                            <div className="mb-4 space-y-2">
                                                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 shadow-inner">
                                                    <p className="text-[10px] text-zinc-300 font-medium italic leading-relaxed">
                                                        "{team.expert_insight || 'Iniciando varredura tática para identificar padrões de comportamento nas odds.'}"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Value Bet Action Area */}
                                            <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl p-3 mb-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)] group-hover:border-emerald-500/60 transition-all">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em]">OPORTUNIDADE REAL</span>
                                                    <Zap size={10} className="text-emerald-500 animate-pulse" fill="currentColor" />
                                                </div>
                                                <p className="text-[14px] font-black text-white uppercase italic text-center py-1 tracking-tight">
                                                    {team.value_bet || 'AGUARDANDO ODDS'}
                                                </p>
                                            </div>

                                            <div className="flex items-end justify-between pt-3 border-t border-zinc-900/50">
                                                <div className="flex-1">
                                                    <p className="text-[8px] text-zinc-600 uppercase font-bold mb-0.5 tracking-wider">PRÓXIMO ALVO</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="text-[11px] font-black text-white uppercase">{team.next_games?.[0]?.opponent || 'A definir'}</span>
                                                        <span className="text-[9px] text-zinc-500 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{team.next_games?.[0]?.date || '--/--'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Confiança IA</span>
                                                    <span className={`text-2xl font-black italic ${team.probability >= 70 ? 'text-emerald-500' : 'text-zinc-500'}`}>{team.probability || '0'}<span className="text-[10px] opacity-30 font-normal">%</span></span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                    ) : (
                        <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

                            <button onClick={() => setFocusedTeam(null)} className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-emerald-500 transition-colors">
                                <ArrowLeft size={12} /> Voltar
                            </button>

                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-zinc-900">
                                <div>
                                    <p className="text-[10px] text-zinc-700 uppercase tracking-wide">{focusedTeam.region}</p>
                                    <h1 className="text-xl font-bold text-white">{focusedTeam.team}</h1>
                                    {focusedTeam.next_games[0]?.venue && (
                                        <p className="text-[10px] text-zinc-600 mt-1">📍 {focusedTeam.next_games[0].venue}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-2">
                                        <p className="text-[8px] text-zinc-700 uppercase">Confiança</p>
                                        <p className="text-xl font-bold text-emerald-500 leading-none">{focusedTeam.probability}%</p>
                                    </div>
                                </div>
                            </div>

                            {focusedTeam.next_games[0]?.odds && (
                                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Target size={14} className="text-emerald-500" />
                                            <span className="text-[12px] font-semibold text-white">Odds ao Vivo - {focusedTeam.next_games[0].opponent}</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-600">{focusedTeam.next_games[0].date}</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[10px]">
                                            <thead>
                                                <tr className="border-b border-zinc-800">
                                                    <th className="text-left py-2 text-zinc-600 font-medium">Casa</th>
                                                    <th className="text-center py-2 text-zinc-600 font-medium">{focusedTeam.next_games[0].is_home ? focusedTeam.team : focusedTeam.next_games[0].opponent}</th>
                                                    <th className="text-center py-2 text-zinc-600 font-medium">Empate</th>
                                                    <th className="text-center py-2 text-zinc-600 font-medium">{focusedTeam.next_games[0].is_home ? focusedTeam.next_games[0].opponent : focusedTeam.team}</th>
                                                    <th className="text-center py-2 text-zinc-600 font-medium">+1.5</th>
                                                    <th className="text-center py-2 text-zinc-600 font-medium">+2.5</th>
                                                    <th className="text-center py-2 text-zinc-600 font-medium">BTTS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookmakers.map((bk) => {
                                                    const odds1x2 = focusedTeam.next_games[0].odds['1x2']?.[bk];
                                                    const oddsOU = focusedTeam.next_games[0].odds['over_under']?.[bk];
                                                    const oddsBTTS = focusedTeam.next_games[0].odds['btts']?.[bk];
                                                    if (!odds1x2) return null;

                                                    return (
                                                        <tr key={bk} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                                                            <td className="py-2 font-medium text-white">{bk}</td>
                                                            <td className="text-center py-2">
                                                                <span className="bg-zinc-900 px-2 py-1 rounded text-emerald-500 font-bold">{odds1x2.home}</span>
                                                            </td>
                                                            <td className="text-center py-2">
                                                                <span className="bg-zinc-900 px-2 py-1 rounded text-zinc-400">{odds1x2.draw}</span>
                                                            </td>
                                                            <td className="text-center py-2">
                                                                <span className="bg-zinc-900 px-2 py-1 rounded text-orange-400 font-bold">{odds1x2.away}</span>
                                                            </td>
                                                            <td className="text-center py-2">
                                                                <span className="text-zinc-500">{oddsOU?.over_15 || '-'}</span>
                                                            </td>
                                                            <td className="text-center py-2">
                                                                <span className="text-zinc-500">{oddsOU?.over_25 || '-'}</span>
                                                            </td>
                                                            <td className="text-center py-2">
                                                                <span className="text-zinc-500">{oddsBTTS?.yes || '-'}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[9px] text-zinc-700 mt-2">Fonte: {focusedTeam.next_games[0].source || 'Google/Agregadores'}</p>
                                </div>
                            )}

                            {focusedTeam.markets && focusedTeam.markets.length > 0 && (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Link2 size={14} className="text-emerald-500" />
                                        <span className="text-[12px] font-semibold text-white">Sugestões de Combinadas</span>
                                        <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold">MAIS SEGURAS</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {generateCombos(focusedTeam).map((combo, ci) => (
                                            <div key={ci} className={`p-3 rounded-lg border ${combo.confidence >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    {combo.confidence >= 80 && <Zap size={10} className="text-emerald-500" fill="currentColor" />}
                                                    <span className={`text-[11px] font-semibold ${combo.confidence >= 80 ? 'text-emerald-400' : 'text-white'}`}>{combo.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-white">@{combo.odds.toFixed(2)}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${combo.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>{combo.confidence}%</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {combo.markets.map((m, mi) => (
                                                        <span key={mi} className="text-[8px] text-zinc-600 bg-zinc-900 px-1 py-0.5 rounded">{m}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {focusedTeam.markets && focusedTeam.markets.length > 0 && (
                                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Flame size={14} className="text-orange-500" />
                                        <span className="text-[12px] font-semibold text-white">Mercados Individuais</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {focusedTeam.markets.map((m, mi) => (
                                            <div key={mi} className={`p-3 rounded-lg border ${m.confidence >= 70 ? 'bg-emerald-500/5 border-emerald-500/20 animate-pulse-subtle' : m.hot ? 'bg-orange-500/5 border-orange-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    {m.confidence >= 70 && <Zap size={10} className="text-emerald-500" />}
                                                    {m.hot && m.confidence < 70 && <Flame size={10} className="text-orange-500" />}
                                                    <span className={`text-[11px] font-semibold ${m.confidence >= 70 ? 'text-emerald-400' : m.hot ? 'text-orange-400' : 'text-white'}`}>{m.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-lg font-bold ${m.confidence >= 70 ? 'text-emerald-500' : m.hot ? 'text-orange-500' : 'text-white'}`}>{m.confidence}%</span>
                                                    <span className="text-[9px] text-zinc-600 uppercase">{m.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-1.5 text-zinc-500 pb-2 border-b border-zinc-900">
                                        <UserCheck size={12} />
                                        <span className="text-[11px] font-medium">Escalação</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-zinc-700 uppercase">Técnico</p>
                                        <p className="text-[13px] font-semibold text-white">{focusedTeam.lineup.coach}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {focusedTeam.lineup.players.map((p, pi) => (
                                            <span key={pi} className="text-[9px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">{p}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-2">
                                    <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
                                        <Layers size={12} />
                                        <span className="text-[11px] font-medium">Histórico Jan/2026</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        {focusedTeam.detailed_history && focusedTeam.detailed_history.map((h, hi) => (
                                            <div key={hi} className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg hover:border-zinc-800 transition-colors">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold ${h.result === 'V' ? 'bg-emerald-500/15 text-emerald-500' : h.result === 'D' ? 'bg-red-500/15 text-red-400' : 'bg-zinc-800 text-zinc-600'}`}>{h.result}</div>
                                                    <div>
                                                        <p className="text-[11px] font-medium text-white">{focusedTeam.team} <span className="text-zinc-700">vs</span> {h.opponent}</p>
                                                        <p className="text-[9px] text-zinc-700">{h.competition} • {h.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-base font-bold text-white font-mono">{h.score}</p>
                                                    <div className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${h.result === 'V' ? 'bg-emerald-500/10 text-emerald-500' : h.result === 'D' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-600'}`}>{h.winner}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-950 border border-emerald-500/20 rounded-lg space-y-2">
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <Calculator size={12} />
                                    <span className="text-[11px] font-medium">Análise do Algoritmo</span>
                                </div>
                                <p className="text-[12px] text-zinc-400 leading-relaxed">{focusedTeam.recommendation_reason}</p>
                                <div className="flex gap-2 pt-2">
                                    <a href="https://www.betano.bet.br" target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-black px-3 py-1.5 rounded-md text-[10px] font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5">
                                        Abrir Betano <ExternalLink size={10} />
                                    </a>
                                    <button className="bg-zinc-900 text-zinc-500 px-3 py-1.5 rounded-md text-[10px] font-medium hover:text-white transition-colors">
                                        Exportar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ===== COMBO BUILDER FLOATING PANEL ===== */}
            <AnimatePresence>
                {showComboBuilder && selectedGames.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 z-[150] shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Ticket size={16} className="text-emerald-500" />
                                <span className="text-[13px] font-bold text-white">Combo Builder</span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold">{selectedGames.length} JOGOS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowSettings(true)} className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900">
                                    <Settings size={14} />
                                </button>
                                <button onClick={() => setShowComboBuilder(false)} className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Selected Games List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                            {selectedGames.map((game, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-white font-medium truncate">{game.home} vs {game.away}</p>
                                        <p className="text-[8px] text-zinc-500">{game.recommendation}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-emerald-500">@{game.odds.toFixed(2)}</span>
                                        <button onClick={() => toggleGameSelection(game)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Odds Summary */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-zinc-500">ODD TOTAL:</span>
                                <span className="text-xl font-bold text-emerald-500">{totalOdds}x</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">LUCRO POTENCIAL:</span>
                                <span className="text-[12px] font-bold text-white">+{profitPercent}%</span>
                            </div>
                        </div>

                        {/* Bet Amount Input */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] text-zinc-500">VALOR:</span>
                            <div className="flex items-center gap-1 flex-1">
                                <button onClick={() => setBetAmount(Math.max(1, betAmount - 10))} className="p-1.5 bg-zinc-900 rounded text-zinc-500 hover:text-white">
                                    <Minus size={12} />
                                </button>
                                <div className="flex-1 bg-zinc-900 rounded px-3 py-1.5 text-center">
                                    <span className="text-[11px] text-zinc-600">R$</span>
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                                        className="w-16 bg-transparent text-white text-center font-bold outline-none"
                                    />
                                </div>
                                <button onClick={() => setBetAmount(betAmount + 10)} className="p-1.5 bg-zinc-900 rounded text-zinc-500 hover:text-white">
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Potential Return */}
                        <div className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 mb-3">
                            <span className="text-[10px] text-zinc-500">RETORNO POTENCIAL:</span>
                            <span className="text-lg font-bold text-white">R$ {potentialReturn}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button onClick={clearSelection} className="flex-1 py-2 bg-zinc-900 text-zinc-500 rounded-lg text-[11px] font-medium hover:text-white transition-colors">
                                Limpar
                            </button>
                            <button
                                onClick={handleCreateComboBet}
                                disabled={isCreatingBet}
                                className="flex-1 py-2 bg-emerald-500 text-black rounded-lg text-[11px] font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                            >
                                {isCreatingBet ? 'Abrindo...' : 'APOSTAR COMBO'}
                                <ExternalLink size={12} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== SETTINGS MODAL ===== */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettings(false)}
                            className="fixed inset-0 bg-black/80 z-[160]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 z-[170]"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Settings size={16} className="text-emerald-500" />
                                    <span className="text-[14px] font-bold text-white">Condições de Aposta</span>
                                </div>
                                <button onClick={() => setShowSettings(false)} className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-900">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Strategies */}
                                <div className="p-3 bg-zinc-900 rounded-lg mb-4">
                                    <label className="text-[10px] text-zinc-500 uppercase mb-2 block flex items-center gap-1">
                                        <Target size={12} />
                                        Estratégias Prontas
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(strategies).map(([key, strat]) => (
                                            <button
                                                key={key}
                                                onClick={() => handleApplyStrategy(key)}
                                                className="p-2 rounded bg-black border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all text-left group"
                                            >
                                                <div className="text-[10px] font-bold text-white mb-0.5">{strat.label}</div>
                                                <div className="text-[8px] text-zinc-500 leading-tight group-hover:text-zinc-400">{strat.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bet Types */}
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase mb-2 block">Tipos de Aposta Aceitos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['UNDER', '1X2', 'BTTS', 'OVER'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    const currentTypes = betSettings?.accepted_bet_types || [];
                                                    const newTypes = currentTypes.includes(type)
                                                        ? currentTypes.filter(t => t !== type)
                                                        : [...currentTypes, type];

                                                    setBetSettings({
                                                        ...betSettings,
                                                        accepted_bet_types: newTypes
                                                    });
                                                }}
                                                className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-colors ${betSettings?.accepted_bet_types?.includes(type)
                                                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                                    : 'bg-zinc-900 text-zinc-600 border-zinc-800 hover:border-zinc-600'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Odds Range */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Odd Mínima</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={betSettings?.min_odds || 1.10}
                                            onChange={(e) => setBetSettings({ ...betSettings, min_odds: parseFloat(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Odd Máxima</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={betSettings?.max_odds || 5.00}
                                            onChange={(e) => setBetSettings({ ...betSettings, max_odds: parseFloat(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Time Range */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Minuto Mínimo</label>
                                        <input
                                            type="number"
                                            value={betSettings?.min_minute || 65}
                                            onChange={(e) => setBetSettings({ ...betSettings, min_minute: parseInt(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Minuto Máximo</label>
                                        <input
                                            type="number"
                                            value={betSettings?.max_minute || 88}
                                            onChange={(e) => setBetSettings({ ...betSettings, max_minute: parseInt(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Profit Range */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Lucro Mín (%)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={betSettings?.min_profit_percent || 1}
                                            onChange={(e) => setBetSettings({ ...betSettings, min_profit_percent: parseFloat(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Lucro Máx (%)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={betSettings?.max_profit_percent || 5}
                                            onChange={(e) => setBetSettings({ ...betSettings, max_profit_percent: parseFloat(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Confidence */}
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Confiança Mínima (%)</label>
                                    <input
                                        type="number"
                                        value={betSettings?.min_confidence || 75}
                                        onChange={(e) => setBetSettings({ ...betSettings, min_confidence: parseInt(e.target.value) })}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                    />
                                </div>

                                {/* Max Games */}
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Máximo de Jogos no Combo</label>
                                    <input
                                        type="number"
                                        value={betSettings?.max_games_combo || 5}
                                        onChange={(e) => setBetSettings({ ...betSettings, max_games_combo: parseInt(e.target.value) })}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                    />
                                </div>

                                {/* Default Amount */}
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Valor Padrão (R$)</label>
                                    <input
                                        type="number"
                                        value={betSettings?.default_bet_amount || 10}
                                        onChange={(e) => setBetSettings({ ...betSettings, default_bet_amount: parseFloat(e.target.value) })}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                    />
                                </div>

                            </div>

                            {/* Platform Credentials */}
                            <div className="py-2 border-t border-zinc-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <Key size={14} className="text-emerald-500" />
                                    <span className="text-[11px] font-bold text-white">Credenciais da Plataforma (Automação)</span>
                                    {/* Platform Credentials */}
                                    <div className="py-2 border-t border-zinc-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Key size={14} className="text-emerald-500" />
                                            <span className="text-[11px] font-bold text-white">Credenciais da Plataforma (Automação)</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Email Betano</label>
                                                <input
                                                    type="text"
                                                    placeholder="seu.email@exemplo.com"
                                                    value={betSettings?.betano_email_encrypted || ''}
                                                    onChange={(e) => setBetSettings({ ...betSettings, betano_email_encrypted: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Senha Betano (Criptografada)</label>
                                                <input
                                                    type="password"
                                                    placeholder={betSettings?.betano_password_encrypted ? "•••••••• (Configurada)" : "Sua senha segura"}
                                                    value={betSettings?.betano_password_encrypted ? "" : ""} // Não mostrar o valor real na tela por segurança
                                                    onChange={(e) => setBetSettings({ ...betSettings, betano_password_encrypted: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-emerald-500"
                                                />
                                                <p className="text-[9px] text-zinc-600 mt-1">
                                                    * O sistema usará as credenciais mestre configuradas se deixado em branco.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notifications */}
                                    <div className="flex items-center justify-between py-2 border-t border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <Volume2 size={14} className="text-zinc-500" />
                                            <span className="text-[11px] text-white">Alertas Sonoros</span>
                                        </div>
                                        <button
                                            onClick={() => setBetSettings({ ...betSettings, enable_sound_alerts: !betSettings.enable_sound_alerts })}
                                            className={`w-10 h-5 rounded-full transition-colors ${betSettings?.enable_sound_alerts ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${betSettings?.enable_sound_alerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={settingsLoading}
                                        className="w-full py-2.5 bg-emerald-500 text-black rounded-lg text-[12px] font-bold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {settingsLoading ? 'Salvando...' : (
                                            <>
                                                <Save size={14} />
                                                Salvar Configurações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* ===== TUTORIAL MODAL ===== */}
            <AnimatePresence>
                {showTutorial && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTutorial(false)}
                            className="fixed inset-0 bg-black/90 z-[180]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-0 z-[190] overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <Book size={18} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Como Usar a Ferramenta</h2>
                                        <p className="text-xs text-zinc-400">Guia rápido de operações e automação</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={startTour}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                                    >
                                        <Play size={12} /> INICIAR TOUR GUIADO
                                    </button>
                                    <button onClick={() => setShowTutorial(false)} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-8">
                                {/* Section 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-sm">1</div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-2">Scanner Ao Vivo</h3>
                                        <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                                            O painel principal mostra oportunidades em tempo real. Os jogos são filtrados por algoritmos que detectam valor (Odd vs Probabilidade).
                                            <br />
                                            <strong className="text-emerald-500">Verde:</strong> Alta probabilidade. <strong className="text-yellow-500">Amarelo:</strong> Atenção.
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">2</div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-2">Montar Combos (Combo Builder)</h3>
                                        <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                                            Clique no botão <strong className="text-white bg-zinc-800 px-1 rounded">+</strong> de um jogo para adicionar ao seu Ticket.
                                            Adicione até 5 jogos para multiplicar suas odds. O sistema calcula automaticamente o retorno.
                                        </p>
                                    </div>
                                </div>

                                {/* Section 3 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-sm">3</div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-2">Automação (Betano Bot)</h3>
                                        <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                                            A ferramenta possui um robô que opera por você.
                                            <br />
                                            Acesse <strong>Configurações</strong> e preencha suas credenciais (Email/Senha) da Betano em "Credenciais da Plataforma".
                                            <br />
                                            Ou, na primeira vez que clicar em "Apostar", o sistema abrirá o navegador para você logar manualmente uma única vez.
                                        </p>
                                        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 text-[10px] text-zinc-500">
                                            ⚠️ O modo <strong>Headless (Invisível)</strong> vem ativado por padrão para operação silenciosa.
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm">4</div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-2">Estratégias</h3>
                                        <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                                            Nas configurações, você pode escolher estratégias pré-definidas:
                                            <br />
                                            🛡️ <strong>Conservador:</strong> Foco em Green. Odds baixas.
                                            <br />
                                            ⚖️ <strong>Moderado:</strong> Equilíbrio.
                                            <br />
                                            🚀 <strong>Agressivo:</strong> Busca a forra. Maior risco.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
                                <button onClick={() => setShowTutorial(false)} className="px-6 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors">
                                    Entendi, vamos lucrar!
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ##### GUIDED TOUR ##### */}
            <AnimatePresence>
                {isTourActive && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                            onClick={() => setIsTourActive(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-[340px] bg-zinc-950 border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] p-6 pointer-events-auto overflow-hidden"
                        >
                            {/* Inner glow effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />

                            {/* Progress bar */}
                            <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-500" style={{ width: `${(tourStep / 6) * 100}%` }} />

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    {tourStep === 1 && <Radio size={20} />}
                                    {tourStep === 2 && <Zap size={20} />}
                                    {tourStep === 3 && <Target size={20} />}
                                    {tourStep === 4 && <Plus size={20} />}
                                    {tourStep === 5 && <ExternalLink size={20} />}
                                    {tourStep === 6 && <Settings size={20} />}
                                </div>
                                <div>
                                    <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-[0.2em]">Sniper Tour • {tourStep}/6</p>
                                    <h3 className="text-[15px] font-black text-white uppercase tracking-tight">
                                        {tourStep === 1 && "Scanner Ao Vivo"}
                                        {tourStep === 2 && "Sinais de Elite"}
                                        {tourStep === 3 && "Pinagem de Alvos"}
                                        {tourStep === 4 && "Combo Builder"}
                                        {tourStep === 5 && "Automação Betano"}
                                        {tourStep === 6 && "Estratégia Custom"}
                                    </h3>
                                </div>
                            </div>

                            <div className="min-h-[80px]">
                                <p className="text-[13px] text-zinc-400 leading-relaxed mb-6 font-medium">
                                    {tourStep === 1 && "Bem-vindo! Aqui monitoramos a Betano em tempo real. Os cards coloridos indicam o nível de atenção e prioridade estatística definida pelos algoritmos."}
                                    {tourStep === 2 && "Cards piscando em verde indicam oportunidades de altíssima confiança (95%+). Estes são os seus momentos 'Sniper' para lucro rápido."}
                                    {tourStep === 3 && "Viu um jogo quente? Clique no alvo (🎯) para fixar o card no topo. Ele ficará travado lá enquanto você analisa outros mercados."}
                                    {tourStep === 4 && "Deseja multiplicar seus lucros? Clique no '+' de vários jogos para somar as odds em um único bilhete automático no seu ticket flutuante."}
                                    {tourStep === 5 && "Com o ticket pronto, clique em 'Apostar'. Nosso robô vai abrir a Betano e montar o bilhete para você confirmar em segundos."}
                                    {tourStep === 6 && "Ajuste suas estratégias (Conservador, Moderado ou Agressivo) nas configurações. A IA filtrará apenas as entradas que cabem na sua banca."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-4 mt-2">
                                <button
                                    onClick={() => tourStep > 1 ? setTourStep(tourStep - 1) : setIsTourActive(false)}
                                    className="text-[11px] text-zinc-500 font-bold hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    {tourStep === 1 ? "Fechar" : "Voltar"}
                                </button>
                                <button
                                    onClick={() => tourStep < 6 ? setTourStep(tourStep + 1) : setIsTourActive(false)}
                                    className="flex-1 px-5 py-2.5 bg-white text-black text-[11px] font-black rounded-lg hover:bg-emerald-400 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)] uppercase tracking-widest"
                                >
                                    {tourStep === 6 ? "Vamos Lucrar!" : "Próximo Passo"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #000; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #18181b; border-radius: 3px; }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
            {/* GUIDED TOUR COMPONENT */}
            {/* <TourGuide active={isTourActive} step={tourStep} onNext={nextTourStep} onClose={() => setIsTourActive(false)} /> */}

            <SimulationReport isOpen={showSimulationReport} onClose={() => setShowSimulationReport(false)} />
        </div >
    );
};

export default Dashboard;
// force update
// move eye button
// fix network error
// force restart frontend
// force update frontend
// force update eye button
