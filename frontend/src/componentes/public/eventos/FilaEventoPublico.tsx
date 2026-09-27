import { Link } from 'react-router-dom';
import type { PublicCompetitionEvent } from '../../../servicios/apiPublic';
import { InsigniaEstadoEvento } from './InsigniaEstadoEvento';

interface Props {
  evento: PublicCompetitionEvent;
}

export const FilaEventoPublico = ({ evento }: Props) => (
  <Link
    to={`/eventos/${evento.id}`}
    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0c0e16] hover:bg-[#171a26] border border-slate-800/50 hover:border-indigo-500/30 transition-all"
  >
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-200 truncate">
        {evento.name}
      </p>

      <p className="text-[9px] text-slate-500 mt-0.5">
        {evento.current_stage?.name ?? 'Evento'}
        {evento.current_group?.name
          ? ` · ${evento.current_group.name}`
          : ''}
      </p>
    </div>

    <InsigniaEstadoEvento status={evento.status} />
  </Link>
);