// SnackSpot - Premium Button Component
// A versatile button component with multiple variants and states

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * Premium Button Component
 * 
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Press handler
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', 'ghost', 'gradient'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.icon - Icon name (Ionicons)
 * @param {string} props.iconPosition - Icon position: 'left', 'right'
 * @param {boolean} props.fullWidth - Take full width
 * @param {Object} props.style - Additional container styles
 * @param {Object} props.textStyle - Additional text styles
 */
const Button = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
}) => {
    const { colors, shadows } = useTheme();

    // Get size-specific styles
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    height: 36,
                    paddingHorizontal: 16,
                    fontSize: 14,
                    iconSize: 16,
                    borderRadius: 8,
                };
            case 'lg':
                return {
                    height: 56,
                    paddingHorizontal: 28,
                    fontSize: 18,
                    iconSize: 22,
                    borderRadius: 16,
                };
            case 'md':
            default:
                return {
                    height: 48,
                    paddingHorizontal: 24,
                    fontSize: 16,
                    iconSize: 20,
                    borderRadius: 12,
                };
        }
    };

    // Get variant-specific styles
    const getVariantStyles = () => {
        const isDisabled = disabled || loading;

        switch (variant) {
            case 'secondary':
                return {
                    container: {
                        backgroundColor: isDisabled ? colors.textMuted : colors.secondary,
                    },
                    text: { color: '#FFFFFF' },
                    shadow: shadows.md,
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderColor: isDisabled ? colors.textMuted : colors.primary,
                    },
                    text: { color: isDisabled ? colors.textMuted : colors.primary },
                    shadow: shadows.none,
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: { color: isDisabled ? colors.textMuted : colors.primary },
                    shadow: shadows.none,
                };
            case 'gradient':
                return {
                    container: {},
                    text: { color: '#FFFFFF' },
                    shadow: shadows.primary,
                    useGradient: true,
                };
            case 'danger':
                return {
                    container: {
                        backgroundColor: isDisabled ? colors.textMuted : colors.error,
                    },
                    text: { color: '#FFFFFF' },
                    shadow: shadows.md,
                };
            case 'success':
                return {
                    container: {
                        backgroundColor: isDisabled ? colors.textMuted : colors.success,
                    },
                    text: { color: '#FFFFFF' },
                    shadow: shadows.md,
                };
            case 'primary':
            default:
                return {
                    container: {
                        backgroundColor: isDisabled ? colors.textMuted : colors.primary,
                    },
                    text: { color: '#FFFFFF' },
                    shadow: shadows.primary,
                };
        }
    };

    const sizeStyles = getSizeStyles();
    const variantStyles = getVariantStyles();

    // Render icon
    const renderIcon = (position) => {
        if (!icon || loading || iconPosition !== position) return null;

        return (
            <Ionicons
                name={icon}
                size={sizeStyles.iconSize}
                color={variantStyles.text.color}
                style={position === 'left' ? styles.iconLeft : styles.iconRight}
            />
        );
    };

    // Render content
    const renderContent = () => (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variantStyles.text.color}
                />
            ) : (
                <>
                    {renderIcon('left')}
                    <Text
                        style={[
                            styles.text,
                            { fontSize: sizeStyles.fontSize },
                            variantStyles.text,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {renderIcon('right')}
                </>
            )}
        </View>
    );

    // Render gradient button
    if (variantStyles.useGradient && !disabled && !loading) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    fullWidth && styles.fullWidth,
                    variantStyles.shadow,
                    style,
                ]}
            >
                <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.button,
                        {
                            height: sizeStyles.height,
                            paddingHorizontal: sizeStyles.paddingHorizontal,
                            borderRadius: sizeStyles.borderRadius,
                        },
                    ]}
                >
                    {renderContent()}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.button,
                {
                    height: sizeStyles.height,
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                    borderRadius: sizeStyles.borderRadius,
                },
                variantStyles.container,
                variantStyles.shadow,
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    fullWidth: {
        width: '100%',
    },
});

export default Button;
