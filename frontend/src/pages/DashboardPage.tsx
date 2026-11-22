import React from 'react';
import {
  DollarSign,
  Users,
  Percent,
  Bus,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { AdminStats, Trip, SaleTransaction } from '../types';

interface DashboardPageProps {
  stats: AdminStats;
  trips: Trip[];
  sales: SaleTransaction[];
  onNavigateToTrips: () => void;
  onNavigateToManifest: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  trips,
  sales,
  onNavigateToTrips,
  onNavigateToManifest,
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Recaudación Total"
          value={`$${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change="+18.4%"
          isPositive={true}
          subtitle="Facturación bruta mes en curso"
          icon={<DollarSign size={22} />}
        />
        <KpiCard
          title="Factor de Ocupación"
          value={`${stats.occupancy_rate}%`}
          change="+4.2%"
          isPositive={true}
          subtitle="Capacidad vendida promedio"
          icon={<Percent size={22} />}
        />
        <KpiCard
          title="Pasajeros Transportados"
          value={stats.total_passengers}
          change="+12.0%"
          isPositive={true}
          subtitle={`${stats.tickets_sold_today} boletos vendidos hoy`}
          icon={<Users size={22} />}
        />
        <KpiCard
          title="Flota Operativa"
          value={`${stats.fleet_active} / ${stats.fleet_total}`}
          subtitle={`${stats.active_trips} viajes programados`}
          icon={<Bus size={22} />}
        />
      </div>

      {/* Main Grid: Live Departures + Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Departures Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Próximas Salidas y Estado de Abordaje</h2>
              <p className="text-xs text-slate-400">Control de andén e itinerarios en tiempo real</p>
            </div>
            <button
              onClick={onNavigateToTrips}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              Ver todos ({trips.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Ruta / Destino</th>
                  <th className="pb-3">Unidad / Chofer</th>
                  <th className="pb-3">Hora Salida</th>
                  <th className="pb-3">Ocupación</th>
                  <th className="pb-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 font-semibold text-white">
                      <div>{t.route_name}</div>
                      <span className="text-[10px] text-slate-400">Tarifa: ${t.base_price} USD</span>
                    </td>
                    <td className="py-3 text-slate-300">
                      <div className="font-mono text-teal-400 font-bold">{t.bus_plate}</div>
                      <div className="text-[11px] text-slate-400">{t.driver_name}</div>
                    </td>
                    <td className="py-3 text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock size={13} className="text-slate-400" />
                        <span>{new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Hoy</span>
                    </td>
                    <td className="py-3">
                      <div className="w-32">
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-white">{t.booked_seats}/{t.total_seats}</span>
                          <span className="text-teal-400">{t.occupancy_pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${t.occupancy_pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'BOARDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                        }`}
                      >
                        {t.status === 'BOARDING' ? 'Abordando en Andén' : 'Programado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Highlights & Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Alertas del Centro de Control</h2>
            <p className="text-xs text-slate-400 mb-4">Monitoreo de red y seguridad vial</p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-300">Mantenimiento Preventivo Requerido</p>
                  <p className="text-slate-300 mt-0.5">
                    Unidad <span className="font-mono font-bold text-white">VNZ-554</span> alcanzó 15,000 km. Cambio de aceite y frenos programado.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-teal-300">Alta Demanda: Caracas - Maracaibo</p>
                  <p className="text-slate-300 mt-0.5">
                    Ocupación al 88%. Se recomienda habilitar una unidad de refuerzo para el horario 22:00.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-200">Despacho INTT Listo</p>
                  <p className="text-slate-400 mt-0.5">
                    El manifiesto digital para el viaje <strong>CCS-MCB-001</strong> fue generado y firmado criptográficamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToManifest}
            className="w-full mt-4 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            Ver Manifiesto de Despacho →
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-1">Últimas Transacciones y Reservaciones</h2>
        <p className="text-xs text-slate-400 mb-4">Ventas sincronizadas en tiempo real desde la App Móvil</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Pasajero / Cédula</th>
                <th className="pb-3">Ruta</th>
                <th className="pb-3">Asiento</th>
                <th className="pb-3">Método de Pago</th>
                <th className="pb-3">Monto ($)</th>
                <th className="pb-3 text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/40 transition">
                  <td className="py-3 font-semibold text-white">
                    <div>{s.passenger_name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{s.doc_number}</span>
                  </td>
                  <td className="py-3 text-slate-300">{s.route}</td>
                  <td className="py-3 font-bold text-teal-400">#{s.seat_number}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {s.payment_method}
                    </span>
                  </td>
                  <td className="py-3 font-black text-white">${s.amount.toFixed(2)} USD</td>
                  <td className="py-3 text-right text-slate-400">{s.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
