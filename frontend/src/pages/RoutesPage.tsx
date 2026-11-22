import React, { useState } from 'react';
import { MapPin, Plus, Navigation, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { Route } from '../types';
import { RouteModal } from '../components/RouteModal';

interface RoutesPageProps {
  routes: Route[];
  onAddRoute: (route: Partial<Route>) => void;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ routes, onAddRoute }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Red de Rutas Interurbanas y Terminales</h2>
          <p className="text-xs text-slate-400">
            Configuración de distancias en carretera, tiempos estimados y tarifas base
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
        >
          <Plus size={16} />
          <span>Nueva Ruta Interurbana</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Navigation size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {route.origin.split('(')[0]} <span className="text-teal-400">→</span>{' '}
                    {route.destination.split('(')[0]}
                  </h3>
                  <p className="text-[11px] text-slate-400">Ruta Troncal Nacional</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-white">${route.base_price}</span>
                <span className="text-xs text-slate-400 font-semibold"> USD</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-850 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Distancia</p>
                <p className="font-bold text-slate-200 mt-0.5">{route.distance_km} km</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Tiempo Estimado</p>
                <p className="font-bold text-slate-200 mt-0.5">{route.estimated_hours} horas</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Salidas Activas</p>
                <p className="font-bold text-teal-400 mt-0.5">{route.active_trips} viajes</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-[240px]">
                {route.origin}
              </span>
              <button
                onClick={() => alert(`Ajustando tarifas para ${route.origin} -> ${route.destination}`)}
                className="font-semibold text-teal-400 hover:text-teal-300 transition shrink-0"
              >
                Ajustar Tarifas →
              </button>
            </div>
          </div>
        ))}
      </div>

      <RouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddRoute}
      />
    </div>
  );
};
