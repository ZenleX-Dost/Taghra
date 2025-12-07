// TAGHRA - Main Tab Navigator
// Bottom tab navigation for authenticated users

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';

// Import main screens
import MapScreen from '../screens/map/MapScreen';
import HealthScreen from '../screens/health/HealthScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddPlaceScreen from '../screens/sub/AddPlaceScreen';

const Tab = createBottomTabNavigator();

/**
 * Custom Tab Bar Background with blur effect
 */
const TabBarBackground = () => {
    const { isDarkMode } = useTheme();

    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={100}
                tint={isDarkMode ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />
        );
    }

    return null;
};

/**
 * Tab Bar Icon Component
 */
const TabIcon = ({ focused, color, route }) => {
    const getIconName = () => {
        switch (route.name) {
            case 'Map':
                return focused ? 'map' : 'map-outline';
            case 'Health':
                return focused ? 'medical' : 'medical-outline';
            case 'Admin':
                return focused ? 'document-text' : 'document-text-outline';
            case 'Profile':
                return focused ? 'person' : 'person-outline';
            case 'AddPlace':
                return focused ? 'add-circle' : 'add-circle-outline';
            default:
                return 'help-circle-outline';
        }
    };

    return (
        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
            <Ionicons name={getIconName()} size={24} color={color} />
        </View>
    );
};

/**
 * Main Tab Navigator
 * Displays bottom navigation with Map, Health, Admin, Profile, and AddPlace (for Subs)
 */
const MainTabNavigator = () => {
    const { colors, isDarkMode } = useTheme();
    const { user, isSub } = useAuth();

    // Ensure colors is defined
    const safeColors = colors || {
        primary: '#F5A623',
        tabBarInactive: '#999',
    };

    return (
        <Tab.Navigator
            initialRouteName="Map"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color }) => (
                    <TabIcon focused={focused} color={color} route={route} />
                ),
                tabBarActiveTintColor: safeColors.primary,
                tabBarInactiveTintColor: safeColors.tabBarInactive,
                tabBarStyle: {
                    position: 'absolute',
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingTop: 10,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    backgroundColor: isDarkMode
                        ? 'rgba(28, 41, 56, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarBackground: () => <TabBarBackground />,
            })}
        >
            <Tab.Screen
                name="Map"
                component={MapScreen}
                options={{
                    tabBarLabel: 'Explore',
                }}
            />
            <Tab.Screen
                name="Health"
                component={HealthScreen}
                options={{
                    tabBarLabel: 'Health',
                }}
            />

            {/* Add Place tab - Only visible for Sub users */}
            {isSub() && (
                <Tab.Screen
                    name="AddPlace"
                    component={AddPlaceScreen}
                    options={{
                        tabBarLabel: 'Add',
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.addButton, { backgroundColor: safeColors.primary }]}>
                                <Ionicons name="add" size={28} color="#FFFFFF" />
                            </View>
                        ),
                    }}
                />
            )}

            <Tab.Screen
                name="Admin"
                component={AdminScreen}
                options={{
                    tabBarLabel: 'Docs',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    iconContainerFocused: {
        // Optional: Add background for focused state
    },
    addButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -20,
        shadowColor: '#F5A623',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});

export default MainTabNavigator;
