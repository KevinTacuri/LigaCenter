import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { publicApi } from '../../servicios/apiPublic';
import type { PublicMatch } from '../../servicios/apiPublic';

interface IncidenciaItem {
  id: number;
  minute: number;
  type: string;
  player: string | null;
  description: string | null;
}

interface MatchDetailData {
  match: PublicMatch;
  incidences: Record<string, IncidenciaItem[]>;
  report: { id: number; summary: string | null; created_at: string | null } | null;
}

const iconoIncidencia = (tipo: string) => {
  switch (tipo) {
    case 'goal': return { icon: 'sports_soccer', color: 'text-emerald-400', label: 'Gol' };
    case 'yellow_card': return { icon: 'square', color: 'text-yellow-400', label: 'Tarjeta amarilla' };
    case 'red_card': return { icon: 'square', color: 'text-rose-500', label: 'Tarjeta roja' };
    case 'foul': return { icon: 'sports', color: 'text-slate-400', label: 'Falta' };
    case 'injury': return { icon: 'medical_services', color: 'text-orange-400', label: 'Lesión' };
    default: return { icon: 'info', color: 'text-slate-400', label: tipo };
  }
};

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

export const PartidoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            {/* Marcador */}
            <div className="bg-[#11131c] rounded-xl border border-slate-800 p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs text-slate-500 font-bold">
                  {data.match.championship?.name || 'Competición'}
                </span>
                {getStatusBadge(data.match.status)}
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-center">
                  <p className="font-bold text-white text-lg truncate">{data.match.home_team?.name || '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-white">
                    {data.match.home_score ?? '-'} : {data.match.away_score ?? '-'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-lg truncate">{data.match.away_team?.name || '—'}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                {data.match.match_date && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {new Date(data.match.match_date + 'T' + (data.match.match_time || '00:00')).toLocaleString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                )}
                {data.match.venue && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {data.match.venue.name}
                  </span>
                )}
                {data.match.round && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">flag</span>
                    Ronda {data.match.round}
                  </span>
                )}
              </div>
            </div>

            {/* Incidencias */}
            <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Incidencias</h3>
              {Object.keys(data.incidences).length === 0 ? (
                <p className="text-slate-500 text-sm">No hay incidencias registradas para este partido.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.incidences).map(([tipo, items]) =>
                    items.map((item) => {
                      const meta = iconoIncidencia(tipo);
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#171a26] border border-slate-800">
                          <span className={`material-symbols-outlined text-lg ${meta.color}`}>{meta.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">
                              {meta.label} {item.player ? `— ${item.player}` : ''}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-500">{item.description}</p>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-400">{item.minute}'</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Reporte / Acta */}
            {data.report?.summary && (
              <div className="mt-6 bg-[#11131c] rounded-xl border border-slate-800 p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Resumen del partido</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{data.report.summary}</p>
              </div>
            )}
          </>
        )}
      </div>
    </LayoutPublico>
  );
};