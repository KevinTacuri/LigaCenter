import type { PublicCompetitionResult } from '../../../../servicios/apiPublic';

interface Props {
  results: PublicCompetitionResult[];
}

export const ResultadoPuntaje = ({ results }: Props) => (
  <div className="divide-y divide-slate-800/60">
    {results.map((result) => (
      <div
        key={result.id}
        className="px-4 py-3 flex items-center gap-3"
      >
        <span className="w-8 text-center text-sm font-bold text-slate-300">
          {result.position ?? '—'}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {result.participant?.name || 'Participante'}
          </p>

          {result.attempts.length > 0 && (
            <p className="text-[9px] text-slate-500 mt-1">
              {result.attempts.map((a) => a.value).join(' · ')}
            </p>
          )}
        </div>

        <span className="text-sm font-bold text-white">
          {result.result_value ?? '—'}
          {result.result_unit ? ` ${result.result_unit}` : ''}
        </span>
      </div>
    ))}
  </div>
);