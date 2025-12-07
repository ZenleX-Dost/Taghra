-- TAGHRA Database Schema
-- PostgreSQL with PostGIS extension

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'restaurant', 'doctor', 'vet', 'sub', 'admin')),
    points INTEGER DEFAULT 0,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================
-- PLACES
-- ============================================

CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'health', 'vet', 'admin')),
    description TEXT,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    price_level INTEGER DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
    is_open BOOLEAN DEFAULT TRUE,
    opening_hours JSONB,
    photos TEXT[],
    features TEXT[],
    tags TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_places_location ON places USING GIST(location);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_rating ON places(rating DESC);

-- ============================================
-- DOCTORS (for health/vet places)
-- ============================================

CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    consultation_fee DECIMAL(10, 2),
    education TEXT,
    experience_years INTEGER,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES places(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    UNIQUE (doctor_id, date, time_slot)
);

CREATE INDEX idx_doctor_availability ON doctor_availability(doctor_id, date);

-- ============================================
-- MENU (for food places)
-- ============================================

CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    photos TEXT[],
    tags TEXT[],
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (place_id, user_id)
);

CREATE INDEX idx_reviews_place ON reviews(place_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    place_id UUID REFERENCES places(id),
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    delivery_address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_place ON orders(place_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES places(id),
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    reason TEXT,
    fee DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(date);

-- ============================================
-- ADMIN DOCUMENTS
-- ============================================

CREATE TABLE admin_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    required_documents TEXT[],
    steps JSONB,
    fees JSONB,
    processing_time VARCHAR(100),
    office_locations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUB SUBMISSIONS
-- ============================================

CREATE TABLE place_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    address VARCHAR(500) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    phone VARCHAR(20),
    description TEXT,
    photos TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_sub ON place_submissions(sub_id);
CREATE INDEX idx_submissions_status ON place_submissions(status);

-- ============================================
-- GAMIFICATION
-- ============================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    points_required INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_id)
);

CREATE TABLE points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_history_user ON points_history(user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'expo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, token)
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default badges
INSERT INTO badges (name, description, icon, points_required) VALUES
('Explorer', 'First place discovered', 'compass', 0),
('Reviewer', 'First review written', 'star', 10),
('Foodie', '10 food orders', 'restaurant', 50),
('Health Guru', '5 doctor appointments', 'medical', 30),
('Ambassador', 'First place submitted', 'flag', 0),
('Silver', 'Reached 100 points', 'medal', 100),
('Gold', 'Reached 500 points', 'trophy', 500),
('Platinum', 'Reached 1000 points', 'diamond', 1000);

-- Insert sample admin documents
INSERT INTO admin_documents (name, description, category, required_documents, processing_time) VALUES
('Carte Nationale d''Identité Électronique (CNIE)', 'Carte d''identité nationale marocaine', 'Identity', ARRAY['Extrait d''acte de naissance', 'Justificatif de domicile', '2 photos d''identité'], '1-2 weeks'),
('Passeport Biométrique', 'Passeport marocain biométrique', 'Travel', ARRAY['CNIE', 'Extrait d''acte de naissance', '2 photos d''identité', 'Ancien passeport (si renouvellement)'], '2-4 weeks'),
('Permis de Conduire', 'Permis de conduire marocain', 'Transport', ARRAY['CNIE', 'Certificat médical', 'Photos d''identité', 'Attestation de formation'], '2-3 weeks'),
('Extrait d''Acte de Naissance', 'Copie intégrale ou extrait', 'Civil Status', ARRAY['CNIE du demandeur'], '1-3 days'),
('Certificat de Résidence', 'Attestation de domicile', 'Residence', ARRAY['CNIE', 'Justificatif de domicile'], '1-2 days');
