import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vetor AI — Painel',
  description: 'Painel administrativo do agente de IA multiempresa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
