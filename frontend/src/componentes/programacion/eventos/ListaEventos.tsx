import type {
  EventoCompetencia,
} from '../../../types/CompetitionEvent';

interface Props {
  eventos: EventoCompetencia[];

  onGestionar: (evento: EventoCompetencia) => void;
  onEditar: (evento: EventoCompetencia) => void;
  onEliminar: (eventoId: number) => void;

  formatearFecha: (fecha?: string) => string;
}

const ListaEventos = ({
  eventos,
  onGestionar,
  onEditar,
  onEliminar,
  formatearFecha,
}: Props) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">
        Eventos Programados
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <th className="p-3 pl-4">
                Evento
              </th>

              <th className="p-3">
                Disciplina
              </th>

              <th className="p-3">
                Categoría
              </th>

              <th className="p-3">
                Fecha
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
            {eventos.map((evento) => (
              <tr
                key={evento.id}
                className="hover:bg-slate-50/40"
              >
                <td className="p-3 pl-4">
                  <div className="font-bold text-slate-900">
                    {evento.name}
                  </div>

                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    {evento.event_type}
                    {' · '}
                    {evento.participation_type === 'team'
                      ? 'Por equipos'
                      : 'Individual'}
                  </div>
                </td>

                <td className="p-3 text-slate-600">
                  {evento
                    .championship_discipline
                    ?.discipline?.name ?? '-'}
                </td>

                <td className="p-3 text-slate-600">
                  {evento.category?.name ?? '-'}
                </td>

                <td className="p-3 text-slate-600 text-xs">
                  {formatearFecha(evento.date)}

                  {evento.start_time && (
                    <>
                      {' | '}
                      {evento.start_time}
                    </>
                  )}
                </td>

                <td className="p-3 text-slate-600">
                  {evento.venue?.name ?? 'Sin escenario'}
                </td>

                <td className="p-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      evento.status === 'finalizado'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : evento.status === 'en_curso'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : evento.status === 'cancelado'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {evento.status}
                  </span>
                </td>

                <td className="p-3 pr-4">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onGestionar(evento)
                      }
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Gestionar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onEditar(evento)
                      }
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onEliminar(evento.id)
                      }
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {eventos.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-slate-500 text-xs"
                >
                  No hay eventos programados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaEventos;