import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { publicApi } from '../../servicios/apiPublic';
import type { PublicChampionship, ChampionshipStats, PublicTeam } from '../../servicios/apiPublic';

interface ChampionshipDetailData {
  championship: PublicChampionship;
  stats: ChampionshipStats;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'en_curso':
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse">EN CURSO</span>;
    case 'finalizado':
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-700/50 text-slate-400">FINALIZADO</span>;
    default:
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400">CREADO</span>;
  }
};

export const CampeonatoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ChampionshipDetailData | null>(null);
  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const extractYearFromDate = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const year = new Date(dateStr).getFullYear();
    return isNaN(year) ? null : year;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    const yearParam = selectedYear ? { year: selectedYear } : {};
    
    publicApi.getChampionship(Number(id), yearParam)
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
          
          const champYear = extractYearFromDate(res.data.data.championship.start_date);
          if (champYear) {
            const years = [champYear];
            setAvailableYears(years);
            setSelectedYear(champYear);
          }
        } else {
          setError('No se pudo cargar el campeonato.');
        }
      })
      .catch(() => setError('Error al conectar con el servidor.'))
      .finally(() => setLoading(false));

    setTeamsLoading(true);
    publicApi.getTeams({ 
      championship_id: Number(id),
      ...yearParam 
    })
      .then((res) => {
        if (res.data.success) {
          setTeams(res.data.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setTeamsLoading(false));
  }, [id, selectedYear]);

  const handleSearch = (query: string) => {
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  return (
    <LayoutPublico onSearch={handleSearch}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold tracking-wide transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Volver</span>
          </Link>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temporada:</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-[#11131c] border border-slate-800 text-white text-sm font-bold rounded-xl px-4 py-2 pr-10 outline-none focus:border-indigo-500/50 cursor-pointer hover:bg-[#171a26] transition-colors min-w-[100px]"
              >
                {availableYears.length > 0 ? (
                  availableYears.map(year => (
                    <option key={year} value={year} className="bg-[#11131c]">
                      {year}
                    </option>
                  ))
                ) : (
                  <option value={new Date().getFullYear()} className="bg-[#11131c]">
                    {new Date().getFullYear()}
                  </option>
                )}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

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
            <div className="bg-[#11131c] rounded-xl border border-slate-800 p-6 md:p-8">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-black text-white">{data.championship.name}</h2>
                  {data.championship.description && (
                    <p className="text-sm text-slate-400 mt-1">{data.championship.description}</p>
                  )}
                </div>
                {getStatusLabel(data.championship.status)}
              </div>

              {data.championship.disciplines && data.championship.disciplines.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.championship.disciplines.map((d) => (
                    <span
                      key={d.id}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-[#171a26] text-slate-300 border border-slate-800"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {data.championship.start_date && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event</span>
                    Inicio: {data.championship.start_date}
                  </span>
                )}
                {data.championship.end_date && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event_available</span>
                    Fin: {data.championship.end_date}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Estadísticas Generales</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-white">{data.stats.teams_count}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Equipos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{data.stats.total_matches}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Partidos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-indigo-400">{data.stats.total_goals}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Goles</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{data.stats.avg_goals_per_match}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1">Prom. Goles/Partido</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Equipos</h3>
              {teamsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                </div>
              ) : teams.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay equipos registrados en este campeonato.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/equipos/${team.id}`}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#171a26] border border-slate-800 hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all"
                    >
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full object-cover border border-slate-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg font-black text-slate-500">
                          {team.name.charAt(0)}
                        </div>
                      )}
                      <p className="text-xs font-semibold text-white text-center truncate w-full">{team.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Máximos Goleadores</h3>
              {!data.stats.top_scorers || data.stats.top_scorers.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay goleadores registrados.</p>
              ) : (
                <div className="space-y-2">
                  {data.stats.top_scorers.map((scorer, index) => (
                    <div
                      key={scorer.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#171a26] border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-650 text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-white">{scorer.name}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-400">{scorer.goals} goles</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link
                to={`/publico?tab=posiciones&campeonato=${data.championship.id}`}
                className="bg-[#11131c] rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all p-4 text-center"
              >
                <span className="material-symbols-outlined text-2xl text-indigo-400 block mb-1">leaderboard</span>
                <p className="text-xs font-bold text-slate-300">Tabla de Posiciones</p>
              </Link>
              <Link
                to={`/publico?tab=partidos&campeonato=${data.championship.id}`}
                className="bg-[#11131c] rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all p-4 text-center"
              >
                <span className="material-symbols-outlined text-2xl text-indigo-400 block mb-1">sports_soccer</span>
                <p className="text-xs font-bold text-slate-300">Ver Partidos</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </LayoutPublico>
  );
};