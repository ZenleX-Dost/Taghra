-- Taghra - Custom PostgreSQL Functions for Supabase
-- These functions handle complex queries, especially geospatial operations

-- ============================================
-- NEARBY PLACES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_nearby_places(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000,
    place_category TEXT DEFAULT NULL,
    is_open_filter BOOLEAN DEFAULT NULL,
    result_limit INTEGER DEFAULT 20,
    result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    category VARCHAR(20),
    description TEXT,
    address VARCHAR(500),
    phone VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance DOUBLE PRECISION,
    rating DECIMAL(2, 1),
    review_count INTEGER,
    price_level INTEGER,
    is_open BOOLEAN,
    photos TEXT[],
    created_at TIMESTAMP
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
        ST_Y(p.location::geometry) as latitude,
        ST_X(p.location::geometry) as longitude,
        ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance,
        p.rating,
        p.review_count,
        p.price_level,
        p.is_open,
        p.photos,
        p.created_at
    FROM places p
    WHERE 
        ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
        AND (place_category IS NULL OR p.category = place_category)
        AND (is_open_filter IS NULL OR p.is_open = is_open_filter)
        AND p.is_verified = true
    ORDER BY distance
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- ============================================
-- UPDATE PLACE RATING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_place_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE places
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
        )
    WHERE id = COALESCE(NEW.place_id, OLD.place_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for reviews
DROP TRIGGER IF EXISTS update_place_rating_trigger ON reviews;
CREATE TRIGGER update_place_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_place_rating();

-- ============================================
-- AWARD POINTS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION award_points(
    target_user_id UUID,
    points_amount INTEGER,
    action_type VARCHAR(50),
    action_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update user's total points
    UPDATE users
    SET points = points + points_amount
    WHERE id = target_user_id;
    
    -- Record in points history
    INSERT INTO points_history (user_id, points, action, description)
    VALUES (target_user_id, points_amount, action_type, action_description);
    
    -- Check for badge achievements
    INSERT INTO user_badges (user_id, badge_id)
    SELECT target_user_id, b.id
    FROM badges b
    WHERE b.points_required <= (SELECT points FROM users WHERE id = target_user_id)
    AND NOT EXISTS (
        SELECT 1 FROM user_badges ub
        WHERE ub.user_id = target_user_id AND ub.badge_id = b.id
    );
END;
$$;

-- ============================================
-- SEARCH PLACES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION search_places(
    search_query TEXT,
    place_category TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    category VARCHAR(20),
    description TEXT,
    address VARCHAR(500),
    rating DECIMAL(2, 1),
    review_count INTEGER,
    photos TEXT[]
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
        p.rating,
        p.review_count,
        p.photos
    FROM places p
    WHERE 
        p.is_verified = true
        AND (
            p.name ILIKE '%' || search_query || '%'
            OR p.description ILIKE '%' || search_query || '%'
            OR p.address ILIKE '%' || search_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(p.tags) AS tag
                WHERE tag ILIKE '%' || search_query || '%'
            )
        )
        AND (place_category IS NULL OR p.category = place_category)
    ORDER BY 
        CASE 
            WHEN p.name ILIKE search_query THEN 1
            WHEN p.name ILIKE search_query || '%' THEN 2
            WHEN p.name ILIKE '%' || search_query || '%' THEN 3
            ELSE 4
        END,
        p.rating DESC
    LIMIT result_limit;
END;
$$;

-- ============================================
-- GET DOCTOR AVAILABLE SLOTS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_available_slots(
    target_doctor_id UUID,
    target_date DATE
)
RETURNS TABLE (
    time_slot TIME,
    is_available BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.time_slot,
        NOT da.is_booked as is_available
    FROM doctor_availability da
    WHERE 
        da.doctor_id = target_doctor_id
        AND da.date = target_date
    ORDER BY da.time_slot;
END;
$$;

-- ============================================
-- UPDATE UPDATED_AT TIMESTAMP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at
    BEFORE UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
