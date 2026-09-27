import React from 'react';
import { EstadoVacio } from '../EstadoVacio';
import { InsigniaEstado } from '../InsigniaEstado';
import { Paginador } from '../Paginador';
import type { Escenario } from '../../servicios/api';

interface TabEscenariosFixtureProps {
  escenariosPaginados: Escenario[];
  escenariosFiltrados: Escenario[];
  paginaEscenarios: number;
  totalPaginasEscenarios: number;
  filtroTextoEsc: string;
  setFiltroTextoEsc: React.Dispatch<React.SetStateAction<string>>;
  setPaginaEscenarios: React.Dispatch<React.SetStateAction<number>>;
  onCrearEscenario: () => void;
  onEditarEscenario: (escenario: Escenario) => void;
  onEliminarEscenario: (id: number) => void;
}

export const TabEscenariosFixture: React.FC<TabEscenariosFixtureProps> = ({
  escenariosPaginados,
  escenariosFiltrados,
  paginaEscenarios,
  totalPaginasEscenarios,
  filtroTextoEsc,
  setFiltroTextoEsc,
  setPaginaEscenarios,
  onCrearEscenario,
  onEditarEscenario,
  onEliminarEscenario,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="font-extrabold text-base uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">stadium</span>
              Gestión de Escenarios Deportivos
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Administra las canchas, estadios y coliseos disponibles para la programación de encuentros.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar escenario..."
                value={filtroTextoEsc}
                onChange={(e) => {
                  setFiltroTextoEsc(e.target.value);
                  setPaginaEscenarios(1);
                }}
                className="text-xs border border-slate-200 rounded-xl pl-8 pr-3 py-2 bg-slate-50 outline-none w-48 sm:w-64"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
            </div>
            <button
              type="button"
              onClick={onCrearEscenario}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-95 shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Registrar Escenario</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3 pl-4">Escenario</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Ubicación</th>
                <th className="p-3">Capacidad</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {escenariosPaginados.map((esc) => (
                <tr key={esc.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-3 pl-4 font-bold text-slate-900">{esc.name}</td>
                  <td className="p-3 text-slate-600 text-xs capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {esc.venue_type || 'Cancha'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 text-xs">{esc.location || 'No especificada'}</td>
                  <td className="p-3 text-slate-600 text-xs font-semibold">
                    {esc.capacity ? `${esc.capacity} personas` : 'Sin aforo especificado'}
                  </td>
                  <td className="p-3">
                    <InsigniaEstado estado={esc.is_available ? 'activo' : 'inactivo'} tipo="general" />
                  </td>
                  <td className="p-3 pr-4 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => onEditarEscenario(esc)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminarEscenario(esc.id)}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

              {escenariosPaginados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    <EstadoVacio
                      icono="stadium"
                      titulo="No hay escenarios registrados"
                      descripcion="Registra las canchas o estadios donde se jugarán los partidos del campeonato."
                      textoBoton="Registrar Primer Escenario"
                      onAccion={onCrearEscenario}
                    />
                  </td>
                </tr>
              )}

              {escenariosPaginados.length === 0 && escenariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    <EstadoVacio
                      icono="search_off"
                      titulo="Sin resultados para la búsqueda"
                      descripcion="No se encontraron escenarios que coincidan con el término ingresado."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Paginador
          paginaActual={paginaEscenarios}
          totalPaginas={totalPaginasEscenarios}
          totalRegistros={escenariosFiltrados.length}
          onCambiarPagina={setPaginaEscenarios}
          etiqueta="escenarios"
        />
      </div>
    </div>
  );
};
