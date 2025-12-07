// TAGHRA - Theme Context
// Manages app theming (light/dark mode) and provides theme values

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { COLORS, FONTS, SPACING, DIMENSIONS, SHADOWS } from '../utils/constants';

// Storage key
const THEME_KEY = '@snackspot_theme';

// Create context with default lightTheme to prevent undefined errors
const ThemeContext = createContext(null);

/**
 * Light theme configuration
 */
const lightTheme = {
    dark: false,
    colors: {
        // Primary colors
        primary: COLORS.primary,
        primaryDark: COLORS.primaryDark,
        primaryLight: COLORS.primaryLight,
        primaryMuted: COLORS.primaryMuted,

        // Secondary colors
        secondary: COLORS.secondary,
        secondaryDark: COLORS.secondaryDark,
        secondaryLight: COLORS.secondaryLight,

        // Accent
        accent: COLORS.accent,

        // Semantic colors
        success: COLORS.success,
        successMuted: COLORS.successMuted,
        warning: COLORS.warning,
        error: COLORS.error,
        errorMuted: COLORS.errorMuted,
        info: COLORS.info,

        // Background
        background: COLORS.background,
        card: COLORS.card,
        surface: '#FFFFFF',

        // Text
        text: COLORS.text,
        textLight: COLORS.textLight,
        textMuted: COLORS.textMuted,
        textOnPrimary: '#FFFFFF',

        // Border
        border: COLORS.border,

        // Overlay
        overlay: COLORS.overlay,

        // Status
        open: COLORS.open,
        closed: COLORS.closed,

        // Category colors
        food: COLORS.food,
        health: COLORS.health,
        vet: COLORS.vet,
        admin: COLORS.admin,

        // Navigation
        tabBarBackground: '#FFFFFF',
        tabBarActive: COLORS.primary,
        tabBarInactive: COLORS.textMuted,

        // Input
        inputBackground: '#F8FAFC',
        inputBorder: COLORS.border,
        inputText: COLORS.text,
        inputPlaceholder: COLORS.textMuted,

        // Gradient
        gradientStart: COLORS.gradientStart,
        gradientEnd: COLORS.gradientEnd,
    },
    fonts: FONTS,
    spacing: SPACING,
    dimensions: DIMENSIONS,
    shadows: SHADOWS,
};

/**
 * Dark theme configuration
 */
const darkTheme = {
    dark: true,
    colors: {
        // Primary colors (slightly adjusted for dark mode)
        primary: COLORS.primary,
        primaryDark: COLORS.primaryLight,
        primaryLight: COLORS.primaryDark,
        primaryMuted: 'rgba(245, 166, 35, 0.2)',

        // Secondary colors
        secondary: '#8BA3C7',
        secondaryDark: COLORS.secondaryLight,
        secondaryLight: COLORS.secondary,

        // Accent
        accent: COLORS.accent,

        // Semantic colors
        success: COLORS.successLight,
        successMuted: 'rgba(0, 196, 140, 0.2)',
        warning: COLORS.warningLight,
        error: COLORS.errorLight,
        errorMuted: 'rgba(255, 71, 87, 0.2)',
        info: COLORS.infoLight,

        // Background
        background: COLORS.backgroundDark,
        card: COLORS.cardDark,
        surface: '#243447',

        // Text
        text: COLORS.textDark,
        textLight: '#B0BEC5',
        textMuted: '#78909C',
        textOnPrimary: '#FFFFFF',

        // Border
        border: COLORS.borderDark,

        // Overlay
        overlay: 'rgba(0, 0, 0, 0.7)',

        // Status
        open: COLORS.successLight,
        closed: '#78909C',

        // Category colors (slightly brighter for dark mode)
        food: '#FF8A8A',
        health: '#82BFFF',
        vet: '#FFD699',
        admin: '#B57EDC',

        // Navigation
        tabBarBackground: '#1C2938',
        tabBarActive: COLORS.primary,
        tabBarInactive: '#78909C',

        // Input
        inputBackground: '#243447',
        inputBorder: COLORS.borderDark,
        inputText: COLORS.textDark,
        inputPlaceholder: '#78909C',

        // Gradient (adjusted for dark mode)
        gradientStart: COLORS.primaryDark,
        gradientEnd: COLORS.accentDark,
    },
    fonts: FONTS,
    spacing: SPACING,
    dimensions: DIMENSIONS,
    shadows: {
        ...SHADOWS,
        // Slightly adjust shadows for dark mode
        sm: {
            ...SHADOWS.sm,
            shadowOpacity: 0.2,
        },
        md: {
            ...SHADOWS.md,
            shadowOpacity: 0.25,
        },
        lg: {
            ...SHADOWS.lg,
            shadowOpacity: 0.3,
        },
    },
};

/**
 * ThemeProvider component that wraps the app and provides theme
 */
export const ThemeProvider = ({ children }) => {
    // Get device color scheme
    const deviceColorScheme = useColorScheme();

    // State
    const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Load stored theme preference on app start
     */
    useEffect(() => {
        const loadStoredTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem(THEME_KEY);
                if (storedTheme) {
                    setThemeMode(storedTheme);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredTheme();
    }, []);

    /**
     * Determine if dark mode is active
     */
    const isDarkMode = useMemo(() => {
        if (themeMode === 'system') {
            return deviceColorScheme === 'dark';
        }
        return themeMode === 'dark';
    }, [themeMode, deviceColorScheme]);

    /**
     * Get current theme based on mode
     */
    const theme = useMemo(() => {
        return isDarkMode ? darkTheme : lightTheme;
    }, [isDarkMode]) || lightTheme;

    /**
     * Set theme mode
     * @param {string} mode - 'light', 'dark', or 'system'
     */
    const setTheme = useCallback(async (mode) => {
        try {
            await AsyncStorage.setItem(THEME_KEY, mode);
            setThemeMode(mode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, []);

    /**
     * Toggle between light and dark mode
     */
    const toggleTheme = useCallback(async () => {
        const newMode = isDarkMode ? 'light' : 'dark';
        await setTheme(newMode);
    }, [isDarkMode, setTheme]);

    /**
     * Set theme to follow system
     */
    const useSystemTheme = useCallback(async () => {
        await setTheme('system');
    }, [setTheme]);

    // Context value
    const value = useMemo(() => ({
        // Theme data
        theme,
        themeMode,
        isDarkMode,
        isLoading,

        // Theme actions
        setTheme,
        toggleTheme,
        useSystemTheme,

        // Direct access to theme parts
        colors: theme.colors,
        fonts: theme.fonts,
        spacing: theme.spacing,
        dimensions: theme.dimensions,
        shadows: theme.shadows,
    }), [theme, themeMode, isDarkMode, isLoading, setTheme, toggleTheme, useSystemTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    // Return default lightTheme values if context is not available
    if (!context) {
        return {
            theme: lightTheme,
            themeMode: 'light',
            isDarkMode: false,
            isLoading: false,
            setTheme: () => {},
            toggleTheme: () => {},
            useSystemTheme: () => {},
            colors: lightTheme.colors,
            fonts: lightTheme.fonts,
            spacing: lightTheme.spacing,
            dimensions: lightTheme.dimensions,
            shadows: lightTheme.shadows,
        };
    }
    return context;
};

/**
 * Higher-order component to inject theme props
 * @param {Component} Component - Component to wrap
 * @returns {Component} Wrapped component with theme props
 */
export const withTheme = (Component) => {
    return function ThemedComponent(props) {
        const theme = useTheme();
        return <Component {...props} theme={theme} />;
    };
};

export default ThemeContext;
