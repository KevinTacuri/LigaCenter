import React from 'react';
import { createPortal } from 'react-dom';
import { LogoInput } from '../LogoInput';
import { resolverUrlImagen } from '../../servicios/api';
import type { Equipo } from '../../servicios/api';

export interface NuevoJugadorState {
  name: string;
  dni: string;
  age: string;
  phone: string;
  team_id: string;
  number: string;
  position: string;
}

interface ModalNuevoJugadorProps {
  abierto: boolean;
  onCerrar: () => void;
  equipos: Equipo[];
  delegadoTeamId: number | null;
  equipoSelId: number | null;
  nuevoJug: NuevoJugadorState;
  onNuevoJugChange: (v: NuevoJugadorState) => void;
  fotoFile: File | null;
  fotoUrl: string;
  onFotoFileChange: (f: File | null) => void;
  onFotoUrlChange: (u: string) => void;
  onGuardar: (e: React.FormEvent) => void;
}

export const ModalNuevoJugador: React.FC<ModalNuevoJugadorProps> = ({
  abierto,
  onCerrar,
  equipos,
  delegadoTeamId,
  equipoSelId,
  nuevoJug,
  onNuevoJugChange,
  fotoFile,
  fotoUrl,
  onFotoFileChange,
  onFotoUrlChange,
  onGuardar,
}) => {
  if (!abierto) return null;

  const teamIdMostrado =
    delegadoTeamId !== null ? String(delegadoTeamId) : equipoSelId ? String(equipoSelId) : nuevoJug.team_id;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn text-on-surface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nuevo-jugador-title"
    >
      <div className="bg-primary-container border border-outline rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">person_add</span>
            <h3 id="modal-nuevo-jugador-title" className="font-black text-sm uppercase tracking-wide">
              Inscribir Nuevo Jugador
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

        <form onSubmit={onGuardar} className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-on-surface">
            <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
            <p className="text-[11px] font-medium leading-tight">
              <strong className="font-extrabold text-primary block mb-0.5">Reglas de Inscripción:</strong>
              El <strong>DNI/Cédula</strong> debe ser único y el <strong>número de dorsal (#)</strong> no se puede
              repetir dentro del mismo equipo.
            </p>
          </div>

          <LogoInput
            logoFile={fotoFile}
            logoUrlTexto={fotoUrl}
            onFileChange={onFotoFileChange}
            onUrlChange={onFotoUrlChange}
            resolverUrl={resolverUrlImagen}
            label="Foto del Rostro del Jugador"
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block font-sans">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Mateo Messi"
              value={nuevoJug.name}
              onChange={(e) => onNuevoJugChange({ ...nuevoJug, name: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block font-sans">DNI / Cédula *</label>
              <input
                type="text"
                required
                placeholder="Número de documento"
                value={nuevoJug.dni}
                onChange={(e) => onNuevoJugChange({ ...nuevoJug, dni: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block font-sans">Edad *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ej: 22"
                value={nuevoJug.age}
                onChange={(e) => onNuevoJugChange({ ...nuevoJug, age: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block font-sans">Dorsal (#) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ej: 10"
                value={nuevoJug.number}
                onChange={(e) => onNuevoJugChange({ ...nuevoJug, number: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block font-sans">Equipo *</label>
              <select
                value={teamIdMostrado}
                disabled={delegadoTeamId !== null}
                onChange={(e) => onNuevoJugChange({ ...nuevoJug, team_id: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none cursor-pointer font-medium disabled:opacity-60"
              >
                <option value="">Seleccionar Equipo</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={String(eq.id)}>
                    {eq.name}
                  </option>
                ))}
              </select>
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
              type="submit"
              className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Guardar Jugador</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};