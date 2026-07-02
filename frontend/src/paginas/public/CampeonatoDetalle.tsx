import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { publicApi } from '../../servicios/apiPublic';
import type { PublicChampionship, ChampionshipStats } from '../../servicios/apiPublic';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    publicApi.getChampionship(Number(id))
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError('No se pudo cargar el campeonato.');
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
            {/* Cabecera del campeonato */}
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

              {/* Disciplinas */}
              {data.championship.disciplines.length > 0 && (
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

              {/* Fechas */}
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

            {/* Estadísticas generales */}
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

            {/* Goleadores */}
            <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Máximos Goleadores</h3>
              {data.stats.top_scorers.length === 0 ? (
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

            {/* Accesos rápidos */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link
                to={`/?tab=posiciones`}
                className="bg-[#11131c] rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all p-4 text-center"
              >
                <span className="material-symbols-outlined text-2xl text-indigo-400 block mb-1">leaderboard</span>
                <p className="text-xs font-bold text-slate-300">Tabla de Posiciones</p>
              </Link>
              <Link
                to={`/?tab=partidos`}
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