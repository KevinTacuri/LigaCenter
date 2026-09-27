import React from 'react';
import { createPortal } from 'react-dom';
import type { Disciplina } from '../../servicios/api';

export interface NuevaCategoriaState {
  name: string;
  age_min: string;
  age_max: string;
  gender: string;
  discipline_id: string;
}

interface ModalNuevaCategoriaProps {
  abierto: boolean;
  onCerrar: () => void;
  disciplinas: Disciplina[];
  nuevaCat: NuevaCategoriaState;
  onNuevaCatChange: (v: NuevaCategoriaState) => void;
  onGuardar: (e: React.FormEvent) => void;
}

export const ModalNuevaCategoria: React.FC<ModalNuevaCategoriaProps> = ({
  abierto,
  onCerrar,
  disciplinas,
  nuevaCat,
  onNuevaCatChange,
  onGuardar,
}) => {
  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">category</span>
            <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wide">
              Añadir Nueva Categoría
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

        <form onSubmit={onGuardar} className="p-6 space-y-4 font-sans">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Disciplina deportiva *</label>
            <select
              required
              value={nuevaCat.discipline_id}
              onChange={(e) => onNuevaCatChange({ ...nuevaCat, discipline_id: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
            >
              <option value="">-- Selecciona Disciplina --</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Nombre de la Categoría *</label>
            <input
              type="text"
              required
              placeholder="Ej: Sub-18, Libres, Máster +40"
              value={nuevaCat.name}
              onChange={(e) => onNuevaCatChange({ ...nuevaCat, name: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">Edad Mínima</label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 16"
                value={nuevaCat.age_min}
                onChange={(e) => onNuevaCatChange({ ...nuevaCat, age_min: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">Edad Máxima</label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 35"
                value={nuevaCat.age_max}
                onChange={(e) => onNuevaCatChange({ ...nuevaCat, age_max: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Género / Modalidad</label>
            <select
              value={nuevaCat.gender}
              onChange={(e) => onNuevaCatChange({ ...nuevaCat, gender: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>

          <div className="pt-3 border-t border-outline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface-bright transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Guardar Categoría
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};