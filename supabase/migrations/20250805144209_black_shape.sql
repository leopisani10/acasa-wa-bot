/*
  # Criar usuário administrador padrão

  1. Inserir perfil administrativo
    - Email: contato@acasaresidencialsenior.com.br
    - Nome: Administrador ACASA
    - Role: admin
    - Cargo: Administrador Geral
    - Unidade: Matriz
    - Tipo: matriz

  2. Notas
    - Este usuário pode ser usado para configuração inicial
    - A senha deve ser definida através do sistema de auth do Supabase
*/

-- Inserir perfil administrativo (será criado quando o usuário fizer signup)
-- Esta é uma função que será executada via trigger quando um novo usuário for criado

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Se for o email do admin, criar perfil como admin
  IF NEW.email = 'contato@acasaresidencialsenior.com.br' THEN
    INSERT INTO public.profiles (id, name, email, position, unit, type, role)
    VALUES (
      NEW.id,
      'Administrador ACASA',
      NEW.email,
      'Administrador Geral',
      'Matriz',
      'matriz',
      'admin'
    );
  ELSE
    -- Para outros usuários, criar perfil padrão como staff
    INSERT INTO public.profiles (id, name, email, position, unit, type, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'position', 'Colaborador'),
      COALESCE(NEW.raw_user_meta_data->>'unit', 'Botafogo'),
      COALESCE(NEW.raw_user_meta_data->>'type', 'matriz'),
      'staff'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Trigger para criar perfil automaticamente quando usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Função para atualizar email nos perfis quando alterado no auth
CREATE OR REPLACE FUNCTION handle_updated_user()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Trigger para sincronizar email
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_user();