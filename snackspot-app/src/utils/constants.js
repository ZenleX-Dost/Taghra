// SnackSpot - Premium Design Constants
// A modern, luxurious color palette inspired by high-end apps

// PREMIUM COLOR PALETTE
export const COLORS = {
    // Primary - Warm Amber Gold (Premium feel)
    primary: '#F5A623',
    primaryDark: '#D4920F',
    primaryLight: '#FFD466',
    primaryMuted: 'rgba(245, 166, 35, 0.15)',

    // Secondary - Deep Navy Blue (Trust & Professionalism)
    secondary: '#1A2B4C',
    secondaryDark: '#0F1929',
    secondaryLight: '#2D4A73',

    // Accent - Coral Rose (Modern & Vibrant)
    accent: '#FF6B6B',
    accentDark: '#E54B4B',
    accentLight: '#FF8A8A',

    // Success - Emerald Green
    success: '#00C48C',
    successDark: '#00A876',
    successLight: '#4DFFC3',
    successMuted: 'rgba(0, 196, 140, 0.15)',

    // Warning - Sunset Orange
    warning: '#FFB84C',
    warningDark: '#E59B30',
    warningLight: '#FFD699',

    // Error - Ruby Red
    error: '#FF4757',
    errorDark: '#E03546',
    errorLight: '#FF6B7A',
    errorMuted: 'rgba(255, 71, 87, 0.15)',

    // Info - Sky Blue
    info: '#54A0FF',
    infoDark: '#2E86DE',
    infoLight: '#82BFFF',

    // Neutrals - Premium Grays
    white: '#FFFFFF',
    background: '#F8FAFC',
    backgroundDark: '#0F1419',
    card: '#FFFFFF',
    cardDark: '#1C2938',

    // Text Colors
    text: '#1A2B4C',
    textLight: '#64748B',
    textMuted: '#94A3B8',
    textDark: '#F8FAFC',

    // Borders
    border: '#E2E8F0',
    borderDark: '#334155',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Gradient Colors
    gradientStart: '#F5A623',
    gradientEnd: '#FF6B6B',

    // Category Colors
    food: '#FF6B6B',
    health: '#54A0FF',
    vet: '#FFB84C',
    admin: '#9B59B6',

    // Status Colors
    open: '#00C48C',
    closed: '#94A3B8',
    busy: '#FFB84C',
};

// TYPOGRAPHY
export const FONTS = {
    // Font Families (using system fonts for now, can be replaced with custom)
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',

    // Font Sizes
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Line Heights
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

// SPACING
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
};

// DIMENSIONS
export const DIMENSIONS = {
    // Border Radius
    borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        base: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        full: 9999,
    },

    // Icon Sizes
    iconSize: {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 28,
        xl: 32,
        '2xl': 40,
        '3xl': 48,
    },

    // Button Heights
    buttonHeight: {
        sm: 36,
        md: 44,
        lg: 52,
        xl: 60,
    },

    // Input Heights
    inputHeight: {
        sm: 40,
        md: 48,
        lg: 56,
    },

    // Header Height
    headerHeight: 56,

    // Tab Bar Height
    tabBarHeight: 80,

    // Card Sizes
    cardPadding: 16,
};

// SHADOWS (for premium look)
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    '2xl': {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    // Colored shadows for premium effects
    primary: {
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    accent: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
};

// API CONFIGURATION
export const API_CONFIG = {
    BASE_URL: 'https://api.snackspot.ma/v1',
    TIMEOUT: 10000,
    SOCKET_URL: 'wss://api.snackspot.ma',
};

// MAP CONFIGURATION
export const MAP_CONFIG = {
    DEFAULT_LATITUDE: 33.5731, // Casablanca, Morocco
    DEFAULT_LONGITUDE: -7.5898,
    DEFAULT_DELTA: 0.01,
    INITIAL_RADIUS: 500, // meters
    RADIUS_LEVELS: [
        { points: 0, radius: 500, label: '500m' },
        { points: 50, radius: 1000, label: '1 km' },
        { points: 150, radius: 2000, label: '2 km' },
        { points: 500, radius: 5000, label: '5 km' },
        { points: 1000, radius: -1, label: 'Unlimited' },
    ],
};

// GAMIFICATION CONFIG
export const POINTS_CONFIG = {
    ADD_PLACE: 10,
    REVIEW_WITH_PHOTO: 5,
    ORDER_COMPLETED: 2,
    DAILY_LOGIN: 1,
    BOOKING_COMPLETED: 3,
    SHARE_APP: 5,
};

// USER ROLES
export const USER_ROLES = {
    USER: 'user',
    RESTAURANT: 'restaurant',
    DOCTOR: 'doctor',
    VET: 'vet',
    SUB: 'sub',
    ADMIN: 'admin',
};

// PLACE CATEGORIES
export const CATEGORIES = {
    FOOD: {
        id: 'food',
        label: 'Food & Drinks',
        icon: 'restaurant',
        color: COLORS.food,
    },
    HEALTH: {
        id: 'health',
        label: 'Doctors & Clinics',
        icon: 'medical-services',
        color: COLORS.health,
    },
    VET: {
        id: 'vet',
        label: 'Veterinarians',
        icon: 'pets',
        color: COLORS.vet,
    },
    ADMIN: {
        id: 'admin',
        label: 'Administration',
        icon: 'account-balance',
        color: COLORS.admin,
    },
};

// ORDER STATUS
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

// APPOINTMENT STATUS
export const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
};

// ANIMATION DURATIONS
export const ANIMATIONS = {
    fast: 150,
    normal: 300,
    slow: 500,
};

// SERVICE FEE
export const SERVICE_FEE = 1; // 1 DH per transaction

export default {
    COLORS,
    FONTS,
    SPACING,
    DIMENSIONS,
    SHADOWS,
    API_CONFIG,
    MAP_CONFIG,
    POINTS_CONFIG,
    USER_ROLES,
    CATEGORIES,
    ORDER_STATUS,
    APPOINTMENT_STATUS,
    ANIMATIONS,
    SERVICE_FEE,
};
