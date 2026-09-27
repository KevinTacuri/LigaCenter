import type { PublicCompetitionEventDetail } from '../../../servicios/apiPublic';
import { InsigniaEstadoEvento } from './InsigniaEstadoEvento';

interface Props {
  evento: PublicCompetitionEventDetail;
}

const etiquetas = {
  carrera: 'Carrera',
  salto: 'Salto',
  lanzamiento: 'Lanzamiento',
  puntaje: 'Puntaje',
  individual: 'Individual',
  equipos: 'Equipos',
  single_final: 'Final única',
  rounds: 'Rondas',
  qualifying_semifinal_final: 'Clasificación | Semifinal | Final',
  qualifying_final: 'Clasificación | Final',
};

const badgeClass = `
  text-[10px] px-2 py-1 rounded
  bg-surface-container-high
  text-on-surface
  border border-outline
`;

export const CabeceraEventoPublico = ({ evento }: Props) => (
  <div className="bg-[#11131c] border border-slate-800 rounded-xl p-5">
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-semibold">
          {evento.championship_name}
        </p>

        <h1 className="text-xl font-bold text-white mt-1">
          {evento.name}
        </h1>

        <div className="flex gap-2 mt-2">
          <span className="text-[10px] px-2 py-1 rounded bg-indigo-500/10 text-indigo-400">
            {evento.discipline_name}
          </span>

          <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
            {evento.category_name}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
            <span className={badgeClass}>
                {etiquetas[evento.event_type as keyof typeof etiquetas] || evento.event_type}
            </span>

            <span className={badgeClass}>
                {etiquetas[evento.participation_type as keyof typeof etiquetas] || evento.participation_type}
            </span>

            {evento.competition_format && (
                <span className={badgeClass}>
                    {etiquetas[evento.competition_format as keyof typeof etiquetas] || evento.competition_format}
                </span>
            )}
        </div>
      </div>

      <InsigniaEstadoEvento status={evento.status} />
    </div>

    <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
      <span className="flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">group</span>
        {evento.participants_count} participantes
      </span>

      {evento.date && (
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {new Date(
            `${evento.date}T${evento.start_time || '00:00'}`
          ).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}

      {evento.venue?.name && (
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">
            location_on
          </span>
          {evento.venue.name}
        </span>
      )}
    </div>
  </div>
);