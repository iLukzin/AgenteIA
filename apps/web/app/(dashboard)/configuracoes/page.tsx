'use client';

import { useEffect, useState } from 'react';
import { api, apiUrl, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  name: string;
  phone: string | null;
  whatsappNumber: string | null;
  aiPersonality: string;
  greetingMessage: string | null;
  awayMessage: string | null;
  closingMessage: string | null;
  handoffMessage: string | null;
}

function CompanySettingsForm() {
  const [company, setCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Company>('/companies/me').then(setCompany);
  }, []);

  function update<K extends keyof Company>(key: K, value: Company[K]) {
    setCompany((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.patch('/companies/me', {
        name: company.name,
        phone: company.phone,
        whatsappNumber: company.whatsappNumber,
        aiPersonality: company.aiPersonality,
        greetingMessage: company.greetingMessage,
        awayMessage: company.awayMessage,
        closingMessage: company.closingMessage,
        handoffMessage: company.handoffMessage,
      });
      setMessage('Configurações salvas.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (!company) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Dados da empresa</h2>
        <div>
          <Label>Nome</Label>
          <Input value={company.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Telefone</Label>
            <Input value={company.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input
              value={company.whatsappNumber ?? ''}
              onChange={(e) => update('whatsappNumber', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Personalidade da IA</h2>
        <div>
          <Label>Tom de voz</Label>
          <Select value={company.aiPersonality} onChange={(e) => update('aiPersonality', e.target.value)}>
            <option value="formal">Formal</option>
            <option value="profissional">Profissional</option>
            <option value="amigavel">Amigável</option>
            <option value="premium">Premium</option>
            <option value="consultiva">Consultiva</option>
          </Select>
        </div>
        <div>
          <Label>Mensagem de saudação</Label>
          <Textarea rows={2} value={company.greetingMessage ?? ''} onChange={(e) => update('greetingMessage', e.target.value)} />
        </div>
        <div>
          <Label>Mensagem fora do horário</Label>
          <Textarea rows={2} value={company.awayMessage ?? ''} onChange={(e) => update('awayMessage', e.target.value)} />
        </div>
        <div>
          <Label>Mensagem de encerramento</Label>
          <Textarea rows={2} value={company.closingMessage ?? ''} onChange={(e) => update('closingMessage', e.target.value)} />
        </div>
        <div>
          <Label>Mensagem de transferência para humano</Label>
          <Textarea rows={2} value={company.handoffMessage ?? ''} onChange={(e) => update('handoffMessage', e.target.value)} />
        </div>
      </Card>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </form>
  );
}

interface WhatsappIntegration {
  configured: boolean;
  instanceName?: string | null;
  status?: string;
}

function WhatsappIntegrationForm() {
  const webhookUrl = `${apiUrl}/webhooks/whatsapp`;

  const [integration, setIntegration] = useState<WhatsappIntegration | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [evolutionApiUrl, setEvolutionApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const [configuringWebhook, setConfiguringWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  useEffect(() => {
    api.get<WhatsappIntegration>('/integrations/whatsapp').then((data) => {
      setIntegration(data);
      if (data.instanceName) setInstanceName(data.instanceName);
    });
  }, []);

  // Enquanto o QR code estiver na tela e ainda não tiver conectado,
  // checa o status a cada poucos segundos — assim que o celular
  // escanear, a tela atualiza sozinha, sem precisar de F5.
  useEffect(() => {
    if (!qrCode) return;

    const interval = setInterval(async () => {
      try {
        const status = await api.get<WhatsappIntegration>('/integrations/whatsapp/status');
        setIntegration(status);
        if (status.status === 'connected') {
          setQrCode(null);
          setPairingCode(null);
          setMessage('WhatsApp conectado com sucesso!');
        }
      } catch {
        // Ignora falhas pontuais de polling — tenta de novo no próximo ciclo.
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [qrCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await api.put<WhatsappIntegration>('/integrations/whatsapp', {
        instanceName,
        apiUrl: evolutionApiUrl,
        apiKey,
      });
      setIntegration(result);
      setApiKey('');
      setMessage('Integração salva. Agora você já pode gerar o QR code abaixo.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar integração.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateQrCode() {
    setGeneratingQr(true);
    setQrError(null);
    setMessage(null);
    try {
      const result = await api.post<{
        qrCodeBase64: string;
        pairingCode?: string;
        webhookConfigured: boolean;
        webhookError?: string;
      }>('/integrations/whatsapp/qrcode', { webhookUrl });
      setQrCode(result.qrCodeBase64);
      setPairingCode(result.pairingCode ?? null);
      if (!result.webhookConfigured) {
        setQrError(
          `QR code gerado, mas não consegui configurar o webhook automaticamente: ${
            result.webhookError ?? 'erro desconhecido'
          }. Use o botão "Configurar webhook" abaixo, ou configure manualmente na sua Evolution API.`,
        );
      }
    } catch (err) {
      setQrError(err instanceof ApiError ? err.message : 'Erro ao gerar o QR code.');
    } finally {
      setGeneratingQr(false);
    }
  }

  async function handleConfigureWebhook() {
    setConfiguringWebhook(true);
    setWebhookMessage(null);
    setWebhookError(null);
    try {
      await api.post('/integrations/whatsapp/webhook', { webhookUrl });
      setWebhookMessage('Webhook configurado. Agora mensagens recebidas devem chegar ao agente.');
    } catch (err) {
      setWebhookError(err instanceof ApiError ? err.message : 'Erro ao configurar o webhook.');
    } finally {
      setConfiguringWebhook(false);
    }
  }

  return (
    <Card className="space-y-4 max-w-2xl mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">Integração com WhatsApp</h2>
        {integration?.configured && <Badge status={integration.status ?? 'disconnected'} />}
      </div>

      <p className="text-sm text-gray-500">
        Ao gerar o QR code abaixo, tentamos configurar automaticamente o webhook na sua Evolution
        API (evento <code className="text-xs bg-gray-100 px-1 rounded">MESSAGES_UPSERT</code>). Se
        isso falhar, ou se sua instância já estava conectada antes dessa automação existir, use o
        botão "Configurar webhook" para fazer isso manualmente sem precisar reconectar.
      </p>

      <div>
        <Label>URL do webhook</Label>
        <Input readOnly value={webhookUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nome da instância</Label>
            <Input
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              required
              placeholder="minha-empresa"
            />
          </div>
          <div>
            <Label>URL da Evolution API</Label>
            <Input
              value={evolutionApiUrl}
              onChange={(e) => setEvolutionApiUrl(e.target.value)}
              required
              placeholder="https://sua-evolution-api.com"
            />
          </div>
        </div>
        <div>
          <Label>API Key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            placeholder="Cole a API key da sua Evolution API"
          />
          <p className="text-xs text-gray-400 mt-1">
            Por segurança, não mostramos a chave já salva — toda vez que você salvar esta seção,
            precisa colar a chave de novo (mesmo que não tenha mudado).
          </p>
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar integração'}
        </Button>
      </form>

      {integration?.configured && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Conectar o WhatsApp</h3>

          {integration.status === 'connected' && !qrCode ? (
            <p className="text-sm text-green-700">
              WhatsApp conectado. Se precisar reconectar (ex: depois de deslogar no celular),
              gere um QR code novo abaixo.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Clique no botão, abra o WhatsApp no celular em Configurações → Dispositivos
              conectados → Conectar dispositivo, e escaneie o código.
            </p>
          )}

          {qrCode && (
            <div className="flex flex-col items-center gap-2 py-2">
              <img src={qrCode} alt="QR code para conectar o WhatsApp" className="w-56 h-56 border border-gray-200 rounded-lg" />
              {pairingCode && (
                <p className="text-xs text-gray-400">
                  Ou use o código de pareamento: <span className="font-mono">{pairingCode}</span>
                </p>
              )}
              <p className="text-xs text-gray-400">Aguardando leitura...</p>
            </div>
          )}

          {qrError && <p className="text-sm text-red-600">{qrError}</p>}

          <Button type="button" onClick={handleGenerateQrCode} disabled={generatingQr}>
            {generatingQr ? 'Gerando...' : qrCode ? 'Gerar QR code novo' : 'Gerar QR code'}
          </Button>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Já conectado mas o agente não está respondendo às mensagens? Provavelmente o
              webhook nunca foi configurado. Sem precisar desconectar nada:
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleConfigureWebhook}
              disabled={configuringWebhook}
            >
              {configuringWebhook ? 'Configurando...' : 'Configurar webhook'}
            </Button>
            {webhookMessage && <p className="text-sm text-green-700 mt-2">{webhookMessage}</p>}
            {webhookError && <p className="text-sm text-red-600 mt-2">{webhookError}</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ConfiguracoesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Configurações</h1>
      <p className="text-sm text-gray-500 mb-6">
        Dados da empresa, personalidade do agente de IA e integração com o WhatsApp.
      </p>

      <CompanySettingsForm />
      <WhatsappIntegrationForm />
    </div>
  );
}
