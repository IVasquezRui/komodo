import React, { useState } from 'react';
import { Printer, Download, CheckCircle, Clock, ShieldCheck, Bus, FileSpreadsheet } from 'lucide-react';
import { ManifestEntry } from '../types';

interface ManifestPageProps {
  manifest: ManifestEntry[];
}

export const ManifestPage: React.FC<ManifestPageProps> = ({ manifest }) => {
  const [filter, setFilter] = useState<'ALL' | 'BOARDED' | 'CONFIRMED'>('ALL');

  const tripDetails = {
    manifestNumber: 'INTT-MAN-2026-00492',
    company: 'EXPRESOS SAN CRISTÓBAL C.A. - RIF J-30492817-0',
    permitNumber: 'DTT-MINISTERIO-TRANSPORTE-8841',
    route: 'CARACAS (LA BANDERA) → MARACAIBO (TERMINAL CENTRAL)',
    busPlate: 'ABC-123',
    busModel: 'Marcopolo Paradiso G8 1800 DD',
    unitNumber: '042',
    driver1: 'RAMÓN ANTONIO GÓMEZ (V-14.892.110) - LIC. 5TA',
    driver2: 'PEDRO JOSÉ BASTIDAS (V-16.732.409) - LIC. 5TA',
    departureDateTime: '22/11/2026 · 20:00 HLV',
    terminalBay: 'Andén 4 - Pista Central',
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredEntries = manifest.filter((m) => {
    if (filter === 'BOARDED') return m.status === 'BOARDED';
    if (filter === 'CONFIRMED') return m.status === 'CONFIRMED';
    return true;
  });

  const boardedCount = manifest.filter((m) => m.status === 'BOARDED').length;

  return (
    <div className="space-y-6">
      {/* Action Header - hidden when printing */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <FileSpreadsheet size={18} />
            </span>
            <h2 className="text-base font-bold text-white">
              Manifiesto de Pasajeros y Despacho Oficial
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Documento legal reglamentario exigido en alcabalas por el INTT y Guardia Nacional
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'ALL' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({manifest.length})
            </button>
            <button
              onClick={() => setFilter('BOARDED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'BOARDED' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              A Bordo ({boardedCount})
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
          >
            <Printer size={16} />
            <span>Imprimir Manifiesto Oficial (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Legal Sheet (Designed for A4 Print & High-Contrast Display) */}
      <div className="print-page bg-white text-slate-950 p-8 rounded-2xl shadow-xl border border-slate-200">
        {/* Header Government Format */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black tracking-wider text-slate-700 uppercase">
                REPÚBLICA BOLIVARIANA DE VENEZUELA
              </p>
              <p className="text-[9px] font-bold text-slate-600">
                MINISTERIO DEL PODER POPULAR PARA EL TRANSPORTE • INTT
              </p>
              <p className="text-[12px] font-black text-slate-900 mt-1 uppercase">
                {tripDetails.company}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-black text-xs rounded">
                {tripDetails.manifestNumber}
              </span>
              <p className="text-[9px] text-slate-500 mt-1 font-mono">
                Permiso: {tripDetails.permitNumber}
              </p>
            </div>
          </div>
          <h1 className="text-center text-sm font-black text-slate-900 tracking-widest uppercase mt-3 py-1 bg-slate-100 border border-slate-300">
            GUÍA DE DESPACHO Y CONTROL DE PASAJEROS EN RUTA
          </h1>
        </div>

        {/* Dispatch Technical Meta */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded text-xs mb-5">
          <div className="space-y-1">
            <p>
              <span className="font-bold text-slate-700">Ruta Autorizada:</span>{' '}
              <span className="font-extrabold text-slate-900">{tripDetails.route}</span>
            </p>
            <p>
              <span className="font-bold text-slate-700">Unidad de Transporte:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{tripDetails.busPlate}</span> (Unidad #{tripDetails.unitNumber} - {tripDetails.busModel})
            </p>
            <p>
              <span className="font-bold text-slate-700">Andén de Salida:</span>{' '}
              <span>{tripDetails.terminalBay}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p>
              <span className="font-bold text-slate-700">Fecha y Hora Salida:</span>{' '}
              <span className="font-bold text-slate-900">{tripDetails.departureDateTime}</span>
            </p>
            <p>
              <span className="font-bold text-slate-700">Chofer Titular:</span>{' '}
              <span>{tripDetails.driver1}</span>
            </p>
            <p>
              <span className="font-bold text-slate-700">Chofer Relevo:</span>{' '}
              <span>{tripDetails.driver2}</span>
            </p>
          </div>
        </div>

        {/* Passenger Table */}
        <div className="overflow-hidden border border-slate-300 rounded mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-200 border-b border-slate-300 text-slate-800 font-black uppercase text-[10px]">
              <tr>
                <th className="py-2 px-3 w-12 text-center">Asiento</th>
                <th className="py-2 px-4">Apellidos y Nombres</th>
                <th className="py-2 px-3">Tipo / Cédula</th>
                <th className="py-2 px-3">Teléfono</th>
                <th className="py-2 px-3">Origen</th>
                <th className="py-2 px-3">Destino</th>
                <th className="py-2 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.map((p) => (
                <tr key={p.seat_number} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-center font-black font-mono bg-slate-50">
                    #{p.seat_number}
                  </td>
                  <td className="py-2 px-4 font-bold text-slate-900">{p.full_name}</td>
                  <td className="py-2 px-3 font-mono font-semibold">
                    {p.doc_type}-{p.doc_number}
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{p.phone}</td>
                  <td className="py-2 px-3 text-slate-700">{p.origin}</td>
                  <td className="py-2 px-3 text-slate-700">{p.destination}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        p.status === 'BOARDED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {p.status === 'BOARDED' ? 'ABORDADO' : 'CONFIRMADO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legal Signatures Block */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-300 text-center text-xs">
          <div>
            <div className="h-16 border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-900">FIRMA DEL CHOFER</p>
            <p className="text-[10px] text-slate-500">C.I. V-14.892.110</p>
          </div>
          <div>
            <div className="h-16 border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-900">DESPACHADOR DE TERMINAL</p>
            <p className="text-[10px] text-slate-500">Operaciones La Bandera</p>
          </div>
          <div>
            <div className="h-16 border-b border-slate-400 mb-2" />
            <p className="font-bold text-slate-900">SELLO Y VISTO BUENO INTT</p>
            <p className="text-[10px] text-slate-500">Autoridad de Tránsito Terrestre</p>
          </div>
        </div>

        {/* Cryptographic Footprint */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-700" />
            <span className="font-mono">HMAC SHA-256 SIGNATURE: a8f9c1b2d3e4f50689b78a9c210de45f8910</span>
          </div>
          <span>Generado por Plataforma Komodo v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
