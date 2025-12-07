// Taghra - Profile Screen
// User profile with points, badges, and settings

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getUserLevel, getUnlockedRadius } from '../../utils/helpers';

/**
 * Profile Screen Component
 */
const ProfileScreen = ({ navigation }) => {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const { user, logout, isSub } = useAuth();

    // Mock user data
    const userPoints = user?.points || 245;
    const levelInfo = getUserLevel(userPoints);
    const radiusInfo = getUnlockedRadius(userPoints);

    // Menu items
    const menuItems = [
        {
            id: 'orders',
            icon: 'receipt-outline',
            label: 'My Orders',
            screen: 'MyOrders',
        },
        {
            id: 'appointments',
            icon: 'calendar-outline',
            label: 'My Appointments',
            screen: 'MyAppointments',
        },
        {
            id: 'favorites',
            icon: 'heart-outline',
            label: 'Favorites',
            screen: 'Favorites',
        },
        {
            id: 'leaderboard',
            icon: 'trophy-outline',
            label: 'Leaderboard',
            screen: 'Leaderboard',
        },
    ];

    const settingsItems = [
        {
            id: 'notifications',
            icon: 'notifications-outline',
            label: 'Notifications',
            screen: 'NotificationSettings',
        },
        {
            id: 'privacy',
            icon: 'shield-outline',
            label: 'Privacy & Security',
            screen: 'Privacy',
        },
        {
            id: 'help',
            icon: 'help-circle-outline',
            label: 'Help & Support',
            screen: 'Help',
        },
        {
            id: 'about',
            icon: 'information-circle-outline',
            label: 'About Taghra',
            screen: 'About',
        },
    ];

    // Handle logout
    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Profile
                    </Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <LinearGradient
                            colors={[colors.gradientStart, colors.gradientEnd]}
                            style={styles.avatar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.avatarText}>
                                {user?.fullName?.charAt(0) || 'U'}
                            </Text>
                        </LinearGradient>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.text }]}>
                                {user?.fullName || 'User Name'}
                            </Text>
                            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                                {user?.email || 'user@example.com'}
                            </Text>
                            {isSub() && (
                                <View style={[styles.subBadge, { backgroundColor: colors.primaryMuted }]}>
                                    <Ionicons name="star" size={14} color={colors.primary} />
                                    <Text style={[styles.subBadgeText, { color: colors.primary }]}>
                                        Ambassador
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Level & Points */}
                    <View style={styles.levelContainer}>
                        <View style={styles.levelHeader}>
                            <View style={styles.levelBadge}>
                                <Ionicons
                                    name="diamond"
                                    size={16}
                                    color={levelInfo.levelColor}
                                />
                                <Text
                                    style={[styles.levelText, { color: levelInfo.levelColor }]}
                                >
                                    {levelInfo.level}
                                </Text>
                            </View>
                            <Text style={[styles.pointsText, { color: colors.text }]}>
                                {userPoints} pts
                            </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: levelInfo.levelColor,
                                        width: `${levelInfo.progress}%`,
                                    },
                                ]}
                            />
                        </View>
                        {levelInfo.nextLevel && (
                            <Text style={[styles.nextLevelText, { color: colors.textMuted }]}>
                                {levelInfo.pointsNeeded} pts to {levelInfo.nextLevel}
                            </Text>
                        )}
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {radiusInfo.label}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                                Radius
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>23</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                                Orders
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                                Reviews
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Sub Dashboard Link */}
                {isSub() && (
                    <TouchableOpacity
                        style={[styles.subDashboard, { backgroundColor: colors.primaryMuted }]}
                        onPress={() => navigation.navigate('SubDashboard')}
                    >
                        <View style={styles.subDashboardContent}>
                            <Ionicons name="analytics" size={24} color={colors.primary} />
                            <View style={styles.subDashboardText}>
                                <Text style={[styles.subDashboardTitle, { color: colors.primary }]}>
                                    Ambassador Dashboard
                                </Text>
                                <Text style={[styles.subDashboardSubtitle, { color: colors.primary }]}>
                                    View your earnings and submissions
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate(item.screen)}
                        >
                            <View style={styles.menuItemLeft}>
                                <Ionicons name={item.icon} size={22} color={colors.text} />
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {item.label}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Settings Section */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    Settings
                </Text>
                <View style={styles.menuSection}>
                    {/* Dark Mode Toggle */}
                    <View style={[styles.menuItem, { backgroundColor: colors.card }]}>
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="moon-outline" size={22} color={colors.text} />
                            <Text style={[styles.menuItemText, { color: colors.text }]}>
                                Dark Mode
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    {settingsItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { backgroundColor: colors.card }]}
                            onPress={() => navigation.navigate(item.screen)}
                        >
                            <View style={styles.menuItemLeft}>
                                <Ionicons name={item.icon} size={22} color={colors.text} />
                                <Text style={[styles.menuItemText, { color: colors.text }]}>
                                    {item.label}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <Button
                    title="Log Out"
                    variant="outline"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    icon="log-out-outline"
                    iconPosition="left"
                />

                {/* Version */}
                <Text style={[styles.version, { color: colors.textMuted }]}>
                    Version 1.0.0
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    settingsButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    profileCard: {
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        marginBottom: 8,
    },
    subBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    subBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    levelContainer: {
        marginBottom: 20,
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    levelText: {
        fontSize: 14,
        fontWeight: '700',
    },
    pointsText: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    nextLevelText: {
        fontSize: 12,
        marginTop: 6,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    subDashboard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    subDashboardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subDashboardText: {},
    subDashboardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    subDashboardSubtitle: {
        fontSize: 13,
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 8,
    },
    menuSection: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 16,
        marginBottom: 16,
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
    },
});

export default ProfileScreen;
