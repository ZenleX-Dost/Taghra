# Supabase Migration Guide for Taghra

## Overview
This document explains how to migrate the Taghra database from PostgreSQL to Supabase.

## Important Notes

### PostGIS/Geography Support
Supabase supports PostGIS extension natively. The GEOGRAPHY type used for location data is fully compatible.

### UUID Generation
Supabase supports `uuid_generate_v4()` through the `uuid-ossp` extension.

### Migration Steps

1. **Enable Required Extensions in Supabase Dashboard**
   - Go to your Supabase project SQL Editor
   - Run the following:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Run the Schema**
   - Copy the entire `schema.sql` file
   - Paste and execute it in the Supabase SQL Editor
   - This will create all tables, indexes, and seed data

3. **Configure Row Level Security (RLS)**
   - Supabase uses RLS for security
   - See `rls-policies.sql` for recommended policies
   - You can enable/disable RLS per table in the Supabase dashboard

4. **Update Backend Code**
   - Replace `pg` queries with Supabase client calls
   - Use Supabase Auth for authentication (recommended)
   - Or continue using JWT with manual user management

## Key Differences

### Authentication
**Option 1: Use Supabase Auth (Recommended)**
- Built-in user management
- Email verification
- Password reset flows
- OAuth providers

**Option 2: Custom JWT (Current Implementation)**
- Continue managing users manually in `users` table
- Use `password_hash` field
- Manage `refresh_tokens` table

### Querying
**PostgreSQL (Old):**
```javascript
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];
```

**Supabase (New):**
```javascript
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### Geospatial Queries
Supabase supports PostGIS functions, but you may need to use `.rpc()` for complex queries:

```javascript
const { data, error } = await supabase.rpc('get_nearby_places', {
  lat: 33.5731,
  lng: -7.5898,
  radius: 1000
});
```

## File Structure
- `schema.sql` - Complete database schema (compatible with Supabase)
- `rls-policies.sql` - Row Level Security policies (optional but recommended)
- `functions.sql` - Custom PostgreSQL functions for complex queries

## Next Steps
1. Import schema into Supabase
2. Set up RLS policies
3. Update backend routes to use Supabase client
4. Update auth middleware
5. Test all endpoints
