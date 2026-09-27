import { useState } from 'react';
import type { PublicEventGroup } from '../../../servicios/apiPublic';
import { InsigniaEstadoEvento } from './InsigniaEstadoEvento';
import { ResultadosGrupoPublico } from './ResultadosGrupoPublico';

interface Props {
  group: PublicEventGroup;
  eventType: string;
  defaultOpen?: boolean;
  qualificationMethod?: string | null;
  qualifiersPerGroup?: number | null;
}

export const GrupoEventoPublico = ({
  group,
  eventType,
  defaultOpen = false,
  qualificationMethod,
  qualifiersPerGroup,
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  const fecha = group.date
    ? new Date(
        `${group.date}T${group.start_time || '00:00'}`
      ).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-[#0c0e16] border border-slate-800/70 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#171a26] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`material-symbols-outlined text-slate-500 text-base transition-transform ${
              open ? 'rotate-90' : ''
            }`}
          >
            chevron_right
          </span>

          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-slate-200">
              {group.name}
            </p>

            <p className="text-[10px] text-slate-500 mt-0.5">
              {fecha || 'Sin fecha programada'}
            </p>
          </div>
        </div>

        <InsigniaEstadoEvento status={group.status} />
      </button>

      {open && (
        <div className="border-t border-slate-800/70">
          <ResultadosGrupoPublico
            group={group}
            eventType={eventType}
            embedded
            qualificationMethod={qualificationMethod}
            qualifiersPerGroup={qualifiersPerGroup}
          />
        </div>
      )}
    </div>
  );
};