import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { publicApi } from '../../servicios/apiPublic';
import type { SearchResults } from '../../servicios/apiPublic';

export const ResultadosBusqueda: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({});
      setError('Ingresa al menos 2 caracteres para buscar.');
      return;
    }
    setLoading(true);
    setError(null);
    publicApi.search(q)
      .then((res) => {
        if (res.data.success) {
          setResults(res.data.data);
        } else {
          setError('No se pudo completar la búsqueda.');
        }
      })
      .catch(() => setError('Error al conectar con el servidor.'))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (query: string) => {
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  const hayResultados =
    (results.championships?.length || 0) +
    (results.matches?.length || 0) +
    (results.teams?.length || 0) +
    (results.players?.length || 0) > 0;

  return (
    <LayoutPublico onSearch={handleSearch}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-1">
          Resultados para <span className="text-primary">"{q}"</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {hayResultados ? 'Coincidencias encontradas' : 'Sin coincidencias'}
        </p>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm mb-6">
            {error}
          </div>
        )}

        {!loading && !error && !hayResultados && (
          <div className="bg-[#11131c] rounded-xl border border-slate-800 p-10 text-center">
            <p className="text-slate-400 text-sm">No se encontraron resultados para tu búsqueda.</p>
          </div>
        )}

        {!loading && results.championships && results.championships.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Campeonatos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.championships.map((champ) => (
                <div key={champ.id} className="bg-[#11131c] rounded-xl p-4 border border-slate-800">
                  <p className="font-bold text-white text-sm">{champ.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{champ.status}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && results.matches && results.matches.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Partidos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.matches.map((match) => (
                <Link
                  key={match.id}
                  to={`/partidos/${match.id}`}
                  className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all"
                >
                  <p className="text-sm text-slate-200">
                    {match.home_team?.name || '—'} <span className="text-slate-500">vs</span> {match.away_team?.name || '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{match.championship?.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && results.teams && results.teams.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Equipos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.teams.map((team) => (
                <Link
                    key={team.id}
                    to={`/equipos/${team.id}`}
                    className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center gap-3"
                >
                    {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                    )}
                    <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && results.players && results.players.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Jugadores</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.players.map((player) => (
                <Link
                    key={player.id}
                    to={`/jugadores/${player.id}`}
                    className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center gap-3"
                >
                    {player.photo ? (
                    <img src={player.photo} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                    )}
                    <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </LayoutPublico>
  );
};