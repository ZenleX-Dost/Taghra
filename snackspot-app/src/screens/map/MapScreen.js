// Taghra - Map Screen
// Main interactive map screen with geolocation and place markers

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import useLocation from '../../hooks/useLocation';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CATEGORIES, MAP_CONFIG } from '../../utils/constants';
import { formatDistance, getUnlockedRadius } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

// Mock data for demonstration
const MOCK_PLACES = [
    {
        id: '1',
        name: 'Café Snack Marrakech',
        category: 'food',
        latitude: 33.5731,
        longitude: -7.5898,
        isOpen: true,
        rating: 4.5,
        reviewCount: 128,
        distance: 150,
    },
    {
        id: '2',
        name: 'Dr. Ahmed Clinic',
        category: 'health',
        latitude: 33.5751,
        longitude: -7.5878,
        isOpen: true,
        rating: 4.8,
        reviewCount: 89,
        distance: 320,
    },
    {
        id: '3',
        name: 'Vet Care Center',
        category: 'vet',
        latitude: 33.5711,
        longitude: -7.5918,
        isOpen: false,
        rating: 4.2,
        reviewCount: 45,
        distance: 280,
    },
    {
        id: '4',
        name: 'Municipal Office',
        category: 'admin',
        latitude: 33.5741,
        longitude: -7.5858,
        isOpen: true,
        rating: 3.9,
        reviewCount: 23,
        distance: 450,
    },
];

/**
 * Category Filter Chip Component
 */
const FilterChip = ({ category, isActive, onPress }) => {
    const { colors } = useTheme();
    const categoryData = CATEGORIES[category.toUpperCase()];

    return (
        <TouchableOpacity
            style={[
                styles.filterChip,
                {
                    backgroundColor: isActive ? categoryData.color : colors.card,
                    borderColor: isActive ? categoryData.color : colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons
                name={categoryData.icon}
                size={18}
                color={isActive ? '#FFFFFF' : categoryData.color}
            />
            <Text
                style={[
                    styles.filterChipText,
                    { color: isActive ? '#FFFFFF' : colors.text },
                ]}
            >
                {categoryData.label.split(' ')[0]}
            </Text>
        </TouchableOpacity>
    );
};

/**
 * Place Card Preview Component
 */
const PlaceCard = ({ place, onPress, onClose }) => {
    const { colors, shadows } = useTheme();
    const categoryData = CATEGORIES[place.category.toUpperCase()];
    const slideAnim = useRef(new Animated.Value(200)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.placeCardContainer,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <Card
                style={[styles.placeCard, shadows.xl]}
                onPress={onPress}
            >
                <View style={styles.placeCardHeader}>
                    <View
                        style={[
                            styles.placeCardIcon,
                            { backgroundColor: `${categoryData.color}20` },
                        ]}
                    >
                        <Ionicons
                            name={categoryData.icon}
                            size={24}
                            color={categoryData.color}
                        />
                    </View>
                    <View style={styles.placeCardInfo}>
                        <Text style={[styles.placeCardName, { color: colors.text }]}>
                            {place.name}
                        </Text>
                        <View style={styles.placeCardMeta}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor: place.isOpen
                                            ? colors.successMuted
                                            : colors.errorMuted,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: place.isOpen ? colors.success : colors.error },
                                    ]}
                                >
                                    {place.isOpen ? 'Open' : 'Closed'}
                                </Text>
                            </View>
                            <Text style={[styles.placeCardDistance, { color: colors.textMuted }]}>
                                {formatDistance(place.distance)}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.placeCardClose}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
                <View style={styles.placeCardFooter}>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFB84C" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>
                            {place.rating}
                        </Text>
                        <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                            ({place.reviewCount})
                        </Text>
                    </View>
                    <Button
                        title="View Details"
                        variant="primary"
                        size="sm"
                        icon="arrow-forward"
                        iconPosition="right"
                        onPress={onPress}
                    />
                </View>
            </Card>
        </Animated.View>
    );
};

/**
 * Map Screen Component
 */
const MapScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const { user } = useAuth();
    const { location, isLoading: locationLoading, getCurrentLocation } = useLocation();

    // State
    const [places, setPlaces] = useState(MOCK_PLACES);
    const [activeFilters, setActiveFilters] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showRadiusCircle, setShowRadiusCircle] = useState(true);

    // Refs
    const mapRef = useRef(null);

    // Get user's unlocked radius
    const userPoints = user?.points || 0;
    const radiusInfo = getUnlockedRadius(userPoints);
    const searchRadius = radiusInfo.radius === -1 ? 10000 : radiusInfo.radius;

    // Center map on user location
    const centerOnUser = useCallback(() => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: MAP_CONFIG.DEFAULT_DELTA,
                longitudeDelta: MAP_CONFIG.DEFAULT_DELTA,
            });
        }
    }, [location]);

    // Toggle filter
    const toggleFilter = (category) => {
        setActiveFilters((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    // Filter places
    const filteredPlaces = places.filter((place) =>
        activeFilters.length === 0 || activeFilters.includes(place.category)
    );

    // Handle marker press
    const handleMarkerPress = (place) => {
        setSelectedPlace(place);
    };

    // Handle place card press
    const handlePlacePress = () => {
        if (selectedPlace) {
            navigation.navigate('PlaceDetail', { placeId: selectedPlace.id });
        }
    };

    // Get marker color based on category
    const getMarkerColor = (place) => {
        const categoryData = CATEGORIES[place.category.toUpperCase()];
        return place.isOpen ? categoryData.color : colors.closed;
    };

    // Map style for dark mode
    const mapStyle = isDarkMode
        ? [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }],
            },
        ]
        : [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                    latitude: location?.latitude || MAP_CONFIG.DEFAULT_LATITUDE,
                    longitude: location?.longitude || MAP_CONFIG.DEFAULT_LONGITUDE,
                    latitudeDelta: MAP_CONFIG.DEFAULT_DELTA,
                    longitudeDelta: MAP_CONFIG.DEFAULT_DELTA,
                }}
                showsUserLocation
                showsMyLocationButton={false}
                customMapStyle={mapStyle}
                onPress={() => setSelectedPlace(null)}
            >
                {/* Search Radius Circle */}
                {showRadiusCircle && location && (
                    <Circle
                        center={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }}
                        radius={searchRadius}
                        strokeWidth={2}
                        strokeColor={`${colors.primary}80`}
                        fillColor={`${colors.primary}10`}
                    />
                )}

                {/* Place Markers */}
                {filteredPlaces.map((place) => (
                    <Marker
                        key={place.id}
                        coordinate={{
                            latitude: place.latitude,
                            longitude: place.longitude,
                        }}
                        onPress={() => handleMarkerPress(place)}
                    >
                        <View
                            style={[
                                styles.markerContainer,
                                {
                                    backgroundColor: getMarkerColor(place),
                                    borderColor: '#FFFFFF',
                                },
                            ]}
                        >
                            <Ionicons
                                name={CATEGORIES[place.category.toUpperCase()].icon}
                                size={16}
                                color="#FFFFFF"
                            />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Top Bar */}
            <SafeAreaView style={styles.topBar} edges={['top']}>
                {/* Search Bar */}
                <TouchableOpacity
                    style={[
                        styles.searchBar,
                        { backgroundColor: colors.card },
                    ]}
                    activeOpacity={0.9}
                >
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>
                        Search places...
                    </Text>
                    <View style={styles.searchActions}>
                        <TouchableOpacity
                            style={[styles.searchButton, { backgroundColor: colors.primary }]}
                        >
                            <Ionicons name="options" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    {Object.keys(CATEGORIES).map((category) => (
                        <FilterChip
                            key={category}
                            category={category}
                            isActive={activeFilters.includes(category.toLowerCase())}
                            onPress={() => toggleFilter(category.toLowerCase())}
                        />
                    ))}
                </View>

                {/* Radius Info */}
                <TouchableOpacity
                    style={[styles.radiusInfo, { backgroundColor: colors.card }]}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.gradientEnd]}
                        style={styles.radiusIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="analytics" size={16} color="#FFFFFF" />
                    </LinearGradient>
                    <View>
                        <Text style={[styles.radiusLabel, { color: colors.textMuted }]}>
                            Search Radius
                        </Text>
                        <Text style={[styles.radiusValue, { color: colors.text }]}>
                            {radiusInfo.label}
                        </Text>
                    </View>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Map Controls */}
            <View style={styles.mapControls}>
                <TouchableOpacity
                    style={[styles.mapButton, { backgroundColor: colors.card }]}
                    onPress={centerOnUser}
                >
                    <Ionicons name="locate" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mapButton, { backgroundColor: colors.card }]}
                    onPress={() => setShowRadiusCircle(!showRadiusCircle)}
                >
                    <Ionicons
                        name={showRadiusCircle ? 'eye' : 'eye-off'}
                        size={24}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* Notifications Button */}
            <TouchableOpacity
                style={[styles.notificationButton, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('Notifications')}
            >
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
                <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                    <Text style={styles.notificationBadgeText}>3</Text>
                </View>
            </TouchableOpacity>

            {/* Selected Place Card */}
            {selectedPlace && (
                <PlaceCard
                    place={selectedPlace}
                    onPress={handlePlacePress}
                    onClose={() => setSelectedPlace(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    searchActions: {
        flexDirection: 'row',
        gap: 8,
    },
    searchButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    radiusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    radiusIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radiusLabel: {
        fontSize: 11,
    },
    radiusValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    mapControls: {
        position: 'absolute',
        right: 16,
        bottom: 160,
        gap: 12,
    },
    mapButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    notificationButton: {
        position: 'absolute',
        top: 60,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    markerContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    placeCardContainer: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
    },
    placeCard: {
        padding: 16,
    },
    placeCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    placeCardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeCardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    placeCardName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    placeCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    placeCardDistance: {
        fontSize: 14,
    },
    placeCardClose: {
        padding: 4,
    },
    placeCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '700',
    },
    reviewCount: {
        fontSize: 14,
    },
});

export default MapScreen;
