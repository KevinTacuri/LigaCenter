import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { TiempoEnVivo } from '../../componentes/public/TiempoEnVivo';
import { publicApi } from '../../servicios/apiPublic';

import { registrarCanalPartido } from '../../servicios/echo';

interface PartidoDetalleData {
  match: any;
  incidences: any;
  report: any;
}

export const PartidoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PartidoDetalleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapStatus = (backendStatus: string) => {
    const statusMap: Record<string, string> = {
      'programado': 'pendiente',
      'en_curso': 'en_vivo',
      'finalizado': 'finalizado',
      'cancelado': 'cancelado',
      'reprogramado': 'reprogramado',
    };
    return statusMap[backendStatus] || backendStatus;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    publicApi.getMatch(Number(id))
      .then((res) => {
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError('No se pudo cargar el partido.');
        }
      })
      .catch(() => setError('Error al conectar con el servidor.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const canal = registrarCanalPartido(Number(id));

    // 1. Escuchar actualización general de estado y marcador de goles
    canal.listen('MatchUpdated', (e: any) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          match: {
            ...prev.match,
            home_score: e.local_team_goals,
            away_score: e.visitor_team_goals,
            status: mapStatus(e.status),
            timer_status: e.timer_status || prev.match.timer_status,
            current_period: e.current_period || prev.match.current_period,
          }
        };
      });
    });

    // 2. Escuchar sincronización del cronómetro en vivo
    canal.listen('MatchTimerSynced', (e: any) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          match: {
            ...prev.match,
            elapsed_time: e.current_elapsed_time,
            timer_status: e.timer_status,
            current_period: e.current_period,
            status: e.timer_status === 'running' || e.timer_status === 'paused' ? 'en_vivo' : mapStatus(prev.match.status),
          }
        };
      });
    });

    // 3. Escuchar registro de nuevas incidencias (goles, tarjetas, etc.)
    canal.listen('MatchIncidenceCreated', (e: any) => {
      setData((prev) => {
        if (!prev) return prev;
        const type = e.type;
        const nuevaInc = {
          id: e.id,
          minute: e.minute,
          type: e.type,
          player: e.player ? e.player.name : null,
          description: e.description,
        };

        const incidencesPrev = { ...prev.incidences };
        if (!incidencesPrev[type]) {
          incidencesPrev[type] = [];
        }
        
        // Evitar duplicados por id
        if (incidencesPrev[type].some((i: any) => i.id === e.id)) {
          return prev;
        }

        incidencesPrev[type] = [...incidencesPrev[type], nuevaInc].sort((a, b) => a.minute - b.minute);

        return {
          ...prev,
          incidences: incidencesPrev,
        };
      });
    });

    // 4. Escuchar eliminación de incidencias
    canal.listen('MatchIncidenceDeleted', (e: any) => {
      setData((prev) => {
        if (!prev) return prev;
        const incidencesPrev = { ...prev.incidences };
        
        Object.keys(incidencesPrev).forEach((type) => {
          incidencesPrev[type] = incidencesPrev[type].filter((i: any) => i.id !== e.incidence_id);
        });

        return {
          ...prev,
          incidences: incidencesPrev,
        };
      });
    });

    return () => {
      canal.unsubscribe();
    };
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_vivo':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse">EN VIVO</span>;
      case 'finalizado':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-700/50 text-slate-400">FINALIZADO</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400">PRÓXIMO</span>;
    }
  };

  const TeamLogo: React.FC<{ name?: string; logo?: string | null; size?: 'lg' }> = ({
    name,
    logo,
    size = 'lg',
  }) => {
    const dimensions = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg';

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

  const handleSearch = (query: string) => {
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  if (loading) {
    return (
      <LayoutPublico onSearch={handleSearch}>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
        </div>
      </LayoutPublico>
    );
  }

  if (error || !data) {
    return (
      <LayoutPublico onSearch={handleSearch}>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm">
          {error || 'No se encontró el partido'}
        </div>
      </LayoutPublico>
    );
  }

  const match = data.match;

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

        {/* Header del partido */}
        <div className="bg-[#11131c] rounded-xl border border-slate-800 p-6 md:p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {match.championship?.name || 'Competición'}
              </h2>
              <span className="text-xs text-slate-500">
                {match.venue?.name || '—'} · {match.match_date || '—'}
              </span>
            </div>
            {match.status === 'en_vivo' ? (
              <TiempoEnVivo 
                elapsedTime={match.elapsed_time} 
                status={match.status} 
                timerStatus={match.timer_status}
                currentPeriod={match.current_period}
                size="lg" 
              />
            ) : (
              getStatusBadge(match.status)
            )}
          </div>

          {/* Marcador principal */}
          <div className="flex items-center justify-center gap-8 md:gap-12 py-6">
            <div className="text-center">
              <TeamLogo name={match.home_team?.name} logo={match.home_team?.logo} size="lg" />
              <p className="text-sm font-bold text-white mt-2">{match.home_team?.name || '—'}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-4">
                <span className="text-5xl md:text-6xl font-black text-white">
                  {match.status === 'en_vivo' ? (match.home_score ?? 0) : (match.home_score ?? '-')}
                </span>
                <span className="text-2xl font-bold text-slate-600">VS</span>
                <span className="text-5xl md:text-6xl font-black text-white">
                  {match.status === 'en_vivo' ? (match.away_score ?? 0) : (match.away_score ?? '-')}
                </span>
              </div>
              {match.status === 'en_vivo' && match.elapsed_time !== null && (
                <div className="mt-2">
                  <TiempoEnVivo 
                    elapsedTime={match.elapsed_time} 
                    status={match.status} 
                    timerStatus={match.timer_status}
                    currentPeriod={match.current_period}
                    size="md" 
                  />
                </div>
              )}
            </div>

            <div className="text-center">
              <TeamLogo name={match.away_team?.name} logo={match.away_team?.logo} size="lg" />
              <p className="text-sm font-bold text-white mt-2">{match.away_team?.name || '—'}</p>
            </div>
          </div>

          {match.status === 'finalizado' && match.report && (
            <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
              Acta oficializada · {match.report.created_at}
            </div>
          )}
        </div>

        {/* Incidencias */}
        {data.incidences && Object.keys(data.incidences).length > 0 && (
          <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Incidencias del Partido</h3>
            <div className="space-y-3">
              {Object.entries(data.incidences).map(([type, items]: [string, any]) => (
                <div key={type}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{type}</h4>
                  <div className="space-y-1">
                    {items.map((inc: any) => (
                      <div key={inc.id} className="flex items-center gap-3 text-sm bg-[#171a26] p-2 rounded-lg border border-slate-800">
                        <span className="font-bold text-slate-400">{inc.minute}'</span>
                        <span className="text-white">{inc.player || '—'}</span>
                        <span className="text-slate-500 text-xs">{inc.description || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estadisticas rapidas */}
        {match.status === 'finalizado' && (
          <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Resumen</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-white">{match.home_score ?? 0}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Goles Local</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{match.away_score ?? 0}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Goles Visita</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">
                  {(match.home_score ?? 0) + (match.away_score ?? 0)}
                </p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Total Goles</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">
                  {data.incidences ? Object.values(data.incidences).reduce((acc: number, curr: any) => acc + curr.length, 0) : 0}
                </p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">Incidencias</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutPublico>
  );
};