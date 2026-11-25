import React from 'react';
import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  userName?: string;
  userRole?: string;
  actionButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  userName = 'Despacho Central',
  userRole = 'Operador Komodo',
  actionButton,
}) => {
  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="min-h-16 px-4 sm:px-8 py-3 border-b border-violet-500/20 bg-[#120D24]/85 backdrop-blur flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
          {title}
        </h1>
        <p className="text-xs text-violet-200/70 truncate">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative hidden lg:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-300/70" />
          <input
            type="text"
            placeholder="Buscar unidades, boletos, cédula..."
            className="w-60 pl-9 pr-4 py-1.5 bg-[#191333] border border-violet-500/25 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] transition"
          />
        </div>

        {actionButton}

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl bg-[#191333] text-violet-200 hover:text-white hover:bg-violet-500/25 border border-violet-500/20 transition"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#120D24]" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-violet-500/20">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#10B981] text-white flex items-center justify-center font-bold text-xs shadow-komodo">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-100">{userName}</p>
            <p className="text-[10px] text-[#10B981] font-semibold">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
