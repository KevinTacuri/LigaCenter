import { Link } from 'react-router-dom';
import { TiempoEnVivo } from '../TiempoEnVivo';
import type { PublicMatch } from '../../../servicios/apiPublic';

interface Props {
  match: PublicMatch;
  disciplineName?: string;
  categoryName?: string;
}

const obtenerNombreEquipo = (nombre?: string) => {
  if (!nombre) return '—';
  return nombre.split(' - ')[0] || nombre;
};

const EstadoPartido = ({ match }: { match: PublicMatch }) => {
  if (match.status === 'en_vivo') {
    return (
      <TiempoEnVivo
        elapsedTime={match.elapsed_time}
        status={match.status}
        timerStatus={match.timer_status}
        size="sm"
      />
    );
  }

  if (match.status === 'finalizado') {
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700/50 text-slate-400">
        FINALIZADO
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">
      PRÓXIMO
    </span>
  );
};

export const TarjetaPartidoDestacado = ({
  match,
  disciplineName,
  categoryName,
}: Props) => (
  <Link
    to={`/partidos/${match.id}`}
    className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02] min-w-[260px] max-w-[260px] flex-shrink-0"
  >
    <div className="flex justify-between items-start gap-1 mb-2">
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-slate-500 font-bold truncate block">
          {match.championship?.name || 'Competición'}
        </span>

        <div className="flex gap-1.5 mt-0.5">
          {disciplineName && (
            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
              {disciplineName}
            </span>
          )}

          {categoryName && (
            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
              {categoryName}
            </span>
          )}
        </div>
      </div>

      <EstadoPartido match={match} />
    </div>

    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="font-medium text-sm text-slate-200 truncate">
          {obtenerNombreEquipo(match.home_team?.name)}
        </span>
        <span className="font-bold text-base text-white">
          {match.status === 'en_vivo' ? match.home_score ?? 0 : match.home_score ?? '-'}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="font-medium text-sm text-slate-200 truncate">
          {obtenerNombreEquipo(match.away_team?.name)}
        </span>
        <span className="font-bold text-base text-white">
          {match.status === 'en_vivo' ? match.away_score ?? 0 : match.away_score ?? '-'}
        </span>
      </div>
    </div>

    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
      <span className="material-symbols-outlined text-xs">schedule</span>
      {match.match_date
        ? new Date(
            `${match.match_date}T${match.match_time || '00:00'}`
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