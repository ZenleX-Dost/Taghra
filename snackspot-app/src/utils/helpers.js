// TAGHRA - Utility Helper Functions

/**
 * Format distance from meters to human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
    if (!meters && meters !== 0) return '';

    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }

    const km = meters / 1000;
    if (km < 10) {
        return `${km.toFixed(1)}km`;
    }

    return `${Math.round(km)}km`;
};

/**
 * Format currency in Moroccan Dirhams
 * @param {number} amount - Amount to format
 * @param {boolean} includeSymbol - Whether to include DH symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, includeSymbol = true) => {
    if (!amount && amount !== 0) return '';

    const formatted = amount.toLocaleString('fr-MA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return includeSymbol ? `${formatted} DH` : formatted;
};

/**
 * Check if a place is currently open based on opening hours
 * @param {Object} openingHours - Object with day names as keys
 * @returns {Object} { isOpen: boolean, closesAt: string, opensAt: string }
 */
export const isPlaceOpen = (openingHours) => {
    if (!openingHours) return { isOpen: false, closesAt: null, opensAt: null };

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = openingHours[currentDay];

    if (!todayHours || todayHours.closed) {
        // Find next opening time
        for (let i = 1; i <= 7; i++) {
            const nextDay = dayNames[(now.getDay() + i) % 7];
            const nextDayHours = openingHours[nextDay];
            if (nextDayHours && !nextDayHours.closed) {
                return {
                    isOpen: false,
                    closesAt: null,
                    opensAt: `${nextDay.charAt(0).toUpperCase() + nextDay.slice(1)} ${nextDayHours.open}`,
                };
            }
        }
        return { isOpen: false, closesAt: null, opensAt: null };
    }

    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    // Handle places that close after midnight
    const isOpen = closeTime > openTime
        ? currentTime >= openTime && currentTime < closeTime
        : currentTime >= openTime || currentTime < closeTime;

    return {
        isOpen,
        closesAt: todayHours.close,
        opensAt: todayHours.open,
    };
};

/**
 * Calculate points based on action type
 * @param {string} actionType - Type of action
 * @returns {number} Points earned
 */
export const calculatePoints = (actionType) => {
    const pointsMap = {
        add_place: 10,
        review_with_photo: 5,
        review: 3,
        order_completed: 2,
        booking_completed: 3,
        daily_login: 1,
        share_app: 5,
        referral: 20,
    };

    return pointsMap[actionType] || 0;
};

/**
 * Get user level based on total points
 * @param {number} points - Total points
 * @returns {Object} { level: string, nextLevel: string, progress: number, pointsNeeded: number }
 */
export const getUserLevel = (points) => {
    const levels = [
        { name: 'Bronze', min: 0, color: '#CD7F32' },
        { name: 'Silver', min: 100, color: '#C0C0C0' },
        { name: 'Gold', min: 500, color: '#FFD700' },
        { name: 'Platinum', min: 1500, color: '#E5E4E2' },
        { name: 'Diamond', min: 5000, color: '#B9F2FF' },
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length; i++) {
        if (points >= levels[i].min) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || null;
        }
    }

    const progress = nextLevel
        ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
        : 100;

    return {
        level: currentLevel.name,
        levelColor: currentLevel.color,
        nextLevel: nextLevel?.name || null,
        progress: Math.min(progress, 100),
        pointsNeeded: nextLevel ? nextLevel.min - points : 0,
    };
};

/**
 * Get unlocked search radius based on points
 * @param {number} points - Total points
 * @returns {Object} { radius: number, label: string, nextLevel: Object }
 */
export const getUnlockedRadius = (points) => {
    const levels = [
        { points: 0, radius: 500, label: '500m' },
        { points: 50, radius: 1000, label: '1 km' },
        { points: 150, radius: 2000, label: '2 km' },
        { points: 500, radius: 5000, label: '5 km' },
        { points: 1000, radius: -1, label: 'Unlimited' },
    ];

    let current = levels[0];
    let next = levels[1];

    for (let i = 0; i < levels.length; i++) {
        if (points >= levels[i].points) {
            current = levels[i];
            next = levels[i + 1] || null;
        }
    }

    return {
        ...current,
        nextLevel: next,
        progress: next ? ((points - current.points) / (next.points - current.points)) * 100 : 100,
    };
};

/**
 * Validate Moroccan phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone is valid
 */
export const validateMoroccanPhone = (phone) => {
    // Moroccan phone numbers: +212 6XXXXXXXX or +212 7XXXXXXXX or 06XXXXXXXX or 07XXXXXXXX
    const regex = /^(?:\+212|0)(?:6|7)\d{8}$/;
    return regex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak',
    };
};

/**
 * Format date to localized string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'full', 'date', 'time', 'relative'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'full') => {
    const d = new Date(date);

    switch (format) {
        case 'date':
            return d.toLocaleDateString('fr-MA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        case 'time':
            return d.toLocaleTimeString('fr-MA', {
                hour: '2-digit',
                minute: '2-digit',
            });
        case 'relative':
            return getRelativeTime(d);
        case 'full':
        default:
            return d.toLocaleString('fr-MA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
    }
};

/**
 * Get relative time string (e.g., "5 minutes ago")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return formatDate(date, 'date');
};

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
};

/**
 * Calculate average rating from reviews
 * @param {Array} reviews - Array of review objects with 'rating' property
 * @returns {number} Average rating (0-5)
 */
export const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
};

/**
 * Get greeting based on time of day
 * @returns {string} Greeting message
 */
export const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

export default {
    formatDistance,
    formatCurrency,
    isPlaceOpen,
    calculatePoints,
    getUserLevel,
    getUnlockedRadius,
    validateMoroccanPhone,
    validateEmail,
    validatePassword,
    formatDate,
    getRelativeTime,
    generateId,
    debounce,
    truncateText,
    calculateAverageRating,
    getGreeting,
};
