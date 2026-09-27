import React from 'react';
import { Paginador } from '../Paginador';
import { EstadoVacio } from '../EstadoVacio';
import { InsigniaEstado } from '../InsigniaEstado';
import { TarjetaLogoCircular } from './TarjetaLogoCircular';
import { resolverUrlImagen } from '../../servicios/api';
import type { Equipo, Categoria } from '../../servicios/api';
import type { FiltrosEquipos } from '../../types/Participantes';

interface TabEquiposProps {
  equiposPaginados: Equipo[];
  categorias: Categoria[];
  cargando: boolean;
  filtros: FiltrosEquipos;
  onFiltrosChange: (filtros: FiltrosEquipos) => void;
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  onCambiarPagina: (pagina: number) => void;
  onAbrirModalNuevo: () => void;
  onAbrirModalExistente: () => void;
  onVerDetalle: (eq: Equipo) => void;
  onEditar: (eq: Equipo) => void;
}

export const TabEquipos: React.FC<TabEquiposProps> = ({
  equiposPaginados,
  categorias,
  cargando,
  filtros,
  onFiltrosChange,
  paginaActual,
  totalPaginas,
  totalRegistros,
  onCambiarPagina,
  onAbrirModalNuevo,
  onAbrirModalExistente,
  onVerDetalle,
  onEditar,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="bg-primary-container text-on-surface rounded-2xl border border-outline p-6 shadow-xs space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-4">
          <div>
            <h2 className="font-black text-base uppercase tracking-wide text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">groups</span>
              Gestión de Equipos
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Total: {totalRegistros} equipos en el campeonato.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAbrirModalNuevo}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Añadir Equipo
            </button>
            <button
              type="button"
              onClick={onAbrirModalExistente}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-all shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              Añadir Equipo Existente
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Lista de equipos
          </h2>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="relative md:col-span-1">
            <input
              type="text"
              placeholder="Buscar por nombre o delegado..."
              value={filtros.busqueda}
              onChange={(e) => onFiltrosChange({ ...filtros, busqueda: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 pr-8 outline-none focus:border-primary"
            />
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
              search
            </span>
          </div>

          <select
            value={filtros.categoria}
            onChange={(e) => onFiltrosChange({ ...filtros, categoria: e.target.value })}
            className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
          >
            <option value="todos">Todas las categorías</option>
            {categorias.map((c) => {
              const discName = c.championship_discipline?.discipline?.name || '';
              return (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                  {discName ? ` (${discName})` : ''}
                </option>
              );
            })}
            <option value="sin_categoria">Sin categoría</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => onFiltrosChange({ ...filtros, estado: e.target.value as FiltrosEquipos['estado'] })}
            className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="aprobado">Aprobado</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazado">Rechazado</option>
          </select>

          <select
            value={filtros.orden}
            onChange={(e) => onFiltrosChange({ ...filtros, orden: e.target.value as FiltrosEquipos['orden'] })}
            className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
          >
            <option value="nombre_asc">Nombre (A-Z)</option>
            <option value="nombre_desc">Nombre (Z-A)</option>
            <option value="representante_asc">Representante (A-Z)</option>
            <option value="representante_desc">Representante (Z-A)</option>
            <option value="estado">Estado</option>
          </select>
        </div>

        {cargando ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
              Cargando registros...
            </span>
          </div>
        ) : equiposPaginados.length === 0 ? (
          <EstadoVacio icono="group_off" titulo="No se encontraron equipos" />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 py-2 animate-fadeIn">
              {equiposPaginados.map((eq) => (
                <div
                  key={eq.id}
                  className="group relative flex flex-col justify-between p-5 bg-primary-container hover:bg-surface border border-outline hover:border-primary/50 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <InsigniaEstado estado={eq.registration_status || 'pendiente'} tipo="registro" />

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Ver Detalle"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDetalle(eq);
                        }}
                        className="w-7 h-7 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button
                        type="button"
                        title="Editar Equipo"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(eq);
                        }}
                        className="w-7 h-7 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                  </div>

                  <div
                    onClick={() => onVerDetalle(eq)}
                    className="flex flex-col items-center text-center cursor-pointer my-1"
                  >
                    <div className="w-20 h-20 mb-3 group-hover:scale-105 transition-transform duration-300">
                      <TarjetaLogoCircular
                        nombre={eq.name}
                        logo={eq.logo}
                        resolverUrl={resolverUrlImagen}
                        tamanio="lg"
                        className="shadow-inner border-2"
                      />
                    </div>

                    <h4 className="text-sm font-extrabold text-on-surface line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                      {eq.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-3 border-t border-outline/60 w-full flex items-center justify-center">
                    {eq.championship_user?.user?.name || eq.representative ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold truncate max-w-full">
                        <span className="material-symbols-outlined text-[13px]">badge</span>
                        <span className="truncate">
                          {eq.championship_user?.user?.name || eq.representative}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(eq);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">add_circle</span>
                        <span>Asignar Delegado</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Paginador
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              totalRegistros={totalRegistros}
              onCambiarPagina={onCambiarPagina}
              etiqueta="equipos"
            />
          </>
        )}
      </div>
    </div>
  );
};