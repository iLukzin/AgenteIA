'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/card';

interface Summary {
  openConversations: number;
  appointmentsThisWeek: number;
  totalCustomers: number;
  totalLeads: number;
  conversionRate: number;
  leadsByStatus: { status: string; count: number }[];
}

export default function OverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Summary>('/dashboard/summary')
      .then(setSummary)
      .catch(() => setError('Não foi possível carregar os indicadores.'));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Visão geral</h1>
      <p className="text-sm text-gray-500 mb-6">
        Resumo da atividade do seu agente de IA.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!summary && !error && (
        <p className="text-sm text-gray-400">Carregando indicadores...</p>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Conversas em aberto" value={summary.openConversations} />
            <StatCard label="Agendamentos esta semana" value={summary.appointmentsThisWeek} />
            <StatCard label="Clientes cadastrados" value={summary.totalCustomers} />
            <StatCard
              label="Taxa de conversão de leads"
              value={`${summary.conversionRate}%`}
              hint={`${summary.totalLeads} leads no total`}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Leads por status</h2>
            <div className="space-y-2">
              {summary.leadsByStatus.length === 0 && (
                <p className="text-sm text-gray-400">Nenhum lead registrado ainda.</p>
              )}
              {summary.leadsByStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">{row.status}</span>
                  <span className="font-medium text-gray-900">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
