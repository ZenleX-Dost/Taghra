// TAGHRA - Supabase Configuration
// Supabase client for database operations

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
} else {
    console.log('✅ Supabase configured with URL:', supabaseUrl);
}

// Create Supabase client with service role key (for server-side operations)
// Service role key bypasses Row Level Security (RLS)
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: 'public',
    },
});

/**
 * Execute a query using Supabase
 * This wrapper provides compatibility with the existing pg-style query interface
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result in pg-compatible format
 */
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        // Replace $1, $2, etc. with actual values for Supabase RPC or use raw SQL
        const { data, error } = await supabase.rpc('execute_sql', {
            query_text: text,
            query_params: params,
        });

        if (error) {
            throw error;
        }

        const duration = Date.now() - start;

        // Log slow queries in development
        if (process.env.NODE_ENV === 'development' && duration > 100) {
            console.log(`Slow query (${duration}ms):`, text);
        }

        return { rows: data || [] };
    } catch (error) {
        console.error('Supabase query error:', error.message);
        throw error;
    }
};

/**
 * Get Supabase client for direct table operations
 * @returns {Object} Supabase client
 */
const getClient = () => supabase;

module.exports = {
    supabase,
    query,
    getClient,
};
