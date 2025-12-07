// Placeholder screens for Taghra
// These are minimal placeholders to complete navigation

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';

const PlaceholderScreen = ({ navigation, route, title }) => {
    const { colors } = useTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>{title || route.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Coming Soon</Text>
                <Button title="Go Back" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: 20 }} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 16 },
});

// Export individual screens
export const MenuScreen = (props) => <PlaceholderScreen {...props} title="Menu" />;
export const CartScreen = (props) => <PlaceholderScreen {...props} title="Cart" />;
export const CheckoutScreen = (props) => <PlaceholderScreen {...props} title="Checkout" />;
export const BookingScreen = (props) => <PlaceholderScreen {...props} title="Book Appointment" />;
export const AppointmentConfirmationScreen = (props) => <PlaceholderScreen {...props} title="Appointment Confirmed" />;
export const AdministrationDetailScreen = (props) => <PlaceholderScreen {...props} title="Document Details" />;
export const LeaderboardScreen = (props) => <PlaceholderScreen {...props} title="Leaderboard" />;
export const SubDashboardScreen = (props) => <PlaceholderScreen {...props} title="Ambassador Dashboard" />;
export const NotificationsScreen = (props) => <PlaceholderScreen {...props} title="Notifications" />;
export const WriteReviewScreen = (props) => <PlaceholderScreen {...props} title="Write Review" />;
export const MyOrdersScreen = (props) => <PlaceholderScreen {...props} title="My Orders" />;
export const MyAppointmentsScreen = (props) => <PlaceholderScreen {...props} title="My Appointments" />;
