import React from 'react';
import type { Escenario, Partido } from '../../servicios/api';
import { BadgeEstadoFixture } from './BadgeEstadoFixture';

interface TarjetaPartidoFixtureProps {
  partido: Partido;
  escenarios: Escenario[];
  onReprogramar: (partido: Partido) => void;
  esDelegado?: boolean;
}

export const TarjetaPartidoFixture: React.FC<TarjetaPartidoFixtureProps> = ({
  partido,
  escenarios,
  onReprogramar,
  esDelegado = false,
}) => {
  const cancha = escenarios.find((escenario) => escenario.id === partido.venue_id)?.name || 'Por definir';

  return (
    <tr className="odd:bg-[var(--surface-card-celeste)]/25 even:bg-[var(--surface-card-azul)]/10 hover:bg-[var(--surface-card-elevated-hover)]/90 transition-colors">
      <td className="p-3 pl-4 font-bold text-[var(--on-surface)]">Fecha {partido.round}</td>
      <td className="p-3">
        <span className="font-semibold text-[var(--on-surface)]">{partido.local_team?.name || 'Por definir'}</span>
        <span className="mx-2 text-[var(--on-surface-variant)] font-bold">VS</span>
        <span className="font-semibold text-[var(--on-surface)]">{partido.visitor_team?.name || 'Por definir'}</span>
      </td>
      <td className="p-3 text-[var(--on-surface-variant)] text-xs">
        {partido.match_date ? new Date(partido.match_date).toLocaleDateString('es-AR') : 'Por definir'}
        <span className="mx-1 text-[var(--on-surface-muted)]">|</span>
        {partido.match_time || 'Por definir'}
      </td>
      <td className="p-3 text-[var(--on-surface-variant)] text-xs">{cancha}</td>
      <td className="p-3">
        <BadgeEstadoFixture estado={partido.status} tipo="partido" />
      </td>
      {!esDelegado && (
        <td className="p-3 pr-4 text-right">
          {partido.status !== 'finalizado' && (
            <button
              type="button"
              onClick={() => onReprogramar(partido)}
              className="text-xs font-bold text-[var(--text-accent)] hover:text-[var(--primary)] cursor-pointer transition-colors"
            >
              Reprogramar
            </button>
          )}
        </td>
      )}
    </tr>
  );
};
