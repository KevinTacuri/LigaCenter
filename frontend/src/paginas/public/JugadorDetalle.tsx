import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { publicApi } from '../../servicios/apiPublic';

interface PlayerInfo {
  id: number;
  name: string;
  photo: string | null;
  team: { id: number; name: string; logo: string | null } | null;
}

interface StatsByChampionship {
  championship: { id: number; name: string } | null;
  statistics: Record<string, number>;
}

interface PlayerDetailData {
  player: PlayerInfo;
  statistics_by_championship: StatsByChampionship[];
}

const nombreEstadistica = (slug: string) => {
  const map: Record<string, string> = {
    goals: 'Goles',
    yellow_cards: 'Tarjetas amarillas',
    red_cards: 'Tarjetas rojas',
    assists: 'Asistencias',
  };
  return map[slug] || slug;
};

export const JugadorDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PlayerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    publicApi.getPlayer(Number(id))
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError('No se pudo cargar el jugador.');
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
            {/* Cabecera del jugador */}
            <div className="bg-[var(--surface-card-azul)] rounded-xl border border-[var(--outline)] p-6 flex items-center gap-4">
              {data.player.photo ? (
                <img src={data.player.photo} alt={data.player.name} className="w-16 h-16 rounded-full object-cover border border-slate-800" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-500">
                  {data.player.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{data.player.name}</h2>
                {data.player.team && (
                  <Link
                    to={`/equipos/${data.player.team.id}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors mt-1"
                  >
                    {data.player.team.logo && (
                      <img src={data.player.team.logo} alt={data.player.team.name} className="w-4 h-4 rounded-full object-cover" />
                    )}
                    {data.player.team.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Estadísticas por campeonato */}
            <div className="mt-6 space-y-4">
              {data.statistics_by_championship.length === 0 ? (
                <div className="bg-[#11131c] rounded-xl border border-slate-800 p-6">
                  <p className="text-slate-500 text-sm">No hay estadísticas registradas.</p>
                </div>
              ) : (
                data.statistics_by_championship.map((entry, idx) => (
                  <div key={idx} className={idx % 2 === 0 ? 'bg-[var(--surface-card-azul)] rounded-xl border border-[var(--outline)] p-6' : 'bg-[var(--surface-card-verde)] rounded-xl border border-[var(--outline)] p-6'}>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                      {entry.championship?.name || 'Competición'}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(entry.statistics).map(([slug, value]) => (
                        <div key={slug} className="text-center">
                          <p className="text-lg font-black text-indigo-400">{value}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{nombreEstadistica(slug)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </LayoutPublico>
  );
};