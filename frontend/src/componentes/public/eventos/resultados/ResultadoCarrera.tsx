import type { PublicCompetitionResult } from '../../../../servicios/apiPublic';
import { participanteClasifica } from '../../../../utils/public/clasificacionEvento';

interface Props {
  results: PublicCompetitionResult[];
  qualifiersPerGroup?: number | null;
  qualificationMethod?: string | null;
}



export const ResultadoCarrera = ({
  results,
  qualifiersPerGroup,
  qualificationMethod,
}: Props) => (
  <div className="divide-y divide-slate-800/60">
    {results.map((result) => {

      const clasifica = participanteClasifica({
        result,
        qualificationMethod,
        qualifiersPerGroup,
      });

      return (
        <div
          key={result.id}
          className={`px-4 py-3 grid grid-cols-[40px_1fr_70px_80px] items-center gap-3 ${
            clasifica
              ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
              : ''
          }`}
        >
          <span className={`text-sm font-bold text-center ${
            clasifica ? 'text-emerald-400' : 'text-slate-300'
          }`}>
            {result.position ?? '—'}
          </span>

          <span className="text-xs font-semibold text-slate-200 truncate">
            {result.participant?.name || 'Participante'}
          </span>

          <span className="text-[10px] text-slate-500 text-center">
            {result.lane ? `Carril ${result.lane}` : '—'}
          </span>

          <div className="text-right">
            <p className="text-sm font-bold text-white">
              {result.result_value ?? '—'}
              {result.result_unit ? ` ${result.result_unit}` : ''}
            </p>

            {clasifica && (
              <span className="text-[9px] font-bold text-emerald-400">
                CLASIFICA
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);