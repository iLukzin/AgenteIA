'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';

interface Conversation {
  id: string;
  status: string;
  channel: string;
  startedAt: string;
  customer: { name: string | null; phone: string };
}

interface Message {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    api.get<Conversation[]>('/conversations').then(setConversations);
  }, []);

  function selectConversation(id: string) {
    setSelectedId(id);
    setLoadingMessages(true);
    api
      .get<Message[]>(`/conversations/${id}/messages`)
      .then(setMessages)
      .finally(() => setLoadingMessages(false));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Conversas</h1>
      <p className="text-sm text-gray-500 mb-6">
        Histórico de conversas do agente de IA com seus clientes (somente leitura).
      </p>

      <div className="flex gap-4 h-[28rem]">
        <div className="w-72 shrink-0 border border-gray-200 rounded-xl overflow-y-auto bg-white">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={clsx(
                'w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50',
                selectedId === c.id && 'bg-brand-50',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {c.customer?.name || c.customer?.phone}
                </span>
                <Badge status={c.status} />
              </div>
              <span className="text-xs text-gray-400">
                {new Date(c.startedAt).toLocaleString('pt-BR')}
              </span>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-sm text-gray-400 p-4">Nenhuma conversa ainda.</p>
          )}
        </div>

        <div className="flex-1 border border-gray-200 rounded-xl bg-white p-4 overflow-y-auto">
          {!selectedId && (
            <p className="text-sm text-gray-400">Selecione uma conversa para ver as mensagens.</p>
          )}
          {selectedId && loadingMessages && (
            <p className="text-sm text-gray-400">Carregando mensagens...</p>
          )}
          {selectedId && !loadingMessages && (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    'max-w-md rounded-lg px-3 py-2 text-sm',
                    m.senderType === 'customer'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-brand-600 text-white ml-auto',
                  )}
                >
                  <p>{m.content}</p>
                  <p className={clsx(
                    'text-[10px] mt-1',
                    m.senderType === 'customer' ? 'text-gray-400' : 'text-brand-100',
                  )}>
                    {new Date(m.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-gray-400">Sem mensagens nesta conversa.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
