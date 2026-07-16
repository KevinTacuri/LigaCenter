import React from 'react';
import { Link } from 'react-router-dom';
import { TiempoEnVivo } from '../../componentes/public/TiempoEnVivo';
import { TablaPosicionesDinamica } from '../../componentes/TablaPosicionesDinamica';
import type { 
  PublicMatch, 
  PublicStanding, 
  PublicChampionship, 
  PublicDiscipline 
} from '../../servicios/apiPublic';
import type { Posicion } from '../../servicios/api';

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

  const obtenerNombreEquipo = (nombreCompleto: string | undefined): string => {
    if (!nombreCompleto) return '—';
    const partes = nombreCompleto.split(' - ');
    return partes[0] || nombreCompleto;
  };

  const mapStandingToPosicion = (standing: PublicStanding, index: number): Posicion => {
    return {
      team_id: standing.team?.id || 0,
      category_id: 0,
      matches_played: standing.matches_played || 0,
      wins: standing.wins || 0,
      draws: standing.draws || 0,
      losses: standing.losses || 0,
      goals_for: standing.goals_for || 0,
      goals_against: standing.goals_against || 0,
      goal_difference: standing.goal_difference || 0,
      points: standing.points || 0,
      team: standing.team ? {
        id: standing.team.id,
        name: standing.team.name,
        logo: standing.team.logo
      } : undefined,
      wins_total: standing.wins_total || 0,
      losses_total: standing.losses_total || 0,
      sets_for: standing.sets_for || 0,
      sets_against: standing.sets_against || 0,
      sets_ratio: standing.sets_ratio || 0,
      points_for: standing.points_for || 0,
      points_against: standing.points_against || 0,
      points_ratio: standing.points_ratio || 0,
      win_percentage: standing.win_percentage || 0,
      games_behind: standing.games_behind || 0,
      streak: standing.streak || null,
    };
  };

  const TeamLogo: React.FC<{ name?: string; logo?: string | null; size?: 'sm' | 'md' }> = ({
    name,
    logo,
    size = 'md',
  }) => {
    const dimensions = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-14 h-14 text-lg';

    if (logo) {
      return (
        <img
          src={logo}
          alt={name || 'Equipo'}
          className={`${dimensions} rounded-full object-cover border border-slate-700 bg-[#171a26]`}
        />
      );
    }

    const initial = name?.trim()?.[0]?.toUpperCase() || '?';

    return (
      <div
        className={`${dimensions} rounded-full border border-slate-700 bg-[#171a26] flex items-center justify-center font-bold text-slate-300`}
      >
        {initial}
      </div>
    );
  };

  const posicionesMapeadas: Posicion[] = standings.map((s, index) => mapStandingToPosicion(s, index));

  return (
    <>
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

      {selectedChampionship && (
        <div className="mb-4">
          <Link
            to={`/campeonatos/${selectedChampionship}`}
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
          >
            Ver detalle completo del campeonato
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      )}

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
            <TablaPosicionesDinamica
              standings={posicionesMapeadas}
              discipline={disciplines.find(d => d.id === selectedDiscipline)?.name || 'futbol'}
              loading={loading}
            />
          )}

          {tabActiva === 'partidos' && (
            <div className="space-y-8">
              {matches && matches.filter(m => m.status === 'en_vivo').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <h3 className="text-xs font-extrabold text-red-500 uppercase tracking-widest">En Vivo Ahora</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matches.filter(m => m.status === 'en_vivo').map(match => (
                      <Link
                        key={match.id}
                        to={`/partidos/${match.id}`}
                        className="group relative bg-slate-900/60 backdrop-blur-md rounded-2xl border border-red-500/35 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col p-5"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            {match.championship?.name || 'Competición'}
                          </span>
                          <TiempoEnVivo 
                            elapsedTime={match.elapsed_time} 
                            status={match.status} 
                            timerStatus={match.timer_status}
                            currentPeriod={match.current_period ?? undefined}
                            size="md" 
                          />
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3">
                          <div className="flex flex-col items-center gap-2 min-w-0">
                            <TeamLogo name={match.home_team?.name} logo={match.home_team?.logo} size="md" />
                            <span className="text-sm font-bold text-white text-center truncate w-full group-hover:text-red-400 transition-colors">
                              {obtenerNombreEquipo(match.home_team?.name)}
                            </span>
                          </div>

                          <div className="flex flex-col items-center px-4 bg-slate-950/40 rounded-xl py-2.5 border border-slate-800/80">
                            <span className="text-3xl font-black text-white tracking-widest tabular-nums">
                              {match.home_score ?? 0} : {match.away_score ?? 0}
                            </span>
                            <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider mt-1 animate-pulse">En Juego</span>
                          </div>

                          <div className="flex flex-col items-center gap-2 min-w-0">
                            <TeamLogo name={match.away_team?.name} logo={match.away_team?.logo} size="md" />
                            <span className="text-sm font-bold text-white text-center truncate w-full group-hover:text-red-400 transition-colors">
                              {obtenerNombreEquipo(match.away_team?.name)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span className="material-symbols-outlined text-xs text-red-500">schedule</span>
                            {match.match_date
                              ? new Date(match.match_date + 'T' + (match.match_time || '00:00')).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                          {match.venue && (
                            <span className="flex items-center gap-1 max-w-[50%] truncate font-semibold">
                              <span className="material-symbols-outlined text-xs text-slate-500">location_on</span>
                              {match.venue.name}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {matches && matches.filter(m => m.status === 'en_vivo').length > 0 && (
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Otros Partidos</h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches && matches.filter(m => m.status !== 'en_vivo').length > 0 ? (
                    matches.filter(m => m.status !== 'en_vivo').map(match => (
                      <Link
                        key={match.id}
                        to={`/partidos/${match.id}`}
                        className="group bg-[#11131c] rounded-xl border border-slate-800 hover:border-indigo-650/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-650/10 transition-all duration-200 overflow-hidden flex flex-col"
                      >
                        <div className="flex justify-between items-center px-4 pt-3 pb-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate max-w-[65%]">
                            {match.championship?.name || 'Competición'}
                          </span>
                          {getStatusBadge(match.status)}
                        </div>

                        <div className="px-4 pb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <div className="flex flex-col items-center gap-1.5 min-w-0">
                            <TeamLogo name={match.home_team?.name} logo={match.home_team?.logo} size="sm" />
                            <span className="text-xs font-semibold text-slate-200 text-center truncate w-full">
                              {obtenerNombreEquipo(match.home_team?.name)}
                            </span>
                          </div>

                          <div className="flex flex-col items-center px-1">
                            {match.status === 'pendiente' || match.status === 'reprogramado' ? (
                              <span className="text-lg font-black text-slate-500 tracking-wider">VS</span>
                            ) : (
                              <span className="text-2xl font-black text-white tabular-nums whitespace-nowrap">
                                {match.home_score ?? '-'} <span className="text-slate-600">:</span> {match.away_score ?? '-'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-1.5 min-w-0">
                            <TeamLogo name={match.away_team?.name} logo={match.away_team?.logo} size="sm" />
                            <span className="text-xs font-semibold text-slate-200 text-center truncate w-full">
                              {obtenerNombreEquipo(match.away_team?.name)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto border-t border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {match.match_date
                              ? new Date(match.match_date + 'T' + (match.match_time || '00:00')).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                          {match.venue && (
                            <span className="flex items-center gap-1 truncate max-w-[45%]">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {match.venue.name}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    matches && matches.filter(m => m.status === 'en_vivo').length === 0 && (
                      <div className="col-span-full bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
                        <p className="text-slate-400 text-sm">No hay partidos disponibles para este campeonato</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};