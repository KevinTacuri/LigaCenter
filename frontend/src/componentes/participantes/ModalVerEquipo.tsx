import React from 'react';
import { createPortal } from 'react-dom';
import { resolverUrlImagen } from '../../servicios/api';
import type { Equipo, Jugador } from '../../servicios/api';

interface ModalVerEquipoProps {
  abierto: boolean;
  eq: Equipo | null;
  jugadores: Jugador[];
  esDelegado: boolean;
  onCerrar: () => void;
  onCambiarEstado: (id: number, estado: 'aprobado' | 'pendiente' | 'rechazado') => Promise<void>;
  onEliminar: (id: number) => void;
  onEditar: (eq: Equipo) => void;
}

export const ModalVerEquipo: React.FC<ModalVerEquipoProps> = ({
  abierto,
  eq,
  jugadores,
  esDelegado,
  onCerrar,
  onCambiarEstado,
  onEliminar,
  onEditar,
}) => {
  if (!abierto || !eq) return null;

  const jugadoresDelEquipo = jugadores.filter((j) => (j.team_id ?? j.team?.id) === eq.id);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ver-equipo-title"
    >
      <div className="bg-primary-container border border-outline text-on-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">info</span>
            <h3 id="modal-ver-equipo-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">
              Detalle del Equipo
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

        <div className="px-6 py-5 space-y-5">
          <div className="flex flex-col items-center text-center pb-4 border-b border-outline">
            <div className="w-24 h-24 rounded-full border border-outline flex items-center justify-center overflow-hidden bg-surface mb-3 shadow-inner">
              {eq.logo ? (
                <img src={resolverUrlImagen(eq.logo) || ''} alt={eq.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-on-surface-variant font-extrabold uppercase">{eq.name[0] || '?'}</span>
              )}
            </div>
            <h2 className="text-xl font-black text-on-surface">{eq.name}</h2>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
              Delegado:{' '}
              {eq.championship_user?.user?.name || eq.representative || (
                <span className="text-on-surface-variant italic">Sin registrar</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-surface p-3 rounded-xl border border-outline">
              <p className="text-on-surface-variant font-bold uppercase tracking-wider mb-1">Disciplina</p>
              <p className="font-extrabold text-on-surface text-sm">{eq.discipline?.name || 'No asignada'}</p>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-outline">
              <p className="text-on-surface-variant font-bold uppercase tracking-wider mb-1">Categoría</p>
              <p className="font-extrabold text-on-surface text-sm">{eq.category?.name || 'No asignada'}</p>
            </div>
          </div>

          <div className="space-y-2 bg-surface p-3.5 rounded-xl border border-outline font-sans">
            <span className="text-xs font-black uppercase tracking-wider text-on-surface block">
              Estado del Registro
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onCambiarEstado(eq.id, 'aprobado')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  eq.registration_status === 'aprobado'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-[1.02]'
                    : 'bg-surface text-on-surface-variant border-outline hover:border-emerald-500/50 hover:bg-emerald-500/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span>Aprobado</span>
              </button>
              <button
                type="button"
                onClick={() => onCambiarEstado(eq.id, 'pendiente')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  eq.registration_status === 'pendiente' || !eq.registration_status
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                    : 'bg-surface text-on-surface-variant border-outline hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">schedule</span>
                <span>Pendiente</span>
              </button>
              <button
                type="button"
                onClick={() => onCambiarEstado(eq.id, 'rechazado')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  eq.registration_status === 'rechazado'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs scale-[1.02]'
                    : 'bg-surface text-on-surface-variant border-outline hover:border-rose-500/50 hover:bg-rose-500/10'
                }`}
              >
                <span className="material-symbols-outlined text-xs">cancel</span>
                <span>Rechazado</span>
              </button>
            </div>
          </div>

          <div className="border-t border-outline pt-4 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Jugadores Inscritos ({jugadoresDelEquipo.length})
            </h4>
            {jugadoresDelEquipo.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-2">No hay jugadores inscritos en este equipo.</p>
            ) : (
              <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {jugadoresDelEquipo.map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center gap-2 text-xs text-on-surface bg-surface border border-outline rounded-lg px-2.5 py-1.5"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                    <span className="font-semibold">{j.name}</span>
                    {j.number && <span className="ml-auto text-on-surface-variant font-mono">#{j.number}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(eq.delegate || eq.championship_user?.user) && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs font-sans">
              <p className="text-primary font-bold uppercase tracking-wider mb-1">Cuenta de Delegado</p>
              <p className="font-semibold text-on-surface">
                {eq.championship_user?.user?.name || eq.delegate?.name}
              </p>
              <p className="text-on-surface-variant">
                {eq.championship_user?.user?.email || eq.delegate?.email}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline flex justify-end items-center gap-2 bg-surface-dim">
          {!esDelegado && (
            <>
              <button
                onClick={async () => {
                  onCerrar();
                  await onEliminar(eq.id);
                }}
                className="mr-auto px-3 py-2 text-xs font-bold text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-950/30 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
                Eliminar
              </button>
              <button
                onClick={() => {
                  onCerrar();
                  onEditar(eq);
                }}
                className="px-4 py-2 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-850 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                Editar
              </button>
            </>
          )}
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};