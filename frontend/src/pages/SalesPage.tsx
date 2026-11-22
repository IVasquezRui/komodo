import React, { useState } from 'react';
import { Receipt, Search, Download, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SaleTransaction } from '../types';

interface SalesPageProps {
  sales: SaleTransaction[];
}

export const SalesPage: React.FC<SalesPageProps> = ({ sales }) => {
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredSales = sales.filter((s) => {
    const matchesMethod = filterMethod === 'ALL' || s.payment_method === filterMethod;
    const matchesSearch =
      search === '' ||
      s.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      s.doc_number.includes(search) ||
      s.route.toLowerCase().includes(search.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const totalAmount = filteredSales.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Controls & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Ventas y Recaudación de Pasajes</h2>
          <p className="text-xs text-slate-400">
            Libro de transacciones comerciales, liquidaciones y trazabilidad de boletos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exportando reporte de ventas en formato CSV / Excel...')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Transacciones Filtradas</p>
          <p className="text-xl font-black text-white mt-1">{filteredSales.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Liquidado</p>
          <p className="text-xl font-black text-teal-400 mt-1">${totalAmount.toFixed(2)} USD</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Ticket Promedio</p>
          <p className="text-xl font-black text-white mt-1">
            ${filteredSales.length ? (totalAmount / filteredSales.length).toFixed(2) : '0.00'} USD
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por pasajero, cédula o ruta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PAGO_MOVIL', 'ZELLE', 'TARJETA', 'EFECTIVO'].map((method) => (
            <button
              key={method}
              onClick={() => setFilterMethod(method)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                filterMethod === method
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {method === 'ALL' ? 'Todos los Métodos' : method}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">ID Reserva</th>
                <th className="py-3.5 px-6">Pasajero / Titular</th>
                <th className="py-3.5 px-6">Ruta / Viaje</th>
                <th className="py-3.5 px-6">Asiento</th>
                <th className="py-3.5 px-6">Método de Pago</th>
                <th className="py-3.5 px-6">Monto Total</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Fecha / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850/40 transition">
                  <td className="py-4 px-6 font-mono text-teal-400 font-bold">{s.reservation_id}</td>
                  <td className="py-4 px-6 font-semibold text-white">
                    <div>{s.passenger_name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{s.doc_number}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    <div>{s.route}</div>
                    <span className="text-[10px] text-slate-500">Salida: {s.departure_date}</span>
                  </td>
                  <td className="py-4 px-6 font-black text-white text-sm">#{s.seat_number}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {s.payment_method}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-black text-teal-400 text-sm">
                    ${s.amount.toFixed(2)} USD
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 size={13} />
                      Completado
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-slate-400">{s.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
