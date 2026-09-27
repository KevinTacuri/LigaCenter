import React from 'react';

interface BannerPlazoInscripcionProps {
  delegadoTeamId: number | null;
  limiteDate: Date | null;
  isDeadlineExpired: boolean;
  prorrogaPendiente: boolean;
  mostrarFormProrroga: boolean;
  onMostrarFormProrroga: (v: boolean) => void;
  prorrogaFecha: string;
  onProrrogaFechaChange: (v: string) => void;
  prorrogaMotivo: string;
  onProrrogaMotivoChange: (v: string) => void;
  enviandoProrroga: boolean;
  onEnviarSolicitud: (e: React.FormEvent) => void;
}

export const BannerPlazoInscripcion: React.FC<BannerPlazoInscripcionProps> = ({
  delegadoTeamId,
  limiteDate,
  isDeadlineExpired,
  prorrogaPendiente,
  mostrarFormProrroga,
  onMostrarFormProrroga,
  prorrogaFecha,
  onProrrogaFechaChange,
  prorrogaMotivo,
  onProrrogaMotivoChange,
  enviandoProrroga,
  onEnviarSolicitud,
}) => {
  if (delegadoTeamId === null || !limiteDate) return null;

  if (mostrarFormProrroga) {
    return (
      <div className="p-5 rounded-2xl border bg-[#11131c] border-slate-800 text-slate-100 mb-6 animate-fadeIn">
        <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-indigo-455 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Solicitar Prórroga de Inscripción
        </h3>
        <form onSubmit={onEnviarSolicitud} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block font-sans">Nueva fecha propuesta *</label>
              <input
                type="datetime-local"
                required
                value={prorrogaFecha}
                onChange={(e) => onProrrogaFechaChange(e.target.value)}
                className="w-full text-sm border border-slate-700 bg-slate-800 rounded-lg p-2.5 text-white outline-hidden font-sans"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 block font-sans">Motivo o justificación *</label>
            <textarea
              required
              placeholder="Explica brevemente por qué necesitas más tiempo (ej. Dificultad para recolectar fotos de los DNI)..."
              value={prorrogaMotivo}
              onChange={(e) => onProrrogaMotivoChange(e.target.value)}
              className="w-full text-sm border border-slate-700 bg-slate-800 rounded-lg p-2.5 text-white min-h-[80px] outline-hidden font-sans"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => onMostrarFormProrroga(false)}
              className="px-4 py-2 border border-slate-700 text-slate-400 hover:bg-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer font-sans"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviandoProrroga}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-60 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 font-sans"
            >
              {enviandoProrroga ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xs">send</span>
              )}
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-2xl border ${
        isDeadlineExpired
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
      } mb-6 shadow-xs`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`material-symbols-outlined text-2xl mt-0.5 ${
              isDeadlineExpired ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {isDeadlineExpired ? 'history_toggle_off' : 'verified'}
          </span>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider font-sans">
              Plazo de Inscripción de Plantilla
            </h3>
            <p className="text-xs mt-1 text-slate-350 font-sans">
              La fecha límite para inscribir o modificar jugadores de tu equipo es el:{' '}
              <span className="font-bold text-white">
                {limiteDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              .
            </p>
            {isDeadlineExpired ? (
              <p className="text-xs mt-1 text-amber-400 font-bold font-sans">
                ❌ El plazo ha vencido. Los formularios de edición y carga de jugadores están deshabilitados.
              </p>
            ) : (
              <p className="text-xs mt-1 text-emerald-400 font-bold font-sans">
                ✓ El plazo está vigente. Aún puedes registrar y editar jugadores.
              </p>
            )}
          </div>
        </div>

        {isDeadlineExpired && (
          <div className="w-full md:w-auto">
            {prorrogaPendiente ? (
              <div className="bg-amber-650/20 border border-amber-500/30 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-amber-400 font-sans">Solicitud de prórroga pendiente</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Tu organizador la revisará pronto.</p>
              </div>
            ) : (
              <button
                onClick={() => onMostrarFormProrroga(true)}
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-650 text-[#0a0b10] font-bold text-xs uppercase tracking-wide px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
              >
                <span className="material-symbols-outlined text-sm font-bold">schedule_send</span>
                Solicitar Prórroga
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};