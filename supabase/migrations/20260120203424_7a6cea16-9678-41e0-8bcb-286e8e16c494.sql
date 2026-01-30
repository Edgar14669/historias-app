-- Criar função para inserir usuário admin de teste (será chamada após o signup)
-- Esta é uma função auxiliar para facilitar o setup inicial do admin

-- Primeiro, vamos garantir que há um trigger ativo para criar roles automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Também garantir que o trigger de profile existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();