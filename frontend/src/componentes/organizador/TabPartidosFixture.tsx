import React from 'react';
import type { Escenario, Partido } from '../../servicios/api';
import { EstadoVacio } from '../EstadoVacio';
import { Paginador } from '../Paginador';
import { TarjetaPartidoFixture } from './TarjetaPartidoFixture';

interface FiltrosPartidosFixtureUI {
  ronda: number | null;
  equipo: number | null;
  estado: string;
  cancha: number | null;
}

interface TabPartidosFixtureProps {
  partidosPaginados: Partido[];
  escenarios: Escenario[];
  filtros: FiltrosPartidosFixtureUI;
  setRonda: React.Dispatch<React.SetStateAction<number | null>>;
  setEquipo: React.Dispatch<React.SetStateAction<number | null>>;
  setEstado: React.Dispatch<React.SetStateAction<string>>;
  setCancha: React.Dispatch<React.SetStateAction<number | null>>;
  rondasDisponibles: number[];
  equiposEnPartidos: Array<[number, string]>;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  onCambiarPagina: (pagina: number) => void;
  onLimpiarFiltros: () => void;
  onReprogramar: (partido: Partido) => void;
  esDelegado: boolean;
}

export const TabPartidosFixture: React.FC<TabPartidosFixtureProps> = ({
  partidosPaginados,
  escenarios,
  filtros,
  setRonda,
  setEquipo,
  setEstado,
  setCancha,
  rondasDisponibles,
  equiposEnPartidos,
  paginaActual,
  totalPaginas,
  totalRegistros,
  onCambiarPagina,
  onLimpiarFiltros,
  onReprogramar,
  esDelegado,
}) => {
  return (
    <div className="bg-[var(--surface-container-low)] rounded-2xl border border-[var(--outline)] p-6 shadow-xs">
      <h2 className="font-extrabold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">Programación de Partidos</h2>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mb-4">
        {rondasDisponibles.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jornada</label>
            <select
              value={filtros.ronda ?? ''}
              onChange={(e) => setRonda(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="">Todas</option>
              {rondasDisponibles.map((ronda) => (
                <option key={ronda} value={ronda}>Fecha {ronda}</option>
              ))}
            </select>
          </div>
        )}

        {equiposEnPartidos.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Equipo</label>
            <select
              value={filtros.equipo ?? ''}
              onChange={(e) => setEquipo(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="">Todos</option>
              {equiposEnPartidos.map(([id, nombre]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</label>
          <select
            value={filtros.estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="todos">Todos</option>
            <option value="programado">Programado</option>
            <option value="en_curso">En Curso</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
            <option value="reprogramado">Reprogramado</option>
          </select>
        </div>

        {escenarios.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cancha</label>
            <select
              value={filtros.cancha ?? ''}
              onChange={(e) => setCancha(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="">Todas</option>
              {escenarios.map((escenario) => (
                <option key={escenario.id} value={escenario.id}>{escenario.name}</option>
              ))}
            </select>
          </div>
        )}

        {(filtros.ronda || filtros.equipo || filtros.estado !== 'todos' || filtros.cancha) && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="text-xs font-bold text-primary hover:underline cursor-pointer pb-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <th className="p-3 pl-4">Fecha (Round)</th>
              <th className="p-3">Partido (Equipos)</th>
              <th className="p-3">Día y Hora</th>
              <th className="p-3">Cancha / Escenario</th>
              <th className="p-3">Estado</th>
              {!esDelegado && <th className="p-3 pr-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {partidosPaginados.map((partido) => (
              <TarjetaPartidoFixture
                key={partido.id}
                partido={partido}
                escenarios={escenarios}
                onReprogramar={onReprogramar}
                esDelegado={esDelegado}
              />
            ))}

            {partidosPaginados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  <EstadoVacio
                    icono="event_busy"
                    titulo="No hay partidos programados"
                    descripcion="Genera el fixture automático o agrega encuentros desde la pestaña 'Generar Fixture'."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginador
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalRegistros={totalRegistros}
        onCambiarPagina={onCambiarPagina}
        etiqueta="partidos"
      />
    </div>
  );
};
