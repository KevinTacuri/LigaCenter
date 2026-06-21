import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  serviciosResultados,
  serviciosParticipantes,
  serviciosFixture
} from '../servicios/api';
import type {
  Posicion,
  Sancion,
  Disciplina,
  Categoria,
  TipoEstadistica,
  RankingItem
} from '../servicios/api';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { BarraLateral } from '../componentes/BarraLateral';

export const VisualizacionPublica: React.FC = () => {
  const { usuario } = useAutenticacion();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');

  const [tabActiva, setTabActiva] = useState<string>('posiciones');

  useEffect(() => {
    if (queryTab && queryTab !== tabActiva) {
      setTabActiva(queryTab);
    }
  }, [queryTab]);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Datos
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [estadisticasDisponibles, setEstadisticasDisponibles] = useState<TipoEstadistica[]>([]);
  const [dynamicRankings, setDynamicRankings] = useState<RankingItem[]>([]);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);

  // Nuevos estados para formatos y partidos públicos
  const [grupos, setGrupos] = useState<any[]>([]);
  const [fixtureKnockout, setFixtureKnockout] = useState<any[]>([]);
  const [todosLosPartidos, setTodosLosPartidos] = useState<any[]>([]);
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [matchReport, setMatchReport] = useState<any>(null);
  const [matchIncidences, setMatchIncidences] = useState<any[]>([]);
  const [mostrarDetallesPart, setMostrarDetallesPart] = useState<boolean>(false);
  const [matchSeleccionado, setMatchSeleccionado] = useState<any>(null);
  const [cargandoReporte, setCargandoReporte] = useState<boolean>(false);

  // Filtros de tabla
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroDisc, setFiltroDisc] = useState('');
  const [filtroCat, setFiltroCat] = useState('');

  useEffect(() => {
    cargarFiltros();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [tabActiva, filtroDisc, filtroCat]);

  // Al cambiar la disciplina, cargamos sus estadísticas dinámicas configuradas
  useEffect(() => {
    cargarEstadisticasDisciplina();
  }, [filtroDisc]);

  const cargarEstadisticasDisciplina = async () => {
    if (!filtroDisc) {
      setEstadisticasDisponibles([]);
      if (tabActiva.startsWith('stat_')) setTabActiva('posiciones');
      return;
    }
    try {
      const res = await serviciosResultados.obtenerEstadisticasPorDisciplina(parseInt(filtroDisc));
      if (res.success) {
        setEstadisticasDisponibles(res.data);
      } else {
        setEstadisticasDisponibles([]);
      }
    } catch (err) {
      setEstadisticasDisponibles([]);
    }
  };

  const cargarFiltros = async () => {
    try {
      const resDisc = await serviciosParticipantes.obtenerDisciplinas();
      const resCat = await serviciosParticipantes.obtenerCategorias();
      if (resDisc.success) setDisciplinas(resDisc.data);
      if (resCat.success) setCategorias(resCat.data);
    } catch (err) {}
  };

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      if (tabActiva === 'posiciones') {
        const discId = filtroDisc ? parseInt(filtroDisc) : undefined;
        const catId = filtroCat ? parseInt(filtroCat) : undefined;
        const catActiva = categorias.find(c => c.id === catId);

        if (catActiva?.format === 'grupos') {
          if (catId) {
            const resG = await serviciosParticipantes.obtenerGrupos(catId);
            if (resG.success) setGrupos(resG.data);
          } else {
            setGrupos([]);
          }
        } else if (catActiva?.format === 'eliminacion_directa') {
          if (discId && catId) {
            const resFix = await serviciosFixture.obtenerFixture(discId, catId);
            if (resFix.success) setFixtureKnockout(resFix.data);
          } else {
            setFixtureKnockout([]);
          }
        } else {
          // Liga o por defecto
          const res = await serviciosResultados.obtenerPosiciones(discId, catId);
          if (res.success) setPosiciones(res.data);
        }
      } else if (tabActiva === 'sanciones') {
        const res = await serviciosResultados.obtenerSanciones();
        if (res.success) setSanciones(res.data);
      } else if (tabActiva === 'partidos') {
        const res = await serviciosFixture.obtenerPartidos();
        if (res.success) setTodosLosPartidos(res.data);
      } else if (tabActiva.startsWith('stat_')) {
        const statTypeId = parseInt(tabActiva.replace('stat_', ''));
        const discId = filtroDisc ? parseInt(filtroDisc) : undefined;
        const catId = filtroCat ? parseInt(filtroCat) : undefined;
        if (discId) {
          const res = await serviciosResultados.obtenerRankingEstadisticas({
            discipline_id: discId,
            statistic_type_id: statTypeId,
            category_id: catId
          });
          if (res.success) {
            setDynamicRankings(res.data);
          }
        }
      }
    } catch (err) {
      setErrorLocal('Error al cargar datos estadísticos.');
    } finally {
      setCargando(false);
    }
  };

  const verDetallesPartido = async (partido: any) => {
    setMatchSeleccionado(partido);
    setMostrarDetallesPart(true);
    setMatchReport(null);
    setMatchIncidences([]);
    setCargandoReporte(true);
    try {
      const resRep = await serviciosResultados.obtenerReportePartido(partido.id);
      if (resRep.success) setMatchReport(resRep.data);
      
      const resInc = await serviciosResultados.obtenerIncidenciasPorPartido(partido.id);
      if (resInc.success) setMatchIncidences(resInc.data);
    } catch (err) {
      // Ignorar errores
    } finally {
      setCargandoReporte(false);
    }
  };

  const contenidoInterno = (
    <>
      {/* Cabecera */}
      <header className="bg-[#11131c]/90 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-black text-white leading-none">Estadísticas y Posiciones</h1>
            <span className="text-[10px] text-slate-450 font-semibold tracking-wider uppercase mt-1 block">
              Consulta Pública de Resultados en Tiempo Real
            </span>
          </div>
        </div>
      </header>

      {/* Tabs (visibles solo en móvil ya que en desktop se navega por la barra lateral) */}
      <div className="bg-[#11131c] border-b border-slate-900 px-6 py-2 flex flex-wrap gap-2 lg:hidden">
        <button
          onClick={() => setSearchParams({ tab: 'posiciones' })}
          className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
            tabActiva === 'posiciones' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
          }`}
        >
          Tabla de Posiciones
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'partidos' })}
          className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
            tabActiva === 'partidos' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
          }`}
        >
          Lista de Partidos
        </button>

        {/* Pestañas de estadísticas dinámicas si hay una disciplina seleccionada */}
        {filtroDisc && estadisticasDisponibles.map((est) => {
          const tabKey = `stat_${est.statistic_type.id}`;
          return (
            <button
              key={tabKey}
              onClick={() => setSearchParams({ tab: tabKey })}
              className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
                tabActiva === tabKey ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
              }`}
            >
              {est.statistic_type.display_name}
            </button>
          );
        })}

        <button
          onClick={() => setSearchParams({ tab: 'sanciones' })}
          className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
            tabActiva === 'sanciones' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
          }`}
        >
          Suspendidos / Sanciones
        </button>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Filtros para la Tabla de Posiciones y Partidos */}
        {(tabActiva === 'posiciones' || tabActiva === 'partidos' || tabActiva.startsWith('stat_')) && (
          <div className="bg-[#11131c] border border-slate-900 p-4 rounded-2xl flex flex-wrap gap-4 shadow-xs items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Filtrar Disciplina</label>
              <select
                value={filtroDisc} onChange={(e) => {
                  setFiltroDisc(e.target.value);
                  setFiltroCat('');
                }}
                className="text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg p-2 cursor-pointer outline-hidden block"
              >
                <option value="">Todas las disciplinas</option>
                {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Filtrar Categoría</label>
              <select
                value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}
                className="text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg p-2 cursor-pointer outline-hidden block"
              >
                <option value="">Todas las categorías</option>
                {categorias
                  .filter((c) => !filtroDisc || c.discipline_id === parseInt(filtroDisc))
                  .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
            </div>
            {tabActiva === 'partidos' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Filtrar por Fecha</label>
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg p-2 cursor-pointer outline-hidden block h-[33px] min-w-[130px]"
                />
              </div>
            )}
          </div>
        )}

        {/* Tabla principal */}
        <section className="bg-[#11131c] rounded-2xl border border-slate-900 shadow-xs overflow-hidden">
          
          {cargando ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-450 uppercase tracking-widest font-bold">Cargando datos oficiales...</span>
            </div>
          ) : (
            <>
              {tabActiva === 'posiciones' && (() => {
                const catId = filtroCat ? parseInt(filtroCat) : undefined;
                const catActiva = categorias.find(c => c.id === catId);
                
                if (catActiva?.format === 'grupos') {
                  return (
                    <div className="p-6 space-y-6">
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-900 pb-2">Posiciones por Grupos</h3>
                      {grupos.length === 0 ? (
                        <p className="text-xs text-slate-450 italic text-center py-6">No hay grupos registrados en esta categoría.</p>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {grupos.map((grp) => {
                            const sortedTeams = [...(grp.teams || [])].sort((a, b) => {
                              const ptsDiff = (b.pivot?.points || 0) - (a.pivot?.points || 0);
                              if (ptsDiff !== 0) return ptsDiff;
                              const gdA = (a.pivot?.goals_for || 0) - (a.pivot?.goals_against || 0);
                              const gdB = (b.pivot?.goals_for || 0) - (b.pivot?.goals_against || 0);
                              const gdDiff = gdB - gdA;
                              if (gdDiff !== 0) return gdDiff;
                              return (b.pivot?.goals_for || 0) - (a.pivot?.goals_for || 0);
                            });

                            return (
                              <div key={grp.id} className="bg-[#171a26]/40 border border-slate-900 rounded-2xl p-5 space-y-4">
                                <h4 className="font-black text-xs text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">{grp.name}</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-[#11131c] border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                                        <th className="p-2 text-center w-8 font-extrabold">Pos</th>
                                        <th className="p-2">Equipo</th>
                                        <th className="p-2 text-center">PJ</th>
                                        <th className="p-2 text-center">PG</th>
                                        <th className="p-2 text-center">PE</th>
                                        <th className="p-2 text-center">PP</th>
                                        <th className="p-2 text-center">GF-GC</th>
                                        <th className="p-2 text-center font-extrabold pr-2">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-900">
                                      {sortedTeams.map((team, idx) => {
                                        const gf = team.pivot?.goals_for || 0;
                                        const gc = team.pivot?.goals_against || 0;
                                        const gd = gf - gc;
                                        return (
                                          <tr key={team.id} className="hover:bg-[#171a26]/60 text-slate-300">
                                            <td className="p-2 text-center font-bold text-slate-455">{idx + 1}</td>
                                            <td className="p-2 font-bold text-white">{team.name}</td>
                                            <td className="p-2 text-center">{team.pivot?.matches_played || 0}</td>
                                            <td className="p-2 text-center text-emerald-450">{team.pivot?.wins || 0}</td>
                                            <td className="p-2 text-center text-slate-400">{team.pivot?.draws || 0}</td>
                                            <td className="p-2 text-center text-rose-500">{team.pivot?.losses || 0}</td>
                                            <td className="p-2 text-center text-slate-400">{gf}-{gc} ({gd > 0 ? `+${gd}` : gd})</td>
                                            <td className="p-2 text-center font-extrabold text-indigo-400 pr-2 text-sm">{team.pivot?.points || 0}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (catActiva?.format === 'eliminacion_directa') {
                  const getKnockoutPhases = () => {
                    const order = ['octavos', 'cuartos', 'semifinal', 'final'];
                    const groups: { [key: string]: any[] } = {};
                    fixtureKnockout.forEach(match => {
                      const ph = match.phase || 'final';
                      if (!groups[ph]) groups[ph] = [];
                      groups[ph].push(match);
                    });
                    return order.filter(ph => groups[ph] && groups[ph].length > 0).map(ph => ({
                      name: ph === 'semifinal' ? 'Semifinal' : ph === 'cuartos' ? 'Cuartos de Final' : ph === 'octavos' ? 'Octavos de Final' : 'Gran Final',
                      matches: groups[ph]
                    }));
                  };

                  const phases = getKnockoutPhases();

                  return (
                    <div className="p-6 space-y-6">
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-900 pb-2">Llaves de Eliminación Directa</h3>
                      {phases.length === 0 ? (
                        <p className="text-xs text-slate-455 italic text-center py-6">No hay llaves programadas para esta categoría.</p>
                      ) : (
                        <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
                          {phases.map((phase, pIdx) => (
                            <div key={pIdx} className="flex-1 min-w-[260px] space-y-6 flex flex-col justify-around bg-[#171a26]/20 border border-slate-900 p-4 rounded-2xl">
                              <div className="text-center font-black text-[10px] text-slate-450 bg-[#171a26] border border-slate-850 py-1.5 rounded-lg uppercase tracking-widest">
                                {phase.name}
                              </div>
                              <div className="space-y-4">
                                {phase.matches.map((match) => (
                                  <div
                                    key={match.id}
                                    onClick={() => verDetallesPartido(match)}
                                    className="bg-[#11131c] border border-slate-900 rounded-xl p-3.5 space-y-2.5 shadow-xs hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.02]"
                                  >
                                    <div className="flex justify-between items-center text-xs">
                                      <span className={`font-bold ${match.home_score > match.away_score ? 'text-white' : 'text-slate-450'}`}>
                                        {match.local_team?.name || '—'}
                                      </span>
                                      <span className="font-extrabold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md text-xs">
                                        {match.home_score !== null ? match.home_score : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-slate-905 pt-2">
                                      <span className={`font-bold ${match.away_score > match.home_score ? 'text-white' : 'text-slate-450'}`}>
                                        {match.visitor_team?.name || '—'}
                                      </span>
                                      <span className="font-extrabold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md text-xs">
                                        {match.away_score !== null ? match.away_score : '—'}
                                      </span>
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-bold flex justify-between uppercase">
                                      <span>{match.match_date ? new Date(match.match_date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : '—'}</span>
                                      <span>{match.venue?.name || '—'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Liga / Por defecto (Tabla Grande)
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="p-3.5 pl-6 text-center w-12">Pos</th>
                          <th className="p-3.5">Equipo</th>
                          <th className="p-3.5 text-center">PJ</th>
                          <th className="p-3.5 text-center">PG</th>
                          <th className="p-3.5 text-center">PE</th>
                          <th className="p-3.5 text-center">PP</th>
                          <th className="p-3.5 text-center">GF</th>
                          <th className="p-3.5 text-center">GC</th>
                          <th className="p-3.5 text-center">DG</th>
                          <th className="p-3.5 text-center pr-6">Puntos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-sm">
                        {posiciones.map((pos, idx) => (
                          <tr key={pos.id} className="hover:bg-[#171a26]/40">
                            <td className="p-3.5 pl-6 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-white">{pos.team?.name}</td>
                            <td className="p-3.5 text-center text-slate-300">{pos.matches_played}</td>
                            <td className="p-3.5 text-center text-emerald-450 font-semibold">{pos.matches_won}</td>
                            <td className="p-3.5 text-center text-slate-400">{pos.matches_drawn}</td>
                            <td className="p-3.5 text-center text-rose-500">{pos.matches_lost}</td>
                            <td className="p-3.5 text-center text-slate-300">{pos.goals_for}</td>
                            <td className="p-3.5 text-center text-slate-300">{pos.goals_against}</td>
                            <td className="p-3.5 text-center text-white font-bold">{pos.goal_difference > 0 ? `+${pos.goal_difference}` : pos.goal_difference}</td>
                            <td className="p-3.5 text-center font-extrabold text-indigo-400 text-base pr-6">{pos.total_points}</td>
                          </tr>
                        ))}
                        {posiciones.length === 0 && (
                          <tr>
                            <td colSpan={10} className="p-10 text-center text-slate-450 text-xs">No hay posiciones registradas para estos filtros.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Pestaña: Calendario de Partidos */}
              {tabActiva === 'partidos' && (() => {
                const partidosFiltrados = todosLosPartidos.filter(partido => {
                  if (filtroDisc && partido.discipline_id !== parseInt(filtroDisc)) return false;
                  if (filtroCat && partido.category_id !== parseInt(filtroCat)) return false;
                  if (filtroFecha && partido.match_date !== filtroFecha) return false;
                  return true;
                });

                return (
                  <div className="space-y-4 p-6">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <h3 className="font-black text-xs uppercase tracking-widest text-slate-450">Calendario Oficial de Encuentros</h3>
                      {filtroFecha && (
                        <button
                          onClick={() => setFiltroFecha('')}
                          className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer bg-transparent border-0 outline-hidden"
                        >
                          Ver todas las fechas
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                      {partidosFiltrados.map((match) => (
                        <div
                          key={match.id}
                          onClick={() => verDetallesPartido(match)}
                          className="bg-[#171a26]/40 border border-slate-900 rounded-2xl p-5 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                              <span className="px-2 py-0.5 rounded-sm bg-[#11131c] border border-slate-850 text-slate-450 text-[8px] font-black uppercase tracking-wider">
                                {match.category?.name || 'Categoría'}
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase">
                                {match.match_date ? new Date(match.match_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300">{match.local_team?.name || 'Local'}</span>
                                <span className="font-extrabold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 border border-indigo-500/10 rounded text-xs">
                                  {match.home_score !== null ? match.home_score : '—'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-300">{match.visitor_team?.name || 'Visitante'}</span>
                                <span className="font-extrabold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 border border-indigo-500/10 rounded text-xs">
                                  {match.away_score !== null ? match.away_score : '—'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-905 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {match.venue?.name || '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {match.match_time || '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {partidosFiltrados.length === 0 && (
                        <div className="md:col-span-2 lg:col-span-3 p-12 text-center text-slate-500 bg-[#171a26]/10 border border-slate-900 rounded-2xl">
                          <span className="material-symbols-outlined text-3xl mb-2 text-slate-605 block">calendar_today</span>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">No hay partidos programados</p>
                          <p className="text-[10px] text-slate-500 mt-1">Intenta seleccionar otros filtros o fechas.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {tabActiva.startsWith('stat_') && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3.5 pl-6 text-center w-12">Pos</th>
                        <th className="p-3.5">Jugador</th>
                        <th className="p-3.5">Equipo</th>
                        <th className="p-3.5 text-center pr-6">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {dynamicRankings.map((r, idx) => (
                        <tr key={idx} className="hover:bg-[#171a26]/40">
                          <td className="p-3.5 pl-6 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-white">{r.player_name}</td>
                          <td className="p-3.5 text-slate-305">{r.team || '—'}</td>
                          <td className="p-3.5 text-center font-extrabold text-indigo-400 text-base pr-6">{r.value}</td>
                        </tr>
                      ))}
                      {dynamicRankings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-10 text-center text-slate-450 text-xs">No hay estadísticas registradas para esta disciplina.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tabActiva === 'sanciones' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3.5 pl-6">Jugador</th>
                        <th className="p-3">Equipo</th>
                        <th className="p-3">Motivo / Causa de la Sanción</th>
                        <th className="p-3">Fecha Inicio</th>
                        <th className="p-3">Duración</th>
                        <th className="p-3 pr-6 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {sanciones.map((s) => (
                        <tr key={s.id} className="hover:bg-[#171a26]/40">
                          <td className="p-3.5 pl-6 font-bold text-white">{s.player?.name}</td>
                          <td className="p-3 text-slate-305">{s.player?.team?.name}</td>
                          <td className="p-3 text-slate-400 text-xs">{s.reason}</td>
                          <td className="p-3 text-slate-450 text-xs">{new Date(s.start_date).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-300 font-semibold">{s.duration} {s.duration === 1 ? 'partido' : 'partidos'}</td>
                          <td className="p-3 pr-6 text-right">
                            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-455 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {sanciones.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-slate-450 text-xs">No hay sanciones activas en este momento.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </section>

      </main>

      {/* Modal de Detalles del Partido */}
      {mostrarDetallesPart && matchSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#11131c] border border-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">sports_soccer</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">Detalles del Partido</h3>
              </div>
              <button
                onClick={() => setMostrarDetallesPart(false)}
                className="w-7 h-7 rounded-lg border border-slate-800 text-slate-400 hover:bg-[#171a26] hover:text-white transition-all flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Marcador grande */}
            <div className="bg-gradient-to-b from-[#171a26] to-[#11131c] p-6 border-b border-slate-900 text-center space-y-4">
              <div className="flex items-center justify-center gap-6">
                {/* Local */}
                <div className="flex-1 text-right">
                  <p className="font-black text-xs text-white md:text-sm">{matchSeleccionado.local_team?.name || 'Local'}</p>
                </div>
                {/* Score */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-lg md:text-xl font-black text-indigo-400 shadow-xs">
                    {matchSeleccionado.home_score !== null ? matchSeleccionado.home_score : '—'}
                  </span>
                  <span className="text-slate-500 font-black text-xs uppercase tracking-widest">VS</span>
                  <span className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-lg md:text-xl font-black text-indigo-400 shadow-xs">
                    {matchSeleccionado.away_score !== null ? matchSeleccionado.away_score : '—'}
                  </span>
                </div>
                {/* Visitante */}
                <div className="flex-1 text-left">
                  <p className="font-black text-xs text-white md:text-sm">{matchSeleccionado.visitor_team?.name || 'Visitante'}</p>
                </div>
              </div>
              
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider space-y-1">
                <p>Cancha: {matchSeleccionado.venue?.name || '—'} | Hora: {matchSeleccionado.match_time || '—'}</p>
                <p className="text-indigo-400">Estado: {matchSeleccionado.status}</p>
              </div>
            </div>

            {/* Incidencias del partido */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cargandoReporte ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-450 font-bold uppercase tracking-widest">Cargando incidencias oficiales...</span>
                </div>
              ) : (
                <>
                  {/* Cronología */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase text-slate-450 border-b border-slate-905 pb-1">Cronología del Partido</h4>
                    
                    {matchIncidences.length === 0 ? (
                      <p className="text-xs text-slate-450 italic text-center py-6">No se registraron incidencias (goles o tarjetas) en la planilla oficial de este encuentro.</p>
                    ) : (
                      <div className="space-y-2">
                        {matchIncidences
                          .sort((a, b) => a.minute - b.minute)
                          .map((inc) => {
                            const isLocal = inc.team_id === matchSeleccionado.home_team_id;
                            
                            let icon = 'sports_soccer';
                            let iconColor = 'text-white';
                            let label = 'GOL';
                            if (inc.incidence_type === 'yellow_card') {
                              icon = 'style';
                              iconColor = 'text-amber-400';
                              label = 'Tarjeta Amarilla';
                            } else if (inc.incidence_type === 'red_card') {
                              icon = 'style';
                              iconColor = 'text-rose-500';
                              label = 'Tarjeta Roja';
                            } else if (inc.incidence_type === 'foul') {
                              icon = 'warning';
                              iconColor = 'text-amber-500';
                              label = 'Falta';
                            } else if (inc.incidence_type === 'injury') {
                              icon = 'medical_services';
                              iconColor = 'text-[#e55]';
                              label = 'Lesión';
                            }

                            return (
                              <div
                                key={inc.id}
                                className={`flex items-center gap-3 p-3 bg-[#171a26]/40 border border-slate-900 rounded-xl ${
                                  isLocal ? 'border-l-indigo-500/30' : 'border-r-indigo-500/30 flex-row-reverse text-right'
                                }`}
                              >
                                <div className="text-[9px] font-black text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-sm shrink-0">
                                  {inc.minute}'
                                </div>
                                <span className={`material-symbols-outlined text-xs ${iconColor} shrink-0`}>
                                  {icon}
                                </span>
                                <div className="flex-1 text-xs">
                                  <p className="font-bold text-slate-200">{inc.player?.name || 'Jugador'}</p>
                                  <p className="text-[9px] text-slate-455 font-bold uppercase">{label} • {isLocal ? 'Local' : 'Visitante'}</p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Observaciones */}
                  {matchReport && matchReport.observations && (
                    <div className="bg-[#171a26]/40 border border-slate-900 rounded-xl p-4 space-y-2 mt-4">
                      <h4 className="font-bold text-xs uppercase text-slate-455">Observaciones del Árbitro</h4>
                      <p className="text-xs text-slate-350 italic font-medium leading-relaxed">
                        "{matchReport.observations}"
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-900 text-center bg-[#171a26]/20">
              <button
                onClick={() => setMostrarDetallesPart(false)}
                className="w-full bg-[#171a26] hover:bg-[#1c1f2e] border border-slate-850 text-slate-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all"
              >
                Cerrar Detalles
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );

  if (usuario) {
    return (
      <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
        <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />
        <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
          {contenidoInterno}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans flex flex-col">
      {contenidoInterno}
    </div>
  );
};
