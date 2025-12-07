// TAGHRA - Supabase Client for React Native
// Direct Supabase integration for real-time features and database access

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../utils/constants';

const supabaseUrl = SUPABASE_CONFIG.URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// ============================================
// Authentication Functions
// ============================================

/**
 * Sign up a new user
 * @param {string} email 
 * @param {string} password 
 * @param {Object} metadata - Additional user data (fullName, phone, role)
 */
export const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: metadata.fullName,
                phone: metadata.phone,
                role: metadata.role || 'user',
            },
        },
    });

    if (error) throw error;

    // Create user profile in users table
    if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: metadata.fullName,
            phone: metadata.phone,
            role: metadata.role || 'user',
            points: 0,
        });

        if (profileError) {
            console.error('Error creating user profile:', profileError);
        }
    }

    return data;
};

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 */
export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

/**
 * Get current session
 */
export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback 
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange(callback);
};

// ============================================
// Database Functions
// ============================================

/**
 * Get user profile
 * @param {string} userId 
 */
export const getUserProfile = async (userId) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update user profile
 * @param {string} userId 
 * @param {Object} updates 
 */
export const updateUserProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get nearby places
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} radiusKm 
 * @param {string} category - Optional filter by category
 */
export const getNearbyPlaces = async (latitude, longitude, radiusKm = 5, category = null) => {
    // Using PostGIS ST_DWithin function via Supabase RPC
    let query = supabase.rpc('get_nearby_places', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
    });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Get place by ID
 * @param {string} placeId 
 */
export const getPlaceById = async (placeId) => {
    const { data, error } = await supabase
        .from('places')
        .select(`
            *,
            menu_categories (
                *,
                menu_items (*)
            ),
            reviews (
                *,
                users (full_name, avatar_url)
            )
        `)
        .eq('id', placeId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get menu for a place
 * @param {string} placeId 
 */
export const getPlaceMenu = async (placeId) => {
    const { data, error } = await supabase
        .from('menu_categories')
        .select(`
            *,
            menu_items (*)
        `)
        .eq('place_id', placeId)
        .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Create an order
 * @param {Object} orderData 
 */
export const createOrder = async (orderData) => {
    const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get user orders
 * @param {string} userId 
 */
export const getUserOrders = async (userId) => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            places (name, photos, address)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Book an appointment
 * @param {Object} appointmentData 
 */
export const bookAppointment = async (appointmentData) => {
    const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get user appointments
 * @param {string} userId 
 */
export const getUserAppointments = async (userId) => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            places (name, photos, address, phone)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Submit a review
 * @param {Object} reviewData 
 */
export const submitReview = async (reviewData) => {
    const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get place reviews
 * @param {string} placeId 
 */
export const getPlaceReviews = async (placeId) => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            users (full_name, avatar_url)
        `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to order status changes
 * @param {string} orderId 
 * @param {Function} callback 
 */
export const subscribeToOrder = (orderId, callback) => {
    return supabase
        .channel(`order-${orderId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            },
            (payload) => callback(payload.new)
        )
        .subscribe();
};

/**
 * Subscribe to new notifications
 * @param {string} userId 
 * @param {Function} callback 
 */
export const subscribeToNotifications = (userId, callback) => {
    return supabase
        .channel(`notifications-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => callback(payload.new)
        )
        .subscribe();
};

// ============================================
// Storage Functions
// ============================================

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {File|Blob} file - File to upload
 */
export const uploadFile = async (bucket, path, file) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) throw error;
    return data;
};

/**
 * Get public URL for a file
 * @param {string} bucket 
 * @param {string} path 
 */
export const getPublicUrl = (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

export default supabase;
