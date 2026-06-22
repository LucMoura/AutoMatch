-- =============================================================
-- RLS Fix: Resolve recursao infinita nas policies da profiles
-- Causa: EXISTS (SELECT 1 FROM profiles ...) dentro de uma
-- policy da propria tabela profiles causa recursao infinita.
-- Solucao: Funcao SECURITY DEFINER que ignora RLS.
-- Execute no Supabase SQL Editor
-- =============================================================

-- 1. Funcao que verifica admin sem gatilhar RLS recursivo
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
-- 2. Profiles
-- =============================================================

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR is_admin()
  );

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR is_admin()
  );

-- =============================================================
-- 3. Cars
-- =============================================================

DROP POLICY IF EXISTS "cars_insert_admin" ON cars;
CREATE POLICY "cars_insert_admin" ON cars
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "cars_update_admin" ON cars;
CREATE POLICY "cars_update_admin" ON cars
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "cars_delete_admin" ON cars;
CREATE POLICY "cars_delete_admin" ON cars
  FOR DELETE USING (is_admin());

-- =============================================================
-- 4. Saved matches
-- =============================================================

DROP POLICY IF EXISTS "saved_matches_delete_own" ON saved_matches;
CREATE POLICY "saved_matches_delete_own" ON saved_matches
  FOR DELETE USING (
    auth.uid() = user_id
    OR is_admin()
  );
