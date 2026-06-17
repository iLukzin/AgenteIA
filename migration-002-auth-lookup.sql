-- =====================================================================
-- VETOR AI — Migration 002: função auxiliar de login
--
-- Por que isso é necessário: a política de RLS na tabela `users` exige
-- que `app.current_company_id` já esteja definido para qualquer SELECT.
-- Mas no momento do login só temos o e-mail e a senha — ainda não
-- sabemos a qual empresa o usuário pertence (é justamente isso que
-- esta consulta precisa descobrir). Por isso ela precisa rodar
-- ignorando RLS, mas SÓ ela, e SÓ para este propósito específico —
-- nunca conceda BYPASSRLS para a app_backend_role de forma geral.
--
-- SECURITY DEFINER faz a função executar com o privilégio de quem a
-- criou. Rode este arquivo no SQL Editor do Supabase normalmente
-- (lá você está conectado como o superusuário `postgres`, que já
-- ignora RLS por padrão) — assim a função nasce com esse privilégio,
-- sem precisar conceder nada extra à role da aplicação além do
-- EXECUTE explícito abaixo.
-- =====================================================================

CREATE OR REPLACE FUNCTION auth_find_user_by_email(p_email TEXT)
RETURNS TABLE (
    id            UUID,
    company_id    UUID,
    name          VARCHAR,
    email         VARCHAR,
    password_hash TEXT,
    role          VARCHAR,
    active        BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, company_id, name, email, password_hash, role, active
    FROM users
    WHERE email = p_email
    LIMIT 1;
$$;

-- Remove qualquer permissão default e concede explicitamente só para
-- a role que o backend usa — nenhuma outra role/usuário pode chamá-la.
REVOKE ALL ON FUNCTION auth_find_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_find_user_by_email(TEXT) TO app_backend_role;

-- Teste rápido (deve retornar vazio até você ter algum usuário cadastrado):
-- SELECT * FROM auth_find_user_by_email('teste@exemplo.com');
