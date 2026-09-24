import type {
  EtapaEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  etapas: EtapaEvento[];

  cargando: boolean;

  onAgregar: () => void;

  onEditar: (etapa: EtapaEvento) => void;

  onEliminar: (etapaId: number) => void;

  onGestionar: (etapa: EtapaEvento) => void;
}

const obtenerTipoEtapa = (
  tipo: EtapaEvento['stage_type']
) => {
  switch (tipo) {
    case 'qualifying':
      return 'Clasificatoria';

    case 'semifinal':
      return 'Semifinal';

    case 'final':
      return 'Final';

    default:
      return tipo;
  }
};

const obtenerMetodoClasificacion = (
  metodo: EtapaEvento['qualification_method']
) => {
  if (!metodo) {
    return '-';
  }

  if (metodo === 'best_overall') {
    return 'Mejores generales';
  }

  if (metodo === 'best_per_group') {
    return 'Mejores por grupo';
  }

  if (metodo === 'all') {
    return 'Todos';
  }

  return metodo;
};

const ListaEtapasEvento = ({
  etapas,
  cargando,
  onAgregar,
  onGestionar,
  onEditar,
  onEliminar,
}: Props) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Estructura de competencia
          </h3>

          <p className="text-[10px] text-slate-500 mt-1">
            Etapas configuradas para el evento
          </p>
        </div>

        <button
          type="button"
          onClick={onAgregar}
          className="bg-secondary hover:bg-secondary-container text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
        >
          Agregar etapa
        </button>
      </div>

      <div className="space-y-3">
        {etapas.map((etapa, index) => (
          <div key={etapa.id}>
            <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-4">

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                    {etapa.stage_number}
                  </div>

                  <div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {etapa.name}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
                        {etapa.rounds_count}{' '}
                        {etapa.rounds_count === 1
                          ? 'ronda'
                          : 'rondas'}
                      </span>

                      <span className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
                        {etapa.result_aggregation ===
                        'sum'
                          ? 'Suma'
                          : etapa.result_aggregation ===
                            'best'
                            ? 'Mejor resultado'
                            : 'Promedio'}
                      </span>

                      {etapa.qualification_method ===
                        'best_per_group' && (
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
                          {etapa.qualifiers_per_group}{' '}
                          por grupo
                        </span>
                      )}

                      {etapa.stage_type ===
                        'final' &&
                        etapa.podium_places && (
                          <span className="px-2 py-1 rounded-md bg-amber-50 text-[9px] font-bold text-amber-700">
                            {etapa.podium_places}{' '}
                            premiados
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onEditar(etapa)
                    }
                    className="text-xs font-bold text-slate-500 hover:text-primary cursor-pointer"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onGestionar(etapa)
                    }
                    className="text-xs font-bold text-primary cursor-pointer"
                  >
                    Gestionar →
                  </button>
                </div>
              </div>
            </div>

            {index <
              etapas.length - 1 && (
              <div className="h-5 flex justify-center">
                <div className="w-px bg-slate-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

  );
};

export default ListaEtapasEvento;