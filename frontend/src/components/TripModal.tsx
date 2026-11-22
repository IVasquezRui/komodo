import React, { useState } from 'react';
import { X, Calendar, Clock, Bus, User, DollarSign } from 'lucide-react';
import { Trip as TripType, Bus as BusType, Route as RouteType } from '../types';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: BusType[];
  routes: RouteType[];
  onSubmit: (trip: Partial<TripType>) => void;
}

export const TripModal: React.FC<TripModalProps> = ({
  isOpen,
  onClose,
  buses,
  routes,
  onSubmit,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || '');
  const [selectedBusPlate, setSelectedBusPlate] = useState(buses[0]?.plate || '');
  const [driverName, setDriverName] = useState('Ramón Gómez');
  const [departureDate, setDepartureDate] = useState('2026-11-23');
  const [departureTime, setDepartureTime] = useState('20:00');
  const [price, setPrice] = useState(35.0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const route = routes.find((r) => r.id === selectedRouteId) || routes[0];
    const bus = buses.find((b) => b.plate === selectedBusPlate) || buses[0];

    onSubmit({
      route_name: `${route?.origin || 'Caracas'} → ${route?.destination || 'Maracaibo'}`,
      origin: route?.origin || 'Caracas',
      destination: route?.destination || 'Maracaibo',
      bus_plate: bus?.plate || 'ABC-123',
      bus_model: bus?.model || 'Marcopolo G8',
      driver_name: driverName,
      departure_time: `${departureDate}T${departureTime}:00Z`,
      arrival_time: `${departureDate}T23:59:00Z`,
      status: 'SCHEDULED',
      total_seats: bus?.capacity || 52,
      booked_seats: 0,
      occupancy_pct: 0,
      base_price: Number(price),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Calendar size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Programar Nuevo Viaje (Salida)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ruta Asignada
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.origin} → {r.destination} (${r.base_price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Autobús de Flota
              </label>
              <select
                value={selectedBusPlate}
                onChange={(e) => setSelectedBusPlate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {buses.map((b) => (
                  <option key={b.plate} value={b.plate}>
                    {b.plate} — {b.model} ({b.capacity} pax)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chofer Principal
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha Salida
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hora Salida
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tarifa ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-teal-400 font-bold focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition shadow-lg shadow-teal-500/20"
            >
              Publicar e Iniciar Ventas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
