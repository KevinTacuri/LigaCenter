import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { publicApi } from '../../servicios/apiPublic';
import type { PublicPlayer } from '../../servicios/apiPublic';

interface RecentMatch {
  id: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  date: string | null;
}

interface StandingInfo {
  position: number | null;
  points: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

interface TeamDetailData {
  team: { id: number; name: string; logo: string | null };
  players: PublicPlayer[];
  recent_matches: RecentMatch[];
  standing: StandingInfo | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'en_curso':
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse">EN VIVO</span>;
    case 'finalizado':
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700/50 text-slate-400">FINALIZADO</span>;
    default:
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">PRÓXIMO</span>;
  }
};

export const EquipoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TeamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paginaJugadores, setPaginaJugadores] = useState(1);
  const jugadoresPorPagina = 6;
  const totalPaginasJugadores = data ? Math.max(1, Math.ceil((data.players || []).length / jugadoresPorPagina)) : 1;
  const jugadoresPaginados = data ? (data.players || []).slice((paginaJugadores - 1) * jugadoresPorPagina, paginaJugadores * jugadoresPorPagina) : [];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    publicApi.getTeam(Number(id))
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError('No se pudo cargar el equipo.');
        }
      })
      .catch(() => setError('Error al conectar con el servidor.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSearch = (query: string) => {
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  return (
    <LayoutPublico onSearch={handleSearch}>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold tracking-wide transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Volver</span>
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Cabecera del equipo */}
            <div className="bg-[var(--surface-card-azul)] rounded-xl border border-[var(--outline)] p-6 flex items-center gap-4">
              {data.team.logo ? (
                <img src={data.team.logo} alt={data.team.name} className="w-16 h-16 rounded-full object-cover border border-slate-800" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-500">
                  {data.team.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{data.team.name}</h2>
                <p className="text-xs text-slate-500">{data.players.length} jugadores registrados</p>
              </div>
            </div>

            {/* Estadísticas / standing */}
            {data.standing && (
              <div className="mt-6 bg-[var(--surface-card-verde)] rounded-xl border border-[var(--outline)] p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Estadísticas</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-lg font-black text-white">{data.standing.matches_played}</p>
                    <p className="text-[10px] text-slate-500 uppercase">PJ</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-emerald-400">{data.standing.wins}</p>
                    <p className="text-[10px] text-slate-500 uppercase">G</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-400">{data.standing.draws}</p>
                    <p className="text-[10px] text-slate-500 uppercase">E</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-rose-400">{data.standing.losses}</p>
                    <p className="text-[10px] text-slate-500 uppercase">P</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">
                      {data.standing.goal_difference > 0 ? `+${data.standing.goal_difference}` : data.standing.goal_difference}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">DG</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-indigo-400">{data.standing.points}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Pts</p>
                  </div>
                </div>
              </div>
            )}

            {/* Plantilla */}
            <div className="mt-6 bg-[var(--surface-card-azul)] rounded-xl border border-[var(--outline)] p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Plantilla</h3>
              {data.players.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay jugadores registrados.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {jugadoresPaginados.map((player) => (
                      <Link
                        key={player.id}
                        to={`/jugadores/${player.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#171a26] border border-slate-800 hover:border-indigo-500/50 transition-all"
                      >
                        {player.photo ? (
                          <img src={player.photo} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {player.jersey_number ?? '—'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                          {player.jersey_number != null && (
                            <span className="text-xs font-black text-indigo-400 shrink-0">#{player.jersey_number}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPaginasJugadores > 1 && (
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                      <button
                        disabled={paginaJugadores === 1}
                        onClick={() => setPaginaJugadores(p => p - 1)}
                        className="px-3 py-1 bg-[#171a26] border border-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="text-slate-500 font-medium">
                        Página {paginaJugadores} de {totalPaginasJugadores} ({data.players.length} jugadores)
                      </span>
                      <button
                        disabled={paginaJugadores === totalPaginasJugadores}
                        onClick={() => setPaginaJugadores(p => p + 1)}
                        className="px-3 py-1 bg-[#171a26] border border-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Últimos partidos */}
            <div className="mt-6 bg-[var(--surface-card-verde)] rounded-xl border border-[var(--outline)] p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Últimos partidos</h3>
              {data.recent_matches.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay partidos recientes.</p>
              ) : (
                <div className="space-y-3">
                  {data.recent_matches.map((match) => (
                    <Link
                      key={match.id}
                      to={`/partidos/${match.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#171a26] border border-slate-800 hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-200">
                        <span className="font-semibold">{match.home_team}</span>
                        <span className="text-white font-bold">{match.home_score ?? '-'} : {match.away_score ?? '-'}</span>
                        <span className="font-semibold">{match.away_team}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {match.date && <span className="text-[10px] text-slate-500">{match.date}</span>}
                        {getStatusBadge(match.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </LayoutPublico>
  );
};