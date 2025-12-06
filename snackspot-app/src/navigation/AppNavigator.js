// SnackSpot - App Navigator
// Root navigation that handles auth state

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Import additional screens (accessible from any tab)
import PlaceDetailScreen from '../screens/map/PlaceDetailScreen';
import MenuScreen from '../screens/food/MenuScreen';
import CartScreen from '../screens/food/CartScreen';
import CheckoutScreen from '../screens/food/CheckoutScreen';
import BookingScreen from '../screens/health/BookingScreen';
import AppointmentConfirmationScreen from '../screens/health/AppointmentConfirmationScreen';
import AdministrationDetailScreen from '../screens/admin/AdministrationDetailScreen';
import LeaderboardScreen from '../screens/profile/LeaderboardScreen';
import SubDashboardScreen from '../screens/sub/SubDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WriteReviewScreen from '../screens/WriteReviewScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';

const Stack = createStackNavigator();

/**
 * Loading Screen Component
 * Shown while checking authentication state
 */
const LoadingScreen = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
};

/**
 * Main Stack Navigator (for authenticated users)
 * Contains tab navigator and modal screens
 */
const MainStackNavigator = () => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
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
                        opacity: current.progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                        }),
                    },
                }),
            }}
        >
            {/* Main Tab Navigator */}
            <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
            />

            {/* Place Details */}
            <Stack.Screen
                name="PlaceDetail"
                component={PlaceDetailScreen}
            />

            {/* Food Ordering Flow */}
            <Stack.Screen
                name="Menu"
                component={MenuScreen}
            />
            <Stack.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
            />

            {/* Health Booking Flow */}
            <Stack.Screen
                name="Booking"
                component={BookingScreen}
            />
            <Stack.Screen
                name="AppointmentConfirmation"
                component={AppointmentConfirmationScreen}
            />

            {/* Admin Details */}
            <Stack.Screen
                name="AdministrationDetail"
                component={AdministrationDetailScreen}
            />

            {/* Profile Related */}
            <Stack.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
            />
            <Stack.Screen
                name="MyOrders"
                component={MyOrdersScreen}
            />
            <Stack.Screen
                name="MyAppointments"
                component={MyAppointmentsScreen}
            />

            {/* Sub Dashboard */}
            <Stack.Screen
                name="SubDashboard"
                component={SubDashboardScreen}
            />

            {/* Common Screens */}
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="WriteReview"
                component={WriteReviewScreen}
                options={{
                    presentation: 'modal',
                }}
            />
        </Stack.Navigator>
    );
};

/**
 * Root App Navigator
 * Handles authentication flow and navigation state
 */
const AppNavigator = () => {
    const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();
    const { colors, isDarkMode } = useTheme();

    // Navigation theme
    const navigationTheme = {
        dark: isDarkMode,
        colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.error,
        },
    };

    // Show loading while checking auth state
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer theme={navigationTheme}>
            {isAuthenticated ? <MainStackNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AppNavigator;
