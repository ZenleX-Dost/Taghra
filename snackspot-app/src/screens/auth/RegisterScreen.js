// Taghra - Register Screen
// Premium registration screen with form validation

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    validateEmail,
    validatePassword,
    validateMoroccanPhone,
} from '../../utils/helpers';

/**
 * Register Screen Component
 */
const RegisterScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { register } = useAuth();

    // Form state
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);

    // Update form field
    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }

        // Check password strength
        if (field === 'password') {
            const strength = validatePassword(value);
            setPasswordStrength(strength);
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Full name validation
        if (!form.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (form.fullName.trim().length < 2) {
            newErrors.fullName = 'Name is too short';
        }

        // Email validation
        if (!form.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(form.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Phone validation
        if (!form.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!validateMoroccanPhone(form.phone)) {
            newErrors.phone = 'Please enter a valid Moroccan phone number';
        }

        // Password validation
        const passwordCheck = validatePassword(form.password);
        if (!form.password) {
            newErrors.password = 'Password is required';
        } else if (!passwordCheck.isValid) {
            newErrors.password = passwordCheck.errors[0];
        }

        // Confirm password validation
        if (!form.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Terms acceptance
        if (!acceptTerms) {
            newErrors.terms = 'You must accept the Terms & Conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle registration
    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await register({
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                password: form.password,
            });
            // Navigation is handled by AppNavigator based on auth state
        } catch (error) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const renderPasswordStrength = () => {
        if (!form.password || !passwordStrength) return null;

        const strengthColors = {
            weak: colors.error,
            medium: colors.warning,
            strong: colors.success,
        };

        const strengthLabels = {
            weak: 'Weak',
            medium: 'Medium',
            strong: 'Strong',
        };

        return (
            <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                    {[1, 2, 3].map((level) => (
                        <View
                            key={level}
                            style={[
                                styles.strengthBar,
                                {
                                    backgroundColor:
                                        (passwordStrength.strength === 'weak' && level === 1) ||
                                            (passwordStrength.strength === 'medium' && level <= 2) ||
                                            passwordStrength.strength === 'strong'
                                            ? strengthColors[passwordStrength.strength]
                                            : colors.border,
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text
                    style={[
                        styles.strengthText,
                        { color: strengthColors[passwordStrength.strength] },
                    ]}
                >
                    {strengthLabels[passwordStrength.strength]}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Create Account
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textLight }]}>
                            Join Taghra and start exploring
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={form.fullName}
                            onChangeText={(value) => updateField('fullName', value)}
                            error={errors.fullName}
                            leftIcon="person-outline"
                            autoCapitalize="words"
                            autoComplete="name"
                        />

                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={form.email}
                            onChangeText={(value) => updateField('email', value)}
                            error={errors.email}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Input
                            label="Phone Number"
                            placeholder="+212 6XX XXX XXX"
                            value={form.phone}
                            onChangeText={(value) => updateField('phone', value)}
                            error={errors.phone}
                            leftIcon="call-outline"
                            keyboardType="phone-pad"
                            autoComplete="tel"
                        />

                        <View>
                            <Input
                                label="Password"
                                placeholder="Create a strong password"
                                value={form.password}
                                onChangeText={(value) => updateField('password', value)}
                                error={errors.password}
                                leftIcon="lock-closed-outline"
                                secureTextEntry
                                autoComplete="new-password"
                            />
                            {renderPasswordStrength()}
                        </View>

                        <Input
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={form.confirmPassword}
                            onChangeText={(value) => updateField('confirmPassword', value)}
                            error={errors.confirmPassword}
                            leftIcon="lock-closed-outline"
                            secureTextEntry
                            autoComplete="new-password"
                        />

                        {/* Terms & Conditions */}
                        <TouchableOpacity
                            style={styles.termsContainer}
                            onPress={() => setAcceptTerms(!acceptTerms)}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: acceptTerms
                                            ? colors.primary
                                            : 'transparent',
                                        borderColor: acceptTerms
                                            ? colors.primary
                                            : errors.terms
                                                ? colors.error
                                                : colors.border,
                                    },
                                ]}
                            >
                                {acceptTerms && (
                                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                )}
                            </View>
                            <Text style={[styles.termsText, { color: colors.textLight }]}>
                                I agree to the{' '}
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                                    Terms & Conditions
                                </Text>{' '}
                                and{' '}
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                                    Privacy Policy
                                </Text>
                            </Text>
                        </TouchableOpacity>
                        {errors.terms && (
                            <Text style={[styles.termsError, { color: colors.error }]}>
                                {errors.terms}
                            </Text>
                        )}

                        {/* Register Button */}
                        <Button
                            title="Create Account"
                            onPress={handleRegister}
                            variant="gradient"
                            size="lg"
                            fullWidth
                            loading={loading}
                            style={styles.registerButton}
                        />
                    </View>

                    {/* Sign In Link */}
                    <View style={styles.signinContainer}>
                        <Text style={[styles.signinText, { color: colors.textLight }]}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.signinLink, { color: colors.primary }]}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        marginBottom: 24,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 16,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
    },
    strengthBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    strengthText: {
        marginLeft: 12,
        fontSize: 12,
        fontWeight: '600',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        marginTop: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
    termsError: {
        fontSize: 12,
        marginBottom: 16,
        marginLeft: 34,
    },
    registerButton: {
        marginTop: 16,
    },
    signinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 24,
    },
    signinText: {
        fontSize: 16,
    },
    signinLink: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default RegisterScreen;
