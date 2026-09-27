import React from 'react';
import { createPortal } from 'react-dom';
import type { Jugador } from '../../servicios/api';

interface ModalJugadoresExistentesProps {
  abierto: boolean;
  onCerrar: () => void;
  jugadoresDisponibles: Jugador[];
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  seleccionados: number[];
  onSeleccionadosChange: (ids: number[]) => void;
  guardando: boolean;
  onConfirmar: () => void;
}

export const ModalJugadoresExistentes: React.FC<ModalJugadoresExistentesProps> = ({
  abierto,
  onCerrar,
  jugadoresDisponibles,
  busqueda,
  onBusquedaChange,
  seleccionados,
  onSeleccionadosChange,
  guardando,
  onConfirmar,
}) => {
  if (!abierto) return null;

  const filtrados = jugadoresDisponibles.filter((jugador) => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return true;
    return (
      jugador.name?.toLowerCase().includes(texto) ||
      jugador.dni?.toLowerCase().includes(texto)
    );
  });

  const toggleSeleccion = (id: number) => {
    onSeleccionadosChange(
      seleccionados.includes(id) ? seleccionados.filter((s) => s !== id) : [...seleccionados, id]
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn text-on-surface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-jugadores-existentes-title"
    >
      <div className="bg-primary-container border border-outline rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-base">person_add_alt</span>
            <h3 id="modal-jugadores-existentes-title" className="font-black text-sm uppercase tracking-wide">
              Añadir Jugadores Existentes
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:bg-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">info</span>
            <p className="text-[11px] font-medium leading-tight">
              <strong className="font-extrabold text-blue-600 block mb-0.5">Seleccionar jugadores</strong>
              Busca y selecciona uno o varios jugadores registrados previamente para añadirlos al equipo.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Buscar Jugador</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Nombre o DNI..."
                value={busqueda}
                onChange={(e) => onBusquedaChange(e.target.value)}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl py-3 pl-10 pr-3 outline-none focus:border-blue-600 transition-all font-medium"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant">Jugadores disponibles</span>
            <span className="text-[11px] font-black text-blue-600">
              {seleccionados.length} seleccionados
            </span>
          </div>

          <div className="border border-outline rounded-xl bg-surface overflow-hidden">
            <div className="max-h-64 overflow-y-auto divide-y divide-outline">
              {filtrados.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                    person_search
                  </span>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {busqueda ? 'No se encontraron jugadores.' : 'No hay jugadores disponibles.'}
                  </p>
                </div>
              ) : (
                filtrados.map((jugador) => {
                  const seleccionado = seleccionados.includes(jugador.id);
                  return (
                    <button
                      key={jugador.id}
                      type="button"
                      onClick={() => toggleSeleccion(jugador.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer ${
                        seleccionado ? 'bg-blue-600/10' : 'hover:bg-surface-container'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          seleccionado ? 'bg-blue-600 border-blue-600 text-white' : 'border-outline'
                        }`}
                      >
                        {seleccionado && <span className="material-symbols-outlined text-sm">check</span>}
                      </div>

                      <div className="w-9 h-9 rounded-full bg-surface-container border border-outline overflow-hidden shrink-0 flex items-center justify-center">
                        {jugador.photo ? (
                          <img src={jugador.photo} alt={jugador.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant text-base">
                            person
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold truncate">{jugador.name}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          DNI: {jugador.dni || 'Sin documento'}
                        </p>
                      </div>

                      {seleccionado && (
                        <span className="material-symbols-outlined text-blue-600 text-base">check_circle</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-outline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2.5 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={seleccionados.length === 0 || guardando}
              onClick={onConfirmar}
              className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add_alt</span>
              <span>Añadir{seleccionados.length > 0 ? ` (${seleccionados.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};