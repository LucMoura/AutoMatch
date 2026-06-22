-- =============================================================
-- AutoMatch - Supabase Schema
-- Execute this SQL in the Supabase SQL Editor
-- =============================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  surname TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- 2. CARS (vehicle catalog)
CREATE TABLE cars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  engine TEXT NOT NULL,
  power TEXT NOT NULL,
  consumption TEXT NOT NULL,
  weight TEXT NOT NULL,
  ipva DOUBLE PRECISION NOT NULL DEFAULT 0,
  insurance DOUBLE PRECISION NOT NULL DEFAULT 0,
  maintenance DOUBLE PRECISION NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  main_image TEXT NOT NULL DEFAULT '',
  thumbnail_images JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SAVED_MATCHES (user-car matches)
CREATE TABLE saved_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  match_percentage DOUBLE PRECISION NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_saved_matches_user_id ON saved_matches(user_id);
CREATE INDEX idx_saved_matches_car_id ON saved_matches(car_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_cars_category ON cars(category);

-- =============================================================
-- FUNCTIONS (SECURITY DEFINER to bypass RLS recursion)
-- =============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_matches ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/update own profile; admin can read/update all
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR is_admin()
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR is_admin()
  );

CREATE POLICY "profiles_insert_trigger" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cars: public read, admin write
CREATE POLICY "cars_select_public" ON cars
  FOR SELECT USING (true);

CREATE POLICY "cars_insert_admin" ON cars
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "cars_update_admin" ON cars
  FOR UPDATE USING (is_admin());

CREATE POLICY "cars_delete_admin" ON cars
  FOR DELETE USING (is_admin());

-- Saved matches: user owns their matches
CREATE POLICY "saved_matches_select_own" ON saved_matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_matches_insert_own" ON saved_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_matches_update_own" ON saved_matches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "saved_matches_delete_own" ON saved_matches
  FOR DELETE USING (
    auth.uid() = user_id
    OR is_admin()
  );

-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, surname)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: erro ao criar profile para %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
