-- =============================================
-- AERO — Auth & Security (minimal)
-- Migration: 002_auth_security.sql
-- =============================================


-- 1. Permitir INSERT al registrarse
-- Sin esto el trigger handle_new_user falla
CREATE POLICY "profiles: insert on signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. Helper para que el frontend consulte el rol
-- Uso: const { data } = await supabase.rpc('get_my_role')
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- 3. Crear fila en students o vendors según rol del signup
-- El cliente pasa: supabase.auth.signUp({ options: { data: { role: 'student' } } })
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');

  UPDATE profiles SET role = v_role WHERE id = NEW.id;

  IF v_role = 'student' THEN
    INSERT INTO students (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF v_role = 'vendor' THEN
    INSERT INTO vendors (id, business_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();