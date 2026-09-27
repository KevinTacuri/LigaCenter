import { Link } from 'react-router-dom';
import type { PublicCompetitionEvent } from '../../../servicios/apiPublic';
import { InsigniaEstadoEvento } from './InsigniaEstadoEvento';

interface Props {
  evento: PublicCompetitionEvent;
}

export const TarjetaEventoDestacado = ({ evento }: Props) => (
  <Link
    to={`/eventos/${evento.id}`}
    className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02] min-w-[260px] max-w-[260px] flex-shrink-0"
  >
    <div className="flex justify-between items-start gap-1 mb-2">
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-slate-500 font-bold truncate block">
          {evento.championship_name || 'Competición'}
        </span>

        <div className="flex gap-1.5 mt-0.5">
          {evento.discipline_name && (
            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
              {evento.discipline_name}
            </span>
          )}

          {evento.category_name && (
            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
              {evento.category_name}
            </span>
          )}
        </div>
      </div>

      <InsigniaEstadoEvento status={evento.status} />
    </div>

    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="font-medium text-sm text-slate-200 truncate">
          {evento.name}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-[10px] text-slate-400 truncate">
          {evento.current_stage?.name ?? 'Evento'}
          {evento.current_group?.name
            ? ` · ${evento.current_group.name}`
            : ''}
        </span>
      </div>
    </div>

    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
      <span className="material-symbols-outlined text-xs">
        schedule
      </span>
      {evento.date
        ? new Date(
            `${evento.date}T${evento.start_time || '00:00'}`
            ).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            })
        : '—'}
    </div>
  </Link>
);