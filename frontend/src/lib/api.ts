import axios from "axios";
import { getCookie } from "cookies-next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

export const endpoints = {
    auth: {
        login: "/auth/login",
        register: "/auth/register",
        me: "/auth/me",
    },
    accounts: {
        list: "/account",
        balance: (id: string) => `/account/balance/${id}`,
    },
    transactions: {
        create: "/transaction",
        history: "/transaction/history",
    },
};
