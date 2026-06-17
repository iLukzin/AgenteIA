'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Select } from '@/components/ui/input';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  status: string;
  source: string | null;
  estimatedValue: string | null;
  createdAt: string;
  customer: { name: string | null; phone: string };
}

const STATUSES = ['new', 'qualified', 'proposal', 'won', 'lost'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('');

  function load(status?: string) {
    api.get<Lead[]>(`/leads${status ? `?status=${status}` : ''}`).then(setLeads);
  }

  useEffect(() => load(), []);

  function handleFilterChange(value: string) {
    setFilter(value);
    load(value || undefined);
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/leads/${id}`, { status });
    load(filter || undefined);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Leads</h1>
      <p className="text-sm text-gray-500 mb-6">
        Oportunidades de venda identificadas pelo agente de IA nas conversas.
      </p>

      <div className="mb-4 max-w-xs">
        <Select value={filter} onChange={(e) => handleFilterChange(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <Table>
        <Thead>
          <Th>Cliente</Th>
          <Th>Origem</Th>
          <Th>Valor estimado</Th>
          <Th>Status</Th>
          <Th>Criado em</Th>
        </Thead>
        <tbody>
          {leads.map((lead) => (
            <Tr key={lead.id}>
              <Td>{lead.customer?.name || lead.customer?.phone}</Td>
              <Td>{lead.source || '—'}</Td>
              <Td>{lead.estimatedValue ? `R$ ${lead.estimatedValue}` : '—'}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Badge status={lead.status} />
                  <Select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="py-1 w-32"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
              </Td>
              <Td>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</Td>
            </Tr>
          ))}
          {leads.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={5}>
                Nenhum lead encontrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
