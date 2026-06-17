'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  durationMinutes: number;
  active: boolean;
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Service[]>('/services').then(setServices);
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.post('/services', {
        name,
        price: price ? Number(price) : undefined,
        durationMinutes: Number(duration),
      });
      setName('');
      setPrice('');
      setDuration('30');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar serviço.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(service: Service) {
    if (service.active) {
      await api.delete(`/services/${service.id}`); // soft delete (inativa)
    } else {
      await api.patch(`/services/${service.id}`, { active: true });
    }
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Serviços</h1>
      <p className="text-sm text-gray-500 mb-6">
        Serviços que o agente de IA pode oferecer e agendar.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <Label>Nome do serviço</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Preço (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label>Duração (min)</Label>
            <Input
              type="number"
              min="5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" disabled={creating}>
              {creating ? 'Adicionando...' : 'Adicionar serviço'}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>Preço</Th>
          <Th>Duração</Th>
          <Th>Status</Th>
          <Th>Ações</Th>
        </Thead>
        <tbody>
          {services.map((service) => (
            <Tr key={service.id}>
              <Td>{service.name}</Td>
              <Td>{service.price ? `R$ ${service.price}` : '—'}</Td>
              <Td>{service.durationMinutes} min</Td>
              <Td>
                <Badge status={service.active ? 'active' : 'cancelled'} />
              </Td>
              <Td>
                <button
                  onClick={() => toggleActive(service)}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {service.active ? 'Inativar' : 'Reativar'}
                </button>
              </Td>
            </Tr>
          ))}
          {services.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={5}>
                Nenhum serviço cadastrado ainda.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
