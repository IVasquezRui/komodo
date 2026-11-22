import React, { useState } from 'react';
import { X, Bus, Check, Wifi, Wind, Bath, Zap } from 'lucide-react';
import { Bus as BusType } from '../types';

interface BusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bus: Partial<BusType>) => void;
}

export const BusModal: React.FC<BusModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('Marcopolo Paradiso G8 1800 DD');
  const [brand, setBrand] = useState('Marcopolo');
  const [decks, setDecks] = useState(2);
  const [capacity, setCapacity] = useState(52);
  const [wifi, setWifi] = useState(true);
  const [ac, setAc] = useState(true);
  const [bath, setBath] = useState(true);
  const [usb, setUsb] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      alert('Ingresa la placa del autobús');
      return;
    }
    onSubmit({
      plate: plate.toUpperCase(),
      model,
      brand,
      decks,
      capacity,
      amenities: { wifi, ac, bath, usb },
      status: 'ACTIVE',
    });
    setPlate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Bus size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Registrar Nueva Unidad de Flota</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Placa Oficial / Matrícula
              </label>
              <input
                type="text"
                placeholder="Ej. ABC-990"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Marca del Chasis
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Marcopolo">Marcopolo</option>
                <option value="Irizar">Irizar</option>
                <option value="Yutong">Yutong</option>
                <option value="Volvo">Volvo</option>
                <option value="Scania">Scania</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Modelo y Versión
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Configuración de Pisos
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDecks(1);
                    setCapacity(40);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    decks === 1
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  1 Piso (Single)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecks(2);
                    setCapacity(52);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    decks === 2
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  2 Pisos (Double Decker)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Capacidad de Asientos
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 40)}
                min={10}
                max={90}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
          </div>

          {/* Amenities Toggles */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Comodidades a Bordo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={wifi}
                  onChange={(e) => setWifi(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0"
                />
                <Wifi size={14} className="text-teal-400" />
                <span>Wi-Fi Satelital</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={ac}
                  onChange={(e) => setAc(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0"
                />
                <Wind size={14} className="text-teal-400" />
                <span>Aire Acondicionado</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={bath}
                  onChange={(e) => setBath(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0"
                />
                <Bath size={14} className="text-teal-400" />
                <span>Baño a Bordo</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={usb}
                  onChange={(e) => setUsb(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0"
                />
                <Zap size={14} className="text-teal-400" />
                <span>Tomas USB / 110V</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
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
              Guardar Autobús
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
