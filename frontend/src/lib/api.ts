import axios, { AxiosError } from "axios";
import { getCookie } from "cookies-next";

// Ensure the base URL ends with a slash to avoid mangled paths when joining relative endpoints
// In production on Vercel, we use relative /api paths to benefit from same-domain proxying
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

    // In browser, if we are on a local network (e.g. 192.168.x.x), 
    // we should try to connect to the backend on the same host
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
            return `http://${hostname}:5000/api`;
        }
    }

    return "http://localhost:5000/api";
};

const API_BASE_URL = getBaseUrl().replace(/\/?$/, '/');
console.log("Resolved API_BASE_URL:", API_BASE_URL);


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

import { handleApiError } from "./error-handler";

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const appError = handleApiError(error);

        if (appError.status === 401) {
            // Check if we already have a token, if so, it's probably expired
            const hasToken = typeof window !== 'undefined' ? document.cookie.includes('token=') : false;
            if (hasToken) {
                console.warn("Session expired (401), clearing local state...");
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        
        return Promise.reject(appError);
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
