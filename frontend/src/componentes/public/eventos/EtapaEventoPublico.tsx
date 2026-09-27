import { useState } from 'react';
import type { PublicEventStage } from '../../../servicios/apiPublic';
import { InsigniaEstadoEvento } from './InsigniaEstadoEvento';
import { GrupoEventoPublico } from './GrupoEventoPublico';

interface Props {
  stage: PublicEventStage;
  eventType: string;
  defaultOpen?: boolean;
}

export const EtapaEventoPublico = ({
  stage,
  eventType,
  defaultOpen = false,
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  const obtenerClasificacion = () => {
    if (stage.stage_type === 'final') {
      return stage.podium_places
        ? `${stage.podium_places} puestos premiados`
        : null;
    }

    if (stage.qualification_method === 'best_overall') {
      return `Clasifican los mejores ${stage.qualifiers_count ?? 0}`;
    }

    if (stage.qualification_method === 'best_per_group') {
      return `Clasifican ${stage.qualifiers_per_group ?? 0} por serie`;
    }

    if (stage.qualification_method === 'all') {
      return 'Clasifican todos';
    }

    return null;
  };

  const clasificacion = obtenerClasificacion();

  return (
    <div className="bg-[#11131c] border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-container-high transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-slate-500 text-lg transition-transform ${
              open ? 'rotate-90' : ''
            }`}
          >
            chevron_right
          </span>

          <div className="text-left">
            <span className="text-sm font-bold text-white">
              {stage.name}
            </span>

            {clasificacion && (
              <p className="text-[10px] text-indigo-400 mt-0.5">
                {clasificacion}
              </p>
            )}
          </div>
        </div>

        <InsigniaEstadoEvento status={stage.status} />
      </button>

      {open && (
        <div className="border-t border-slate-800 p-3 space-y-2">
          {stage.groups.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500">
              Aún no hay series programadas
            </div>
          ) : (
            stage.groups.map((group) => (
              <GrupoEventoPublico
                key={group.id}
                group={group}
                eventType={eventType}
                defaultOpen={group.status === 'en_curso'}
                qualificationMethod={stage.qualification_method}
                qualifiersPerGroup={stage.qualifiers_per_group ?? 2}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};