// TAGHRA - Premium Card Component
// A versatile card container with shadow and press support

import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Premium Card Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {Function} props.onPress - Press handler (makes card pressable)
 * @param {string} props.variant - Card variant: 'elevated', 'outlined', 'filled'
 * @param {string} props.padding - Padding size: 'none', 'sm', 'md', 'lg'
 * @param {string} props.radius - Border radius: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.disabled - Disabled state for pressable cards
 * @param {Object} props.style - Additional container styles
 */
const Card = ({
    children,
    onPress,
    variant = 'elevated',
    padding = 'md',
    radius = 'md',
    disabled = false,
    style,
}) => {
    const { colors, shadows } = useTheme();
    const scaleValue = React.useRef(new Animated.Value(1)).current;

    // Get padding based on size
    const getPadding = () => {
        switch (padding) {
            case 'none':
                return 0;
            case 'sm':
                return 12;
            case 'lg':
                return 24;
            case 'md':
            default:
                return 16;
        }
    };

    // Get border radius based on size
    const getBorderRadius = () => {
        switch (radius) {
            case 'sm':
                return 8;
            case 'lg':
                return 20;
            case 'xl':
                return 24;
            case 'md':
            default:
                return 12;
        }
    };

    // Get variant-specific styles
    const getVariantStyles = () => {
        switch (variant) {
            case 'outlined':
                return {
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...shadows.none,
                };
            case 'filled':
                return {
                    backgroundColor: colors.surface,
                    borderWidth: 0,
                    ...shadows.none,
                };
            case 'elevated':
            default:
                return {
                    backgroundColor: colors.card,
                    borderWidth: 0,
                    ...shadows.md,
                };
        }
    };

    // Press animation handlers
    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const cardStyles = [
        styles.card,
        {
            padding: getPadding(),
            borderRadius: getBorderRadius(),
        },
        getVariantStyles(),
        style,
    ];

    // Pressable card
    if (onPress) {
        return (
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled}
                    activeOpacity={1}
                    style={cardStyles}
                >
                    {children}
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // Non-pressable card
    return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
});

export default Card;
