import React from 'react';
import { Paginador } from '../Paginador';
import { EstadoVacio } from '../EstadoVacio';
import { TarjetaLogoCircular } from './TarjetaLogoCircular';
import { resolverUrlImagen } from '../../servicios/api';
import type { Jugador, Equipo, Categoria } from '../../servicios/api';
import type { FiltrosJugadores } from '../../types/Participantes';

interface TabJugadoresProps {
  jugadoresPaginados: Jugador[];
  equipos: Equipo[];
  categorias: Categoria[];
  cargando: boolean;
  filtros: FiltrosJugadores;
  onFiltrosChange: (filtros: FiltrosJugadores) => void;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  onCambiarPagina: (pagina: number) => void;
  esDelegado: boolean;
  isDeadlineExpired: boolean;
  onAbrirModalNuevo: () => void;
  onEditar: (j: Jugador) => void;
  onEliminar: (id: number) => void;
}

export const TabJugadores: React.FC<TabJugadoresProps> = ({
  jugadoresPaginados,
  equipos,
  categorias,
  cargando,
  filtros,
  onFiltrosChange,
  paginaActual,
  totalPaginas,
  totalRegistros,
  onCambiarPagina,
  esDelegado,
  isDeadlineExpired,
  onAbrirModalNuevo,
  onEditar,
  onEliminar,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="bg-primary-container text-on-surface rounded-2xl border border-outline p-6 shadow-xs space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-4">
          <div>
            <h2 className="font-black text-base uppercase tracking-wide text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
              Gestión de Jugadores
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Total: {totalRegistros} jugadores inscritos.
            </p>
          </div>

          <button
            type="button"
            onClick={onAbrirModalNuevo}
            disabled={isDeadlineExpired}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Añadir Jugador
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Lista de jugadores
          </h2>
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <input
                type="text"
                placeholder="Buscar por nombre del jugador o DNI..."
                value={filtros.busqueda}
                onChange={(e) => onFiltrosChange({ ...filtros, busqueda: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 pr-8 outline-none focus:border-primary"
              />
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                search
              </span>
            </div>

            <select
              value={filtros.orden}
              onChange={(e) => onFiltrosChange({ ...filtros, orden: e.target.value as FiltrosJugadores['orden'] })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
            >
              <option value="nombre_asc">Nombre (A-Z)</option>
              <option value="nombre_desc">Nombre (Z-A)</option>
              <option value="equipo_asc">Equipo (A-Z)</option>
              <option value="equipo_desc">Equipo (Z-A)</option>
            </select>
          </div>

          {!esDelegado && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={filtros.categoriaId ?? ''}
                onChange={(e) =>
                  onFiltrosChange({
                    ...filtros,
                    categoriaId: e.target.value ? Number(e.target.value) : null,
                    equipoId: null,
                  })
                }
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filtros.equipoId ?? ''}
                onChange={(e) =>
                  onFiltrosChange({ ...filtros, equipoId: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
              >
                <option value="">Todos los equipos</option>
                {equipos
                  .filter((eq) => !filtros.categoriaId || eq.category?.id === filtros.categoriaId)
                  .map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {cargando ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
              Cargando registros...
            </span>
          </div>
        ) : jugadoresPaginados.length === 0 ? (
          <EstadoVacio icono="person_off" titulo="No se encontraron jugadores" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2 animate-fadeIn">
              {jugadoresPaginados.map((j) => (
                <div
                  key={j.id}
                  className="group relative flex flex-col justify-between p-5 bg-primary-container hover:bg-surface border border-outline hover:border-primary/50 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-3 gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">tag</span>
                      #{j.number ?? 'N/A'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface border border-outline text-on-surface-variant truncate max-w-[120px]">
                      {j.team?.name || 'Sin equipo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 my-2">
                    <div className="group-hover:scale-105 transition-transform duration-300">
                      <TarjetaLogoCircular
                        nombre={j.name}
                        logo={j.photo}
                        resolverUrl={resolverUrlImagen}
                        tamanio="md"
                        className="shadow-inner border-2"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold text-on-surface truncate leading-snug group-hover:text-primary transition-colors">
                        {j.name}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                        DNI: {j.dni || 'Sin DNI'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-1 font-bold">
                        {j.age && <span>{j.age} años</span>}
                        {j.position && (
                          <span className="bg-surface px-1.5 py-0.5 rounded border border-outline uppercase">
                            {j.position}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline/60 w-full flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditar(j)}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(j.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Paginador
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              totalRegistros={totalRegistros}
              onCambiarPagina={onCambiarPagina}
              etiqueta="jugadores"
            />
          </>
        )}
      </div>
    </div>
  );
};