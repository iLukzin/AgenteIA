'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Td, Tr } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface KnowledgeDocument {
  id: string;
  filename: string;
  status: string;
  createdAt: string;
}

export default function BaseConhecimentoPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);

  function load() {
    api.get<KnowledgeDocument[]>('/documents').then(setDocuments);
  }

  useEffect(load, []);

  function cancelEdit() {
    setEditingId(null);
    setFilename('');
    setContent('');
    setError(null);
  }

  async function handleEditClick(id: string) {
    setError(null);
    setLoadingEdit(id);
    try {
      const doc = await api.get<{ id: string; filename: string; content: string }>(
        `/documents/${id}`,
      );
      setEditingId(doc.id);
      setFilename(doc.filename);
      setContent(doc.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar este documento.');
    } finally {
      setLoadingEdit(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.patch(`/documents/${editingId}`, { filename, content });
      } else {
        await api.post('/documents', { filename, content });
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Erro ao ${editingId ? 'salvar as alterações' : 'adicionar conteúdo'}.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/documents/${id}`);
      if (editingId === id) cancelEdit();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir documento.');
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Base de conhecimento</h1>
      <p className="text-sm text-gray-500 mb-6">
        Cole aqui textos que o agente de IA deve conhecer: perguntas frequentes, políticas,
        descrições detalhadas de serviços etc. Cada texto é dividido em trechos e indexado
        automaticamente para a busca da IA (pode levar alguns segundos).
      </p>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {editingId && (
            <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
              <span>Editando um item já existente da base de conhecimento.</span>
              <button type="button" onClick={cancelEdit} className="font-medium hover:underline">
                Cancelar edição
              </button>
            </div>
          )}
          <div>
            <Label>Título (só para identificação no painel)</Label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              required
              placeholder="Política de cancelamento"
            />
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Cole aqui o texto que o agente deve saber..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving
              ? 'Indexando...'
              : editingId
                ? 'Salvar alterações'
                : 'Adicionar à base de conhecimento'}
          </Button>
        </form>
      </Card>

      <Table>
        <Thead>
          <Th>Título</Th>
          <Th>Status</Th>
          <Th>Adicionado em</Th>
          <Th>Ações</Th>
        </Thead>
        <tbody>
          {documents.map((doc) => (
            <Tr key={doc.id}>
              <Td>{doc.filename}</Td>
              <Td><Badge status={doc.status} /></Td>
              <Td>{new Date(doc.createdAt).toLocaleString('pt-BR')}</Td>
              <Td>
                <button
                  onClick={() => handleEditClick(doc.id)}
                  disabled={loadingEdit === doc.id}
                  className="text-sm text-brand-600 hover:underline mr-3 disabled:opacity-50"
                >
                  {loadingEdit === doc.id ? 'Carregando...' : 'Editar'}
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </Td>
            </Tr>
          ))}
          {documents.length === 0 && (
            <Tr>
              <Td className="text-gray-400" colSpan={4}>
                Nada na base de conhecimento ainda.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
