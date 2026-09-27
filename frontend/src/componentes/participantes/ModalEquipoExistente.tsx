import React from 'react';
import { createPortal } from 'react-dom';
import type { Equipo } from '../../servicios/api';

interface ModalEquipoExistenteProps {
  abierto: boolean;
  onCerrar: () => void;
  equiposExistentes: Equipo[];
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  seleccionados: number[];
  onSeleccionadosChange: (ids: number[]) => void;
  onConfirmar: () => void;
}

export const ModalEquipoExistente: React.FC<ModalEquipoExistenteProps> = ({
  abierto,
  onCerrar,
  equiposExistentes,
  busqueda,
  onBusquedaChange,
  seleccionados,
  onSeleccionadosChange,
  onConfirmar,
}) => {
  if (!abierto) return null;

  const equiposFiltrados = equiposExistentes.filter((equipo) =>
    equipo.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleSeleccion = (id: number) => {
    onSeleccionadosChange(
      seleccionados.includes(id) ? seleccionados.filter((s) => s !== id) : [...seleccionados, id]
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-equipo-existente-title"
    >
      <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-outline animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">group</span>
            <h3 id="modal-equipo-existente-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">
              Añadir Equipo Existente
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar equipo..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl py-2.5 pl-10 pr-3 outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Equipos disponibles</span>
            {seleccionados.length > 0 && (
              <span className="text-xs font-bold text-primary">{seleccionados.length} seleccionado(s)</span>
            )}
          </div>

          <div className="border border-outline rounded-xl bg-surface overflow-hidden">
            <div className="max-h-[45vh] overflow-y-auto divide-y divide-outline">
              {equiposFiltrados.map((equipo) => {
                const seleccionado = seleccionados.includes(equipo.id);
                return (
                  <button
                    key={equipo.id}
                    type="button"
                    onClick={() => toggleSeleccion(equipo.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-all cursor-pointer ${
                      seleccionado ? 'bg-primary/10' : 'hover:bg-surface-bright'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        seleccionado ? 'bg-primary border-primary text-white' : 'border-outline'
                      }`}
                    >
                      {seleccionado && <span className="material-symbols-outlined text-sm">check</span>}
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-surface-dim border border-outline flex items-center justify-center overflow-hidden shrink-0">
                      {equipo.logo ? (
                        <img src={equipo.logo} alt={equipo.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant">groups</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{equipo.name}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {equipo.discipline?.name || 'Sin disciplina'}
                      </p>
                      {equipo.category && (
                        <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                          Anterior: {equipo.category.name}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}

              {equiposFiltrados.length === 0 && (
                <div className="py-10 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">search_off</span>
                  <p className="text-xs font-bold text-on-surface-variant mt-2">No se encontraron equipos</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline rounded-lg hover:bg-surface-bright transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={seleccionados.length === 0}
              onClick={onConfirmar}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#800f2f] hover:bg-[#991238] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-all shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              Añadir seleccionados
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};