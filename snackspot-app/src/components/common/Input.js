// SnackSpot - Premium Input Component
// A versatile input component with validation and styling

import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * Premium Input Component
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChangeText - Change handler
 * @param {string} props.error - Error message
 * @param {string} props.hint - Hint text
 * @param {string} props.leftIcon - Left icon name (Ionicons)
 * @param {string} props.rightIcon - Right icon name (Ionicons)
 * @param {Function} props.onRightIconPress - Right icon press handler
 * @param {boolean} props.secureTextEntry - Password input
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.multiline - Multiline input
 * @param {number} props.numberOfLines - Number of lines for multiline
 * @param {string} props.size - Input size: 'sm', 'md', 'lg'
 * @param {Object} props.style - Additional container styles
 * @param {Object} props.inputStyle - Additional input styles
 */
const Input = ({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    secureTextEntry = false,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    size = 'md',
    style,
    inputStyle,
    ...props
}) => {
    const { colors, shadows } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const animatedBorder = useRef(new Animated.Value(0)).current;
    const inputRef = useRef(null);

    // Handle focus animation
    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(animatedBorder, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.timing(animatedBorder, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    // Get size-specific styles
    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    height: multiline ? undefined : 40,
                    paddingHorizontal: 12,
                    fontSize: 14,
                    iconSize: 18,
                    borderRadius: 8,
                };
            case 'lg':
                return {
                    height: multiline ? undefined : 56,
                    paddingHorizontal: 20,
                    fontSize: 18,
                    iconSize: 24,
                    borderRadius: 16,
                };
            case 'md':
            default:
                return {
                    height: multiline ? undefined : 48,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    iconSize: 20,
                    borderRadius: 12,
                };
        }
    };

    const sizeStyles = getSizeStyles();

    // Get border color based on state
    const borderColor = animatedBorder.interpolate({
        inputRange: [0, 1],
        outputRange: [
            error ? colors.error : colors.inputBorder,
            error ? colors.error : colors.primary,
        ],
    });

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View style={[styles.container, style]}>
            {/* Label */}
            {label && (
                <Text
                    style={[
                        styles.label,
                        {
                            color: error ? colors.error : isFocused ? colors.primary : colors.text,
                        },
                    ]}
                >
                    {label}
                </Text>
            )}

            {/* Input Container */}
            <Animated.View
                style={[
                    styles.inputContainer,
                    {
                        height: sizeStyles.height,
                        paddingHorizontal: sizeStyles.paddingHorizontal,
                        borderRadius: sizeStyles.borderRadius,
                        backgroundColor: disabled
                            ? colors.border
                            : colors.inputBackground,
                        borderColor: borderColor,
                    },
                    isFocused && shadows.sm,
                ]}
            >
                {/* Left Icon */}
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={sizeStyles.iconSize}
                        color={
                            error
                                ? colors.error
                                : isFocused
                                    ? colors.primary
                                    : colors.textMuted
                        }
                        style={styles.leftIcon}
                    />
                )}

                {/* Text Input */}
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.inputPlaceholder}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={[
                        styles.input,
                        {
                            fontSize: sizeStyles.fontSize,
                            color: disabled ? colors.textMuted : colors.inputText,
                            minHeight: multiline ? numberOfLines * 24 : undefined,
                        },
                        inputStyle,
                    ]}
                    {...props}
                />

                {/* Password Toggle / Right Icon */}
                {secureTextEntry ? (
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.rightIconButton}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={sizeStyles.iconSize}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                ) : rightIcon ? (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIconButton}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={sizeStyles.iconSize}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                ) : null}
            </Animated.View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons
                        name="alert-circle"
                        size={14}
                        color={colors.error}
                        style={styles.errorIcon}
                    />
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        {error}
                    </Text>
                </View>
            )}

            {/* Hint */}
            {hint && !error && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        fontWeight: '400',
    },
    leftIcon: {
        marginRight: 12,
    },
    rightIconButton: {
        marginLeft: 8,
        padding: 4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    errorIcon: {
        marginRight: 4,
    },
    errorText: {
        fontSize: 12,
        fontWeight: '500',
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
    },
});

export default Input;
