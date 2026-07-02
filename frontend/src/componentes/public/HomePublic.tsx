import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { TiempoEnVivo } from '../../componentes/public/TiempoEnVivo';
import type { 
  PublicMatch, 
  PublicDiscipline, 
  PublicChampionship 
} from '../../servicios/apiPublic';
import { publicApi } from '../../servicios/apiPublic';

export const HomePublic: React.FC = () => {
  const [highlightedMatches, setHighlightedMatches] = useState<PublicMatch[]>([]);
  const [disciplines, setDisciplines] = useState<PublicDiscipline[]>([]);
  const [championships, setChampionships] = useState<PublicChampionship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  
  const [position, setPosition] = useState(0);
  const animationRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDiscipline]);

  useEffect(() => {
    if (highlightedMatches.length === 0 || isPaused) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTimestamp = 0;
    const speed = 0.5;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setPosition((prev) => {
        let newPos = prev + (speed * delta) / 16;
        const totalWidth = highlightedMatches.length * 280;
        if (newPos >= totalWidth / 2) {
          newPos = 0;
        }
        return newPos;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [highlightedMatches, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, disciplinesRes, championshipsRes] = await Promise.all([
        publicApi.getHighlightedMatches(),
        publicApi.getDisciplines(),
        publicApi.getChampionships({ discipline_id: selectedDiscipline || undefined })
      ]);

      setHighlightedMatches(matchesRes.data.data || []);
      setDisciplines(disciplinesRes.data.data || []);
      
      const champData = championshipsRes.data.data?.data || [];
      setChampionships(champData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (query: string) => {
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  return (
    <LayoutPublico onSearch={handleSearch}>
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">⚡ Destacados</h2>
          <Link to="/publico" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#11131c] rounded-xl p-4 animate-pulse h-32" />
            ))}
          </div>
        ) : highlightedMatches.length === 0 ? (
          <div className="bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
            <p className="text-slate-400 text-sm">No hay partidos destacados en este momento</p>
          </div>
        ) : (
          <div 
            className="relative overflow-hidden rounded-xl"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="flex gap-4"
              style={{
                transform: `translateX(-${position}px)`,
                transition: 'none',
                width: 'max-content',
              }}
            >
              {highlightedMatches.map(match => (
                <Link
                  key={match.id}
                  to={`/partidos/${match.id}`}
                  className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02] min-w-[260px] max-w-[260px] flex-shrink-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[100px]">
                      {match.championship?.name || 'Competición'}
                    </span>
                    {match.status === 'en_vivo' ? (
                      <TiempoEnVivo elapsedTime={match.elapsed_time} status={match.status} size="sm" />
                    ) : (
                      getStatusBadge(match.status)
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200 truncate">{match.home_team?.name || '—'}</span>
                      <span className="font-bold text-base text-white">
                        {match.status === 'en_vivo' ? (match.home_score ?? 0) : (match.home_score ?? '-')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200 truncate">{match.away_team?.name || '—'}</span>
                      <span className="font-bold text-base text-white">
                        {match.status === 'en_vivo' ? (match.away_score ?? 0) : (match.away_score ?? '-')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    {match.match_date ? new Date(match.match_date + 'T' + (match.match_time || '00:00')).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
                  </div>
                </Link>
              ))}
              {highlightedMatches.map(match => (
                <Link
                  key={`dup-${match.id}`}
                  to={`/partidos/${match.id}`}
                  className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02] min-w-[260px] max-w-[260px] flex-shrink-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[100px]">
                      {match.championship?.name || 'Competición'}
                    </span>
                    {match.status === 'en_vivo' ? (
                      <TiempoEnVivo elapsedTime={match.elapsed_time} status={match.status} size="sm" />
                    ) : (
                      getStatusBadge(match.status)
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200 truncate">{match.home_team?.name || '—'}</span>
                      <span className="font-bold text-base text-white">
                        {match.status === 'en_vivo' ? (match.home_score ?? 0) : (match.home_score ?? '-')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-200 truncate">{match.away_team?.name || '—'}</span>
                      <span className="font-bold text-base text-white">
                        {match.status === 'en_vivo' ? (match.away_score ?? 0) : (match.away_score ?? '-')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    {match.match_date ? new Date(match.match_date + 'T' + (match.match_time || '00:00')).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
                  </div>
                </Link>
              ))}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0b10] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0b10] to-transparent pointer-events-none" />
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDiscipline(null)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedDiscipline === null
                ? 'bg-indigo-650 text-white'
                : 'bg-[#11131c] text-slate-400 hover:bg-[#1a1d2a] hover:text-white border border-slate-800'
            }`}
          >
            Todos
          </button>
          {disciplines.map(discipline => (
            <button
              key={discipline.id}
              onClick={() => setSelectedDiscipline(discipline.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedDiscipline === discipline.id
                  ? 'bg-indigo-650 text-white'
                  : 'bg-[#11131c] text-slate-400 hover:bg-[#1a1d2a] hover:text-white border border-slate-800'
              }`}
            >
              {discipline.name}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-6 border-b border-slate-800">
        <nav className="flex gap-6">
          <Link
            to="/publico"
            className="py-3 text-sm font-bold text-indigo-400 border-b-2 border-indigo-400"
          >
            Todos los Partidos
          </Link>
          <Link
            to="/favoritos"
            className="py-3 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          >
            Mis Favoritos
          </Link>
          <Link
            to="/campeonatos"
            className="py-3 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
          >
            Competiciones
          </Link>
        </nav>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">🏆 Competiciones</h2>
          <Link to="/campeonatos" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#11131c] rounded-xl p-4 animate-pulse h-28" />
            ))}
          </div>
        ) : championships.length === 0 ? (
          <div className="bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
            <p className="text-slate-400 text-sm">No hay competiciones disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {championships.slice(0, 6).map(champ => (
              <Link
                key={champ.id}
                to={`/campeonatos/${champ.id}`}
                className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-sm truncate">{champ.name}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    champ.status === 'en_curso' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {champ.status === 'en_curso' ? 'En curso' : champ.status}
                  </span>
                </div>
                {champ.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{champ.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">groups</span>
                    {champ.teams_count || 0} equipos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">sports_soccer</span>
                    {champ.matches_count || 0} partidos
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </LayoutPublico>
  );
};