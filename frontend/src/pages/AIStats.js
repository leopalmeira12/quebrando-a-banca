import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, ArrowLeft, TrendingUp, BarChart3, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIStats = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#020305] text-white p-6 lg:p-12">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-10 hover:translate-x-[-4px] transition-transform">
                <ArrowLeft size={16} /> Voltar ao Painel
            </button>

            <header className="mb-12">
                <div className="flex items-center gap-3 text-emerald-500 mb-4 bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10 w-fit">
                    <PieChart size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Analytics AI</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic">Estatísticas <span className="text-emerald-500">Avançadas.</span></h1>
                <p className="text-gray-500 text-sm mt-4 max-w-lg font-medium">Relatórios detalhados de ROI, Assertividade e Desempenho do Algoritmo Backend-Specialist.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0a0c12] border border-white/5 p-10 rounded-[40px]">
                    <BarChart3 className="text-emerald-500 mb-6" size={32} />
                    <h3 className="text-2xl font-black uppercase italic mb-4">Volume de Acertos</h3>
                    <p className="text-gray-500 text-sm mb-8">Base de dados consolidada com mais de 2.500 partidas auditadas em 2025/2026.</p>
                    <div className="h-64 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 text-gray-700 font-black uppercase text-[10px] tracking-widest">
                        Gráfico de Performance em Processamento
                    </div>
                </div>

                <div className="bg-[#0a0c12] border border-white/5 p-10 rounded-[40px]">
                    <Target className="text-emerald-500 mb-6" size={32} />
                    <h3 className="text-2xl font-black uppercase italic mb-4">Fator de Lucro (ROI)</h3>
                    <p className="text-gray-500 text-sm mb-8">Rentabilidade média mensal baseada em modelos matemáticos de Poisson e Monte Carlo.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <span className="text-[10px] font-black text-gray-700 uppercase block mb-2">Mensal</span>
                            <span className="text-3xl font-black text-emerald-500">+28.5%</span>
                        </div>
                        <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                            <span className="text-[10px] font-black text-emerald-500 uppercase block mb-2">Anual (IA)</span>
                            <span className="text-3xl font-black text-white">412%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIStats;
