import { create } from 'zustand';
import axios from 'axios';

// Resolve the API base URL once.
// Local dev: Vite proxy handles /api -> localhost:5000 (same-origin, cookies work)
// Production: vercel.json rewrites /api -> Render backend (same-origin, cookies work)
// Only set VITE_API_URL if you need to bypass both proxies (rare).
let BASE_URL;
if (import.meta.env.VITE_API_URL) {
    BASE_URL = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`;
} else if (import.meta.env.DEV) {
    BASE_URL = 'http://localhost:5000/api';
} else {
    // Production: relative URL works because vercel.json rewrites /api/* to Render
    BASE_URL = '/api';
}

// Create a configured Axios instance
// withCredentials: true ensures the browser attaches the HttpOnly cookie to every request.
export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 30000, // 30s — Render cold starts can take 15-20s
});

// Add Request Interceptor to inject the access token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Configure Response Interceptor for automated token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// Routes that should NEVER trigger a token refresh attempt
const NO_REFRESH_ROUTES = ['/auth/refresh', '/auth/login', '/auth/register'];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. Intercept 401 Unauthorized for automated token refresh
        // CRITICAL: /auth/me MUST be allowed to trigger refresh — that's how page reload works.
        const shouldRefresh =
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !NO_REFRESH_ROUTES.some(route => originalRequest.url === route);

        if (shouldRefresh) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Securely request a new short-lived access token using the HttpOnly refresh cookie
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                const newAccessToken = response.data.accessToken;

                useAuthStore.getState().setAccessToken(newAccessToken);
                processQueue(null, newAccessToken);

                // Retry the original failed request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().logout(true);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // 2. Auto-retry for transient network blips
        if (!originalRequest._retried && (error.code === 'ECONNABORTED' || !error.response)) {
            originalRequest._retried = true;
            await new Promise((r) => setTimeout(r, 400));
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);


export const useAuthStore = create((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isCheckingAuth: true, // Defaults true — App.jsx gatekeeper blocks rendering until resolved
    error: null,
    setAccessToken: (token) => set({ accessToken: token }),
    clearError: () => set({ error: null }),

    // 1. Session validation on page reload
    // Uses /auth/me which IS allowed to trigger the 401 refresh interceptor.
    // Flow: GET /me → 401 (no token) → interceptor calls /refresh with cookie → gets token → retries /me → success
    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const response = await api.get('/auth/me');
            set({
                user: response.data.data,
                isAuthenticated: true,
                isCheckingAuth: false
            });
        } catch (error) {
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isCheckingAuth: false
            });
        }
    },

    // 2. Register a new user
    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', userData);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // 3. Login user
    login: async (email, password, rememberMe = false, reactivate = false) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password, rememberMe, reactivate });
            set({
                user: response.data.data,
                accessToken: response.data.accessToken,
                isAuthenticated: true,
                isLoading: false
            });
            return response.data;
        } catch (error) {
            set({ isLoading: false });
            if (error.response?.data?.requiresReactivation) {
                throw error.response.data;
            }
            const errorMessage = error.response?.data?.message || 'Invalid email or password';
            set({ error: errorMessage });
            throw new Error(errorMessage);
        }
    },

    // 4. Logout user
    logout: async (forceClientSide = false) => {
        set({ isLoading: true, error: null });
        try {
            if (!forceClientSide) {
                await api.get('/auth/logout');
            }
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isLoading: false
            });
        } catch (error) {
            console.error('Logout error:', error);
            set({ isLoading: false });
        }
    },

    // 5. Upload avatar image
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/auth/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        set((state) => ({ user: { ...state.user, ...response.data.data } }));
        return response.data;
    },

    // 5.5. Remove avatar image
    removeAvatar: async () => {
        const response = await api.delete('/auth/profile/avatar');
        set((state) => ({ user: { ...state.user, ...response.data.data } }));
        return response.data;
    },

    // 6. Update profile info
    updateProfile: async (updates) => {
        const response = await api.put('/auth/profile', updates);
        set((state) => ({ user: { ...state.user, ...response.data.data } }));
        return response.data;
    },

    // 7. Change password
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/profile/password', { currentPassword, newPassword });
        return response.data;
    },

    // 8. Synchronize email after update
    syncEmail: (newEmail) => {
        set((state) => ({
            user: state.user ? { ...state.user, email: newEmail } : null
        }));
    },
}));
