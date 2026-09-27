import React from 'react';
import { createPortal } from 'react-dom';
import { LogoInput } from '../LogoInput';
import { resolverUrlImagen } from '../../servicios/api';
import type { Equipo } from '../../servicios/api';

export interface EditarEquipoState {
  abierto: boolean;
  eq: Equipo | null;
  nombre: string;
  representante: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  guardando: boolean;
  enable_delegate: boolean;
  delegate_name: string;
  delegate_email: string;
  delegate_password?: string;
}

interface ModalEditarEquipoProps {
  estado: EditarEquipoState;
  onEstadoChange: (v: EditarEquipoState) => void;
  onCerrar: () => void;
  logoFile: File | null;
  logoUrl: string;
  onLogoFileChange: (f: File | null) => void;
  onLogoUrlChange: (u: string) => void;
  onGuardar: () => void;
}

function generarPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export const ModalEditarEquipo: React.FC<ModalEditarEquipoProps> = ({
  estado,
  onEstadoChange,
  onCerrar,
  logoFile,
  logoUrl,
  onLogoFileChange,
  onLogoUrlChange,
  onGuardar,
}) => {
  if (!estado.abierto) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-equipo-title"
    >
      <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">edit</span>
            <h3 id="modal-editar-equipo-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">
              Editar Equipo
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

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant block">Nombre del Equipo *</label>
            <input
              type="text"
              value={estado.nombre}
              onChange={(e) => onEstadoChange({ ...estado, nombre: e.target.value })}
              placeholder="Nombre del equipo"
              className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
            />
          </div>

          {!estado.enable_delegate && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block">
                Representante / Delegado (Solo Nombre)
              </label>
              <input
                type="text"
                value={estado.representante}
                onChange={(e) => onEstadoChange({ ...estado, representante: e.target.value })}
                placeholder="Nombre del representante"
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
              />
            </div>
          )}

          <div className="border border-outline bg-surface rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={estado.enable_delegate}
                onChange={(e) => onEstadoChange({ ...estado, enable_delegate: e.target.checked })}
                className="w-4 h-4 text-primary border-outline rounded focus:ring-primary cursor-pointer"
              />
              <span className="text-xs font-bold text-on-surface">Habilitar cuenta de acceso para el Delegado</span>
            </label>

            {estado.enable_delegate && (
              <div className="space-y-2.5 pt-1.5 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">
                    Nombre del Delegado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={estado.delegate_name}
                    onChange={(e) => onEstadoChange({ ...estado, delegate_name: e.target.value })}
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
                    value={estado.delegate_email}
                    onChange={(e) => onEstadoChange({ ...estado, delegate_email: e.target.value })}
                    className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">
                    Contraseña Temporal / Restablecer
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Dejar en blanco para no cambiar"
                      value={estado.delegate_password || ''}
                      onChange={(e) => onEstadoChange({ ...estado, delegate_password: e.target.value })}
                      className="flex-1 text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => onEstadoChange({ ...estado, delegate_password: generarPassword() })}
                      className="px-2.5 py-2 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      Generar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="text-xs font-bold text-on-surface-variant block">Estado del Registro *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onEstadoChange({ ...estado, estado: 'aprobado' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  estado.estado === 'aprobado'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-[1.02]'
                    : 'bg-surface text-on-surface-variant border-outline hover:border-emerald-500/50 hover:bg-emerald-500/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span>Aprobado</span>
              </button>
              <button
                type="button"
                onClick={() => onEstadoChange({ ...estado, estado: 'pendiente' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  estado.estado === 'pendiente'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                    : 'bg-surface text-on-surface-variant border-outline hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">schedule</span>
                <span>Pendiente</span>
              </button>
              <button
                type="button"
                onClick={() => onEstadoChange({ ...estado, estado: 'rechazado' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  estado.estado === 'rechazado'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs scale-[1.02]'
                    : 'bg-surface text-on-surface-variant border-outline hover:border-rose-500/50 hover:bg-rose-500/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">cancel</span>
                <span>Rechazado</span>
              </button>
            </div>
          </div>

          <LogoInput
            logoFile={logoFile}
            logoUrlTexto={logoUrl}
            logoActualUrl={estado.eq?.logo}
            onFileChange={onLogoFileChange}
            onUrlChange={onLogoUrlChange}
            resolverUrl={resolverUrlImagen}
            label="Logo del Equipo"
          />
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-855 flex items-center justify-end gap-3 bg-slate-50 dark:bg-[#171a26]/20">
          <button
            onClick={onCerrar}
            disabled={estado.guardando}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-855 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={estado.guardando || !estado.nombre.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-650 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>,
    document.body
  );
};