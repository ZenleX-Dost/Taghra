// SnackSpot - Auth Navigator
// Stack navigation for authentication screens

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Import auth screens
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

/**
 * Authentication Navigator
 * Handles the authentication flow: Onboarding -> Login -> Register
 */
const AuthNavigator = () => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            initialRouteName="Onboarding"
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: colors.background },
                gestureEnabled: true,
                cardStyleInterpolator: ({ current, layouts }) => ({
                    cardStyle: {
                        transform: [
                            {
                                translateX: current.progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [layouts.screen.width, 0],
                                }),
                            },
                        ],
                    },
                }),
            }}
        >
            <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{
                    gestureEnabled: false, // Can't go back from onboarding
                }}
            />
            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
            />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
