import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/token', formData);
    return response.data;
};

export const register = async (email, password) => {
    const response = await api.post('/register', { email, password });
    return response.data;
};

export const getDashboardData = async () => {
    const response = await api.get('/dashboard-data');
    return response.data;
};

// =========== BET SETTINGS ===========
export const getBetSettings = async () => {
    const response = await api.get('/bet-settings');
    return response.data;
};

export const updateBetSettings = async (settings) => {
    const response = await api.put('/bet-settings', settings);
    return response.data;
};

// =========== COMBO BET ===========
export const createComboBet = async (games, betAmount, isSimulated = false) => {
    const response = await api.post('/combo-bet', { games, bet_amount: betAmount, is_simulated: isSimulated });
    return response.data;
};

export const getBetHistory = async (limit = 20) => {
    const response = await api.get(`/bet-history?limit=${limit}`);
    return response.data;
};

export const updateBetStatus = async (betId, status, resultAmount = null) => {
    const response = await api.put(`/bet-history/${betId}/status?status=${status}${resultAmount ? `&result_amount=${resultAmount}` : ''}`);
    return response.data;
};

// =========== LIVE OPPORTUNITIES ===========
export const getLiveOpportunities = async () => {
    const response = await api.get('/live-opportunities');
    return response.data;
};

// =========== BETANO BOT (Auto Login with Cookies) ===========
export const openBetanoBrowser = async () => {
    const response = await api.post('/betano/open');
    return response.data;
};

export const placeComboBetOnBetano = async (games, betAmount) => {
    const response = await api.post('/betano/place-combo', { games, bet_amount: betAmount });
    return response.data;
};

export const getBetanoStatus = async () => {
    const response = await api.get('/betano/status');
    return response.data;
};

export const openPlatform = async (bookmaker) => {
    const response = await api.post('/bot/open-platform', { bookmaker });
    return response.data;
};

export const openGameWithBot = async (bookmaker, game) => {
    const response = await api.post('/bot/open-game', { bookmaker, game });
    return response.data;
};

export default api;
