import React from 'react';
import type { Escenario, Partido } from '../../servicios/api';

interface ModalReprogramacionPartidoProps {
  partido: Partido | null;
  datosReprog: {
    match_date: string;
    match_time: string;
    venue_id: string;
  };
  escenarios: Escenario[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}

export const ModalReprogramacionPartido: React.FC<ModalReprogramacionPartidoProps> = ({
  partido,
  datosReprog,
  escenarios,
  onClose,
  onSubmit,
  onChange,
}) => {
  if (!partido) return null;

  return (
    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-4 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-amber-200 pb-2">
        <h3 className="font-bold text-sm text-amber-800 uppercase tracking-wide">Reprogramar Partido</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-amber-800 hover:font-bold cursor-pointer text-xs"
        >
          Cerrar
        </button>
      </div>

      <p className="text-xs text-slate-700">
        Partido: <strong>{partido.local_team?.name} vs {partido.visitor_team?.name}</strong> (Fecha {partido.round})
      </p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Nueva Fecha</label>
          <input
            type="date"
            required
            value={datosReprog.match_date}
            onChange={(e) => onChange((prev: any) => ({ ...prev, match_date: e.target.value }))}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Nueva Hora</label>
          <input
            type="text"
            required
            placeholder="Ej: 14:00"
            value={datosReprog.match_time}
            onChange={(e) => onChange((prev: any) => ({ ...prev, match_time: e.target.value }))}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Escenario / Cancha</label>
          <select
            required
            value={datosReprog.venue_id}
            onChange={(e) => onChange((prev: any) => ({ ...prev, venue_id: e.target.value }))}
            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 cursor-pointer"
          >
            <option value="">Seleccione Escenario</option>
            {escenarios.map((esc) => (
              <option key={esc.id} value={esc.id}>{esc.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-secondary text-white font-bold py-2 rounded-lg text-xs hover:brightness-105 cursor-pointer"
        >
          Confirmar Reprogramación
        </button>
      </form>
    </div>
  );
};
