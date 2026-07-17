import React from 'react';
import { Link } from 'react-router-dom';
import type { Posicion } from '../servicios/api';

interface TablaPosicionesDinamicaProps {
  standings: Posicion[];
  discipline: string;
  loading?: boolean;
  className?: string;
}

type ColumnConfig = {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  render: (standing: Posicion, index: number) => React.ReactNode;
};

export const TablaPosicionesDinamica: React.FC<TablaPosicionesDinamicaProps> = ({
  standings,
  discipline,
  loading = false,
  className = '',
}) => {
  const getDisciplineType = (): 'futbol' | 'voley' | 'basquet' => {
    if (!discipline) return 'futbol';
    const name = discipline.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    if (name.includes('voley') || name.includes('voleibol') || name.includes('volleyball') || name.includes('voley playa') || name.includes('voley playa')) {
      return 'voley';
    }
    if (name.includes('basquet') || name.includes('basketball') || name.includes('baloncesto') || name.includes('basquetbol')) {
      return 'basquet';
    }
    if (name.includes('balon mano') || name.includes('balonmano') || name.includes('handball') || name.includes('balonmano')) {
      return 'futbol';
    }
    if (name.includes('futbol') || name.includes('futbol') || name.includes('soccer') || name.includes('futsal')) {
      return 'futbol';
    }
    return 'futbol';
  };

  const disciplineType = getDisciplineType();

  const getColumns = (): ColumnConfig[] => {
    const baseColumns: ColumnConfig[] = [
      {
        key: 'pos',
        label: 'Pos',
        align: 'center',
        render: (_, index) => <span className="font-bold text-slate-400">{index + 1}</span>,
      },
      {
        key: 'team',
        label: 'Equipo',
        align: 'left',
        render: (standing) => {
          const nombreEquipo = standing.team?.name || '—';
          const nombreCorto = nombreEquipo.includes(' - ') ? nombreEquipo.split(' - ')[0] : nombreEquipo;
          return (
            <Link
              to={`/equipos/${standing.team_id}`}
              className="font-bold text-white hover:text-indigo-400 transition-colors"
            >
              {nombreCorto}
            </Link>
          );
        },
      },
      {
        key: 'pj',
        label: 'PJ',
        align: 'center',
        render: (standing) => <span className="text-slate-300">{standing.matches_played || 0}</span>,
      },
    ];

    if (disciplineType === 'futbol') {
      return [
        ...baseColumns,
        {
          key: 'g',
          label: 'G',
          align: 'center',
          render: (standing) => <span className="text-emerald-400">{standing.wins || 0}</span>,
        },
        {
          key: 'e',
          label: 'E',
          align: 'center',
          render: (standing) => <span className="text-slate-400">{standing.draws || 0}</span>,
        },
        {
          key: 'p',
          label: 'P',
          align: 'center',
          render: (standing) => <span className="text-rose-400">{standing.losses || 0}</span>,
        },
        {
          key: 'gf',
          label: 'GF',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.goals_for || 0}</span>,
        },
        {
          key: 'gc',
          label: 'GC',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.goals_against || 0}</span>,
        },
        {
          key: 'dg',
          label: 'DG',
          align: 'center',
          render: (standing) => {
            const diff = standing.goal_difference || 0;
            return (
              <span className={`font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
            );
          },
        },
        {
          key: 'pts',
          label: 'Pts',
          align: 'center',
          render: (standing) => <span className="font-extrabold text-indigo-400 text-base">{standing.points || 0}</span>,
        },
      ];
    }

    if (disciplineType === 'voley') {
      return [
        ...baseColumns,
        {
          key: 'g',
          label: 'G',
          align: 'center',
          render: (standing) => <span className="text-emerald-400">{standing.wins_total || 0}</span>,
        },
        {
          key: 'p',
          label: 'P',
          align: 'center',
          render: (standing) => <span className="text-rose-400">{standing.losses_total || 0}</span>,
        },
        {
          key: 'sf',
          label: 'SF',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.sets_for || 0}</span>,
        },
        {
          key: 'sc',
          label: 'SC',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.sets_against || 0}</span>,
        },
        {
          key: 'sr',
          label: 'SR',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.sets_ratio?.toFixed(3) || '0.000'}</span>,
        },
        {
          key: 'pf',
          label: 'PF',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.points_for || 0}</span>,
        },
        {
          key: 'pc',
          label: 'PC',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.points_against || 0}</span>,
        },
        {
          key: 'pr',
          label: 'PR',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.points_ratio?.toFixed(3) || '0.000'}</span>,
        },
        {
          key: 'pts',
          label: 'Pts',
          align: 'center',
          render: (standing) => <span className="font-extrabold text-indigo-400 text-base">{standing.points || 0}</span>,
        },
      ];
    }

    if (disciplineType === 'basquet') {
      return [
        ...baseColumns,
        {
          key: 'pg',
          label: 'PG',
          align: 'center',
          render: (standing) => <span className="text-emerald-400">{standing.wins_total || 0}</span>,
        },
        {
          key: 'pp',
          label: 'PP',
          align: 'center',
          render: (standing) => <span className="text-rose-400">{standing.losses_total || 0}</span>,
        },
        {
          key: 'porcentaje',
          label: '%',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.win_percentage?.toFixed(1) || '0.0'}</span>,
        },
        {
          key: 'dif',
          label: 'DIF',
          align: 'center',
          render: (standing) => {
            const diff = (standing.points_for || 0) - (standing.points_against || 0);
            return (
              <span className={`font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
            );
          },
        },
        {
          key: 'pf',
          label: 'PF',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.points_for || 0}</span>,
        },
        {
          key: 'pc',
          label: 'PC',
          align: 'center',
          render: (standing) => <span className="text-slate-300">{standing.points_against || 0}</span>,
        },
        {
          key: 'racha',
          label: 'Racha',
          align: 'center',
          render: (standing) => (
            <span className="text-slate-300 font-mono text-xs">
              {standing.streak || '—'}
            </span>
          ),
        },
        {
          key: 'pts',
          label: 'Pts',
          align: 'center',
          render: (standing) => <span className="font-extrabold text-indigo-400 text-base">{standing.points || 0}</span>,
        },
      ];
    }

    return baseColumns;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        No hay posiciones disponibles para esta categoría
      </div>
    );
  }

  const columns = getColumns();

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#171a26] border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`p-3 ${col.align === 'center' ? 'text-center' : ''} ${
                  col.align === 'right' ? 'text-right' : ''
                } ${col.key === 'team' ? 'pl-4' : ''} ${
                  col.key === 'pts' ? 'pr-4' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {standings.map((standing, index) => (
            <tr
              key={standing.team_id || index}
              className="hover:bg-[#171a26]/40 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`p-3 text-sm ${col.align === 'center' ? 'text-center' : ''} ${
                    col.align === 'right' ? 'text-right' : ''
                  } ${col.key === 'team' ? 'pl-4' : ''} ${
                    col.key === 'pts' ? 'pr-4' : ''
                  }`}
                >
                  {col.render(standing, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};