// TAGHRA - Location Hook
// Custom hook for managing user geolocation

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { MAP_CONFIG } from '../utils/constants';

/**
 * Custom hook for location management
 * @param {Object} options - Hook options
 * @param {boolean} options.watchPosition - Whether to watch position continuously
 * @param {number} options.distanceInterval - Distance interval for updates (meters)
 * @returns {Object} Location state and methods
 */
export const useLocation = (options = {}) => {
    const { watchPosition = false, distanceInterval = 10 } = options;

    // State
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(null);

    // Refs
    const watchSubscription = useRef(null);
    const isMounted = useRef(true);

    /**
     * Request location permission
     */
    const requestPermission = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            const granted = status === 'granted';
            setHasPermission(granted);
            return granted;
        } catch (err) {
            console.error('Error requesting location permission:', err);
            setError('Failed to request location permission');
            return false;
        }
    }, []);

    /**
     * Get current location
     */
    const getCurrentLocation = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Check permission
            const { status } = await Location.getForegroundPermissionsAsync();

            if (status !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    setError('Location permission denied');
                    setIsLoading(false);
                    // Return default location (Casablanca)
                    const defaultLocation = {
                        latitude: MAP_CONFIG.DEFAULT_LATITUDE,
                        longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
                    };
                    setLocation(defaultLocation);
                    return defaultLocation;
                }
            }

            // Get current position
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            if (isMounted.current) {
                const newLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    accuracy: position.coords.accuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp,
                };

                setLocation(newLocation);
                setHasPermission(true);
                return newLocation;
            }
        } catch (err) {
            console.error('Error getting location:', err);
            if (isMounted.current) {
                setError('Failed to get location. Please enable GPS.');
                // Return default location
                const defaultLocation = {
                    latitude: MAP_CONFIG.DEFAULT_LATITUDE,
                    longitude: MAP_CONFIG.DEFAULT_LONGITUDE,
                };
                setLocation(defaultLocation);
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [requestPermission]);

    /**
     * Start watching position
     */
    const startWatching = useCallback(async () => {
        try {
            // Stop existing subscription
            if (watchSubscription.current) {
                watchSubscription.current.remove();
            }

            // Check permission
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    setError('Location permission denied');
                    return;
                }
            }

            // Start watching
            watchSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval,
                },
                (position) => {
                    if (isMounted.current) {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            altitude: position.coords.altitude,
                            accuracy: position.coords.accuracy,
                            heading: position.coords.heading,
                            speed: position.coords.speed,
                            timestamp: position.timestamp,
                        });
                    }
                }
            );
        } catch (err) {
            console.error('Error watching location:', err);
            if (isMounted.current) {
                setError('Failed to watch location');
            }
        }
    }, [distanceInterval, requestPermission]);

    /**
     * Stop watching position
     */
    const stopWatching = useCallback(() => {
        if (watchSubscription.current) {
            watchSubscription.current.remove();
            watchSubscription.current = null;
        }
    }, []);

    /**
     * Get address from coordinates (reverse geocoding)
     */
    const getAddress = useCallback(async (latitude, longitude) => {
        try {
            const results = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (results && results.length > 0) {
                const addr = results[0];
                const formattedAddress = {
                    street: addr.street,
                    city: addr.city,
                    region: addr.region,
                    country: addr.country,
                    postalCode: addr.postalCode,
                    name: addr.name,
                    formatted: [addr.street, addr.city, addr.region]
                        .filter(Boolean)
                        .join(', '),
                };

                if (isMounted.current) {
                    setAddress(formattedAddress);
                }
                return formattedAddress;
            }
        } catch (err) {
            console.error('Error getting address:', err);
        }
        return null;
    }, []);

    /**
     * Get coordinates from address (geocoding)
     */
    const getCoordinates = useCallback(async (addressString) => {
        try {
            const results = await Location.geocodeAsync(addressString);

            if (results && results.length > 0) {
                return {
                    latitude: results[0].latitude,
                    longitude: results[0].longitude,
                };
            }
        } catch (err) {
            console.error('Error geocoding address:', err);
        }
        return null;
    }, []);

    /**
     * Calculate distance between two points
     * @param {Object} point1 - First point {latitude, longitude}
     * @param {Object} point2 - Second point {latitude, longitude}
     * @returns {number} Distance in meters
     */
    const calculateDistance = useCallback((point1, point2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (point1.latitude * Math.PI) / 180;
        const φ2 = (point2.latitude * Math.PI) / 180;
        const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
        const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }, []);

    /**
     * Get distance from current location to a point
     * @param {Object} point - Target point {latitude, longitude}
     * @returns {number|null} Distance in meters or null if no location
     */
    const getDistanceToPoint = useCallback(
        (point) => {
            if (!location) return null;
            return calculateDistance(location, point);
        },
        [location, calculateDistance]
    );

    // Initialize on mount
    useEffect(() => {
        isMounted.current = true;
        getCurrentLocation();

        if (watchPosition) {
            startWatching();
        }

        return () => {
            isMounted.current = false;
            stopWatching();
        };
    }, []);

    // Update watching when watchPosition changes
    useEffect(() => {
        if (watchPosition) {
            startWatching();
        } else {
            stopWatching();
        }
    }, [watchPosition, startWatching, stopWatching]);

    return {
        // State
        location,
        address,
        error,
        isLoading,
        hasPermission,

        // Methods
        requestPermission,
        getCurrentLocation,
        startWatching,
        stopWatching,
        getAddress,
        getCoordinates,
        calculateDistance,
        getDistanceToPoint,

        // Convenience getters
        latitude: location?.latitude,
        longitude: location?.longitude,
        isAvailable: !!location,
    };
};

export default useLocation;
