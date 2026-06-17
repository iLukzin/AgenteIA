'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  customer: { name: string | null; phone: string };
  service: { name: string } | null;
  employee: { name: string } | null;
}

interface Option {
  id: string;
  name: string | null;
}

const STATUSES = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'];

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Appointment[]>('/appointments').then(setAppointments);
  }

  useEffect(() => {
    load();
    api.get<Option[]>('/customers').then(setCustomers);
    api.get<Option[]>('/services').then(setServices);
    api.get<Option[]>('/employees').then(setEmployees);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.post('/appointments', {
        customerId,
        serviceId: serviceId || undefined,
        employeeId: employeeId || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      setCustomerId('');
      setServiceId('');
      setEmployeeId('');
      setScheduledAt('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao agendar.');
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Agendamentos</h1>
      <p className="text-sm text-gray-500 mb-6">
        Agendamentos marcados pelo agente de IA ou manualmente aqui no painel.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Cliente</Label>
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Selecione...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name || 'Sem nome'}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Serviço</Label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">—</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Profissional</Label>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">—</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Data e hora</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" disabled={creating}>
              {creating ? 'Agendando...' : 'Agendar'}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      <Table>
        <Thead>
          <Th>Cliente</Th>
          <Th>Serviço</Th>
          <Th>Profissional</Th>
          <Th>Data/hora</Th>
          <Th>Status</Th>
          <Th>Ações</Th>
        </Thead>
        <tbody>
          {appointments.map((appt) => (
            <Tr key={appt.id}>
              <Td>{appt.customer?.name || appt.customer?.phone}</Td>
              <Td>{appt.service?.name || '—'}</Td>
              <Td>{appt.employee?.name || '—'}</Td>
              <Td>{new Date(appt.scheduledAt).toLocaleString('pt-BR')}</Td>
              <Td><Badge status={appt.status} /></Td>
              <Td>
                <Select
                  value={appt.status}
                  onChange={(e) => updateStatus(appt.id, e.target.value)}
                  className="py-1"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Td>
            </Tr>
          ))}
          {appointments.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={6}>
                Nenhum agendamento ainda.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
