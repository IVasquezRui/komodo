import React, { useState } from 'react';
import { Bus as BusIcon, Plus, Wifi, Wind, Bath, Zap, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { Bus } from '../types';
import { BusModal } from '../components/BusModal';

interface FleetPageProps {
  fleet: Bus[];
  onAddBus: (bus: Partial<Bus>) => void;
}

export const FleetPage: React.FC<FleetPageProps> = ({ fleet, onAddBus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE'>('ALL');

  const filteredFleet = fleet.filter((b) => {
    if (filter === 'ACTIVE') return b.status === 'ACTIVE';
    if (filter === 'MAINTENANCE') return b.status === 'MAINTENANCE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'ALL'
                ? 'bg-teal-500 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas las Unidades ({fleet.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'ACTIVE'
                ? 'bg-teal-500 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            En Operación ({fleet.filter((b) => b.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setFilter('MAINTENANCE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'MAINTENANCE'
                ? 'bg-teal-500 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Mantenimiento ({fleet.filter((b) => b.status === 'MAINTENANCE').length})
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
        >
          <Plus size={16} />
          <span>Registrar Nuevo Autobús</span>
        </button>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFleet.map((bus) => (
          <div
            key={bus.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden"
          >
            {/* Top Bar */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
                    <BusIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-black text-white tracking-wide">
                      {bus.plate}
                    </h3>
                    <p className="text-xs text-slate-400">{bus.brand}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    bus.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {bus.status === 'ACTIVE' ? (
                    <>
                      <CheckCircle2 size={12} />
                      Activo
                    </>
                  ) : (
                    <>
                      <Wrench size={12} />
                      Taller
                    </>
                  )}
                </span>
              </div>

              {/* Model & Config */}
              <div className="my-3">
                <p className="text-sm font-bold text-slate-100">{bus.model}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {bus.decks === 2 ? '2 Pisos (Double Decker)' : '1 Piso Estándar'}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-teal-400">{bus.capacity} Asientos</span>
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Servicios y Comodidades
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {bus.amenities?.wifi && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                      <Wifi size={12} /> Wi-Fi
                    </span>
                  )}
                  {bus.amenities?.ac && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                      <Wind size={12} /> Aire A/C
                    </span>
                  )}
                  {bus.amenities?.bath && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                      <Bath size={12} /> Baño
                    </span>
                  )}
                  {bus.amenities?.usb && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                      <Zap size={12} /> Carga USB
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Registrado: {bus.created_at ? new Date(bus.created_at).toLocaleDateString() : 'Activo'}
              </span>
              <button
                onClick={() => alert(`Configuración de mapa de asientos para unidad ${bus.plate}`)}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
              >
                Ver Mapa de Asientos →
              </button>
            </div>
          </div>
        ))}
      </div>

      <BusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddBus}
      />
    </div>
  );
};
