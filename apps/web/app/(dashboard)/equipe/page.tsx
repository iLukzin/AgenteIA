'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  name: string;
  specialties: string[];
  active: boolean;
}

export default function EquipePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Employee[]>('/employees').then(setEmployees);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.post('/employees', {
        name,
        specialties: specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setName('');
      setSpecialties('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao adicionar funcionário.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(employee: Employee) {
    if (employee.active) {
      await api.delete(`/employees/${employee.id}`);
    } else {
      await api.patch(`/employees/${employee.id}`, { active: true });
    }
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Equipe</h1>
      <p className="text-sm text-gray-500 mb-6">
        Profissionais disponíveis para atendimento e agendamento.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Especialidades (separadas por vírgula)</Label>
            <Input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="corte, barba"
            />
          </div>
          <div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>Especialidades</Th>
          <Th>Status</Th>
          <Th>Ações</Th>
        </Thead>
        <tbody>
          {employees.map((employee) => (
            <Tr key={employee.id}>
              <Td>{employee.name}</Td>
              <Td>{employee.specialties?.join(', ') || '—'}</Td>
              <Td>
                <Badge status={employee.active ? 'active' : 'cancelled'} />
              </Td>
              <Td>
                <button
                  onClick={() => toggleActive(employee)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {employee.active ? 'Inativar' : 'Reativar'}
                </button>
              </Td>
            </Tr>
          ))}
          {employees.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={4}>
                Nenhum funcionário cadastrado ainda.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
