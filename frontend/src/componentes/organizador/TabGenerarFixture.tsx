import React from 'react';
import type { Disciplina, Categoria, Escenario } from '../../servicios/api';

interface TabGenerarFixtureProps {
  generarMode: 'fixture' | 'eventos';
  setGenerarMode: React.Dispatch<React.SetStateAction<'fixture' | 'eventos'>>;
  datosFixture: {
    discipline_id: string;
    category_id: string;
    start_date: string;
    venue_ids: number[];
    format: 'liga' | 'grupos' | 'eliminacion_directa';
    num_groups: string;
    advance_per_group: string;
    third_place: boolean;
  };
  setDatosFixture: React.Dispatch<React.SetStateAction<any>>;
  disciplinas: Disciplina[];
  categorias: Categoria[];
  escenarios: Escenario[];
  onSubmitFixture: (e: React.FormEvent) => Promise<void>;
  onToggleVenue: (id: number) => void;
  datosEvento: any;
  setDatosEvento: React.Dispatch<React.SetStateAction<any>>;
  onSubmitEvento: (e: React.FormEvent) => Promise<void>;
  FormularioEvento: React.ComponentType<any>;
}

export const TabGenerarFixture: React.FC<TabGenerarFixtureProps> = ({
  generarMode,
  setGenerarMode,
  datosFixture,
  setDatosFixture,
  disciplinas,
  categorias,
  escenarios,
  onSubmitFixture,
  onToggleVenue,
  datosEvento,
  setDatosEvento,
  onSubmitEvento,
  FormularioEvento,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setGenerarMode('fixture')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            generarMode === 'fixture' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">account_tree</span>
          Fixture
        </button>

        <button
          type="button"
          onClick={() => setGenerarMode('eventos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            generarMode === 'eventos' ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">event</span>
          Eventos
        </button>
      </div>

      {generarMode === 'fixture' && (
        <div>
          <h2 className="font-extrabold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">
            Generar Calendario Round Robin (Todos contra Todos)
          </h2>
          <form onSubmit={onSubmitFixture} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                <select
                  required value={datosFixture.discipline_id}
                  onChange={(e) => setDatosFixture({ ...datosFixture, discipline_id: e.target.value, category_id: '' })}
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
                  required value={datosFixture.category_id}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const format = categorias.find((categoria) => categoria.id === parseInt(catId))?.format || 'liga';
                    setDatosFixture({ ...datosFixture, category_id: catId, format });
                  }}
                  className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                >
                  <option value="">Seleccionar Categoría</option>
                  {categorias
                    .filter((categoria) => !datosFixture.discipline_id || categoria.championship_discipline?.discipline_id === parseInt(datosFixture.discipline_id))
                    .map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>{categoria.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Fecha de Inicio del Torneo *</label>
                <input
                  type="date"
                  required value={datosFixture.start_date}
                  onChange={(e) => setDatosFixture({ ...datosFixture, start_date: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
              </div>

              <div className="space-y-1 border-t border-slate-105 pt-3">
                <label className="text-xs font-bold text-slate-700 block">Formato de Competencia</label>
                <select
                  value={datosFixture.format}
                  onChange={(e) => setDatosFixture({ ...datosFixture, format: e.target.value as any })}
                  className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                >
                  <option value="liga">Liga (Todos contra todos)</option>
                  <option value="grupos">Fase de Grupos + Eliminación</option>
                  <option value="eliminacion_directa">Eliminación Directa</option>
                </select>
              </div>
            </div>

            {datosFixture.format === 'grupos' && (
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">N° de Grupos *</label>
                    <input
                      type="number"
                      min="2"
                      placeholder="Ej: 4"
                      value={datosFixture.num_groups}
                      onChange={(e) => setDatosFixture({ ...datosFixture, num_groups: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-hidden bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">Clasificados/Grupo *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 2"
                      value={datosFixture.advance_per_group}
                      onChange={(e) => setDatosFixture({ ...datosFixture, advance_per_group: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-hidden bg-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={datosFixture.third_place}
                    onChange={(e) => setDatosFixture({ ...datosFixture, third_place: e.target.checked })}
                    className="rounded-sm border-slate-300 text-indigo-600 outline-hidden"
                  />
                  <span className="text-[10px] font-bold text-slate-650 uppercase">Partido por 3° Puesto</span>
                </label>
              </div>
            )}

            {datosFixture.format === 'eliminacion_directa' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fadeIn">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={datosFixture.third_place}
                    onChange={(e) => setDatosFixture({ ...datosFixture, third_place: e.target.checked })}
                    className="rounded-sm border-slate-300 text-indigo-600 outline-hidden"
                  />
                  <span className="text-[10px] font-bold text-slate-650 uppercase">Partido por 3° Puesto</span>
                </label>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Escenarios Disponibles para Asignar *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                {escenarios.map((escenario) => (
                  <label key={escenario.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={datosFixture.venue_ids.includes(escenario.id)}
                      onChange={() => onToggleVenue(escenario.id)}
                      className="rounded-sm border-slate-300 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    {escenario.name}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3 rounded-lg text-sm transition-all cursor-pointer">
              Generar Fixture del Campeonato
            </button>
          </form>
        </div>
      )}

      {generarMode === 'eventos' && (
        <FormularioEvento
          datosEvento={datosEvento}
          setDatosEvento={setDatosEvento}
          disciplinas={disciplinas}
          categorias={categorias}
          escenarios={escenarios}
          onSubmit={onSubmitEvento}
        />
      )}
    </div>
  );
};
