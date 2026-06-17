'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Target,
  Users,
  UserCog,
  BookOpen,
  Settings,
  LogOut,
} from 'lucide-react';
import { logout } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/conversas', label: 'Conversas', icon: MessageCircle },
  { href: '/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { href: '/leads', label: 'Leads', icon: Target },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicos', label: 'Serviços', icon: Settings },
  { href: '/equipe', label: 'Equipe', icon: UserCog },
  { href: '/base-conhecimento', label: 'Base de conhecimento', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-semibold text-brand-900">Vetor AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-brand-50 text-brand-800' : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <Link
          href="/configuracoes"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/configuracoes' ? 'bg-brand-50 text-brand-800' : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          <Settings size={18} />
          Configurações
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
