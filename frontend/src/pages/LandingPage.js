import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Activity, ChevronRight, BarChart3, ShieldCheck, Cpu, Terminal } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [logLines, setLogLines] = useState([
        "SYSTEM_AUTH: OK",
        "CONNECTING_SOFASCORE_API...",
        "ANALYZING_ODDS_DEVIATION",
        "MONITORING_BRAZIL_SERIE_A",
        "DETECTED_LIVE_OPPORTUNITY: UBERLÂNDIA vs CALDENSE"
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const events = [
                "CALCULATING_PROBABILITY: 98.4%",
                "BOT_STATUS: ACTIVE",
                "UPDATING_BANK_ROLL_STATS",
                "NEW_SIGNAL_GENERATED",
                "SCRAPING_MINUTE_85_GAMES",
                "ESTIMATED_ROI: 4.2%",
                "STAKING_ADJUSTED: SAFE_MODE"
            ];
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            setLogLines(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${randomEvent}`]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#030408] text-white selection:bg-emerald-500/30 overflow-x-hidden font-sans">
            {/* Design Commitment: FRAGMENTATION & BRUTALISM */}

            {/* Background Data Layer */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute top-0 left-1/4 w-[1px] h-full bg-emerald-500/20"></div>
                <div className="absolute top-0 right-1/4 w-[1px] h-full bg-emerald-500/20"></div>
            </div>

            {/* Top Navigation */}
            <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center rounded-sm">
                        <Zap size={18} className="text-black fill-black" />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase">INVEST <span className="text-emerald-500">SPORT</span></span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/login')} className="text-xs font-bold uppercase tracking-widest hover:text-emerald-400 transition-colors">Acessar Terminal</button>
                    <button onClick={() => navigate('/register')} className="bg-emerald-500 text-black text-xs font-black uppercase px-6 py-2 rounded-sm hover:bg-emerald-400 transition-all">Começar Agora</button>
                </div>
            </nav>

            <main className="relative z-10 max-w-[1600px] mx-auto px-8 pt-12 pb-32">

                {/* HERO SECTION: TYPOGRAPHIC BRUTALISM */}
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="lg:w-2/3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-emerald-500/10 border-l-4 border-emerald-500 px-6 py-2 mb-8 inline-block"
                        >
                            <span className="text-emerald-500 font-bold text-sm tracking-widest uppercase">
                                MONITORAMENTO AUTOMÁTICO 24/7 ATIVADO
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-6xl md:text-[120px] font-black leading-[0.85] tracking-tighter mb-8"
                        >
                            LUCRO REAL.<br />
                            <span className="text-emerald-500">TODO DIA.</span><br />
                            SEM SORTE.
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="max-w-xl"
                        >
                            <p className="text-xl text-gray-400 leading-relaxed mb-10 border-l border-white/10 pl-8">
                                Transformamos o caos das apostas em um mercado de renda variável previsível.
                                Nossa IA monitora desvios estatísticos para garantir ganhos entre
                                <span className="text-white font-bold ml-1 mr-1">1% a 5% todos os dias</span>
                                com entradas quase 100% garantidas.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/register')}
                                    className="bg-emerald-500 text-black font-black text-lg px-12 py-6 rounded-sm flex items-center gap-3 group transition-all hover:scale-[1.02] shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]"
                                >
                                    ATIVAR MINHA LICENÇA
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <div className="flex items-center gap-4 px-6 border border-white/10 rounded-sm">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#030408] flex items-center justify-center text-[10px] font-bold">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">+1,240 investidores online</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* LIVE MONITORING UI - RADICAL ASYMMETRY */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="lg:w-1/3 w-full bg-[#0a0c14] border border-white/5 p-1 relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Activity size={200} className="text-emerald-500" />
                        </div>

                        <div className="bg-[#030408] p-6 border border-white/5">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Terminal Live Analysis</span>
                                </div>
                                <Activity size={12} className="text-gray-600" />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase mb-2">Meta de Ganhos Hoje</div>
                                    <div className="flex items-end gap-2">
                                        <div className="text-4xl font-black text-emerald-500">3.42%</div>
                                        <div className="text-xs text-gray-500 mb-1 mb-1 font-bold underline decoration-emerald-500/30">ALCANÇADO</div>
                                    </div>
                                    <div className="w-full h-[2px] bg-white/5 mt-3 relative overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "78%" }}
                                            transition={{ duration: 2, delay: 1 }}
                                            className="absolute top-0 left-0 h-full bg-emerald-500"
                                        ></motion.div>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-sm border-l border-emerald-500">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Terminal size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-bold text-gray-400">LOG DE MONITORAMENTO</span>
                                    </div>
                                    <div className="font-mono text-[10px] space-y-1.5 min-h-[100px]">
                                        <AnimatePresence mode='popLayout'>
                                            {logLines.map((line, i) => (
                                                <motion.div
                                                    key={line}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={i === logLines.length - 1 ? "text-emerald-400" : "text-gray-600"}
                                                >
                                                    {line}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-3 rounded-sm">
                                        <span className="block text-[8px] text-gray-500 uppercase">Assertividade</span>
                                        <span className="text-lg font-black italic">99.2%</span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-sm">
                                        <span className="block text-[8px] text-gray-500 uppercase">Volume 24h</span>
                                        <span className="text-lg font-black italic">R$ 1.2M</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Decoration */}
                        <motion.div
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 w-full h-[1px] bg-emerald-500/30 z-20 pointer-events-none"
                        ></motion.div>
                    </motion.div>
                </div>

                {/* THE 3 PILLARS: GEOMETRIC & CONTRASTED */}
                <div className="grid grid-cols-1 md:grid-cols-3 mt-32 border-t border-white/5">
                    {[
                        {
                            icon: <BarChart3 className="text-emerald-500" size={32} />,
                            title: "Lucratividade Consistente",
                            desc: "Esqueça as 'zebras'. Focamos em lucros sólidos de 1% a 5% sobre a banca diariamente através de juros compostos matemáticos."
                        },
                        {
                            icon: <ShieldCheck className="text-emerald-500" size={32} />,
                            title: "Segurança Algorítmica",
                            desc: "Monitoramos o fluxo de dinheiro mundial para detectar odds desajustadas. Entradas com quase 100% de probabilidade de acerto."
                        },
                        {
                            icon: <Cpu className="text-emerald-500" size={32} />,
                            title: "Execução Automatizada",
                            desc: "Nossa tecnologia não dorme. Enquanto o mundo para, nossos servidores continuam rastreando as melhores brechas do mercado."
                        }
                    ].map((feat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ backgroundColor: "rgba(16,185,129,0.03)" }}
                            className={`p-12 border-b md:border-b-0 border-white/5 ${i < 2 ? 'md:border-r' : ''}`}
                        >
                            <div className="mb-8">{feat.icon}</div>
                            <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{feat.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* CTA SECTION: FULL WIDTH IMPACT */}
            <section className="bg-emerald-500 py-24 px-8 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none">
                    <span className="text-[300px] font-black leading-none block -translate-y-1/2 -rotate-3 text-black">MONEY-MAKER</span>
                </div>

                <div className="max-w-[1200px] mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black mb-12 leading-tight">PRONTO PARA INVESTIR<br />COM IA AGORA?</h2>
                    <button
                        onClick={() => navigate('/register')}
                        className="bg-black text-emerald-500 text-xl font-black px-16 py-8 rounded-sm hover:scale-105 transition-transform shadow-2xl uppercase tracking-widest"
                    >
                        Quero Ganhar Meus Primeiros 5% Hoje
                    </button>
                    <p className="text-black/60 mt-8 font-bold text-xs uppercase tracking-[0.2em]">Vagas limitadas para o servidor v2.0</p>
                </div>
            </section>

            <footer className="py-20 px-8 border-t border-white/5 text-center">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
                    <div className="font-black text-lg">INVEST SPORT</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest">© 2026 ALGORITHMIC TRADING SYSTEMS. ALL RIGHTS RESERVED.</div>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
                        <a href="#terms" className="hover:text-emerald-500">Termos</a>
                        <a href="#privacy" className="hover:text-emerald-500">Privacidade</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

