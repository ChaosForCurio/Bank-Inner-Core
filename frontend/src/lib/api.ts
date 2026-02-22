import axios, { AxiosError } from "axios";
import { getCookie } from "cookies-next";

// Ensure the base URL ends with a slash to avoid mangled paths when joining relative endpoints
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/?$/, '/');

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = getCookie("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Check if we already have a token, if so, it's probably expired
            const token = typeof window !== 'undefined' ? document.cookie.includes('token=') : false;
            if (token) {
                console.warn("Session expired (401), clearing local state...");
                // Note: Actual cookie clearing usually happens on the server/logout, 
                // but we can proactively redirect or clear local state here if needed.
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const endpoints = {
    auth: {
        login: "auth/login",
        register: "auth/register",
        logout: "auth/logout",
        me: "auth/me",
    },
    accounts: {
        list: "account",
        balance: (id: string) => `account/balance/${id}`,
    },
    transactions: {
        create: "transaction",
        history: "transaction/history",
    },
    users: {
        lookup: (uuid: string) => `users/lookup/${uuid}`,
    },
};
