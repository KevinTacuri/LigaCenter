import React from 'react';
import { createPortal } from 'react-dom';

export interface EditarCategoriaState {
  abierto: boolean;
  id: number | null;
  name: string;
  age_min: string;
  age_max: string;
  gender: string;
  guardando: boolean;
}

interface ModalEditarCategoriaProps {
  estado: EditarCategoriaState;
  onEstadoChange: (v: EditarCategoriaState) => void;
  onCerrar: () => void;
  onGuardar: (e: React.FormEvent) => void;
}

export const ModalEditarCategoria: React.FC<ModalEditarCategoriaProps> = ({
  estado,
  onEstadoChange,
  onCerrar,
  onGuardar,
}) => {
  if (!estado.abierto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
          <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wide">Editar Categoría</h3>
          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={onGuardar} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Nombre Categoría *</label>
            <input
              type="text"
              required
              value={estado.name}
              onChange={(e) => onEstadoChange({ ...estado, name: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">Edad Mínima</label>
              <input
                type="number"
                min="0"
                value={estado.age_min}
                onChange={(e) => onEstadoChange({ ...estado, age_min: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">Edad Máxima</label>
              <input
                type="number"
                min="0"
                value={estado.age_max}
                onChange={(e) => onEstadoChange({ ...estado, age_max: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Género</label>
            <select
              value={estado.gender}
              onChange={(e) => onEstadoChange({ ...estado, gender: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
          <div className="pt-2 border-t border-outline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface-bright transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={estado.guardando}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {estado.guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};