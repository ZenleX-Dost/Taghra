// Taghra - Database Helper for Supabase
// Wrapper functions to make database operations easier

const { supabase, executeQuery } = require('../config/supabase');

/**
 * Database helper class for common operations
 */
class Database {
    /**
     * Execute a SELECT query
     */
    static async select(table, options = {}) {
        const { columns = '*', filters = {}, single = false, orderBy = null, limit = null, offset = null } = options;

        return executeQuery(async () => {
            let query = supabase.from(table).select(columns);

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                if (typeof value === 'object' && value.operator) {
                    switch (value.operator) {
                        case 'eq':
                            query = query.eq(key, value.value);
                            break;
                        case 'neq':
                            query = query.neq(key, value.value);
                            break;
                        case 'gt':
                            query = query.gt(key, value.value);
                            break;
                        case 'gte':
                            query = query.gte(key, value.value);
                            break;
                        case 'lt':
                            query = query.lt(key, value.value);
                            break;
                        case 'lte':
                            query = query.lte(key, value.value);
                            break;
                        case 'like':
                            query = query.like(key, value.value);
                            break;
                        case 'ilike':
                            query = query.ilike(key, value.value);
                            break;
                        case 'in':
                            query = query.in(key, value.value);
                            break;
                        case 'is':
                            query = query.is(key, value.value);
                            break;
                        default:
                            query = query.eq(key, value.value);
                    }
                } else {
                    query = query.eq(key, value);
                }
            });

            // Apply ordering
            if (orderBy) {
                const { column, ascending = true } = orderBy;
                query = query.order(column, { ascending });
            }

            // Apply pagination
            if (limit) query = query.limit(limit);
            if (offset) query = query.range(offset, offset + (limit || 10) - 1);

            // Single record or multiple
            if (single) query = query.single();

            return await query;
        });
    }

    /**
     * Insert a record
     */
    static async insert(table, data, returning = true) {
        return executeQuery(async () => {
            let query = supabase.from(table).insert(data);
            if (returning) query = query.select();
            return await query;
        });
    }

    /**
     * Update records
     */
    static async update(table, data, filters = {}) {
        return executeQuery(async () => {
            let query = supabase.from(table).update(data);

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            return await query.select();
        });
    }

    /**
     * Delete records
     */
    static async delete(table, filters = {}) {
        return executeQuery(async () => {
            let query = supabase.from(table).delete();

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            return await query;
        });
    }

    /**
     * Call a PostgreSQL function (RPC)
     */
    static async rpc(functionName, params = {}) {
        return executeQuery(async () => {
            return await supabase.rpc(functionName, params);
        });
    }

    /**
     * Execute raw SQL (use sparingly)
     */
    static async raw(sql) {
        return executeQuery(async () => {
            return await supabase.rpc('exec_sql', { sql });
        });
    }
}

module.exports = Database;
