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

// Routes that should NEVER trigger a silent token refresh (they are auth routes themselves)
const AUTH_ROUTES = ["auth/login", "auth/register", "auth/refresh", "auth/reset-password", "auth/passkeys/login"];

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const processRefreshQueue = (token: string | null) => {
    refreshQueue.forEach(cb => cb(token));
    refreshQueue = [];
};

import { handleApiError } from "./error-handler";

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const requestUrl: string = originalRequest?.url ?? "";

        // Skip silent refresh for auth endpoints — they handle their own failures
        const isAuthRoute = AUTH_ROUTES.some(r => requestUrl.includes(r));

        // Only attempt silent refresh on 401 from protected routes (not auth routes themselves)
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            if (isRefreshing) {
                // Queue concurrent requests until refresh completes
                return new Promise((resolve, reject) => {
                    refreshQueue.push((token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        } else {
                            reject(error);
                        }
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Silently get new access token via the httpOnly refreshToken cookie
                const refreshRes = await api.post("auth/refresh");
                const newToken: string = refreshRes.data.accessToken;

                // Persist as 7-day cookie so it survives browser restarts
                const { setCookie } = await import("cookies-next");
                setCookie("token", newToken, { maxAge: 60 * 60 * 24 * 7 });

                // Retry original request with fresh token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                processRefreshQueue(newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processRefreshQueue(null);
                // Session fully expired — redirect to login
                if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        const appError = handleApiError(error);
        return Promise.reject(appError);
    }
);

export const endpoints = {
    auth: {
        login: "auth/login",
        register: "auth/register",
        logout: "auth/logout",
        me: "auth/me",
        refresh: "auth/refresh",
        forgotPassword: {
            options: "auth/passkeys/login/options",
            verify: "auth/passkeys/login/verify",
        },
        resetPassword: "auth/reset-password",
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
    notifications: {
        vapidKey: "notifications/vapid-public-key",
        subscribe: "notifications/subscribe",
    }
};
