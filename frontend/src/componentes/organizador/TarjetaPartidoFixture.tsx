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
    <tr className="hover:bg-slate-50/40 transition-colors">
      <td className="p-3 pl-4 font-bold text-slate-700">Fecha {partido.round}</td>
      <td className="p-3">
        <span className="font-semibold text-slate-900">{partido.local_team?.name || 'Por definir'}</span>
        <span className="mx-2 text-slate-400 font-bold">VS</span>
        <span className="font-semibold text-slate-900">{partido.visitor_team?.name || 'Por definir'}</span>
      </td>
      <td className="p-3 text-slate-600 text-xs">
        {partido.match_date ? new Date(partido.match_date).toLocaleDateString('es-AR') : 'Por definir'}
        <span className="mx-1 text-slate-400">|</span>
        {partido.match_time || 'Por definir'}
      </td>
      <td className="p-3 text-slate-600 text-xs">{cancha}</td>
      <td className="p-3">
        <BadgeEstadoFixture estado={partido.status} tipo="partido" />
      </td>
      {!esDelegado && (
        <td className="p-3 pr-4 text-right">
          {partido.status !== 'finalizado' && (
            <button
              type="button"
              onClick={() => onReprogramar(partido)}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Reprogramar
            </button>
          )}
        </td>
      )}
    </tr>
  );
};
