-- Taghra - DROP ALL TABLES (Clean Slate)
-- Run this FIRST to remove all existing tables, then run the complete schema

-- Drop all tables in reverse order (due to foreign key constraints)
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS place_submissions CASCADE;
DROP TABLE IF EXISTS admin_documents CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Confirm all tables are dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
