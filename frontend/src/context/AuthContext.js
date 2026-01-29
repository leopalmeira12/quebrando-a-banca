import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/users/me');
                    setUser(data);
                } catch (error) {
                    console.error("Auth check failed", error);
                    // Só remove o token se for erro de autenticação (401)
                    // Se for erro de rede ou servidor fora do ar, mantém o token para tentar novamente depois
                    if (error.response && error.response.status === 401) {
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        // Opcional: Podíamos setar o user com dados do cache local se quiséssemos ser muito resilientes
                        // Mas por enquanto, apenas NÃO REMOVER o token já evita o logout forçado por erro de conexão
                        console.warn("Erro de conexão mas mantendo token local:", error.message);
                    }
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const loginUser = async (email, password) => {
        const { access_token } = await import('../api').then(m => m.login(email, password));
        localStorage.setItem('token', access_token);
        const { data } = await api.get('/users/me');
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
