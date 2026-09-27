import type { PublicCompetitionResult } from '../../../../servicios/apiPublic';

interface Props {
  results: PublicCompetitionResult[];
  updatedIds?: number[];
}

export const ResultadoIntentos = ({ results, updatedIds }: Props) => (
  <div className="divide-y divide-slate-800/60">
    {results.map((result) => {
      const actualizado = updatedIds?.includes(result.id);

      return (
        <div
          key={result.id}
          className={`
            transition-colors duration-900 ease-in-out px-4 py-3
            ${
              actualizado
                ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/30 shadow-[0_0_18px_rgba(52,211,153,0.15)]'
                : ''
            }
          `}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 text-center text-sm font-bold text-slate-300">
              {result.position ?? '—'}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {result.participant?.name || 'Participante'}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.attempts.map((attempt) => (
                  <span
                    key={attempt.id}
                    className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-300"
                  >
                    {attempt.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              <p className="text-[9px] text-slate-500">
                Mejor
              </p>

              <p className="text-sm font-bold text-white">
                {result.result_value ?? '—'}
                {result.result_unit
                  ? ` ${result.result_unit}`
                  : ''}
              </p>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);