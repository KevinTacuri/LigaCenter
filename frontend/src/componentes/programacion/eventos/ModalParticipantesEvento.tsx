import type { FormEvent } from 'react';

import type {
  Equipo,
  Jugador,
} from '../../../servicios/api';

import type {
  EventoCompetencia,
} from '../../../types/CompetitionEvent';

interface Props {
  abierto: boolean;
  evento: EventoCompetencia | null;

  jugadores: Jugador[];
  equipos: Equipo[];

  seleccionados: number[];

  busqueda: string;
  cargando: boolean;

  onCerrar: () => void;

  onCambiarBusqueda: (valor: string) => void;
  onBuscar: () => void;

  onToggle: (id: number) => void;
  onSeleccionarTodos: () => void;

  onSubmit: (e: FormEvent) => void;
}

const ModalParticipantesEvento = ({
  abierto,
  evento,
  jugadores,
  equipos,
  seleccionados,
  busqueda,
  cargando,
  onCerrar,
  onCambiarBusqueda,
  onBuscar,
  onToggle,
  onSeleccionarTodos,
  onSubmit,
}: Props) => {
  if (!abierto || !evento) {
    return null;
  }

  const esPorEquipos =
    evento.participation_type === 'team';

  const totalOpciones = esPorEquipos
    ? equipos.length
    : jugadores.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {esPorEquipos
                ? 'Agregar equipos'
                : 'Agregar participantes'}
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              {evento.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              close
            </span>
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              {esPorEquipos
                ? 'Buscar equipo'
                : 'Buscar jugador'}
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  esPorEquipos
                    ? 'Nombre del equipo'
                    : 'Nombre o DNI'
                }
                value={busqueda}
                onChange={(e) =>
                  onCambiarBusqueda(e.target.value)
                }
                className="flex-1 text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
              />

              <button
                type="button"
                onClick={onBuscar}
                className="px-4 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {esPorEquipos
                  ? 'Equipos *'
                  : 'Jugadores *'}
              </label>

              {totalOpciones > 0 && (
                <button
                  type="button"
                  onClick={onSeleccionarTodos}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {seleccionados.length === totalOpciones
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
              {cargando ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Cargando...
                </div>
              ) : esPorEquipos ? (
                equipos.map((equipo) => {
                  const seleccionado =
                    seleccionados.includes(equipo.id);

                  return (
                    <label
                      key={equipo.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        seleccionado
                          ? 'bg-secondary/5'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() =>
                          onToggle(equipo.id)
                        }
                        className="rounded border-slate-300 text-secondary focus:ring-secondary"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800">
                          {equipo.name}
                        </div>

                        {equipo.representative && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Representante: {equipo.representative}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                jugadores.map((jugador) => {
                  const seleccionado =
                    seleccionados.includes(jugador.id);

                  return (
                    <label
                      key={jugador.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        seleccionado
                          ? 'bg-secondary/5'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() =>
                          onToggle(jugador.id)
                        }
                        className="rounded border-slate-300 text-secondary focus:ring-secondary"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800">
                          {jugador.name}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {jugador.team?.name ?? 'Sin equipo'}

                          {jugador.dni && (
                            <>
                              {' · '}
                              DNI {jugador.dni}
                            </>
                          )}

                          {jugador.number && (
                            <>
                              {' · '}
                              #{jugador.number}
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}

              {!cargando && totalOpciones === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  {esPorEquipos
                    ? 'No hay equipos disponibles.'
                    : 'No hay jugadores disponibles.'}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-semibold">
              {seleccionados.length} seleccionados
            </div>
          </div>

          <button
            type="submit"
            disabled={
              seleccionados.length === 0 ||
              cargando
            }
            className="w-full bg-secondary hover:bg-secondary-container disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer"
          >
            Agregar {esPorEquipos ? 'equipos' : 'participantes'} (
            {seleccionados.length})
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalParticipantesEvento;