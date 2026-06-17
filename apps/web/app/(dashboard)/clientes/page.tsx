'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  lastInteractionAt: string | null;
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load(query?: string) {
    api
      .get<Customer[]>(`/customers${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      .then(setCustomers);
  }

  useEffect(() => load(), []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.post('/customers', { name: name || undefined, phone });
      setName('');
      setPhone('');
      load(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao cadastrar cliente.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Clientes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Base de clientes que já conversaram com o agente de IA.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Nome (opcional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="5534999999999" />
          </div>
          <div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Cadastrando...' : 'Cadastrar cliente'}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2 max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
        />
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>WhatsApp</Th>
          <Th>E-mail</Th>
          <Th>Última interação</Th>
        </Thead>
        <tbody>
          {customers.map((customer) => (
            <Tr key={customer.id}>
              <Td>{customer.name || '—'}</Td>
              <Td>{customer.phone}</Td>
              <Td>{customer.email || '—'}</Td>
              <Td>
                {customer.lastInteractionAt
                  ? new Date(customer.lastInteractionAt).toLocaleString('pt-BR')
                  : '—'}
              </Td>
            </Tr>
          ))}
          {customers.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={4}>
                Nenhum cliente encontrado.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
