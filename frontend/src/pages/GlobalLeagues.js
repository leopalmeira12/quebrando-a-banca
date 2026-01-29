import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft, Trophy, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalLeagues = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#020305] text-white p-6 lg:p-12">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-10 hover:translate-x-[-4px] transition-transform">
                <ArrowLeft size={16} /> Voltar ao Painel
            </button>

            <header className="mb-12">
                <div className="flex items-center gap-3 text-emerald-500 mb-4 bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10 w-fit">
                    <Globe size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cobertura Global AI</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic">Ligas <span className="text-emerald-500">Mundiais.</span></h1>
                <p className="text-gray-500 text-sm mt-4 max-w-lg font-medium">Explore as 25 principais ligas mundiais com dados auditados via Google Search Engine em tempo real.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { name: 'Brasileirão', id: 'Brasil' },
                    { name: 'Premier League', id: 'Inglaterra' },
                    { name: 'Bundesliga', id: 'Alemanha' },
                    { name: 'La Liga', id: 'Espanha' },
                    { name: 'Serie A', id: 'Itália' },
                    { name: 'Ligue 1', id: 'França' }
                ].map((liga, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        onClick={() => navigate(`/dashboard?league=${liga.id}`)}
                        className="bg-[#0a0c12] border border-white/5 p-8 rounded-[32px] hover:border-emerald-500/20 hover:bg-white/[0.02] transition-all group cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                <Trophy size={24} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativo 24h</span>
                        </div>
                        <h3 className="text-xl font-black uppercase italic mb-2">{liga.name}</h3>
                        <p className="text-gray-500 text-xs font-medium mb-6">Algoritmo validado para extração imediata de escalações e resultados.</p>
                        <button className="w-full bg-white/5 group-hover:bg-emerald-500 group-hover:text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Selecionar Liga
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default GlobalLeagues;
