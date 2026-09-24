import type {
  FormEvent,
} from 'react';

import type {
  GrupoEtapaEvento,
  ParticipanteEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  abierto: boolean;

  grupo: GrupoEtapaEvento | null;

  participantes: ParticipanteEvento[];

  seleccionados: number[];

  onToggle: (participanteId: number) => void;

  onCerrar: () => void;

  onSubmit: (e: FormEvent) => void;
}

const ModalParticipantesGrupoEvento = ({
  abierto,
  grupo,
  participantes,
  seleccionados,
  onToggle,
  onCerrar,
  onSubmit,
}: Props) => {
  if (!abierto || !grupo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Agregar participantes
            </h3>

            <p className="text-[10px] text-slate-500 mt-0.5">
              {grupo.name}
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
          <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
            {participantes.map(
              (participante) => {
                const seleccionado =
                  seleccionados.includes(
                    participante.id
                  );

                const nombre =
                  participante
                    .championship_player
                    ?.name ??
                  participante
                    .championship_team
                    ?.name ??
                  'Participante';

                return (
                  <label
                    key={participante.id}
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
                        onToggle(
                          participante.id
                        )
                      }
                    />

                    <div className="text-xs font-bold text-slate-800">
                      {nombre}
                    </div>
                  </label>
                );
              }
            )}

            {participantes.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay participantes disponibles.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-semibold">
            {seleccionados.length} seleccionados
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                seleccionados.length === 0
              }
              className="bg-secondary hover:bg-secondary-container disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold"
            >
              Agregar ({seleccionados.length})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalParticipantesGrupoEvento;