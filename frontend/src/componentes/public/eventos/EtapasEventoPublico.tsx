import type {
  PublicCompetitionEventDetail,
  PublicEventStage,
} from '../../../servicios/apiPublic';
import { EtapaEventoPublico } from './EtapaEventoPublico';

interface Props {
  evento: PublicCompetitionEventDetail;
}

export const EtapasEventoPublico = ({ evento }: Props) => {
  const actuales = evento.stages.filter((e) => e.status === 'en_curso');
  const proximas = evento.stages.filter((e) => e.status === 'programado');
  const finalizadas = evento.stages.filter((e) => e.status === 'finalizado');

  const renderEtapas = (
    etapas: PublicEventStage[],
    abiertas = false
  ) =>
    etapas.map((stage) => (
      <EtapaEventoPublico
        key={stage.id}
        stage={stage}
        eventType={evento.event_type}
        defaultOpen={abiertas}
      />
    ));

  return (
    <div className="space-y-6">
      {actuales.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Etapa actual
          </h2>

          <div className="space-y-3">
            {renderEtapas(actuales, true)}
          </div>
        </section>
      )}

      {proximas.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Próximas etapas
          </h2>

          <div className="space-y-3">
            {renderEtapas(proximas)}
          </div>
        </section>
      )}

      {finalizadas.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Etapas finalizadas
          </h2>

          <div className="space-y-3">
            {renderEtapas(finalizadas)}
          </div>
        </section>
      )}
    </div>
  );
};