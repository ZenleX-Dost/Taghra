// Taghra - Onboarding Screen
// Premium carousel onboarding with role selection

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    Animated,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const { width, height } = Dimensions.get('window');

// Onboarding slides data
const slides = [
    {
        id: '1',
        title: 'Discover Nearby',
        subtitle: 'Find restaurants, doctors, and services around you in real-time',
        icon: 'location',
        gradient: ['#FF6B6B', '#FF8A8A'],
    },
    {
        id: '2',
        title: 'Order & Book',
        subtitle: 'Order food or book appointments with just a few taps',
        icon: 'calendar',
        gradient: ['#4FACFE', '#00F2FE'],
    },
    {
        id: '3',
        title: 'Earn Rewards',
        subtitle: 'Collect points, unlock badges, and expand your search radius',
        icon: 'gift',
        gradient: ['#F5A623', '#FF6B6B'],
    },
];

// User role options
const roles = [
    {
        id: 'user',
        title: 'User',
        description: 'Find places & order food',
        icon: 'person',
        color: '#54A0FF',
    },
    {
        id: 'restaurant',
        title: 'Restaurant',
        description: 'Manage your business',
        icon: 'restaurant',
        color: '#FF6B6B',
    },
    {
        id: 'doctor',
        title: 'Doctor',
        description: 'Manage appointments',
        icon: 'medical',
        color: '#00C48C',
    },
    {
        id: 'vet',
        title: 'Veterinarian',
        description: 'Pet healthcare services',
        icon: 'paw',
        color: '#FFB84C',
    },
    {
        id: 'sub',
        title: 'Ambassador',
        description: 'Add places & earn rewards',
        icon: 'star',
        color: '#9B59B6',
    },
];

/**
 * Onboarding Screen Component
 */
const OnboardingScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { completeOnboarding } = useAuth();

    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showRoleSelection, setShowRoleSelection] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [locationGranted, setLocationGranted] = useState(false);

    // Refs
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const roleSelectionOpacity = useRef(new Animated.Value(0)).current;

    // Handle slide change
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    // Request location permission
    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationGranted(true);
                return true;
            } else {
                Alert.alert(
                    'Location Required',
                    'Taghra needs your location to find nearby places. Please enable location in settings.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        } catch (error) {
            console.error('Error requesting location:', error);
            return false;
        }
    };

    // Handle Get Started / Next
    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            // Request location first
            const hasLocation = await requestLocationPermission();
            if (hasLocation) {
                // Show role selection
                setShowRoleSelection(true);
                Animated.timing(roleSelectionOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }
        }
    };

    // Handle role selection
    const handleRoleSelect = (role) => {
        setSelectedRole(role.id);
    };

    // Handle continue after role selection
    const handleContinue = async () => {
        if (!selectedRole) {
            Alert.alert('Select a Role', 'Please select how you want to use Taghra.');
            return;
        }

        await completeOnboarding();
        navigation.replace('Login');
    };

    // Render slide item
    const renderSlide = ({ item, index }) => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View
                style={[
                    styles.slide,
                    {
                        width,
                        transform: [{ scale }],
                        opacity,
                    },
                ]}
            >
                <LinearGradient
                    colors={item.gradient}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name={item.icon} size={80} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.slideTitle, { color: colors.text }]}>
                    {item.title}
                </Text>
                <Text style={[styles.slideSubtitle, { color: colors.textLight }]}>
                    {item.subtitle}
                </Text>
            </Animated.View>
        );
    };

    // Render pagination dots
    const renderPagination = () => (
        <View style={styles.paginationContainer}>
            {slides.map((_, index) => {
                const inputRange = [
                    (index - 1) * width,
                    index * width,
                    (index + 1) * width,
                ];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });

                const dotOpacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity: dotOpacity,
                                backgroundColor: colors.primary,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    // Render role selection
    const renderRoleSelection = () => (
        <Animated.View
            style={[
                styles.roleSelectionContainer,
                {
                    opacity: roleSelectionOpacity,
                    backgroundColor: colors.background,
                },
            ]}
        >
            <SafeAreaView style={styles.roleSelectionContent}>
                <Text style={[styles.roleTitle, { color: colors.text }]}>
                    How will you use Taghra?
                </Text>
                <Text style={[styles.roleSubtitle, { color: colors.textLight }]}>
                    Select your primary role. You can change this later.
                </Text>

                <View style={styles.rolesGrid}>
                    {roles.map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            style={[
                                styles.roleCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor:
                                        selectedRole === role.id ? role.color : colors.border,
                                    borderWidth: selectedRole === role.id ? 2 : 1,
                                },
                            ]}
                            activeOpacity={0.7}
                            onPress={() => handleRoleSelect(role)}
                        >
                            <View
                                style={[
                                    styles.roleIconContainer,
                                    { backgroundColor: `${role.color}20` },
                                ]}
                            >
                                <Ionicons name={role.icon} size={28} color={role.color} />
                            </View>
                            <Text style={[styles.roleCardTitle, { color: colors.text }]}>
                                {role.title}
                            </Text>
                            <Text
                                style={[styles.roleCardDescription, { color: colors.textMuted }]}
                            >
                                {role.description}
                            </Text>
                            {selectedRole === role.id && (
                                <View
                                    style={[
                                        styles.roleCheckmark,
                                        { backgroundColor: role.color },
                                    ]}
                                >
                                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.roleButtonContainer}>
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        variant="gradient"
                        size="lg"
                        fullWidth
                        disabled={!selectedRole}
                        icon="arrow-forward"
                        iconPosition="right"
                    />
                </View>
            </SafeAreaView>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {!showRoleSelection ? (
                <>
                    {/* Skip button */}
                    <SafeAreaView style={styles.header}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowRoleSelection(true);
                                Animated.timing(roleSelectionOpacity, {
                                    toValue: 1,
                                    duration: 300,
                                    useNativeDriver: true,
                                }).start();
                            }}
                            style={styles.skipButton}
                        >
                            <Text style={[styles.skipText, { color: colors.textMuted }]}>
                                Skip
                            </Text>
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Slides */}
                    <Animated.FlatList
                        ref={flatListRef}
                        data={slides}
                        renderItem={renderSlide}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: true }
                        )}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                    />

                    {/* Pagination */}
                    {renderPagination()}

                    {/* Button */}
                    <View style={styles.buttonContainer}>
                        <Button
                            title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                            onPress={handleNext}
                            variant="gradient"
                            size="lg"
                            fullWidth
                            icon="arrow-forward"
                            iconPosition="right"
                        />
                    </View>
                </>
            ) : (
                renderRoleSelection()
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
    },
    skipButton: {
        padding: 20,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    slideTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    slideSubtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 26,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    // Role Selection Styles
    roleSelectionContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    roleSelectionContent: {
        flex: 1,
        paddingHorizontal: 24,
    },
    roleTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    roleSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    rolesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    roleCard: {
        width: (width - 64) / 2,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        position: 'relative',
    },
    roleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    roleCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    roleCardDescription: {
        fontSize: 12,
    },
    roleCheckmark: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleButtonContainer: {
        marginTop: 'auto',
        paddingBottom: 40,
    },
});

export default OnboardingScreen;
