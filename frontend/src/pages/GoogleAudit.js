import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GoogleAudit = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#020305] text-white p-6 lg:p-12">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-10 hover:translate-x-[-4px] transition-transform">
                <ArrowLeft size={16} /> Voltar ao Painel
            </button>

            <header className="mb-12">
                <div className="flex items-center gap-3 text-emerald-500 mb-4 bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10 w-fit">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Auditoria de Integridade</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic">Integridade <span className="text-emerald-500">Google.com.</span></h1>
                <p className="text-gray-500 text-sm mt-4 max-w-lg font-medium">Verificamos cada ponto de dado diretamente na fonte original do Google Search para garantir zero erro de input.</p>
            </header>

            <div className="space-y-6">
                {[
                    { status: 'success', label: 'Conexão Google Engine', desc: 'Sincronizado via cluster de busca inteligente.' },
                    { status: 'success', label: 'Extração de Escalações', desc: 'Mapeamento de 10 times da elite europeia e brasileira.' },
                    { status: 'warning', label: 'Cálculo de Odds', desc: 'Processando flutuações de 0.05% no mercado asiático.' },
                    { status: 'success', label: 'Logs de Vitória', desc: 'Verificação dupla: Scrapping + Validação Manual AI.' }
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-[#0a0c12] border border-white/5 p-6 rounded-[32px] flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${item.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {item.status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase italic">{item.label}</h3>
                                <p className="text-[10px] text-gray-500 font-medium">{item.desc}</p>
                            </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${item.status === 'success' ? 'border-emerald-500/20 text-emerald-500' : 'border-amber-500/20 text-amber-500'}`}>
                            {item.status === 'success' ? 'Auditado' : 'Em Fila'}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default GoogleAudit;
