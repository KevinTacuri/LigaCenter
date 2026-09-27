import React from 'react';
import type { Disciplina, Categoria, Escenario, Partido } from '../../servicios/api';

interface TabProgramarFechasFixtureProps {
  datosFecha: {
    discipline_id: string;
    category_id: string;
    round: string;
    available_hours: string;
    venue_ids: number[];
  };
  setDatosFecha: React.Dispatch<React.SetStateAction<any>>;
  disciplinas: Disciplina[];
  categorias: Categoria[];
  escenarios: Escenario[];
  rondasDisponiblesProg: number[];
  partidosDeRondaSeleccionada: Partido[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onToggleVenue: (id: number) => void;
}

export const TabProgramarFechasFixture: React.FC<TabProgramarFechasFixtureProps> = ({
  datosFecha,
  setDatosFecha,
  disciplinas,
  categorias,
  escenarios,
  rondasDisponiblesProg,
  partidosDeRondaSeleccionada,
  onSubmit,
  onToggleVenue,
}) => {
  return (
    <div className="bg-[var(--surface-container-low)] rounded-2xl border border-[var(--outline)] p-6 shadow-xs max-w-2xl mx-auto">
      <h2 className="font-extrabold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">
        Asignar Horarios Automáticamente
      </h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
            <select
              required value={datosFecha.discipline_id}
              onChange={(e) => setDatosFecha({ ...datosFecha, discipline_id: e.target.value, category_id: '' })}
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
            >
              <option value="">Seleccionar Disciplina</option>
              {disciplinas.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>{disciplina.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Categoría *</label>
            <select
              required value={datosFecha.category_id}
              onChange={(e) => setDatosFecha({ ...datosFecha, category_id: e.target.value })}
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
            >
              <option value="">Seleccionar Categoría</option>
              {categorias
                .filter((categoria) => !datosFecha.discipline_id || categoria.championship_discipline?.discipline_id === parseInt(datosFecha.discipline_id))
                .map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>{categoria.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Número de Fecha (Round) *</label>
            <select
              required value={datosFecha.round}
              onChange={(e) => setDatosFecha({ ...datosFecha, round: e.target.value })}
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
            >
              <option value="">Seleccionar Fecha</option>
              {rondasDisponiblesProg.map((ronda) => (
                <option key={ronda} value={ronda}>Fecha {ronda}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Horas Disponibles * (Separadas por comas)</label>
            <input
              type="text"
              required
              placeholder="Ej: 08:00, 10:00, 12:00, 14:00"
              value={datosFecha.available_hours}
              onChange={(e) => setDatosFecha({ ...datosFecha, available_hours: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
            />
          </div>
        </div>

        {datosFecha.category_id && datosFecha.round && (
          <div className="space-y-1.5 bg-slate-50 border border-slate-150 rounded-xl p-3">
            <label className="text-xs font-bold text-slate-700 block">
              Partidos en esta Fecha ({partidosDeRondaSeleccionada.length})
            </label>
            {partidosDeRondaSeleccionada.length === 0 ? (
              <p className="text-xs text-slate-500">No hay partidos con esta categoría y ronda todavía.</p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-1">
                {partidosDeRondaSeleccionada.map((partido) => (
                  <li key={partido.id} className="flex justify-between">
                    <span>{partido.local_team?.name} vs {partido.visitor_team?.name}</span>
                    <span className="text-slate-400">{partido.match_time || 'sin hora'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Escenarios Disponibles para esta Fecha *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
            {escenarios.map((escenario) => (
              <label key={escenario.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={datosFecha.venue_ids.includes(escenario.id)}
                  onChange={() => onToggleVenue(escenario.id)}
                  className="rounded-sm border-slate-300 text-secondary focus:ring-secondary cursor-pointer"
                />
                {escenario.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3 rounded-lg text-sm transition-all cursor-pointer">
          Programar Fecha Automáticamente
        </button>
      </form>
    </div>
  );
};
