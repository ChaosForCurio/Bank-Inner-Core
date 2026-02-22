import axios, { AxiosError } from "axios";
import { getCookie } from "cookies-next";

// Ensure the base URL ends with a slash to avoid mangled paths when joining relative endpoints
// In production on Vercel, we use relative /api paths to benefit from same-domain proxying
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
        // Handle Network Errors (no response from server)
        if (!error.response) {
            console.error("Network Error: Backend might be down.", error.message);
            // We can return a custom error message or structure
            const networkError = {
                message: "Server is unreachable. Please check if the backend is running.",
                isNetworkError: true
            };
            return Promise.reject(networkError);
        }

        if (error.response?.status === 401) {
            // Check if we already have a token, if so, it's probably expired
            const token = typeof window !== 'undefined' ? document.cookie.includes('token=') : false;
            if (token) {
                console.warn("Session expired (401), clearing local state...");
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
        details: (id: string) => `transaction/${id}`,
    },
    users: {
        lookup: (uuid: string) => `users/lookup/${uuid}`,
    },
};
