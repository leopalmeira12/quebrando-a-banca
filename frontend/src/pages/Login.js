import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, LogIn, Activity } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('leandro2703palmeira@gmail.com');
    const [password, setPassword] = useState('123456');
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await loginUser(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Credenciais Inválidas ou Erro de Comunicação.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030408] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none overflow-hidden">
                <span className="text-[500px] font-black tracking-tighter uppercase leading-none">INVEST</span>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="brutalist-panel w-full max-w-md z-10"
            >
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>

                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-emerald-500 fill-emerald-500" />
                            <span className="font-black text-lg tracking-tighter uppercase">INVEST <span className="text-emerald-500">SPORT</span></span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Servidor Online
                        </div>
                    </div>

                    <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">Autenticar <span className="text-emerald-500">Admin.</span></h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-10">Acesse suas estratégias de alto lucro</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 mb-8 text-[10px] font-black uppercase tracking-widest"
                        >
                            ALERTA: {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Username / Email</label>
                            <input
                                type="email"
                                required
                                className="brutalist-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ADMIN@ALGO.COM"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Chave de Acesso</label>
                            <input
                                type="password"
                                required
                                className="brutalist-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="brutalist-button w-full flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            >
                                {isLoading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
                                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap overflow-hidden">
                            <Activity size={14} className="text-emerald-500" />
                            <span>MONITORAMENTO ATIVO: +1.2s LATENCY</span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            Novo Operador? <Link to="/register" className="text-white hover:text-emerald-500 transition-colors ml-1 underline underline-offset-4">Criar Credenciais</Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
// force restart login
