-- =============================================================
-- AutoMatch - Migração Completa
-- Cria as 3 tabelas com schema correto, preserva dados scrapados
-- Execute no Supabase SQL Editor
-- =============================================================

-- =============================================================
-- 1. PROFILES
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  first_name TEXT NOT NULL DEFAULT '',
  surname TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================
-- 2. CARS (preserva dados da tabela antiga)
-- =============================================================

-- Renomear tabela antiga do scraping (se existir)
ALTER TABLE IF EXISTS cars RENAME TO cars_scraped;

-- Criar tabela com schema correto
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

-- Migrar dados do scraping
INSERT INTO cars (id, name, year, price, category, engine, power, consumption, weight)
SELECT
  id::TEXT,
  INITCAP(marca || ' ' || modelo || COALESCE(' ' || versao, '')),
  COALESCE(ano, 0),
  COALESCE(preco_orcamento, 0),
  COALESCE(NULLIF(categoria, 'Indefinido'), 'Indefinido'),
  COALESCE(cambio, ''),
  COALESCE(potencia_cv::TEXT || ' cv', ''),
  '',
  ''
FROM cars_scraped;

CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cars_select_public" ON cars;
CREATE POLICY "cars_select_public" ON cars
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cars_insert_admin" ON cars;
CREATE POLICY "cars_insert_admin" ON cars
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "cars_update_admin" ON cars;
CREATE POLICY "cars_update_admin" ON cars
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "cars_delete_admin" ON cars;
CREATE POLICY "cars_delete_admin" ON cars
  FOR DELETE USING (auth.role() = 'service_role');

-- =============================================================
-- 3. SAVED_MATCHES
-- =============================================================
CREATE TABLE saved_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  match_percentage DOUBLE PRECISION NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_matches_user_id ON saved_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_matches_car_id ON saved_matches(car_id);

ALTER TABLE saved_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_matches_select_own" ON saved_matches;
CREATE POLICY "saved_matches_select_own" ON saved_matches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_matches_insert_own" ON saved_matches;
CREATE POLICY "saved_matches_insert_own" ON saved_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_matches_update_own" ON saved_matches;
CREATE POLICY "saved_matches_update_own" ON saved_matches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_matches_delete_own" ON saved_matches;
CREATE POLICY "saved_matches_delete_own" ON saved_matches
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================
-- 4. TRIGGERS
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS cars_updated_at ON cars;
CREATE TRIGGER cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: criar profile automaticamente no signup
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- 5. BACKFILL: Criar profiles para usuários existentes
-- =============================================================
INSERT INTO profiles (id, email, first_name, surname, role, avatar_url)
SELECT
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'firstName', ''),
  COALESCE(raw_user_meta_data->>'surname', ''),
  'USER',
  ''
FROM auth.users
ON CONFLICT (id) DO NOTHING;
