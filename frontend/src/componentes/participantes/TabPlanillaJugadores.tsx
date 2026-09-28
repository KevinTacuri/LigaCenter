import React from 'react';
import { Autocomplete } from '../Autocomplete';
import { EstadoVacio } from '../EstadoVacio';
import { InsigniaEstado } from '../InsigniaEstado';
import { resolverUrlImagen } from '../../servicios/api';
import type { Equipo, Jugador } from '../../servicios/api';
import type { FilaJugador } from '../../types/Participantes';

interface TabPlanillaJugadoresProps {
  delegadoTeamId: number | null;
  equipoSelId: number | null;
  onEquipoSelIdChange: (id: number | null) => void;
  equipoSel: Equipo | null;
  equiposOpciones: { id: number; label: string }[];
  filasJugadores: FilaJugador[];
  jugadoresDePlanilla: Jugador[];
  cargandoPlanilla: boolean;
  isDeadlineExpired: boolean;
  cargandoJugadoresExistentes: boolean;
  onAbrirModalNuevo: () => void;
  onAbrirModalExistente: () => void;
  onAbrirModalCargaMasiva: () => void;
  onDescargarPlantilla: () => void;
  onEditarJugador: (j: Jugador) => void;
  onEliminarFila: (idx: number) => void;
}

