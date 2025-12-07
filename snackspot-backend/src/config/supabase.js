// Taghra - Supabase Configuration
// Client for Supabase database and features (Realtime, Storage, Auth, etc)

const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service role key for backend

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Execute a Supabase query with error handling
 * @param {Function} queryFn - Async function that performs the Supabase query
 * @returns {Promise<Object>} Query result
 */
const executeQuery = async (queryFn) => {
    const start = Date.now();
    try {
        const result = await queryFn();
        const duration = Date.now() - start;

        // Log slow queries in development
        if (process.env.NODE_ENV === 'development' && duration > 100) {
            console.log(`Slow query (${duration}ms)`);
        }

        if (result.error) {
            throw result.error;
        }

        return result;
    } catch (error) {
        console.error('Supabase query error:', error.message);
        throw error;
    }
};

module.exports = { supabase, executeQuery };
