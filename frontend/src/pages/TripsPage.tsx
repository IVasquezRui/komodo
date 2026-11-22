import React, { useState } from 'react';
import { Calendar, Plus, Clock, User, Bus, AlertCircle, CheckCircle } from 'lucide-react';
import { Trip, Bus as BusType, Route as RouteType } from '../types';
import { TripModal } from '../components/TripModal';

interface TripsPageProps {
  trips: Trip[];
  buses: BusType[];
  routes: RouteType[];
  onAddTrip: (trip: Partial<Trip>) => void;
  onSelectTripForManifest: (tripId: string) => void;
}

export const TripsPage: React.FC<TripsPageProps> = ({
  trips,
  buses,
  routes,
  onAddTrip,
  onSelectTripForManifest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Programación de Viajes y Despacho</h2>
          <p className="text-xs text-slate-400">
            Control de itinerarios diarios, asignación de unidades, choferes y ocupación
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
        >
          <Plus size={16} />
          <span>Programar Nueva Salida</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Itinerario / Ruta</th>
                <th className="py-3.5 px-6">Unidad y Chofer</th>
                <th className="py-3.5 px-6">Salida / Llegada</th>
                <th className="py-3.5 px-6">Capacidad / Ocupación</th>
                <th className="py-3.5 px-6">Tarifa Base</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-850/40 transition">
                  <td className="py-4 px-6 font-semibold text-white">
                    <div className="text-sm">{trip.route_name}</div>
                    <span className="text-[11px] text-slate-400">ID: {trip.id.slice(0, 8)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-mono text-teal-400 font-bold">{trip.bus_plate}</div>
                    <div className="text-slate-300 font-medium">{trip.bus_model}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Chofer: {trip.driver_name}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    <div className="font-medium text-white">
                      {new Date(trip.departure_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(trip.departure_time).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="w-36">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-white">
                          {trip.booked_seats} de {trip.total_seats}
                        </span>
                        <span className="text-teal-400">{trip.occupancy_pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${trip.occupancy_pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-black text-white text-sm">
                    ${trip.base_price.toFixed(2)} USD
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        trip.status === 'BOARDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                      }`}
                    >
                      {trip.status === 'BOARDING' ? 'Abordaje en Andén' : 'Programado'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => onSelectTripForManifest(trip.id)}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500 text-teal-300 hover:text-white border border-teal-500/30 transition text-xs font-bold"
                    >
                      Manifiesto Oficial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        buses={buses}
        routes={routes}
        onSubmit={onAddTrip}
      />
    </div>
  );
};
