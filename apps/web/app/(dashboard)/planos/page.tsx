'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: string;
  messageLimit: number;
  whatsappNumbersLimit: number;
}

const EMPTY_FORM = { name: '', monthlyPrice: '', messageLimit: '', whatsappNumbersLimit: '1' };

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<Plan[]>('/platform-admin/plans').then(setPlans);
  }

  useEffect(load, []);

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      monthlyPrice: String(plan.monthlyPrice),
      messageLimit: String(plan.messageLimit),
      whatsappNumbersLimit: String(plan.whatsappNumbersLimit),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      monthlyPrice: Number(form.monthlyPrice),
      messageLimit: Number(form.messageLimit),
      whatsappNumbersLimit: Number(form.whatsappNumbersLimit),
    };
    try {
      if (editingId) {
        await api.patch(`/platform-admin/plans/${editingId}`, payload);
      } else {
        await api.post('/platform-admin/plans', payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar plano.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Planos</h1>
      <p className="text-sm text-gray-500 mb-6">
        Planos disponíveis para as empresas clientes. Mudar um plano aqui não cobra nada
        automaticamente — é só o registro de qual plano cada empresa está, usado em Empresas
        clientes.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <Label>Nome do plano</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Starter"
            />
          </div>
          <div>
            <Label>Preço mensal (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.monthlyPrice}
              onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))}
            />
          </div>
          <div>
            <Label>Limite de mensagens/mês</Label>
            <Input
              type="number"
              min="1"
              required
              value={form.messageLimit}
              onChange={(e) => setForm((f) => ({ ...f, messageLimit: e.target.value }))}
            />
          </div>
          <div>
            <Label>Nº de WhatsApp</Label>
            <Input
              type="number"
              min="1"
              value={form.whatsappNumbersLimit}
              onChange={(e) => setForm((f) => ({ ...f, whatsappNumbersLimit: e.target.value }))}
            />
          </div>
          <div className="md:col-span-5 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancelar edição
              </Button>
            )}
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>Preço mensal</Th>
          <Th>Limite de mensagens</Th>
          <Th>Nº de WhatsApp</Th>
          <Th>Ações</Th>
        </Thead>
        <tbody>
          {plans.map((plan) => (
            <Tr key={plan.id}>
              <Td>{plan.name}</Td>
              <Td>R$ {plan.monthlyPrice}</Td>
              <Td>{plan.messageLimit}</Td>
              <Td>{plan.whatsappNumbersLimit}</Td>
              <Td>
                <button
                  onClick={() => startEdit(plan)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Editar
                </button>
              </Td>
            </Tr>
          ))}
          {plans.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={5}>
                Nenhum plano cadastrado ainda.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
