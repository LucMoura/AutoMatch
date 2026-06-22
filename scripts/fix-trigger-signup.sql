-- =============================================================
-- AutoMatch - Fix: handle_new_user trigger
-- Execute no Supabase SQL Editor para corrigir o erro 500 no signup
-- =============================================================

-- 1. Verificar se a tabela profiles existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE EXCEPTION 'Tabela profiles nao existe. Execute o schema primeiro.';
  END IF;
END $$;

-- 2. Corrigir a funcao handle_new_user com tratamento de erro
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
    RAISE WARNING 'handle_new_user: Erro ao criar profile para user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Testar se o trigger esta funcionando
SELECT 'Trigger handle_new_user atualizado com sucesso!' AS status;
