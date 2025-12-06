// SnackSpot - Authentication Context
// Manages user authentication state, login, logout, and session persistence

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { USER_ROLES } from '../utils/constants';

// Storage keys
const TOKEN_KEY = '@snackspot_token';
const USER_KEY = '@snackspot_user';
const REFRESH_TOKEN_KEY = '@snackspot_refresh_token';

// Create context
const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the app and provides auth state
 */
export const AuthProvider = ({ children }) => {
    // State
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    /**
     * Load stored authentication data on app start
     */
    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const [storedToken, storedUser, storedRefreshToken, onboardingComplete] = await Promise.all([
                    AsyncStorage.getItem(TOKEN_KEY),
                    AsyncStorage.getItem(USER_KEY),
                    AsyncStorage.getItem(REFRESH_TOKEN_KEY),
                    AsyncStorage.getItem('@snackspot_onboarding_complete'),
                ]);

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    setRefreshToken(storedRefreshToken);
                    setIsAuthenticated(true);
                }

                setHasCompletedOnboarding(onboardingComplete === 'true');
            } catch (error) {
                console.error('Error loading stored auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Response with user and token
     */
    const register = useCallback(async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            const { user: newUser, token: newToken, refreshToken: newRefreshToken } = response.data;

            // Store auth data
            await Promise.all([
                AsyncStorage.setItem(TOKEN_KEY, newToken),
                AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
                AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken),
            ]);

            // Update state
            setUser(newUser);
            setToken(newToken);
            setRefreshToken(newRefreshToken);
            setIsAuthenticated(true);

            return { success: true, user: newUser };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            throw new Error(message);
        }
    }, []);

    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Response with user and token
     */
    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user: loggedInUser, token: newToken, refreshToken: newRefreshToken } = response.data;

            // Store auth data
            await Promise.all([
                AsyncStorage.setItem(TOKEN_KEY, newToken),
                AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedInUser)),
                AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken),
            ]);

            // Update state
            setUser(loggedInUser);
            setToken(newToken);
            setRefreshToken(newRefreshToken);
            setIsAuthenticated(true);

            return { success: true, user: loggedInUser };
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid email or password.';
            throw new Error(message);
        }
    }, []);

    /**
     * Login with social provider (Google/Facebook)
     * @param {string} provider - Social provider name
     * @param {string} accessToken - Provider access token
     * @returns {Promise<Object>} Response with user and token
     */
    const socialLogin = useCallback(async (provider, accessToken) => {
        try {
            const response = await api.post('/auth/social-login', { provider, accessToken });
            const { user: loggedInUser, token: newToken, refreshToken: newRefreshToken } = response.data;

            // Store auth data
            await Promise.all([
                AsyncStorage.setItem(TOKEN_KEY, newToken),
                AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedInUser)),
                AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken),
            ]);

            // Update state
            setUser(loggedInUser);
            setToken(newToken);
            setRefreshToken(newRefreshToken);
            setIsAuthenticated(true);

            return { success: true, user: loggedInUser };
        } catch (error) {
            const message = error.response?.data?.message || 'Social login failed. Please try again.';
            throw new Error(message);
        }
    }, []);

    /**
     * Logout user and clear stored data
     */
    const logout = useCallback(async () => {
        try {
            // Call logout endpoint to invalidate token on server
            if (token) {
                await api.post('/auth/logout').catch(() => { }); // Ignore errors
            }
        } finally {
            // Clear stored data
            await Promise.all([
                AsyncStorage.removeItem(TOKEN_KEY),
                AsyncStorage.removeItem(USER_KEY),
                AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
            ]);

            // Reset state
            setUser(null);
            setToken(null);
            setRefreshToken(null);
            setIsAuthenticated(false);
        }
    }, [token]);

    /**
     * Refresh the access token using refresh token
     * @returns {Promise<string>} New access token
     */
    const refreshAccessToken = useCallback(async () => {
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await api.post('/auth/refresh-token', { refreshToken });
            const { token: newToken, refreshToken: newRefreshToken } = response.data;

            // Store new tokens
            await Promise.all([
                AsyncStorage.setItem(TOKEN_KEY, newToken),
                AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken),
            ]);

            setToken(newToken);
            setRefreshToken(newRefreshToken);

            return newToken;
        } catch (error) {
            // If refresh fails, logout user
            await logout();
            throw new Error('Session expired. Please login again.');
        }
    }, [refreshToken, logout]);

    /**
     * Update user profile
     * @param {Object} updates - Profile updates
     * @returns {Promise<Object>} Updated user
     */
    const updateProfile = useCallback(async (updates) => {
        try {
            const response = await api.put('/users/profile', updates);
            const updatedUser = response.data.user;

            // Update stored user
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            setUser(updatedUser);

            return { success: true, user: updatedUser };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update profile.';
            throw new Error(message);
        }
    }, []);

    /**
     * Mark onboarding as complete
     */
    const completeOnboarding = useCallback(async () => {
        await AsyncStorage.setItem('@snackspot_onboarding_complete', 'true');
        setHasCompletedOnboarding(true);
    }, []);

    /**
     * Check if user has a specific role
     * @param {string} role - Role to check
     * @returns {boolean} Whether user has the role
     */
    const hasRole = useCallback((role) => {
        return user?.role === role;
    }, [user]);

    /**
     * Check if user is a Sub (ambassador)
     * @returns {boolean} Whether user is a Sub
     */
    const isSub = useCallback(() => {
        return user?.role === USER_ROLES.SUB;
    }, [user]);

    /**
     * Check if user is a business (restaurant, doctor, vet)
     * @returns {boolean} Whether user is a business
     */
    const isBusiness = useCallback(() => {
        return [USER_ROLES.RESTAURANT, USER_ROLES.DOCTOR, USER_ROLES.VET].includes(user?.role);
    }, [user]);

    // Context value
    const value = {
        // State
        user,
        token,
        isLoading,
        isAuthenticated,
        hasCompletedOnboarding,

        // Auth methods
        register,
        login,
        socialLogin,
        logout,
        refreshAccessToken,

        // Profile methods
        updateProfile,

        // Onboarding
        completeOnboarding,

        // Role checks
        hasRole,
        isSub,
        isBusiness,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
