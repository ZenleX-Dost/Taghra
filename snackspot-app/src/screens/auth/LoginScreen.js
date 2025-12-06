// SnackSpot - Login Screen
// Premium login screen with email/password and social login

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
import { validateEmail } from '../../utils/helpers';

/**
 * Login Screen Component
 */
const LoginScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { login, socialLogin } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle login
    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await login(email, password);
            // Navigation is handled by AppNavigator based on auth state
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle social login
    const handleSocialLogin = async (provider) => {
        try {
            // In a real app, you would integrate with Google/Facebook SDK
            // and get an access token, then call socialLogin
            Alert.alert(
                'Coming Soon',
                `${provider} login will be available soon!`
            );
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    // Social login button component
    const SocialButton = ({ provider, icon, color, onPress }) => (
        <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: color }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={24} color="#FFFFFF" />
        </TouchableOpacity>
    );

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

                    {/* Logo & Title */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[colors.gradientStart, colors.gradientEnd]}
                            style={styles.logoGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="location" size={40} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Welcome Back
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textLight }]}>
                            Sign in to continue exploring
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            error={errors.email}
                            leftIcon="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            error={errors.password}
                            leftIcon="lock-closed-outline"
                            secureTextEntry
                            autoComplete="password"
                        />

                        {/* Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberMe}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        {
                                            backgroundColor: rememberMe
                                                ? colors.primary
                                                : 'transparent',
                                            borderColor: rememberMe ? colors.primary : colors.border,
                                        },
                                    ]}
                                >
                                    {rememberMe && (
                                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={[styles.rememberText, { color: colors.textLight }]}>
                                    Remember me
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Password reset coming soon!')}>
                                <Text style={[styles.forgotText, { color: colors.primary }]}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            variant="gradient"
                            size="lg"
                            fullWidth
                            loading={loading}
                            style={styles.loginButton}
                        />

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                                or continue with
                            </Text>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Social Login */}
                        <View style={styles.socialContainer}>
                            <SocialButton
                                provider="Google"
                                icon="logo-google"
                                color="#DB4437"
                                onPress={() => handleSocialLogin('Google')}
                            />
                            <SocialButton
                                provider="Facebook"
                                icon="logo-facebook"
                                color="#4267B2"
                                onPress={() => handleSocialLogin('Facebook')}
                            />
                            <SocialButton
                                provider="Apple"
                                icon="logo-apple"
                                color="#000000"
                                onPress={() => handleSocialLogin('Apple')}
                            />
                        </View>
                    </View>

                    {/* Sign Up Link */}
                    <View style={styles.signupContainer}>
                        <Text style={[styles.signupText, { color: colors.textLight }]}>
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.signupLink, { color: colors.primary }]}>
                                Sign Up
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
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
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
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rememberText: {
        fontSize: 14,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        marginBottom: 24,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 24,
    },
    signupText: {
        fontSize: 16,
    },
    signupLink: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default LoginScreen;
