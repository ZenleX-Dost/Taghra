// Taghra - Cart Context
// Manages shopping cart state for ordering food

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICE_FEE } from '../utils/constants';

// Storage key
const CART_KEY = '@Taghra_cart';

// Create context
const CartContext = createContext(null);

/**
 * CartProvider component that wraps the app and provides cart state
 */
export const CartProvider = ({ children }) => {
    // State
    const [items, setItems] = useState([]);
    const [restaurant, setRestaurant] = useState(null); // Current restaurant
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Load stored cart data on app start
     */
    useEffect(() => {
        const loadStoredCart = async () => {
            try {
                const storedCart = await AsyncStorage.getItem(CART_KEY);
                if (storedCart) {
                    const { items: storedItems, restaurant: storedRestaurant } = JSON.parse(storedCart);
                    setItems(storedItems || []);
                    setRestaurant(storedRestaurant || null);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredCart();
    }, []);

    /**
     * Save cart to storage
     */
    const saveCart = useCallback(async (newItems, newRestaurant) => {
        try {
            await AsyncStorage.setItem(
                CART_KEY,
                JSON.stringify({ items: newItems, restaurant: newRestaurant })
            );
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }, []);

    /**
     * Add item to cart
     * @param {Object} item - Item to add
     * @param {number} quantity - Quantity to add
     * @param {Object} newRestaurant - Restaurant the item belongs to
     * @param {Object} options - Selected options/customizations
     */
    const addToCart = useCallback(async (item, quantity = 1, newRestaurant, options = {}) => {
        setItems((currentItems) => {
            // Check if adding from a different restaurant
            if (restaurant && newRestaurant && restaurant.id !== newRestaurant.id) {
                // Clear cart and start fresh with new restaurant
                const newItems = [{
                    ...item,
                    quantity,
                    options,
                    cartId: Date.now().toString(),
                }];
                setRestaurant(newRestaurant);
                saveCart(newItems, newRestaurant);
                return newItems;
            }

            // Check if item already exists (same item ID and same options)
            const optionsKey = JSON.stringify(options);
            const existingIndex = currentItems.findIndex(
                (i) => i.id === item.id && JSON.stringify(i.options) === optionsKey
            );

            let newItems;
            if (existingIndex >= 0) {
                // Update quantity of existing item
                newItems = currentItems.map((i, index) =>
                    index === existingIndex
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            } else {
                // Add new item
                newItems = [
                    ...currentItems,
                    {
                        ...item,
                        quantity,
                        options,
                        cartId: Date.now().toString(),
                    },
                ];
            }

            // Set restaurant if not set
            if (!restaurant && newRestaurant) {
                setRestaurant(newRestaurant);
            }

            saveCart(newItems, newRestaurant || restaurant);
            return newItems;
        });
    }, [restaurant, saveCart]);

    /**
     * Remove item from cart
     * @param {string} cartId - Cart item ID
     */
    const removeFromCart = useCallback(async (cartId) => {
        setItems((currentItems) => {
            const newItems = currentItems.filter((item) => item.cartId !== cartId);

            // Clear restaurant if cart is empty
            if (newItems.length === 0) {
                setRestaurant(null);
                saveCart([], null);
            } else {
                saveCart(newItems, restaurant);
            }

            return newItems;
        });
    }, [restaurant, saveCart]);

    /**
     * Update item quantity in cart
     * @param {string} cartId - Cart item ID
     * @param {number} quantity - New quantity
     */
    const updateQuantity = useCallback(async (cartId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(cartId);
            return;
        }

        setItems((currentItems) => {
            const newItems = currentItems.map((item) =>
                item.cartId === cartId ? { ...item, quantity } : item
            );
            saveCart(newItems, restaurant);
            return newItems;
        });
    }, [restaurant, removeFromCart, saveCart]);

    /**
     * Increment item quantity
     * @param {string} cartId - Cart item ID
     */
    const incrementQuantity = useCallback((cartId) => {
        setItems((currentItems) => {
            const item = currentItems.find((i) => i.cartId === cartId);
            if (item) {
                updateQuantity(cartId, item.quantity + 1);
            }
            return currentItems;
        });
    }, [updateQuantity]);

    /**
     * Decrement item quantity
     * @param {string} cartId - Cart item ID
     */
    const decrementQuantity = useCallback((cartId) => {
        setItems((currentItems) => {
            const item = currentItems.find((i) => i.cartId === cartId);
            if (item) {
                updateQuantity(cartId, item.quantity - 1);
            }
            return currentItems;
        });
    }, [updateQuantity]);

    /**
     * Clear entire cart
     */
    const clearCart = useCallback(async () => {
        setItems([]);
        setRestaurant(null);
        try {
            await AsyncStorage.removeItem(CART_KEY);
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }, []);

    /**
     * Calculate subtotal (before fees)
     * @returns {number} Subtotal amount
     */
    const getSubtotal = useCallback(() => {
        return items.reduce((total, item) => {
            const itemPrice = item.price || 0;
            const optionsPrice = Object.values(item.options || {}).reduce(
                (sum, option) => sum + (option.price || 0),
                0
            );
            return total + (itemPrice + optionsPrice) * item.quantity;
        }, 0);
    }, [items]);

    /**
     * Get service fee
     * @returns {number} Service fee amount
     */
    const getServiceFee = useCallback(() => {
        return items.length > 0 ? SERVICE_FEE : 0;
    }, [items]);

    /**
     * Calculate total (including fees)
     * @returns {number} Total amount
     */
    const getTotal = useCallback(() => {
        return getSubtotal() + getServiceFee();
    }, [getSubtotal, getServiceFee]);

    /**
     * Get total number of items in cart
     * @returns {number} Item count
     */
    const getItemCount = useCallback(() => {
        return items.reduce((count, item) => count + item.quantity, 0);
    }, [items]);

    /**
     * Check if cart is empty
     * @returns {boolean} Whether cart is empty
     */
    const isEmpty = useCallback(() => {
        return items.length === 0;
    }, [items]);

    /**
     * Get item by cart ID
     * @param {string} cartId - Cart item ID
     * @returns {Object|null} Cart item
     */
    const getItem = useCallback((cartId) => {
        return items.find((item) => item.cartId === cartId) || null;
    }, [items]);

    // Context value
    const value = {
        // State
        items,
        restaurant,
        isLoading,

        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,

        // Calculations
        getSubtotal,
        getServiceFee,
        getTotal,
        getItemCount,

        // Helpers
        isEmpty,
        getItem,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

/**
 * Custom hook to use cart context
 * @returns {Object} Cart context value
 */
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;
