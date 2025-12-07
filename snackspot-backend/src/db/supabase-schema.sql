-- TAGHRA Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'restaurant', 'doctor', 'vet', 'sub', 'admin')),
    points INTEGER DEFAULT 0,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- PLACES
-- ============================================

CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'health', 'vet', 'admin')),
    description TEXT,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    price_level INTEGER DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
    is_open BOOLEAN DEFAULT TRUE,
    opening_hours JSONB,
    photos TEXT[],
    features TEXT[],
    tags TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Everyone can view places
CREATE POLICY "Anyone can view places" ON public.places
    FOR SELECT USING (true);

-- Owners can update their places
CREATE POLICY "Owners can update places" ON public.places
    FOR UPDATE USING (auth.uid() = owner_id);

-- Authenticated users can insert places
CREATE POLICY "Authenticated users can create places" ON public.places
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_places_location ON public.places USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);

-- ============================================
-- MENU CATEGORIES & ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    allergens TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view menu
CREATE POLICY "Anyone can view menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled')),
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending',
    delivery_address TEXT,
    delivery_notes TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- APPOINTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
    doctor_name VARCHAR(100),
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create appointments
CREATE POLICY "Users can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    photos TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PLACE SUBMISSIONS (for Sub/Ambassadors)
-- ============================================

CREATE TABLE IF NOT EXISTS public.place_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(20),
    photos TEXT[],
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    points_awarded INTEGER DEFAULT 0,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.place_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON public.place_submissions
    FOR SELECT USING (auth.uid() = submitted_by);

-- Users can create submissions
CREATE POLICY "Users can create submissions" ON public.place_submissions
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get nearby places
CREATE OR REPLACE FUNCTION get_nearby_places(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    category VARCHAR,
    description TEXT,
    address VARCHAR,
    phone VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating DECIMAL,
    review_count INTEGER,
    price_level INTEGER,
    is_open BOOLEAN,
    photos TEXT[],
    features TEXT[],
    distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        p.description,
        p.address,
        p.phone,
        p.latitude,
        p.longitude,
        p.rating,
        p.review_count,
        p.price_level,
        p.is_open,
        p.photos,
        p.features,
        ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1000 AS distance_km
    FROM public.places p
    WHERE ST_DWithin(
        p.location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$;

-- Function to update place rating when a review is added
CREATE OR REPLACE FUNCTION update_place_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.places
    SET 
        rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM public.reviews
            WHERE place_id = NEW.place_id
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE place_id = NEW.place_id
        ),
        updated_at = NOW()
    WHERE id = NEW.place_id;
    
    RETURN NEW;
END;
$$;

-- Trigger to update rating on new review
CREATE TRIGGER trigger_update_place_rating
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_place_rating();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Run these in the Supabase Dashboard > Storage
-- Create buckets for: avatars, places, menu-items, reviews

-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('places', 'places', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('menu-items', 'menu-items', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reviews', 'reviews', true);
