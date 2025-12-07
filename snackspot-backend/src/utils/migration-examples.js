// Taghra - Migration Helper Examples
// Examples showing how to convert PostgreSQL queries to Supabase

/*
 * GUIDE: Converting PostgreSQL to Supabase Queries
 * 
 * This file contains examples of how to convert common database operations
 * from PostgreSQL (using pg library) to Supabase client.
 */

// ============================================
// IMPORTS
// ============================================

// OLD:
const db = require('../config/database');

// NEW:
const Database = require('../utils/database');
const { supabase } = require('../config/supabase'); // For direct access if needed

// ============================================
// SELECT QUERIES
// ============================================

// ─────────────────────────────────────────
// Example 1: Simple SELECT
// ─────────────────────────────────────────

// OLD:
async function getUserById_OLD(userId) {
    const result = await db.query(
        'SELECT id, email, full_name, role FROM users WHERE id = $1',
        [userId]
    );
    return result.rows[0];
}

// NEW:
async function getUserById_NEW(userId) {
    const { data, error } = await Database.select('users', {
        columns: 'id, email, full_name, role',
        filters: { id: userId },
        single: true
    });
    
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────
// Example 2: SELECT with multiple filters
// ─────────────────────────────────────────

// OLD:
async function getPlacesByCategory_OLD(category, isOpen) {
    const result = await db.query(
        'SELECT * FROM places WHERE category = $1 AND is_open = $2',
        [category, isOpen]
    );
    return result.rows;
}

// NEW:
async function getPlacesByCategory_NEW(category, isOpen) {
    const { data, error } = await Database.select('places', {
        filters: {
            category: category,
            is_open: isOpen
        }
    });
    
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────
// Example 3: SELECT with operators
// ─────────────────────────────────────────

// OLD:
async function getTopRatedPlaces_OLD(minRating) {
    const result = await db.query(
        'SELECT * FROM places WHERE rating >= $1 ORDER BY rating DESC LIMIT 10',
        [minRating]
    );
    return result.rows;
}

// NEW:
async function getTopRatedPlaces_NEW(minRating) {
    const { data, error } = await Database.select('places', {
        filters: {
            rating: { operator: 'gte', value: minRating }
        },
        orderBy: { column: 'rating', ascending: false },
        limit: 10
    });
    
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────
// Example 4: SELECT with LIKE
// ─────────────────────────────────────────

// OLD:
async function searchPlacesByName_OLD(searchTerm) {
    const result = await db.query(
        'SELECT * FROM places WHERE name ILIKE $1',
        [`%${searchTerm}%`]
    );
    return result.rows;
}

// NEW:
async function searchPlacesByName_NEW(searchTerm) {
    const { data, error } = await Database.select('places', {
        filters: {
            name: { operator: 'ilike', value: `%${searchTerm}%` }
        }
    });
    
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────
// Example 5: SELECT with pagination
// ─────────────────────────────────────────

// OLD:
async function getUsersPaginated_OLD(limit, offset) {
    const result = await db.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
    );
    return result.rows;
}

// NEW:
async function getUsersPaginated_NEW(limit, offset) {
    const { data, error } = await Database.select('users', {
        orderBy: { column: 'created_at', ascending: false },
        limit: limit,
        offset: offset
    });
    
    if (error) throw error;
    return data;
}

// ============================================
// INSERT QUERIES
// ============================================

// ─────────────────────────────────────────
// Example 6: Simple INSERT
// ─────────────────────────────────────────

// OLD:
async function createReview_OLD(placeId, userId, rating, comment) {
    const result = await db.query(
        `INSERT INTO reviews (place_id, user_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [placeId, userId, rating, comment]
    );
    return result.rows[0];
}

// NEW:
async function createReview_NEW(placeId, userId, rating, comment) {
    const { data, error } = await Database.insert('reviews', {
        place_id: placeId,
        user_id: userId,
        rating: rating,
        comment: comment
    });
    
    if (error) throw error;
    return data[0];
}

// ─────────────────────────────────────────
// Example 7: INSERT multiple rows
// ─────────────────────────────────────────

// OLD:
async function createMultipleItems_OLD(items) {
    const values = items.map((item, i) => 
        `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
    ).join(',');
    
    const params = items.flatMap(item => [item.name, item.price, item.categoryId]);
    
    const result = await db.query(
        `INSERT INTO menu_items (name, price, category_id) VALUES ${values} RETURNING *`,
        params
    );
    return result.rows;
}

// NEW:
async function createMultipleItems_NEW(items) {
    const itemsToInsert = items.map(item => ({
        name: item.name,
        price: item.price,
        category_id: item.categoryId
    }));
    
    const { data, error } = await Database.insert('menu_items', itemsToInsert);
    
    if (error) throw error;
    return data;
}

// ============================================
// UPDATE QUERIES
// ============================================

// ─────────────────────────────────────────
// Example 8: Simple UPDATE
// ─────────────────────────────────────────

// OLD:
async function updateUserPoints_OLD(userId, newPoints) {
    const result = await db.query(
        'UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newPoints, userId]
    );
    return result.rows[0];
}

// NEW:
async function updateUserPoints_NEW(userId, newPoints) {
    const { data, error } = await Database.update('users', 
        { 
            points: newPoints,
            updated_at: new Date().toISOString()
        },
        { id: userId }
    );
    
    if (error) throw error;
    return data[0];
}

// ─────────────────────────────────────────
// Example 9: UPDATE with multiple conditions
// ─────────────────────────────────────────

// OLD:
async function updateOrderStatus_OLD(orderId, userId, newStatus) {
    const result = await db.query(
        'UPDATE orders SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [newStatus, orderId, userId]
    );
    return result.rows[0];
}

// NEW:
async function updateOrderStatus_NEW(orderId, userId, newStatus) {
    // Note: For multiple filters in UPDATE, you might need direct Supabase access
    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('user_id', userId)
        .select();
    
    if (error) throw error;
    return data[0];
}

// ============================================
// DELETE QUERIES
// ============================================

// ─────────────────────────────────────────
// Example 10: Simple DELETE
// ─────────────────────────────────────────

// OLD:
async function deleteNotification_OLD(notificationId) {
    await db.query(
        'DELETE FROM notifications WHERE id = $1',
        [notificationId]
    );
}

// NEW:
async function deleteNotification_NEW(notificationId) {
    const { error } = await Database.delete('notifications', { id: notificationId });
    if (error) throw error;
}

// ─────────────────────────────────────────
// Example 11: DELETE with conditions
// ─────────────────────────────────────────

// OLD:
async function deleteOldNotifications_OLD(userId, daysOld) {
    await db.query(
        'DELETE FROM notifications WHERE user_id = $1 AND created_at < NOW() - INTERVAL \'$2 days\'',
        [userId, daysOld]
    );
}

// NEW:
async function deleteOldNotifications_NEW(userId, daysOld) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString());
    
    if (error) throw error;
}

// ============================================
// COMPLEX QUERIES (Use RPC)
// ============================================

// ─────────────────────────────────────────
// Example 12: Complex geospatial query
// ─────────────────────────────────────────

// OLD:
async function getNearbyPlaces_OLD(lat, lng, radius) {
    const result = await db.query(`
        SELECT 
            id, name, category,
            ST_Distance(location, ST_MakePoint($1, $2)::geography) as distance
        FROM places
        WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
        ORDER BY distance
    `, [lng, lat, radius]);
    return result.rows;
}

// NEW:
async function getNearbyPlaces_NEW(lat, lng, radius) {
    const { data, error } = await Database.rpc('get_nearby_places', {
        lat: lat,
        lng: lng,
        radius_meters: radius,
        place_category: null,
        result_limit: 20
    });
    
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────
// Example 13: Transaction (multiple operations)
// ─────────────────────────────────────────

// OLD:
async function createOrderAndUpdatePoints_OLD(userId, orderData, pointsToAdd) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const orderResult = await client.query(
            'INSERT INTO orders (user_id, total, items) VALUES ($1, $2, $3) RETURNING *',
            [userId, orderData.total, orderData.items]
        );
        
        await client.query(
            'UPDATE users SET points = points + $1 WHERE id = $2',
            [pointsToAdd, userId]
        );
        
        await client.query('COMMIT');
        return orderResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// NEW: Supabase doesn't have built-in transactions for client-side
// Best approach: Use PostgreSQL function or handle errors carefully
async function createOrderAndUpdatePoints_NEW(userId, orderData, pointsToAdd) {
    // Option 1: Use a custom PostgreSQL function (recommended)
    const { data, error } = await Database.rpc('create_order_and_award_points', {
        target_user_id: userId,
        order_total: orderData.total,
        order_items: orderData.items,
        points_to_add: pointsToAdd
    });
    
    if (error) throw error;
    return data;
    
    // Option 2: Sequential operations with error handling
    // Note: Not atomic, but often sufficient
    /*
    try {
        const { data: order, error: orderError } = await Database.insert('orders', {
            user_id: userId,
            total: orderData.total,
            items: orderData.items
        });
        
        if (orderError) throw orderError;
        
        const { error: pointsError } = await Database.rpc('award_points', {
            target_user_id: userId,
            points_amount: pointsToAdd,
            action_type: 'order',
            action_description: `Order ${order[0].id}`
        });
        
        if (pointsError) throw pointsError;
        
        return order[0];
    } catch (error) {
        // Handle or rethrow
        throw error;
    }
    */
}

// ============================================
// JOINS
// ============================================

// ─────────────────────────────────────────
// Example 14: JOIN query
// ─────────────────────────────────────────

// OLD:
async function getOrdersWithPlaces_OLD(userId) {
    const result = await db.query(`
        SELECT 
            o.*,
            p.name as place_name,
            p.address as place_address
        FROM orders o
        JOIN places p ON o.place_id = p.id
        WHERE o.user_id = $1
    `, [userId]);
    return result.rows;
}

// NEW:
async function getOrdersWithPlaces_NEW(userId) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            places (
                name,
                address
            )
        `)
        .eq('user_id', userId);
    
    if (error) throw error;
    return data;
}

// ============================================
// COUNT QUERIES
// ============================================

// ─────────────────────────────────────────
// Example 15: COUNT
// ─────────────────────────────────────────

// OLD:
async function countUserOrders_OLD(userId) {
    const result = await db.query(
        'SELECT COUNT(*) FROM orders WHERE user_id = $1',
        [userId]
    );
    return parseInt(result.rows[0].count);
}

// NEW:
async function countUserOrders_NEW(userId) {
    const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    if (error) throw error;
    return count;
}

// ============================================
// DIRECT SUPABASE CLIENT (When needed)
// ============================================

/*
 * For complex queries not covered by the Database helper,
 * use the Supabase client directly:
 */

const { supabase } = require('../config/supabase');

async function complexQuery() {
    const { data, error } = await supabase
        .from('table_name')
        .select('column1, column2')
        .eq('column3', 'value')
        .gt('column4', 100)
        .order('column5', { ascending: false })
        .limit(10);
    
    if (error) throw error;
    return data;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Export functions as needed
};

/*
 * QUICK REFERENCE:
 * 
 * Database.select(table, options)
 * Database.insert(table, data)
 * Database.update(table, data, filters)
 * Database.delete(table, filters)
 * Database.rpc(functionName, params)
 * 
 * Options for select:
 * - columns: 'col1, col2' or '*'
 * - filters: { col: value } or { col: { operator: 'eq', value: val } }
 * - single: true/false
 * - orderBy: { column: 'col', ascending: true/false }
 * - limit: number
 * - offset: number
 * 
 * Operators:
 * - eq, neq, gt, gte, lt, lte, like, ilike, in, is
 */