export const TabPlanillaJugadores: React.FC<TabPlanillaJugadoresProps> = ({
  delegadoTeamId,
  equipoSelId,
  onEquipoSelIdChange,
  equipoSel,
  equiposOpciones,
  filasJugadores,
  jugadoresDePlanilla,
  cargandoPlanilla,
  isDeadlineExpired,
  cargandoJugadoresExistentes,
  onAbrirModalNuevo,
  onAbrirModalExistente,
  onAbrirModalCargaMasiva,
  onDescargarPlantilla,
  onEditarJugador,
  onEliminarFila,
}) => {
  const filasGuardadas = filasJugadores.filter((f) => f.guardado);

  return (
    <div className="space-y-5">
      {/* Selector de equipo o info de delegado */}
      {delegadoTeamId !== null ? (
        <div className="relative rounded-2xl bg-[var(--surface-card-azul)] border border-[var(--outline)] p-5 shadow-xs overflow-hidden text-on-surface">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[var(--text-accent)]"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 pl-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(64,194,181,0.12)] border border-[rgba(64,194,181,0.28)] text-[var(--text-accent)] text-[10px] font-black uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">shield</span>
                Delegado de Equipo Autorizado
              </span>
              <h3 className="text-base font-black text-[var(--surface-card-title)] tracking-tight leading-none">
                Panel de Inscripción de {equipoSel?.name || 'Cargando equipo...'}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed mt-1">
                Como delegado oficial, tienes permisos para inscribir jugadores, dorsales y gestionar tu planilla.
              </p>
            </div>
            {equipoSel?.logo && (
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-center p-2 shrink-0 shadow-2xs">
                <img src={equipoSel.logo} className="w-full h-full object-contain" alt="Logo Equipo" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface-card-elevated)] rounded-2xl border border-[var(--outline)] p-5 shadow-xs text-on-surface">
          <div className="max-w-md">
            <Autocomplete
              label="Seleccionar Equipo"
              placeholder="Escribe el nombre del equipo..."
              opciones={equiposOpciones}
              valorId={equipoSelId}
              onChange={(id) => onEquipoSelIdChange(id)}
              requerido
            />
          </div>
        </div>
      )}

      {/* Datos del equipo solo lectura */}
      {equipoSel && (
        <div className="bg-[var(--surface-card-elevated)] border border-[var(--outline)] rounded-2xl p-5 text-on-surface shadow-xs">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-3">
            Datos del Equipo — solo lectura
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">Equipo</p>
              <p className="text-sm font-bold text-[var(--surface-card-title)] mt-0.5">{equipoSel.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">
                Representante
              </p>
              <p className="text-sm font-bold text-[var(--surface-card-title)] mt-0.5">{equipoSel.representative || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">Estado</p>
              <InsigniaEstado estado={equipoSel.registration_status || 'pendiente'} tipo="registro" className="mt-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Plantel de jugadores */}
      {equipoSel && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-on-surface">
            <div className="space-y-1">
              <h2 className="font-black text-base uppercase tracking-wider text-[var(--surface-card-title)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--text-accent)] text-lg">groups</span>
                Plantel de Jugadores de {equipoSel.name}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {filasGuardadas.length} deportistas registrados en el torneo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onAbrirModalNuevo}
                disabled={isDeadlineExpired}
                className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-white disabled:opacity-50 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Inscribir Jugador</span>
              </button>
              <button
                type="button"
                onClick={onAbrirModalExistente}
                disabled={isDeadlineExpired || cargandoJugadoresExistentes}
                className="flex items-center gap-2 bg-[var(--surface-card-celeste)] hover:bg-[var(--surface-card-celeste)]/80 border border-[var(--outline)] text-on-surface disabled:opacity-50 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 hover:border-[var(--text-accent)]/60 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm text-[var(--text-accent)]">
                  {cargandoJugadoresExistentes ? 'progress_activity' : 'person_add_alt'}
                </span>
                <span>{cargandoJugadoresExistentes ? 'Cargando...' : 'Añadir Existente'}</span>
              </button>
              <button
                type="button"
                onClick={onAbrirModalCargaMasiva}
                disabled={isDeadlineExpired}
                className="flex items-center gap-2 bg-[var(--surface)] hover:bg-[var(--surface-bright)] text-on-surface border border-[var(--outline)] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-sm text-[var(--text-accent)]">upload_file</span>
                <span>Carga Masiva</span>
              </button>
              <button
                type="button"
                onClick={onDescargarPlantilla}
                className="flex items-center gap-1.5 bg-[var(--surface)] hover:bg-[var(--surface-bright)] text-on-surface border border-[var(--outline)] px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5"
                title="Descargar Formato de Ejemplo CSV"
              >
                <span className="material-symbols-outlined text-sm text-[var(--text-accent)]">
                  download
                </span>
                <span>Plantilla (.CSV)</span>
              </button>
            </div>
          </div>

          {cargandoPlanilla ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
              <span className="text-xs text-on-surface-variant font-extrabold uppercase tracking-widest animate-pulse">
                Cargando plantel...
              </span>
            </div>
          ) : filasGuardadas.length === 0 ? (
            <EstadoVacio
              icono="person_off"
              titulo="Aún no hay jugadores en tu plantilla"
              descripcion="Inscribe a tus deportistas uno por uno o sube la planilla masiva en formato Excel / CSV."
              textoBoton="Inscribir Primer Jugador"
              onAccion={onAbrirModalNuevo}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filasGuardadas.map((fila, idx) => {
                  const jug = jugadoresDePlanilla.find((j) => j.id === fila.id);
                  const tonoCard = idx % 2 === 0
                    ? 'bg-[var(--surface-card-azul)] hover:bg-[var(--surface-card-azul)]/90'
                    : 'bg-[var(--surface-card-verde)] hover:bg-[var(--surface-card-verde)]/90';

                  return (
                    <div
                      key={fila.id || idx}
                      className={`border border-[var(--outline)] rounded-3xl p-4 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative flex flex-col items-center text-center group text-on-surface ${tonoCard}`}
                    >
                    <div
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[rgba(25,59,112,0.94)] dark:bg-[rgba(255,255,255,0.95)] font-black text-[10px] flex items-center justify-center shadow-md border border-white/20 dark:border-[var(--outline)] z-10 ring-1 ring-white/30 dark:ring-[var(--outline)]"
                      style={{ color: '#ffffff' }}
                    >
                      <span className="dark:text-[var(--primary)]">#{fila.dorsal || idx + 1}</span>
                    </div>

                    <div className="relative my-2 group-hover:scale-105 transition-transform duration-300">
                      {fila.foto ? (
                        <img
                          src={resolverUrlImagen(fila.foto) || fila.foto}
                          alt={fila.nombre}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[var(--outline-strong)] shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[var(--surface)] border-2 border-dashed border-[var(--outline)] flex flex-col items-center justify-center text-on-surface-variant shadow-2xs">
                          <span className="material-symbols-outlined text-4xl text-[var(--text-accent)]">person</span>
                        </div>
                      )}
                    </div>

                    <h3
                      className="font-black text-xs sm:text-sm text-[var(--surface-card-title)] tracking-tight leading-tight line-clamp-1 mt-1 w-full px-1"
                      title={fila.nombre}
                    >
                      {fila.nombre}
                    </h3>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-on-surface-variant font-semibold mt-2 w-full">
                      <span className="truncate px-2 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--outline)] font-mono">
                        DNI: {fila.dni || '—'}
                      </span>
                      <span className="truncate px-2 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--outline)]">
                        {fila.edad ? `${fila.edad} a.` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--outline)]/60 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (jug) onEditarJugador(jug);
                        }}
                        disabled={isDeadlineExpired}
                        className="flex-1 flex items-center justify-center gap-1 bg-[var(--surface)] hover:bg-[var(--surface-bright)] text-on-surface border border-[var(--outline)] py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-2xs disabled:opacity-50 hover:-translate-y-0.5"
                      >
                        <span className="material-symbols-outlined text-[11px] text-[var(--text-accent)]">edit</span>
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isDeadlineExpired) onEliminarFila(idx);
                        }}
                        disabled={isDeadlineExpired}
                        className="flex items-center justify-center p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
                        title="Eliminar Jugador"
                      >
                        <span className="material-symbols-outlined text-[11px]">delete</span>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!equipoSel && !cargandoPlanilla && (
        <div className="bg-[var(--surface-card-elevated)] border border-[var(--outline)] rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--text-accent)]">group_add</span>
          <p className="text-on-surface-variant text-sm font-semibold">
            Selecciona un equipo para ver y llenar su planilla de jugadores.
          </p>
        </div>
      )}
    </div>
  );
};