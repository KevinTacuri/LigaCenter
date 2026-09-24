import type {
  GrupoEtapaEvento,
  ParticipanteEvento,
  ParticipanteGrupoEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  grupo: GrupoEtapaEvento;

  participantesGrupo: ParticipanteGrupoEvento[];

  participantesEvento: ParticipanteEvento[];

  cargando: boolean;

  onAgregar: () => void;

  onQuitar: (participanteGrupoId: number) => void;

  onCerrar: () => void;
}

const ListaParticipantesGrupoEvento = ({
  grupo,
  participantesGrupo,
  participantesEvento,
  cargando,
  onAgregar,
  onQuitar,
  onCerrar,
}: Props) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-[10px] font-bold text-primary hover:underline cursor-pointer mb-1"
          >
            ← Cerrar participantes
          </button>

          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Participantes
          </h3>

          <p className="text-[10px] text-slate-500 mt-1">
            {grupo.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onAgregar}
          className="bg-secondary hover:bg-secondary-container text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
        >
          Agregar participantes
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
                  Orden
                </th>

                <th className="p-3">
                  Participante
                </th>

                <th className="p-3">
                  Carril
                </th>

                <th className="p-3 pr-4 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {participantesGrupo.map(
                (participanteGrupo) => {
                  const participante =
                    participantesEvento.find(
                      (participante) =>
                        participante.id ===
                        participanteGrupo
                          .competition_event_participant_id
                    );

                  const nombre =
                    participante
                      ?.championship_player
                      ?.name ??
                    participante
                      ?.championship_team
                      ?.name ??
                    'Participante';

                  return (
                    <tr
                      key={participanteGrupo.id}
                      className="hover:bg-slate-50/40"
                    >
                      <td className="p-3 pl-4 font-bold text-slate-900">
                        {participanteGrupo.start_order ??
                          '-'}
                      </td>

                      <td className="p-3 font-bold text-slate-900">
                        {nombre}
                      </td>

                      <td className="p-3 text-slate-600">
                        {participanteGrupo.lane ??
                          '-'}
                      </td>

                      <td className="p-3 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            onQuitar(
                              participanteGrupo.id
                            )
                          }
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}

              {participantesGrupo.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center text-slate-500 text-xs"
                  >
                    Este grupo todavía no tiene participantes.
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

export default ListaParticipantesGrupoEvento;