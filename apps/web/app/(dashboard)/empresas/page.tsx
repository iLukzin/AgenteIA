'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Select, Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id: string | null;
  plan_name: string | null;
  created_at: string;
  total_users: number;
  total_customers: number;
}

interface Plan {
  id: string;
  name: string;
}

const STATUSES = ['active', 'suspended', 'cancelled'];

const EMPTY_FORM = { companyName: '', name: '', email: '', password: '', planId: '' };

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api
      .get<Company[]>('/platform-admin/companies')
      .then(setCompanies)
      .catch(() => setError('Você não tem acesso a esta área.'));
    api.get<Plan[]>('/platform-admin/plans').then(setPlans);
  }

  useEffect(load, []);

  async function updateCompany(id: string, data: { planId?: string | null; status?: string }) {
    await api.patch(`/platform-admin/companies/${id}`, data);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/platform-admin/companies', {
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        password: form.password,
        planId: form.planId || undefined,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao criar empresa.');
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Empresas clientes</h1>
          <p className="text-sm text-gray-500">
            Todas as empresas cadastradas no Vetor AI. Só você cria empresas novas — não existe
            cadastro público.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nova empresa cliente'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome da empresa</Label>
              <Input
                required
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Clínica Bem Estar"
              />
            </div>
            <div>
              <Label>Plano</Label>
              <Select
                value={form.planId}
                onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
              >
                <option value="">Usar o plano mais barato</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Nome do responsável</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>E-mail de acesso</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="contato@empresa.com.br"
              />
            </div>
            <div>
              <Label>Senha inicial</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="defina e informe ao cliente"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Criando...' : 'Criar empresa e acesso'}
              </Button>
            </div>
          </form>
          {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
        </Card>
      )}

      <Table>
        <Thead>
          <Th>Empresa</Th>
          <Th>Plano</Th>
          <Th>Status</Th>
          <Th>Usuários</Th>
          <Th>Clientes cadastrados</Th>
          <Th>Desde</Th>
        </Thead>
        <tbody>
          {companies.map((company) => (
            <Tr key={company.id}>
              <Td>
                <div className="font-medium text-gray-900">{company.name}</div>
                <div className="text-xs text-gray-400">{company.slug}</div>
              </Td>
              <Td>
                <Select
                  className="py-1"
                  value={company.plan_id ?? ''}
                  onChange={(e) =>
                    updateCompany(company.id, { planId: e.target.value || null })
                  }
                >
                  <option value="">Sem plano</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Badge status={company.status} />
                  <Select
                    className="py-1 w-32"
                    value={company.status}
                    onChange={(e) => updateCompany(company.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </Td>
              <Td>{company.total_users}</Td>
              <Td>{company.total_customers}</Td>
              <Td>{new Date(company.created_at).toLocaleDateString('pt-BR')}</Td>
            </Tr>
          ))}
          {companies.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={6}>
                Nenhuma empresa cadastrada ainda.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
