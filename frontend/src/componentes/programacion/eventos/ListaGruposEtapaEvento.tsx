import type {
  EtapaEvento,
  GrupoEtapaEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  etapa: EtapaEvento;

  grupos: GrupoEtapaEvento[];

  cargando: boolean;

  onAgregar: () => void;

  onEditar: (grupo: GrupoEtapaEvento) => void;

  onEliminar: (grupoId: number) => void;

  onCerrar: () => void;
  onGestionar: (grupo: GrupoEtapaEvento) => void;
}

const ListaGruposEtapaEvento = ({
  etapa,
  grupos,
  cargando,
  onAgregar,
  onEditar,
  onEliminar,
  onCerrar,
  onGestionar,
}: Props) => {
  const obtenerAgregacion = () => {
    switch (
      etapa.result_aggregation
    ) {
      case 'sum':
        return 'Suma';

      case 'best':
        return 'Mejor resultado';

      case 'average':
        return 'Promedio';

      default:
        return etapa.result_aggregation;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">

      {/* CABECERA */}
      <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
        <div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-[10px] font-bold text-primary hover:underline cursor-pointer mb-2"
          >
            ← Volver a etapas
          </button>

          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            {etapa.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
              {etapa.rounds_count}{' '}
              {etapa.rounds_count === 1
                ? 'ronda'
                : 'rondas'}
            </span>

            <span className="px-2 py-1 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
              {obtenerAgregacion()}
            </span>

            {etapa.qualification_method ===
              'best_per_group' &&
              etapa.qualifiers_per_group && (
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700">
                  Clasifican{' '}
                  {etapa.qualifiers_per_group}{' '}
                  por grupo
                </span>
              )}

            {etapa.qualification_method ===
              'best_overall' &&
              etapa.qualifiers_count && (
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-700">
                  Clasifican{' '}
                  {etapa.qualifiers_count}
                </span>
              )}

            {etapa.stage_type ===
              'final' &&
              etapa.podium_places && (
                <span className="px-2 py-1 rounded-md bg-amber-50 text-[9px] font-bold text-amber-700">
                  {etapa.podium_places}{' '}
                  puestos premiados
                </span>
              )}
          </div>
        </div>

        <button
          type="button"
          onClick={onAgregar}
          className="bg-secondary hover:bg-secondary-container text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer shrink-0"
        >
          Nuevo grupo
        </button>
      </div>

      {/* CONTENIDO */}
      {cargando ? (
        <div className="py-10 text-center text-xs text-slate-500">
          Cargando grupos...
        </div>
      ) : grupos.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <span className="material-symbols-outlined text-3xl text-slate-300">
            account_tree
          </span>

          <p className="text-xs font-bold text-slate-600 mt-2">
            Esta etapa todavía no tiene grupos
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            Crea un grupo o serie para organizar a los participantes.
          </p>

          <button
            type="button"
            onClick={onAgregar}
            className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Crear primer grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-primary/30 hover:shadow-xs transition-all"
            >
              {/* CABECERA TARJETA */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {grupo.group_type ===
                    'series'
                      ? 'Serie'
                      : 'Grupo'}{' '}
                    {grupo.group_number}
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                    {grupo.name}
                  </h4>
                </div>

                <span
                  className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold border ${
                    grupo.status ===
                    'finalizado'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : grupo.status ===
                        'en_curso'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : grupo.status ===
                          'cancelado'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {grupo.status}
                </span>
              </div>

              {/* INFORMACIÓN */}
              <div className="mt-4 space-y-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    calendar_month
                  </span>

                  <span>
                    {grupo.date ??
                      'Sin fecha'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    schedule
                  </span>

                  <span>
                    {grupo.start_time ??
                      'Sin hora'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    location_on
                  </span>

                  <span>
                    {grupo.venue?.name ??
                      'Sin escenario'}
                  </span>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      onEditar(grupo)
                    }
                    className="text-[10px] font-bold text-slate-500 hover:text-primary cursor-pointer"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onEliminar(grupo.id)
                    }
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onGestionar(grupo)
                  }
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Gestionar →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaGruposEtapaEvento;