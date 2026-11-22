import React from 'react';
import {
  LayoutDashboard,
  Bus,
  MapPin,
  Calendar,
  Receipt,
  FileSpreadsheet,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'fleet' | 'routes' | 'trips' | 'sales' | 'manifest';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={20} /> },
    { id: 'fleet', label: 'Gestión de Flota', icon: <Bus size={20} />, badge: '6' },
    { id: 'routes', label: 'Rutas y Terminales', icon: <MapPin size={20} /> },
    { id: 'trips', label: 'Itinerarios y Viajes', icon: <Calendar size={20} />, badge: '3 Hoy' },
    { id: 'sales', label: 'Ventas y Recaudación', icon: <Receipt size={20} /> },
    { id: 'manifest', label: 'Manifiesto Oficial (INTT)', icon: <FileSpreadsheet size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-white">KOMODO</span>
              <span className="text-[10px] font-bold bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded uppercase">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Backoffice de Operaciones</p>
          </div>
        </div>

        {/* Company Pill */}
        <div className="mx-4 my-4 p-3 rounded-xl bg-slate-850 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa Operadora</p>
          <p className="text-sm font-bold text-white mt-0.5 truncate">Expresos San Cristóbal C.A.</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-teal-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Gateway Conectado (:8080)
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Health */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-950/50 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-teal-400" />
          <span>Firma HMAC QR: v1.0 Activa</span>
        </div>
        <button
          onClick={() => alert('Cerrando sesión del panel administrativo')}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut size={14} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
