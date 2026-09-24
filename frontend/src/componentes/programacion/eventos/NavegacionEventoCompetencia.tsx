import type {
  EtapaEvento,
  GrupoEtapaEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  vista: 'estructura' | 'participantes';

  etapas: EtapaEvento[];

  etapaSeleccionada: EtapaEvento | null;

  gruposEtapa: GrupoEtapaEvento[];

  grupoSeleccionado: GrupoEtapaEvento | null;

  cantidadParticipantes: number;

  onParticipantes: () => void;

  onEstructura: () => void;

  onEtapa: (etapa: EtapaEvento) => void;

  onGrupo: (grupo: GrupoEtapaEvento) => void;
}

const NavegacionEventoCompetencia = ({
  vista,
  etapas,
  etapaSeleccionada,
  gruposEtapa,
  grupoSeleccionado,
  cantidadParticipantes,
  onParticipantes,
  onEstructura,
  onEtapa,
  onGrupo,
}: Props) => {
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Gestión del evento
        </div>
      </div>

      <div className="p-2 space-y-1">

        {/* PARTICIPANTES */}
        <button
          type="button"
          onClick={onParticipantes}
          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
            vista === 'participantes'
              ? 'bg-primary/10 text-primary'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              groups
            </span>

            <span className="text-xs font-bold">
              Participantes
            </span>
          </div>

          <span className="text-[10px] font-bold">
            {cantidadParticipantes}
          </span>
        </button>

        {/* ESTRUCTURA */}
        <button
          type="button"
          onClick={onEstructura}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
            vista === 'estructura' &&
            !etapaSeleccionada
              ? 'bg-primary/10 text-primary'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            account_tree
          </span>

          <span className="text-xs font-bold">
            Estructura
          </span>
        </button>

        {/* ETAPAS */}
        <div className="pt-2">
          <div className="px-3 mb-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Etapas
          </div>

          <div className="space-y-1">
            {etapas.map((etapa) => {
              const seleccionada =
                etapaSeleccionada?.id === etapa.id;

              return (
                <div key={etapa.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onEtapa(etapa)
                    }
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left cursor-pointer ${
                      seleccionada &&
                      !grupoSeleccionado
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black">
                      {etapa.stage_number}
                    </span>

                    <span className="text-xs font-semibold truncate">
                      {etapa.name}
                    </span>
                  </button>

                  {/* Grupos de la etapa seleccionada */}
                  {seleccionada &&
                    gruposEtapa.length > 0 && (
                      <div className="ml-6 mt-1 pl-3 border-l border-slate-200 space-y-1">
                        {gruposEtapa.map(
                          (grupo) => (
                            <button
                              key={grupo.id}
                              type="button"
                              onClick={() =>
                                onGrupo(grupo)
                              }
                              className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold cursor-pointer ${
                                grupoSeleccionado
                                  ?.id ===
                                grupo.id
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {grupo.name}
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default NavegacionEventoCompetencia;