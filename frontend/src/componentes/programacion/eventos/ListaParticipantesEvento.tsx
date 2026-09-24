import type {
  EventoCompetencia,
  ParticipanteEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  evento: EventoCompetencia;
  participantes: ParticipanteEvento[];
  cargando: boolean;

  onAgregar: () => void;
  onQuitar: (participanteId: number) => void;
}

const ListaParticipantesEvento = ({
  evento,
  participantes,
  cargando,
  onAgregar,
  onQuitar,
}: Props) => {
  const esPorEquipos = evento.participation_type === 'team';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Participantes
          </h3>

          <p className="text-[10px] text-slate-500 mt-1">
            {esPorEquipos
              ? 'Participación por equipos'
              : 'Participación individual'}
          </p>
        </div>

        <button
          type="button"
          onClick={onAgregar}
          className="bg-secondary hover:bg-secondary-container text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
        >
          {esPorEquipos
            ? 'Agregar equipo'
            : 'Agregar participante'}
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-xs text-slate-500">
          Cargando participantes...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3 pl-4">
                  Participante
                </th>

                <th className="p-3">
                  Detalle
                </th>

                <th className="p-3">
                  Estado
                </th>

                <th className="p-3 pr-4 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {participantes.map((participante) => {
                const nombre = esPorEquipos
                  ? participante.championship_team?.name ?? 'Equipo'
                  : participante.championship_player?.name ?? 'Jugador';

                const detalle = esPorEquipos
                  ? participante.championship_team?.representative
                    ?? 'Equipo'
                  : participante.championship_player?.team?.name
                    ?? 'Sin equipo';

                return (
                  <tr
                    key={participante.id}
                    className="hover:bg-slate-50/40"
                  >
                    <td className="p-3 pl-4 font-bold text-slate-900">
                      {nombre}
                    </td>

                    <td className="p-3 text-slate-600">
                      {detalle}
                    </td>

                    <td className="p-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {participante.status}
                      </span>
                    </td>

                    <td className="p-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onQuitar(participante.id)
                        }
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {participantes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center text-slate-500 text-xs"
                  >
                    No hay participantes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaParticipantesEvento;