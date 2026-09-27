import React from 'react';
import { LogoInput } from '../LogoInput';
import { resolverUrlImagen } from '../../servicios/api';
import type { Equipo, Jugador } from '../../servicios/api';

export interface EditarJugadorState {
  abierto: boolean;
  jug: Jugador | null;
  nombre: string;
  dni: string;
  numero: string;
  teamId: string;
  guardando: boolean;
}

interface ModalEditarJugadorProps {
  estado: EditarJugadorState;
  onEstadoChange: (v: EditarJugadorState) => void;
  onCerrar: () => void;
  equipos: Equipo[];
  delegadoTeamId: number | null;
  fotoFile: File | null;
  fotoUrl: string;
  onFotoFileChange: (f: File | null) => void;
  onFotoUrlChange: (u: string) => void;
  onGuardar: () => void;
}

export const ModalEditarJugador: React.FC<ModalEditarJugadorProps> = ({
  estado,
  onEstadoChange,
  onCerrar,
  equipos,
  delegadoTeamId,
  fotoFile,
  fotoUrl,
  onFotoFileChange,
  onFotoUrlChange,
  onGuardar,
}) => {
  if (!estado.abierto) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-jugador-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500 text-base">edit</span>
            <h3 id="modal-editar-jugador-title" className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Editar Jugador
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Nombre Completo *</label>
            <input
              type="text"
              value={estado.nombre}
              onChange={(e) => onEstadoChange({ ...estado, nombre: e.target.value })}
              placeholder="Nombre del jugador"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">DNI</label>
              <input
                type="text"
                value={estado.dni}
                onChange={(e) => onEstadoChange({ ...estado, dni: e.target.value })}
                placeholder="DNI"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Dorsal</label>
              <input
                type="number"
                value={estado.numero}
                onChange={(e) => onEstadoChange({ ...estado, numero: e.target.value })}
                placeholder="Ej: 10"
                min="1"
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Equipo *</label>
            <select
              value={delegadoTeamId !== null ? String(delegadoTeamId) : estado.teamId}
              disabled={delegadoTeamId !== null}
              onChange={(e) => onEstadoChange({ ...estado, teamId: e.target.value })}
              className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
            >
              <option value="">Seleccionar Equipo</option>
              {equipos.map((eq) => (
                <option key={eq.id} value={String(eq.id)}>
                  {eq.name}
                </option>
              ))}
            </select>
          </div>

          <LogoInput
            logoFile={fotoFile}
            logoUrlTexto={fotoUrl}
            logoActualUrl={estado.jug?.photo}
            onFileChange={onFotoFileChange}
            onUrlChange={onFotoUrlChange}
            resolverUrl={resolverUrlImagen}
            label="Foto del Jugador"
          />
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onCerrar}
            disabled={estado.guardando}
            className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={estado.guardando || !estado.nombre.trim() || !estado.teamId}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {estado.guardando ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xs">save</span>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};