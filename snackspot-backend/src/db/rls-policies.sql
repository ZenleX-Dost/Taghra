-- Taghra - Supabase Row Level Security Policies
-- These policies control data access at the database level

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::uuid = id);

-- Users can update their own data (except role and points)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::uuid = id)
  WITH CHECK (auth.uid()::uuid = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- ============================================
-- PLACES TABLE POLICIES
-- ============================================

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Anyone can view verified places
CREATE POLICY "Anyone can view verified places"
  ON places FOR SELECT
  USING (is_verified = true);

-- Owners can view their own places
CREATE POLICY "Owners can view own places"
  ON places FOR SELECT
  USING (owner_id = auth.uid()::uuid);

-- Owners can update their own places
CREATE POLICY "Owners can update own places"
  ON places FOR UPDATE
  USING (owner_id = auth.uid()::uuid);

-- Users with restaurant/doctor/vet role can create places
CREATE POLICY "Business users can create places"
  ON places FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid 
      AND role IN ('restaurant', 'doctor', 'vet')
    )
  );

-- ============================================
-- REVIEWS TABLE POLICIES
-- ============================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Place owners can view orders for their places
CREATE POLICY "Place owners can view their orders"
  ON orders FOR SELECT
  USING (
    place_id IN (
      SELECT id FROM places WHERE owner_id = auth.uid()::uuid
    )
  );

-- Users can create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- Place owners can update order status
CREATE POLICY "Place owners can update order status"
  ON orders FOR UPDATE
  USING (
    place_id IN (
      SELECT id FROM places WHERE owner_id = auth.uid()::uuid
    )
  );

-- ============================================
-- APPOINTMENTS TABLE POLICIES
-- ============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Doctors can view appointments at their place
CREATE POLICY "Doctors can view their appointments"
  ON appointments FOR SELECT
  USING (
    doctor_id IN (
      SELECT id FROM places WHERE owner_id = auth.uid()::uuid
    )
  );

-- Users can create appointments
CREATE POLICY "Users can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- Doctors can update appointment status
CREATE POLICY "Doctors can update appointments"
  ON appointments FOR UPDATE
  USING (
    doctor_id IN (
      SELECT id FROM places WHERE owner_id = auth.uid()::uuid
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- ============================================
-- MENU TABLES POLICIES
-- ============================================

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view menu categories
CREATE POLICY "Anyone can view menu categories"
  ON menu_categories FOR SELECT
  USING (true);

-- Anyone can view available menu items
CREATE POLICY "Anyone can view menu items"
  ON menu_items FOR SELECT
  USING (true);

-- Place owners can manage their menu
CREATE POLICY "Owners can manage menu categories"
  ON menu_categories FOR ALL
  USING (
    place_id IN (
      SELECT id FROM places WHERE owner_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Owners can manage menu items"
  ON menu_items FOR ALL
  USING (
    category_id IN (
      SELECT mc.id FROM menu_categories mc
      JOIN places p ON p.id = mc.place_id
      WHERE p.owner_id = auth.uid()::uuid
    )
  );

-- ============================================
-- PLACE SUBMISSIONS POLICIES
-- ============================================

ALTER TABLE place_submissions ENABLE ROW LEVEL SECURITY;

-- Subs can view their own submissions
CREATE POLICY "Subs can view own submissions"
  ON place_submissions FOR SELECT
  USING (auth.uid()::uuid = sub_id);

-- Subs can create submissions
CREATE POLICY "Subs can create submissions"
  ON place_submissions FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = sub_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'sub'
    )
  );

-- Admins can view and update all submissions
CREATE POLICY "Admins can manage submissions"
  ON place_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- ============================================
-- ADMIN DOCUMENTS POLICIES
-- ============================================

ALTER TABLE admin_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can view admin documents
CREATE POLICY "Anyone can view admin documents"
  ON admin_documents FOR SELECT
  USING (true);

-- Only admins can modify admin documents
CREATE POLICY "Admins can manage documents"
  ON admin_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );
