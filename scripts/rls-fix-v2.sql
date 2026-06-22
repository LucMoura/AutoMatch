-- =============================================================
-- RLS Fix v2: Permitir que admins vejam todos os perfis
-- e deletem matches ao excluir carros
-- Execute no Supabase SQL Editor
-- =============================================================

-- 1. Profiles: admin pode SELECT/UPDATE qualquer perfil
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 2. Saved matches: admin pode deletar qualquer match (necessário ao excluir carro)
DROP POLICY IF EXISTS "saved_matches_delete_own" ON saved_matches;
CREATE POLICY "saved_matches_delete_own" ON saved_matches
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
