-- =====================================================================
-- VETOR AI — Migration 003: integração com WhatsApp (Evolution API)
--
-- Quando uma mensagem chega no webhook, a Evolution API manda no corpo
-- da requisição o campo "instance" (o nome da instância que você criou
-- na Evolution API) — é por esse nome que descobrimos de qual empresa
-- é a mensagem, antes de sabermos o company_id (mesmo problema de
-- "ovo e galinha" do login, resolvido da mesma forma: uma função
-- SECURITY DEFINER bem específica).
-- =====================================================================

ALTER TABLE integrations ADD COLUMN IF NOT EXISTS instance_name VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS integrations_instance_name_key ON integrations (instance_name);

CREATE OR REPLACE FUNCTION webhook_find_company_by_instance(p_instance_name TEXT)
RETURNS TABLE (
    company_id            UUID,
    whatsapp_number        VARCHAR,
    name                   VARCHAR,
    ai_personality         VARCHAR,
    greeting_message       TEXT,
    away_message           TEXT,
    closing_message        TEXT,
    handoff_message        TEXT,
    business_hours         JSONB,
    credentials_encrypted  TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        c.id, c.whatsapp_number, c.name, c.ai_personality, c.greeting_message,
        c.away_message, c.closing_message, c.handoff_message, c.business_hours,
        i.credentials_encrypted
    FROM integrations i
    JOIN companies c ON c.id = i.company_id
    WHERE i.instance_name = p_instance_name
      AND i.type = 'whatsapp_evolution'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION webhook_find_company_by_instance(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION webhook_find_company_by_instance(TEXT) TO app_backend_role;
