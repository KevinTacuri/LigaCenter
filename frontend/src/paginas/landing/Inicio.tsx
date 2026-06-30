import React from 'react';
import { Link } from 'react-router-dom';
import type { 
  PublicMatch, 
  PublicStanding, 
  PublicChampionship, 
  PublicDiscipline 
} from '../../servicios/apiPublic';

interface InicioProps {
  matches: PublicMatch[];
  standings: PublicStanding[];
  championships: PublicChampionship[];
  disciplines: PublicDiscipline[];
  loading: boolean;
  error: string | null;
  tabActiva: string;
  setTabActiva: (tab: string) => void;
  selectedDiscipline: number | null;
  setSelectedDiscipline: (id: number | null) => void;
  selectedChampionship: number | null;
  setSelectedChampionship: (id: number) => void;
}

export const Inicio: React.FC<InicioProps> = ({
  matches,
  standings,
  championships,
  disciplines,
  loading,
  error,
  tabActiva,
  setTabActiva,
  selectedDiscipline,
  setSelectedDiscipline,
  selectedChampionship,
  setSelectedChampionship,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_vivo':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse">EN VIVO</span>;
      case 'finalizado':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700/50 text-slate-400">FINALIZADO</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">PRÓXIMO</span>;
    }
  };

  return (
    <>
      {/* Selector de Campeonato */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campeonato:</label>
        <div className="flex flex-wrap gap-2">
          {championships.map(champ => (
            <button
              key={champ.id}
              onClick={() => setSelectedChampionship(champ.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedChampionship === champ.id
                  ? 'bg-indigo-650 text-white'
                  : 'bg-[#11131c] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {champ.name}
            </button>
          ))}
          {championships.length === 0 && !loading && (
            <span className="text-xs text-slate-500">No hay campeonatos públicos disponibles</span>
          )}
        </div>
      </div>

      {/* Selector de Disciplina */}
      {disciplines.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disciplina:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDiscipline(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedDiscipline === null
                  ? 'bg-indigo-650 text-white'
                  : 'bg-[#11131c] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todas
            </button>
            {disciplines.map(discipline => (
              <button
                key={discipline.id}
                onClick={() => setSelectedDiscipline(discipline.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedDiscipline === discipline.id
                    ? 'bg-indigo-650 text-white'
                    : 'bg-[#11131c] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {discipline.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-800">
        <nav className="flex gap-6">
          <button
            onClick={() => setTabActiva('posiciones')}
            className={`py-2 text-sm font-bold transition-colors border-b-2 ${
              tabActiva === 'posiciones'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Tabla de Posiciones
          </button>
          <button
            onClick={() => setTabActiva('partidos')}
            className={`py-2 text-sm font-bold transition-colors border-b-2 ${
              tabActiva === 'partidos'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Partidos
          </button>
        </nav>
      </div>

      {/* Contenido */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {tabActiva === 'posiciones' && (
            <div className="bg-[#11131c] rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#171a26] border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-3 pl-4 text-center w-10">Pos</th>
                      <th className="p-3">Equipo</th>
                      <th className="p-3 text-center">PJ</th>
                      <th className="p-3 text-center">G</th>
                      <th className="p-3 text-center">E</th>
                      <th className="p-3 text-center">P</th>
                      <th className="p-3 text-center">GF</th>
                      <th className="p-3 text-center">GC</th>
                      <th className="p-3 text-center">DG</th>
                      <th className="p-3 pr-4 text-center font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {standings.map((standing, index) => (
                      <tr key={standing.team.id} className="hover:bg-[#171a26]/40">
                        <td className="p-3 pl-4 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="p-3 font-bold text-white">{standing.team.name}</td>
                        <td className="p-3 text-center text-slate-300">{standing.matches_played}</td>
                        <td className="p-3 text-center text-emerald-400">{standing.wins}</td>
                        <td className="p-3 text-center text-slate-400">{standing.draws}</td>
                        <td className="p-3 text-center text-rose-400">{standing.losses}</td>
                        <td className="p-3 text-center text-slate-300">{standing.goals_for}</td>
                        <td className="p-3 text-center text-slate-300">{standing.goals_against}</td>
                        <td className="p-3 text-center font-bold text-white">
                          {standing.goal_difference > 0 ? `+${standing.goal_difference}` : standing.goal_difference}
                        </td>
                        <td className="p-3 pr-4 text-center font-extrabold text-indigo-400 text-base">
                          {standing.points}
                        </td>
                      </tr>
                    ))}
                    {standings.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-10 text-center text-slate-500 text-sm">
                          No hay posiciones disponibles para este campeonato
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabActiva === 'partidos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map(match => (
                <Link
                  key={match.id}
                  to={`/partidos/${match.id}`}
                  className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]">
                      {match.championship?.name || 'Competición'}
                    </span>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200 truncate">{match.home_team?.name || '—'}</span>
                      <span className="font-bold text-base text-white">{match.home_score ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200 truncate">{match.away_team?.name || '—'}</span>
                      <span className="font-bold text-base text-white">{match.away_score ?? '-'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {match.match_date ? new Date(match.match_date + 'T' + (match.match_time || '00:00')).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </span>
                    {match.venue && (
                      <span className="flex items-center gap-1 truncate max-w-[100px]">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {match.venue.name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {matches.length === 0 && (
                <div className="col-span-full bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
                  <p className="text-slate-400 text-sm">No hay partidos disponibles para este campeonato</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};