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
}

const ListaGruposEtapaEvento = ({
  etapa,
  grupos,
  cargando,
  onAgregar,
  onEditar,
  onEliminar,
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
            ← Cerrar grupos
          </button>

          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            Grupos / Series
          </h3>

          <p className="text-[10px] text-slate-500 mt-1">
            Etapa: {etapa.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onAgregar}
          className="bg-secondary hover:bg-secondary-container text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
        >
          Agregar grupo
        </button>
      </div>

      {cargando ? (
        <div className="py-10 text-center text-xs text-slate-500">
          Cargando grupos...
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
                  Nombre
                </th>

                <th className="p-3">
                  Tipo
                </th>

                <th className="p-3">
                  Fecha / Hora
                </th>

                <th className="p-3">
                  Escenario
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
              {grupos.map((grupo) => (
                <tr
                  key={grupo.id}
                  className="hover:bg-slate-50/40"
                >
                  <td className="p-3 pl-4 font-bold text-slate-900">
                    {grupo.group_number}
                  </td>

                  <td className="p-3 font-bold text-slate-900">
                    {grupo.name}
                  </td>

                  <td className="p-3 text-slate-600">
                    {grupo.group_type === 'series'
                      ? 'Serie'
                      : 'Grupo'}
                  </td>

                  <td className="p-3 text-slate-600 text-xs">
                    {grupo.date ?? '-'}

                    {grupo.start_time && (
                      <>
                        {' | '}
                        {grupo.start_time}
                      </>
                    )}
                  </td>

                  <td className="p-3 text-slate-600">
                    {grupo.venue?.name ??
                      'Sin escenario'}
                  </td>

                  <td className="p-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {grupo.status}
                    </span>
                  </td>

                  <td className="p-3 pr-4">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onEditar(grupo)
                        }
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onEliminar(grupo.id)
                        }
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {grupos.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500 text-xs"
                  >
                    Esta etapa todavía no tiene grupos o series.
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

export default ListaGruposEtapaEvento;