// TAGHRA - Database Configuration
// PostgreSQL connection with PostGIS support (Supabase)

const { Pool } = require('pg');

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseHost = supabaseUrl.replace('https://', '').replace('.supabase.co', '') + '.supabase.co';

// Create connection pool using Supabase PostgreSQL connection
// Supabase provides direct PostgreSQL access
const pool = new Pool({
    host: process.env.DB_HOST || `db.${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}.supabase.co`,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

// Test connection
pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

/**
 * Execute a query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries in development
        if (process.env.NODE_ENV === 'development' && duration > 100) {
            console.log(`Slow query (${duration}ms):`, text);
        }

        return result;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Pool client
 */
const getClient = async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);

    // Timeout for queries
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for too long');
    }, 5000);

    // Override release to clear timeout
    client.release = () => {
        clearTimeout(timeout);
        return originalRelease();
    };

    return client;
};

module.exports = {
    pool,
    query,
    getClient,
};
