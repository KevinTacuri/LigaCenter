import React from 'react';
import { createPortal } from 'react-dom';
import { LogoInput } from '../LogoInput';
import { resolverUrlImagen } from '../../servicios/api';
import type { Disciplina, Categoria } from '../../servicios/api';

export interface NuevoEquipoState {
  name: string;
  representative: string;
  discipline_id: string;
  category_id: string;
  enable_delegate: boolean;
  delegate_name: string;
  delegate_email: string;
  delegate_password: string;
}

interface ModalNuevoEquipoProps {
  abierto: boolean;
  onCerrar: () => void;
  disciplinas: Disciplina[];
  categorias: Categoria[];
  nuevoEq: NuevoEquipoState;
  onNuevoEqChange: (v: NuevoEquipoState) => void;
  logoFile: File | null;
  logoUrl: string;
  onLogoFileChange: (f: File | null) => void;
  onLogoUrlChange: (u: string) => void;
  onGuardar: (e: React.FormEvent) => void;
}

function generarPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export const ModalNuevoEquipo: React.FC<ModalNuevoEquipoProps> = ({
  abierto,
  onCerrar,
  disciplinas,
  categorias,
  nuevoEq,
  onNuevoEqChange,
  logoFile,
  logoUrl,
  onLogoFileChange,
  onLogoUrlChange,
  onGuardar,
}) => {
  if (!abierto) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nuevo-equipo-title"
    >
      <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">group_add</span>
            <h3 id="modal-nuevo-equipo-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">
              Añadir Nuevo Equipo
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

        <form onSubmit={onGuardar} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto font-sans">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Nombre del Equipo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Real Arequipa"
              value={nuevoEq.name}
              onChange={(e) => onNuevoEqChange({ ...nuevoEq, name: e.target.value })}
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
            />
          </div>

          {!nuevoEq.enable_delegate && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">
                Delegado/Representante (Solo Nombre)
              </label>
              <input
                type="text"
                placeholder="Representante del equipo"
                value={nuevoEq.representative}
                onChange={(e) => onNuevoEqChange({ ...nuevoEq, representative: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="border border-outline bg-surface rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={nuevoEq.enable_delegate}
                onChange={(e) => onNuevoEqChange({ ...nuevoEq, enable_delegate: e.target.checked })}
                className="w-4 h-4 text-primary border-outline rounded focus:ring-primary cursor-pointer"
              />
              <span className="text-xs font-bold text-on-surface">Habilitar cuenta de acceso para el Delegado</span>
            </label>

            {nuevoEq.enable_delegate && (
              <div className="space-y-2.5 pt-1.5 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">
                    Nombre del Delegado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={nuevoEq.delegate_name}
                    onChange={(e) => onNuevoEqChange({ ...nuevoEq, delegate_name: e.target.value })}
                    className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={nuevoEq.delegate_email}
                    onChange={(e) => onNuevoEqChange({ ...nuevoEq, delegate_email: e.target.value })}
                    className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">
                    Contraseña Temporal *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Clave de 8+ caracteres"
                      value={nuevoEq.delegate_password}
                      onChange={(e) => onNuevoEqChange({ ...nuevoEq, delegate_password: e.target.value })}
                      className="flex-1 text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => onNuevoEqChange({ ...nuevoEq, delegate_password: generarPassword() })}
                      className="px-2.5 py-2 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      Generar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">Disciplina *</label>
              <select
                required
                value={nuevoEq.discipline_id}
                onChange={(e) => onNuevoEqChange({ ...nuevoEq, discipline_id: e.target.value, category_id: '' })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
              >
                <option value="">Seleccionar Disciplina</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">Categoría *</label>
              <select
                required
                value={nuevoEq.category_id}
                onChange={(e) => onNuevoEqChange({ ...nuevoEq, category_id: e.target.value })}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
              >
                <option value="">Seleccionar Categoría</option>
                {categorias
                  .filter(
                    (c) => !nuevoEq.discipline_id || c.championship_discipline_id === parseInt(nuevoEq.discipline_id)
                  )
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <LogoInput
            logoFile={logoFile}
            logoUrlTexto={logoUrl}
            onFileChange={onLogoFileChange}
            onUrlChange={onLogoUrlChange}
            resolverUrl={resolverUrlImagen}
            label="Logo del Equipo"
          />

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
              className="px-5 py-2 text-xs font-black text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider shadow-xs"
            >
              <span className="material-symbols-outlined text-xs">save</span>
              Guardar Equipo
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};