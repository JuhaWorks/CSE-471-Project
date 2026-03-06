import { create } from 'zustand';
import axios from 'axios';

// Resolve the API base URL once.
// We explicitly keep localhost active for local development via Vite proxy, 
// and fallback to Render for production if no env var is provided.
let BASE_URL;
if (import.meta.env.VITE_API_URL) {
    BASE_URL = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`;
} else if (import.meta.env.DEV) {
    // Explicitly use localhost link for local development
    BASE_URL = 'http://localhost:5000/api';
} else {
    // Production fallback for Vercel
    BASE_URL = 'https://syncforge-io.onrender.com/api';
}

// Create a configured Axios instance
// withCredentials: true ensures the browser attaches the HttpOnly cookie to every request.
export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 15000, // 15s hard timeout — prevents hanging requests
});

// Add Request Interceptor to inject the access token
api.interceptors.request.use((config) => {
    // Safely get state avoiding circular dependency
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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. Intercept 401 Unauthorized for automated token refresh
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/register' && originalRequest.url !== '/auth/profile') {
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
                // Use plain axios to avoid hitting interceptors recursively
                const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                const newAccessToken = response.data.accessToken;

                useAuthStore.getState().setAccessToken(newAccessToken);
                processQueue(null, newAccessToken);

                // Retry the original failed request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Refresh failed; meaning session is completely dead/expired. Clear client state.
                useAuthStore.getState().logout(true); // Call logout client-side only
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // 2. Original auto-retry logic for transient network blips
        if (!originalRequest._retried && (error.code === 'ECONNABORTED' || !error.response)) {
            originalRequest._retried = true;
            await new Promise((r) => setTimeout(r, 400)); // 400 ms back-off
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);


export const useAuthStore = create((set) => ({
    user: null,
    accessToken: null, // Short-lived token stored only in memory
    isAuthenticated: false,
    isLoading: false, // Start as false so Login/Register buttons are immediately interactive
    authChecking: true, // Separate flag for the initial auth check (prevents protected route flash)
    error: null,
    setAccessToken: (token) => set({ accessToken: token }),
    clearError: () => set({ error: null }),

    // 1. Check if the user has an active session
    checkAuth: async (forceFetch = false) => {
        if (window.location.pathname === '/oauth/callback' && !forceFetch) {
            set({ authChecking: false });
            return;
        }
        set({ authChecking: true, error: null });
        try {
            // Because no accessToken is active on refresh/boot, the request interceptor attaches nothing.
            // The backend responds with 401. The response interceptor catches it, hits `/auth/refresh` using
            // the HttpOnly cookie, gets the token, updates zustand state, and seamlessly retries this.
            const response = await api.get('/auth/profile');
            set({
                user: response.data.data,
                isAuthenticated: true,
                authChecking: false
            });
        } catch (error) {
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                authChecking: false
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
    login: async (email, password, reactivate = false) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password, reactivate });
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
                // Return the specific object to trigger the modal in Login.jsx
                throw error.response.data;
            }
            const errorMessage = error.response?.data?.message || 'Invalid email or password';
            set({ error: errorMessage });
            throw new Error(errorMessage);
        }
    },

    // 4. Logout user (Destroys the server-side cookie and clears client state)
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

    // 5. Upload avatar image (multipart/form-data)
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


    // 6. Update profile info (name, status, customMessage)
    updateProfile: async (updates) => {
        const response = await api.put('/auth/profile', updates);
        set((state) => ({ user: { ...state.user, ...response.data.data } }));
        return response.data;
    },

    // 7. Change password (requires currentPassword + newPassword)
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/profile/password', { currentPassword, newPassword });
        return response.data;
    },
}));
