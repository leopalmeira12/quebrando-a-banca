import React, { useState } from 'react';
import { register } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await register(email, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao criar conta. Tente outro email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030408] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Data Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="brutalist-panel w-full max-w-md z-10"
            >
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>

                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-emerald-500 fill-emerald-500" />
                            <span className="font-black text-lg tracking-tighter uppercase">INVEST <span className="text-emerald-500">SPORT</span></span>
                        </div>
                        <UserPlus size={20} className="text-gray-600" />
                    </div>

                    <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic">Nova <span className="text-emerald-500">Conta.</span></h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-10">Inicie sua jornada de lucros diários</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 mb-8 text-[10px] font-black uppercase tracking-widest"
                        >
                            Erro no Sistema: {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Identificação (Email)</label>
                            <input
                                type="email"
                                required
                                className="brutalist-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="USUARIO@ACCESS.COM"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Senha de Segurança</label>
                            <input
                                type="password"
                                required
                                className="brutalist-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Confirmar Senha</label>
                            <input
                                type="password"
                                required
                                className="brutalist-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="brutalist-button w-full flex items-center justify-center gap-3 group emerald-glow"
                            >
                                {isLoading ? 'PROCESSANDO...' : 'REQUISITAR ACESSO'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            Servidor Seguro & Criptografado
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            Já possui credenciais? <Link to="/login" className="text-white hover:text-emerald-500 transition-colors ml-1 underline underline-offset-4">Efetuar Login</Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
