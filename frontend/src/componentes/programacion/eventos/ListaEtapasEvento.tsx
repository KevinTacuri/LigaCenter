import type {
  EtapaEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  etapas: EtapaEvento[];

  cargando: boolean;

  onAgregar: () => void;

  onEditar: (etapa: EtapaEvento) => void;

  onEliminar: (etapaId: number) => void;
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

    case 'round':
      return 'Ronda';

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

  if (metodo === 'all') {
    return 'Todos';
  }

  return metodo;
};

const ListaEtapasEvento = ({
  etapas,
  cargando,
  onAgregar,
  onEditar,
  onEliminar,
}: Props) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Etapas
          </h3>

          <p className="text-[10px] text-slate-500 mt-1">
            Clasificatorias, semifinales, finales o rondas del evento
          </p>
        </div>

        <button
          type="button"
          onClick={onAgregar}
          className="bg-secondary hover:bg-secondary-container text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
        >
          Agregar etapa
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-xs text-slate-500">
          Cargando etapas...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3 pl-4">
                  #
                </th>

                <th className="p-3">
                  Etapa
                </th>

                <th className="p-3">
                  Tipo
                </th>

                <th className="p-3">
                  Clasifican
                </th>

                <th className="p-3">
                  Método
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
              {etapas.map((etapa) => (
                <tr
                  key={etapa.id}
                  className="hover:bg-slate-50/40"
                >
                  <td className="p-3 pl-4 font-bold text-slate-900">
                    {etapa.stage_number}
                  </td>

                  <td className="p-3 font-bold text-slate-900">
                    {etapa.name}
                  </td>

                  <td className="p-3 text-slate-600">
                    {obtenerTipoEtapa(
                      etapa.stage_type
                    )}
                  </td>

                  <td className="p-3 text-slate-600">
                    {etapa.qualifiers_count ?? '-'}
                  </td>

                  <td className="p-3 text-slate-600">
                    {obtenerMetodoClasificacion(
                      etapa.qualification_method
                    )}
                  </td>

                  <td className="p-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {etapa.status}
                    </span>
                  </td>

                  <td className="p-3 pr-4">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onEditar(etapa)
                        }
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onEliminar(etapa.id)
                        }
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {etapas.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500 text-xs"
                  >
                    No hay etapas registradas para este evento.
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

export default ListaEtapasEvento;