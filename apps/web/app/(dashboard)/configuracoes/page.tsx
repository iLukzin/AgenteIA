'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const webhookUrl = `${apiUrl}/webhooks/whatsapp`;

  const [integration, setIntegration] = useState<WhatsappIntegration | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [evolutionApiUrl, setEvolutionApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<WhatsappIntegration>('/integrations/whatsapp').then((data) => {
      setIntegration(data);
      if (data.instanceName) setInstanceName(data.instanceName);
    });
  }, []);

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
      setMessage('Integração salva.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar integração.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4 max-w-2xl mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">Integração com WhatsApp</h2>
        {integration && <Badge status={integration.configured ? 'active' : 'disconnected'} />}
      </div>

      <p className="text-sm text-gray-500">
        Crie uma instância na sua Evolution API e configure o webhook dela apontando para a URL
        abaixo, com o evento <code className="text-xs bg-gray-100 px-1 rounded">MESSAGES_UPSERT</code> habilitado.
      </p>

      <div>
        <Label>URL do webhook (cole na Evolution API)</Label>
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
