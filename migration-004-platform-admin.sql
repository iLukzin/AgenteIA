-- =====================================================================
-- VETOR AI — Migration 004: administração da plataforma
--
-- Adiciona o conceito de "admin da plataforma" — alguém (você, que
-- opera o Vetor AI) que precisa ver e gerenciar TODAS as empresas
-- clientes, atravessando o isolamento normal de RLS entre tenants.
-- =====================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Marca seu próprio usuário como admin da plataforma.
-- Troque o e-mail abaixo se o seu usuário master for outro.
UPDATE users SET is_platform_admin = true WHERE email = 'lucas@fortitude.com';

-- A função de login (migration-002) precisa devolver essa nova
-- informação também. Como o tipo de retorno muda, é preciso recriar
-- a função do zero (CREATE OR REPLACE não permite mudar o retorno).
DROP FUNCTION IF EXISTS auth_find_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION auth_find_user_by_email(p_email TEXT)
RETURNS TABLE (
    id                  UUID,
    company_id          UUID,
    name                VARCHAR,
    email               VARCHAR,
    password_hash       TEXT,
    role                VARCHAR,
    active              BOOLEAN,
    is_platform_admin   BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, company_id, name, email, password_hash, role, active, is_platform_admin
    FROM users
    WHERE email = p_email
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION auth_find_user_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_find_user_by_email(TEXT) TO app_backend_role;

-- Lista todas as empresas, ignorando RLS de propósito — é exatamente
-- isso que a tela de administração da plataforma precisa fazer.
-- Só pode ser chamada pela app_backend_role, e o controller por trás
-- dela exige que o usuário logado tenha is_platform_admin = true.
CREATE OR REPLACE FUNCTION platform_admin_list_companies()
RETURNS TABLE (
    id              UUID,
    name            VARCHAR,
    slug            VARCHAR,
    status          VARCHAR,
    plan_id         UUID,
    plan_name       VARCHAR,
    created_at      TIMESTAMPTZ,
    total_users     BIGINT,
    total_customers BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.id, c.name, c.slug, c.status, c.plan_id, p.name AS plan_name, c.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) AS total_users,
        (SELECT COUNT(*) FROM customers cu WHERE cu.company_id = c.id) AS total_customers
    FROM companies c
    LEFT JOIN plans p ON p.id = c.plan_id
    ORDER BY c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION platform_admin_list_companies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform_admin_list_companies() TO app_backend_role;
