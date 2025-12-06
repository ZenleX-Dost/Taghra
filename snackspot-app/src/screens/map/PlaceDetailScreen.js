// SnackSpot - Place Detail Screen
// Detailed view of a place with menu, reviews, and actions

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    Linking,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CATEGORIES } from '../../utils/constants';
import { formatDistance, formatCurrency, isPlaceOpen } from '../../utils/helpers';

const { width } = Dimensions.get('window');

// Mock place data
const MOCK_PLACE = {
    id: '1',
    name: 'Café Snack Marrakech',
    category: 'food',
    description: 'Authentic Moroccan cuisine with a modern twist. Fresh ingredients, traditional recipes.',
    address: '123 Boulevard Mohammed V, Casablanca',
    phone: '+212 5XX XXX XXX',
    website: 'https://example.com',
    latitude: 33.5731,
    longitude: -7.5898,
    rating: 4.5,
    reviewCount: 128,
    priceLevel: 2,
    distance: 150,
    photos: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
    ],
    openingHours: {
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '23:00' },
        saturday: { open: '09:00', close: '23:00' },
        sunday: { closed: true },
    },
    features: ['Takeaway', 'Delivery', 'Outdoor Seating', 'WiFi', 'Parking'],
    tags: ['Popular', 'Fast Service', 'Family Friendly'],
};

/**
 * Place Detail Screen Component
 */
