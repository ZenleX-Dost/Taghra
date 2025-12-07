// TAGHRA - API Service
// Axios instance with interceptors for authentication and error handling

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../utils/constants';

// Storage keys
const TOKEN_KEY = '@snackspot_token';
const REFRESH_TOKEN_KEY = '@snackspot_refresh_token';

/**
 * Create axios instance with default configuration
 */
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * Flag to track if we're refreshing the token
 */
let isRefreshing = false;

/**
 * Queue of failed requests to retry after token refresh
 */
let failedRequestsQueue = [];

/**
 * Process queue of failed requests
 * @param {string|null} token - New token or null if refresh failed
 */
const processQueue = (token) => {
    failedRequestsQueue.forEach((promise) => {
        if (token) {
            promise.resolve(token);
        } else {
            promise.reject(new Error('Token refresh failed'));
        }
    });
    failedRequestsQueue = [];
};

/**
 * Request interceptor - Adds authorization token to requests
 */
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - Handles token refresh on 401 errors
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            // If already refreshing, add to queue
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

                if (!refreshToken) {
                    // No refresh token, logout user
                    await clearAuthData();
                    throw new Error('No refresh token');
                }

                // Attempt to refresh token
                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}/auth/refresh-token`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { token, refreshToken: newRefreshToken } = response.data;

                // Store new tokens
                await AsyncStorage.setItem(TOKEN_KEY, token);
                await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

                // Update authorization header
                api.defaults.headers.common.Authorization = `Bearer ${token}`;
                originalRequest.headers.Authorization = `Bearer ${token}`;

                // Process queued requests
                processQueue(token);

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                await clearAuthData();
                processQueue(null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Format error for easier handling
        const formattedError = {
            message: error.response?.data?.message || error.message || 'An error occurred',
            status: error.response?.status,
            data: error.response?.data,
        };

        return Promise.reject(formattedError);
    }
);

/**
 * Clear all authentication data from storage
 */
const clearAuthData = async () => {
    try {
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, '@snackspot_user']);
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
};

// ============================================
// API Endpoints
// ============================================

/**
 * Authentication endpoints
 */
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (email, password) => api.post('/auth/login', { email, password }),
    socialLogin: (provider, accessToken) => api.post('/auth/social-login', { provider, accessToken }),
    logout: () => api.post('/auth/logout'),
    refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
    verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

/**
 * User endpoints
 */
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    getPointsHistory: () => api.get('/users/points-history'),
    getBadges: () => api.get('/users/badges'),
    getLeaderboard: (limit = 10) => api.get(`/users/leaderboard?limit=${limit}`),
    uploadAvatar: (formData) => api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

/**
 * Places endpoints
 */
export const placesAPI = {
    getNearby: (params) => api.get('/places/nearby', { params }),
    getById: (id) => api.get(`/places/${id}`),
    getMenu: (id) => api.get(`/places/${id}/menu`),
    getReviews: (id, params) => api.get(`/places/${id}/reviews`, { params }),
    search: (query, params) => api.get('/places/search', { params: { query, ...params } }),
};

/**
 * Orders endpoints
 */
export const ordersAPI = {
    create: (data) => api.post('/orders/create', data),
    getMyOrders: (params) => api.get('/orders/my-orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
};

/**
 * Health (Doctors/Vets) endpoints
 */
export const healthAPI = {
    getDoctors: (params) => api.get('/health/doctors', { params }),
    getDoctorById: (id) => api.get(`/health/doctors/${id}`),
    getAvailability: (id, date) => api.get(`/health/doctors/${id}/availability`, { params: { date } }),
    getSpecialties: () => api.get('/health/specialties'),
};

/**
 * Appointments endpoints
 */
export const appointmentsAPI = {
    book: (data) => api.post('/appointments/book', data),
    getMyAppointments: (params) => api.get('/appointments/my-appointments', { params }),
    getById: (id) => api.get(`/appointments/${id}`),
    cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
    reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
};

/**
 * Admin (Documents) endpoints
 */
export const adminAPI = {
    search: (query) => api.get('/admin/search', { params: { query } }),
    getById: (id) => api.get(`/admin/${id}`),
    getDocuments: () => api.get('/admin/documents'),
};

/**
 * Sub (Ambassador) endpoints
 */
export const subAPI = {
    addPlace: (formData) => api.post('/subs/add-place', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getMySubmissions: (params) => api.get('/subs/my-submissions', { params }),
    getEarnings: () => api.get('/subs/earnings'),
};

/**
 * Reviews endpoints
 */
export const reviewsAPI = {
    create: (placeId, data) => api.post(`/places/${placeId}/reviews`, data),
    update: (placeId, reviewId, data) => api.put(`/places/${placeId}/reviews/${reviewId}`, data),
    delete: (placeId, reviewId) => api.delete(`/places/${placeId}/reviews/${reviewId}`),
    vote: (placeId, reviewId, isHelpful) => api.post(`/places/${placeId}/reviews/${reviewId}/vote`, { isHelpful }),
};

/**
 * Notifications endpoints
 */
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    registerDevice: (token) => api.post('/notifications/register-device', { token }),
};

/**
 * Payment endpoints
 */
export const paymentAPI = {
    createPaymentIntent: (data) => api.post('/payments/create-intent', data),
    confirmPayment: (paymentIntentId) => api.post('/payments/confirm', { paymentIntentId }),
    getPaymentMethods: () => api.get('/payments/methods'),
    addPaymentMethod: (data) => api.post('/payments/methods', data),
};

export default api;