const PlaceDetailScreen = ({ navigation, route }) => {
    const { colors, shadows } = useTheme();
    const { placeId } = route.params || {};

    // State
    const [place, setPlace] = useState(MOCK_PLACE);
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Refs
    const scrollY = useRef(new Animated.Value(0)).current;
    const photoScrollRef = useRef(null);

    // Get open status
    const openStatus = isPlaceOpen(place.openingHours);
    const categoryData = CATEGORIES[place.category.toUpperCase()];

    // Header animation
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Handle call
    const handleCall = () => {
        Linking.openURL(`tel:${place.phone}`);
    };

    // Handle directions
    const handleDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
        Linking.openURL(url);
    };

    // Handle share
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${place.name} on SnackSpot! ${place.address}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    // Handle order/book
    const handlePrimaryAction = () => {
        if (place.category === 'food') {
            navigation.navigate('Menu', { placeId: place.id });
        } else if (place.category === 'health' || place.category === 'vet') {
            navigation.navigate('Booking', { doctorId: place.id });
        } else {
            navigation.navigate('AdministrationDetail', { adminId: place.id });
        }
    };

    // Render price level
    const renderPriceLevel = () => {
        const levels = [];
        for (let i = 0; i < 4; i++) {
            levels.push(
                <Text
                    key={i}
                    style={[
                        styles.priceSymbol,
                        { color: i < place.priceLevel ? colors.text : colors.textMuted },
                    ]}
                >
                    ₫
                </Text>
            );
        }
        return levels;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Animated Header */}
            <Animated.View
                style={[
                    styles.animatedHeader,
                    {
                        backgroundColor: colors.background,
                        opacity: headerOpacity,
                        ...shadows.md,
                    },
                ]}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text
                            style={[styles.headerTitle, { color: colors.text }]}
                            numberOfLines={1}
                        >
                            {place.name}
                        </Text>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setIsFavorite(!isFavorite)}
                        >
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={24}
                                color={isFavorite ? colors.error : colors.text}
                            />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {/* Photo Gallery */}
                <View style={styles.photoGallery}>
                    <ScrollView
                        ref={photoScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentPhotoIndex(index);
                        }}
                    >
                        {place.photos.map((photo, index) => (
                            <View key={index} style={styles.photoContainer}>
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.photoGradient}
                                />
                                {/* Placeholder for actual image */}
                                <View
                                    style={[
                                        styles.photoPlaceholder,
                                        { backgroundColor: `${categoryData.color}30` },
                                    ]}
                                >
                                    <Ionicons
                                        name={categoryData.icon}
                                        size={80}
                                        color={categoryData.color}
                                    />
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Photo Indicators */}
                    <View style={styles.photoIndicators}>
                        {place.photos.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.photoIndicator,
                                    {
                                        backgroundColor:
                                            index === currentPhotoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                                        width: index === currentPhotoIndex ? 24 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Back Button Overlay */}
                    <SafeAreaView style={styles.photoOverlay} edges={['top']}>
                        <TouchableOpacity
                            style={[styles.overlayButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.overlayActions}>
                            <TouchableOpacity
                                style={[styles.overlayButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                onPress={handleShare}
                            >
                                <Ionicons name="share-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.overlayButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                onPress={() => setIsFavorite(!isFavorite)}
                            >
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={isFavorite ? colors.error : '#FFFFFF'}
                                />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Header Info */}
                    <View style={styles.infoHeader}>
                        <View style={styles.categoryBadge}>
                            <View
                                style={[
                                    styles.categoryIcon,
                                    { backgroundColor: `${categoryData.color}20` },
                                ]}
                            >
                                <Ionicons
                                    name={categoryData.icon}
                                    size={16}
                                    color={categoryData.color}
                                />
                            </View>
                            <Text style={[styles.categoryText, { color: categoryData.color }]}>
                                {categoryData.label}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: openStatus.isOpen
                                        ? colors.successMuted
                                        : colors.errorMuted,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: openStatus.isOpen ? colors.success : colors.error },
                                ]}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: openStatus.isOpen ? colors.success : colors.error },
                                ]}
                            >
                                {openStatus.isOpen ? `Open • Closes ${openStatus.closesAt}` : 'Closed'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.placeName, { color: colors.text }]}>
                        {place.name}
                    </Text>

                    {/* Rating & Price */}
                    <View style={styles.ratingRow}>
                        <View style={styles.rating}>
                            <Ionicons name="star" size={18} color="#FFB84C" />
                            <Text style={[styles.ratingText, { color: colors.text }]}>
                                {place.rating}
                            </Text>
                            <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                                ({place.reviewCount} reviews)
                            </Text>
                        </View>
                        <View style={styles.priceLevel}>{renderPriceLevel()}</View>
                        <Text style={[styles.distance, { color: colors.textMuted }]}>
                            {formatDistance(place.distance)}
                        </Text>
                    </View>

                    {/* Tags */}
                    <View style={styles.tags}>
                        {place.tags.map((tag, index) => (
                            <View
                                key={index}
                                style={[styles.tag, { backgroundColor: colors.primaryMuted }]}
                            >
                                <Text style={[styles.tagText, { color: colors.primary }]}>
                                    {tag}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    <Text style={[styles.description, { color: colors.textLight }]}>
                        {place.description}
                    </Text>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: colors.card }]}
                            onPress={handleCall}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: colors.successMuted }]}>
                                <Ionicons name="call" size={20} color={colors.success} />
                            </View>
                            <Text style={[styles.quickActionText, { color: colors.text }]}>
                                Call
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: colors.card }]}
                            onPress={handleDirections}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryMuted }]}>
                                <Ionicons name="navigate" size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.quickActionText, { color: colors.text }]}>
                                Directions
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickAction, { backgroundColor: colors.card }]}
                            onPress={handleShare}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: `${colors.info}20` }]}>
                                <Ionicons name="share-social" size={20} color={colors.info} />
                            </View>
                            <Text style={[styles.quickActionText, { color: colors.text }]}>
                                Share
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Address Card */}
                    <Card style={styles.addressCard}>
                        <View style={styles.addressRow}>
                            <Ionicons name="location-outline" size={20} color={colors.textMuted} />
                            <Text style={[styles.addressText, { color: colors.text }]}>
                                {place.address}
                            </Text>
                        </View>
                    </Card>

                    {/* Features */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Features
                    </Text>
                    <View style={styles.features}>
                        {place.features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                <Text style={[styles.featureText, { color: colors.textLight }]}>
                                    {feature}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Spacer for bottom button */}
                    <View style={{ height: 100 }} />
                </View>
            </Animated.ScrollView>

            {/* Bottom CTA */}
            <View style={[styles.bottomCta, { backgroundColor: colors.background, ...shadows.xl }]}>
                <View style={styles.ctaInfo}>
                    <Text style={[styles.ctaLabel, { color: colors.textMuted }]}>
                        {place.category === 'food' ? 'Average order' : 'Consultation fee'}
                    </Text>
                    <Text style={[styles.ctaPrice, { color: colors.text }]}>
                        {formatCurrency(place.category === 'food' ? 80 : 200)}
                    </Text>
                </View>
                <Button
                    title={place.category === 'food' ? 'View Menu' : 'Book Now'}
                    variant="gradient"
                    size="lg"
                    onPress={handlePrimaryAction}
                    icon="arrow-forward"
                    iconPosition="right"
                    style={styles.ctaButton}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    animatedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginHorizontal: 8,
    },
    photoGallery: {
        height: 300,
        position: 'relative',
    },
    photoContainer: {
        width,
        height: 300,
    },
    photoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120,
        zIndex: 1,
    },
    photoIndicators: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        zIndex: 2,
    },
    photoIndicator: {
        height: 8,
        borderRadius: 4,
    },
    photoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        zIndex: 3,
    },
    overlayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayActions: {
        flexDirection: 'row',
        gap: 8,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    placeName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    rating: {
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
    priceLevel: {
        flexDirection: 'row',
    },
    priceSymbol: {
        fontSize: 14,
        fontWeight: '600',
    },
    distance: {
        fontSize: 14,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 24,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        marginHorizontal: 6,
        borderRadius: 12,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    addressCard: {
        marginBottom: 24,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addressText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    features: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '48%',
    },
    featureText: {
        fontSize: 14,
    },
    bottomCta: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
    },
    ctaInfo: {
        marginRight: 16,
    },
    ctaLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    ctaPrice: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    ctaButton: {
        flex: 1,
    },
});

export default PlaceDetailScreen;
