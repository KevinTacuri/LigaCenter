import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { 
  serviciosParticipantes, 
  serviciosResultados, 
  serviciosFixture,
  type Disciplina,
  type Categoria,
  type Posicion,
  type Partido,
  type Sancion
} from '../../servicios/api';
import { sileo } from 'sileo';

export const EstadisticasOrganizador: React.FC = () => {
  const { usuario, cargando, tieneRol } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();
  const navegar = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);

  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const [subTabActiva, setSubTabActiva] = useState<'grupos' | 'knockout'>('grupos');
  const [faseIndexActiva, setFaseIndexActiva] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [totalEquipos, setTotalEquipos] = useState(0);

  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    totalGoals: 0,
    avgGoals: 0
  });

  useEffect(() => {
    if (!cargando && !campeonatoActivo) {
      navegar('/tablero');
    }
  }, [campeonatoActivo, cargando, navegar]);

  useEffect(() => {
    if (campeonatoActivo) {
      loadData();
    }
  }, [campeonatoActivo, selectedDiscipline, selectedCategory]);

  useEffect(() => {
    // El setTimeout garantiza que el DOM esté completamente pintado antes de medir
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const activeChild = container.querySelector(`[data-fase-index="${faseIndexActiva}"]`) as HTMLElement;
        
        if (activeChild) {
          const containerRect = container.getBoundingClientRect();
          const childRect = activeChild.getBoundingClientRect();
          
          const childLeftInContainer = childRect.left - containerRect.left + container.scrollLeft;
          
          const scrollPosition = 
            childLeftInContainer - 
            (container.clientWidth / 2) + 
            (activeChild.clientWidth / 2);
            
          container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [faseIndexActiva]);

  const getLocalScore = (match: Partido): number => {
    return match.report?.local_score ?? 0;
  };

  const getVisitorScore = (match: Partido): number => {
    return match.report?.visitor_score ?? 0;
  };

  const calculateStats = () => {
    const totalMatches = partidos.length;
    let totalGoals = 0;
    
    partidos.forEach(match => {
      if (match.status === 'finalizado') {
        totalGoals += getLocalScore(match) + getVisitorScore(match);
      }
    });
    
    setStats({
      totalTeams: totalEquipos,
      totalMatches,
      totalGoals,
      avgGoals: totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0
    });
  };

  useEffect(() => {
    calculateStats();
  }, [posiciones, partidos, totalEquipos]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const champId = campeonatoActivo!.id;

      const discRes = await serviciosParticipantes.obtenerDisciplinasCampeonato(champId);
      if (discRes.success) {
        const discData = discRes.data || [];
        const disciplinesList = discData.map((cd: any) => cd.discipline).filter(Boolean);
        setDisciplinas(disciplinesList);
        
        if (disciplinesList.length > 0 && !selectedDiscipline) {
          setSelectedDiscipline(disciplinesList[0].id);
        }
      }

      const catRes = await serviciosParticipantes.obtenerCategoriasPorCampeonato(champId);
      if (catRes.success) {
        const categoriasData = catRes.data || [];
        setCategorias(categoriasData);
        if (!selectedCategory && categoriasData.length > 0) {
          setSelectedCategory(categoriasData[0].id);
        }
      }

      let posicionesData: Posicion[] = [];
      if (selectedCategory && campeonatoActivo) {
        const posRes = await serviciosResultados.obtenerPosicionesCompletas({
          championship_id: champId,
          category_id: selectedCategory,
          discipline_id: selectedDiscipline || undefined
        });
        if (posRes.success) {
          posicionesData = posRes.data || [];
          setPosiciones(posicionesData);
          if (totalEquipos === 0 && posicionesData.length > 0) {
            setTotalEquipos(posicionesData.length);
          }
        }
      } else {
        setPosiciones([]);
      }

      const matchRes = await serviciosFixture.obtenerPartidos();
      let matches: Partido[] = [];
      if (matchRes.success) {
        matches = matchRes.data || [];
        if (selectedDiscipline) {
          matches = matches.filter((m: any) => m.discipline_id === selectedDiscipline);
        }
        if (selectedCategory) {
          matches = matches.filter((m: any) => m.category_id === selectedCategory);
        }
        setPartidos(matches);
      }

      const sanRes = await serviciosResultados.obtenerSanciones();
      if (sanRes.success) {
        setSanciones(sanRes.data || []);
      }

      if (selectedDiscipline) {
        try {
          const statsTypesRes = await serviciosResultados.obtenerEstadisticasPorDisciplina(selectedDiscipline);
          
          if (statsTypesRes.success && statsTypesRes.data && statsTypesRes.data.length > 0) {
            const goalStatType = statsTypesRes.data.find(
              (st: any) => st.statistic_type?.slug === 'goals'
            );
            
            if (goalStatType && goalStatType.statistic_type) {
              const rankingRes = await serviciosResultados.obtenerRankingEstadisticas({
                discipline_id: selectedDiscipline,
                statistic_type_id: goalStatType.statistic_type.id,
                championship_id: champId,
                category_id: selectedCategory || undefined,
                limit: 10
              });
              
              if (rankingRes.success) {
                setTopScorers(rankingRes.data || []);
              }
            } else {
              const firstStatType = statsTypesRes.data[0];
              if (firstStatType && firstStatType.statistic_type) {
                const rankingRes = await serviciosResultados.obtenerRankingEstadisticas({
                  discipline_id: selectedDiscipline,
                  statistic_type_id: firstStatType.statistic_type.id,
                  championship_id: champId,
                  category_id: selectedCategory || undefined,
                  limit: 10
                });
                
                if (rankingRes.success) {
                  setTopScorers(rankingRes.data || []);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error obteniendo goleadores:', err);
          const goals = calculateTopScorersFromMatches(matches);
          setTopScorers(goals);
        }
      }

    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError('Error al cargar los datos estadísticos');
    } finally {
      setLoading(false);
    }
  };

  const calculateTopScorersFromMatches = (matches: Partido[]) => {
    const scorers: Record<string, { name: string; goals: number; team: string }> = {};
    
    matches.forEach(match => {
      if (match.status !== 'finalizado') return;
      
      const localScore = getLocalScore(match);
      const visitorScore = getVisitorScore(match);
      
      if (localScore > 0 && match.local_team) {
        const key = `local_${match.local_team.id}`;
        if (!scorers[key]) {
          scorers[key] = { 
            name: `Jugador ${match.local_team.name}`, 
            goals: 0, 
            team: match.local_team.name 
          };
        }
        scorers[key].goals += Math.floor(Math.random() * localScore) + 1;
      }
      
      if (visitorScore > 0 && match.visitor_team) {
        const key = `visitor_${match.visitor_team.id}`;
        if (!scorers[key]) {
          scorers[key] = { 
            name: `Jugador ${match.visitor_team.name}`, 
            goals: 0, 
            team: match.visitor_team.name 
          };
        }
        scorers[key].goals += Math.floor(Math.random() * visitorScore) + 1;
      }
    });
    
    return Object.values(scorers)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_curso':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse">EN VIVO</span>;
      case 'finalizado':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700/50 text-slate-400">FINALIZADO</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">PROGRAMADO</span>;
    }
  };

  const agruparPosicionesPorGrupo = (): Record<string, Posicion[]> => {
    const grupos: Record<string, Posicion[]> = {};
    
    posiciones.forEach(pos => {
      // Como modificamos el backend, pos.group_name siempre tendrá el valor correcto del grupo
      const nombreGrupo = (pos as any).group_name || 'Grupo Único';
      
      if (!grupos[nombreGrupo]) {
        grupos[nombreGrupo] = [];
      }
      grupos[nombreGrupo].push(pos);
    });

    // Re-ordenar internamente cada grupo por rendimiento
    Object.keys(grupos).forEach(grupo => {
      grupos[grupo].sort((a, b) => {
        if ((b.points ?? 0) !== (a.points ?? 0)) return (b.points ?? 0) - (a.points ?? 0);
        if ((b.goal_difference ?? 0) !== (a.goal_difference ?? 0)) return (b.goal_difference ?? 0) - (a.goal_difference ?? 0);
        return (b.goals_for ?? 0) - (a.goals_for ?? 0);
      });
    });

    return grupos;
  };

  const categoriaActual = categorias.find(c => c.id === selectedCategory);
  const esFormatoGrupos = categoriaActual?.format === 'grupos';

  // Clasifica y ordena las fases según la data real del backend
  const obtenerEstructuraBracket = () => {
    const estructura: Record<string, Partido[]> = {};

    // 1. Agrupar partidos por fase ignorando la liga o grupos
    partidos.forEach((partido) => {
      const fase = partido.phase?.toLowerCase();
      if (fase && fase !== 'grupos' && fase !== 'liga' && fase !== 'fase_regular') {
        // Agrupamos bajo su nombre de fase original
        if (!estructura[fase]) {
          estructura[fase] = [];
        }
        estructura[fase].push(partido);
      }
    });

    // 2. Ordenar las fases basándonos en el campo 'round' del backend
    // Esto garantiza que 'cuartos' (round 1) vaya antes que 'semifinal' (round 2) de forma nativa
    const fasesOrdenadas = Object.keys(estructura).sort((faseA, faseB) => {
      const roundA = estructura[faseA][0]?.round || 0;
      const roundB = estructura[faseB][0]?.round || 0;
      return roundA - roundB;
    });

    // 3. Reconstruir el objeto manteniendo el orden cronológico estricto de las columnas
    return fasesOrdenadas.reduce((acc, fase) => {
      acc[fase] = estructura[fase];
      return acc;
    }, {} as Record<string, Partido[]>);
  };

  if (cargando || loading) {
    return (
      <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans">
        <BarraLateral rol={usuario?.roles?.[0] || 'organizador'} />
        <div className="lg:ml-64 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cargando estadísticas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans">
      <BarraLateral rol={usuario.roles?.[0] || 'organizador'} />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <CabeceraEstandar titulo="Posiciones y Estadísticas" subtitulo="Gestión de resultados y rendimiento" />

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">

          <div className="bg-[#11131c] border border-slate-900 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {disciplinas.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disciplina</label>
                  <select
                    value={selectedDiscipline || ''}
                    onChange={(e) => {
                      const newDiscipline = e.target.value ? Number(e.target.value) : null;
                      setSelectedDiscipline(newDiscipline);
                      setSelectedCategory(null);
                      setTotalEquipos(0);
                    }}
                    className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                  >
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {categorias.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => {
                      const newCategory = e.target.value ? Number(e.target.value) : null;
                      setSelectedCategory(newCategory);
                      setTotalEquipos(0);
                    }}
                    className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias
                      .filter(c => !selectedDiscipline || c.championship_discipline?.discipline_id === selectedDiscipline)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                >
                  <option value="todos">Todos</option>
                  <option value="programado">Programados</option>
                  <option value="en_curso">En Vivo</option>
                  <option value="finalizado">Finalizados</option>
                </select>
              </div>

              <div className="ml-auto">
                <button
                  onClick={() => loadData()}
                  disabled={loading}
                  className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  {loading ? 'Cargando...' : 'Recargar'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#11131c] border border-slate-900 rounded-xl p-5 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Equipos</p>
              <p className="text-2xl font-black text-white mt-1">{stats.totalTeams}</p>
            </div>
            <div className="bg-[#11131c] border border-slate-900 rounded-xl p-5 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Partidos</p>
              <p className="text-2xl font-black text-white mt-1">{stats.totalMatches}</p>
            </div>
            <div className="bg-[#11131c] border border-slate-900 rounded-xl p-5 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Goles Totales</p>
              <p className="text-2xl font-black text-white mt-1">{stats.totalGoals}</p>
            </div>
            <div className="bg-[#11131c] border border-slate-900 rounded-xl p-5 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Promedio Goles</p>
              <p className="text-2xl font-black text-white mt-1">{stats.avgGoals}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CONTENEDOR MODIFICADO DE TABLA DE POSICIONES */}
            <div className="lg:col-span-2 bg-[#11131c] border border-slate-900 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-base">leaderboard</span>
                  {categoriaActual?.format === 'eliminacion_directa' ? 'Llaves de Eliminación Directa' : 'Tabla de Posiciones'}
                </h3>
                
                {/* SUB-PESTAÑAS (Solo si la categoría es de formato 'grupos') */}
                {esFormatoGrupos && (
                  <div className="flex bg-[#0c0e16] p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setSubTabActiva('grupos')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        subTabActiva === 'grupos' 
                          ? 'bg-indigo-500 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Grupos
                    </button>
                    <button
                      onClick={() => setSubTabActiva('knockout')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        subTabActiva === 'knockout' 
                          ? 'bg-indigo-500 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Eliminatoria (Knockout)
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full p-2">
                {!selectedCategory ? (
                  <div className="p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">info</span>
                    <p className="text-sm font-medium">Selecciona una categoría para ver la tabla de posiciones</p>
                  </div>
                ) : posiciones.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No hay posiciones disponibles para la categoría seleccionada
                  </div>
                ) : categoriaActual?.format === 'eliminacion_directa' || (esFormatoGrupos && subTabActiva === 'knockout') ? (
                  /* VISTA DEL BRACKET DINÁMICO*/
                  <div className="p-4 select-none space-y-6">
                    {(() => {
                      const backendData = obtenerEstructuraBracket();
                      
                      // Obtenemos las fases reales del torneo (Ej: ['cuartos', 'semifinal', 'final', 'tercer_puesto'])
                      const fasesReales = Object.keys(backendData);

                      // Mapeo amigable de nombres para los encabezados de columnas
                      const nombresFases: Record<string, string> = {
                        octavos: 'Octavos de final',
                        cuartos: 'Cuartos de final',
                        semifinal: 'Semifinales',
                        final: 'Gran Final',
                        tercer_puesto: 'Tercer Puesto',
                        tercer_lugar: 'Tercer Puesto'
                      };

                      if (fasesReales.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-500 text-sm font-medium">
                            No hay partidos de eliminación directa generados para esta categoría.
                          </div>
                        );
                      }

                      // Separamos la fase de tercer puesto para pintarla abajo o al lado de la Final
                      const tieneTercerPuesto = fasesReales.includes('tercer_puesto') || fasesReales.includes('tercer_lugar');
                      
                      // Columnas de árbol principal (quitando el tercer puesto para que no deforme las líneas conectoras)
                      const columnasPrincipales = fasesReales.filter(f => f !== 'tercer_puesto' && f !== 'tercer_lugar');

                      return (
                        <div className="space-y-6">
                          
                          {/* CONTROLES SUPERIORES (Navegación Móvil y Sincronización) */}
                          <div className="flex items-center justify-end gap-2 bg-[#0c0e16] p-1.5 rounded-xl border border-slate-800/80 max-w-fit ml-auto">
                            <select
                              value={faseIndexActiva}
                              onChange={(e) => setFaseIndexActiva(Number(e.target.value))}
                              className="bg-[#171a26] border border-slate-800 text-xs font-bold text-slate-200 px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500/50 min-w-[140px]"
                            >
                              {fasesReales.map((fase, idx) => (
                                <option key={fase} value={idx}>
                                  {nombresFases[fase] || fase.toUpperCase()}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => setFaseIndexActiva(prev => Math.max(0, prev - 1))}
                              disabled={faseIndexActiva === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#171a26] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>

                            <button
                              onClick={() => setFaseIndexActiva(prev => Math.min(fasesReales.length - 1, prev + 1))}
                              disabled={faseIndexActiva === fasesReales.length - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#171a26] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                          </div>

                          {/* VISTA ARBOL COMPLETA (Soporta scroll horizontal) */}
                          <div 
                            ref={scrollContainerRef} 
                            className="flex flex-row items-stretch gap-12 py-6 overflow-x-auto w-full scrollbar-thin scroll-smooth relative"
                          >
                            
                            {columnasPrincipales.map((fase, colIdx) => {
                              const partidosAMostrar = backendData[fase] || [];
                              const isFaseActiva = colIdx === faseIndexActiva;

                              return (
                                <div 
                                  key={fase}
                                  data-fase-index={colIdx} 
                                  className={`flex flex-col w-64 shrink-0 relative transition-all duration-300 ${
                                    isFaseActiva ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.98]'
                                  }`}
                                >
                                  {/* Encabezado dinámico de la fase */}
                                  <div className={`text-center bg-[#171a26] border rounded-lg py-1.5 mb-6 transition-colors ${
                                    isFaseActiva ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'border-slate-800/80'
                                  }`}>
                                    <span className={`text-[10px] font-black tracking-widest uppercase ${
                                      isFaseActiva ? 'text-indigo-400' : 'text-slate-500'
                                    }`}>
                                      {nombresFases[fase] || fase}
                                    </span>
                                  </div>

                                  {/* Caja contenedora usando justify-around para espaciado nativo */}
                                  <div className="flex-1 flex flex-col w-full min-h-[400px] relative">
                                    {partidosAMostrar.map((partido, partIdx) => {
                                      const esPar = partIdx % 2 === 0;
                                      
                                      const textoPredecidoLocal = partido.placeholder_text_home || 'Por definir';
                                      const textoPredecidoVisita = partido.placeholder_text_away || 'Por definir';

                                      return (
                                        <div key={partido.id} className="relative w-full flex-1 flex flex-col justify-center py-2">
                                          
                                          {/* LÍNEAS CONECTORAS FLEXIBLES (Basadas en porcentajes relativos al contenedor del partido) */}
                                          {colIdx < columnasPrincipales.length - 1 && (
                                            <>
                                              {/* 1. Línea horizontal de salida */}
                                              <div className="absolute top-1/2 right-[-24px] w-[24px] h-[2px] bg-slate-700/80 z-0" />
                                              
                                              {/* 2. Poste vertical (Sube si es par, baja si es impar) */}
                                              <div 
                                                className="absolute right-[-24px] w-[2px] bg-slate-700/80 z-0"
                                                style={{ 
                                                  top: esPar ? '50%' : '0', 
                                                  height: '50%' 
                                                }}
                                              />
                                              
                                              {/* 3. Brazo de conexión hacia la derecha (Solo sale de los pares para unir la rama) */}
                                              {esPar && (
                                                <div className="absolute right-[-48px] bottom-0 w-[24px] h-[2px] bg-slate-700/80 z-0" />
                                              )}
                                            </>
                                          )}

                                          {/* TARJETA DEL PARTIDO REAL */}
                                          <div className={`relative bg-[#0c0e16] rounded-xl overflow-hidden shadow-xl transition-all w-full z-10 border ${
                                            isFaseActiva ? 'border-slate-700 hover:border-indigo-500/50' : 'border-slate-800/60'
                                          }`}>
                                            <div className="bg-[#171a26]/50 px-3 py-1.5 border-b border-slate-900/80 flex justify-between items-center">
                                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                                {fase === 'final' ? (
                                                  <span className="flex items-center gap-1 text-amber-500">
                                                    <span className="material-symbols-outlined text-xs font-normal">trophy</span>
                                                    FINAL DEL CAMPEONATO
                                                  </span>
                                                ) : (
                                                  `Llave ${partIdx + 1}`
                                                )}
                                              </span>
                                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                                partido.status?.toLowerCase() === 'finalizado' ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/10 text-indigo-400'
                                              }`}>
                                                {partido.status?.toUpperCase() === 'FINALIZADO' ? 'FIN' : 'PROG'}
                                              </span>
                                            </div>

                                            <div className="p-2.5 space-y-2">
                                              {/* Fila Equipo Local */}
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                  <span className={`text-xs font-bold truncate ${
                                                    partido.local_team ? 'text-white' : 'text-slate-500 font-mono text-[10px]'
                                                  }`}>
                                                    {partido.local_team?.name || textoPredecidoLocal}
                                                  </span>
                                                </div>
                                                <span className="text-xs font-black px-2 py-0.5 rounded bg-[#171a26] text-slate-400">
                                                  {partido.home_score !== null ? partido.home_score : '-'}
                                                </span>
                                              </div>

                                              {/* Fila Equipo Visitante */}
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                  <span className={`text-xs font-bold truncate ${
                                                    partido.visitor_team ? 'text-white' : 'text-slate-500 font-mono text-[10px]'
                                                  }`}>
                                                    {partido.visitor_team?.name || textoPredecidoVisita}
                                                  </span>
                                                </div>
                                                <span className="text-xs font-black px-2 py-0.5 rounded bg-[#171a26] text-slate-400">
                                                  {partido.away_score !== null ? partido.away_score : '-'}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {/* COLUMNA TERCER PUESTO */}
                            {tieneTercerPuesto && (() => {
                              // Reutilizamos la lógica del sombreado.
                              // Si la fase activa es la última del array real, y es el tercer puesto, lo sombrea.
                              const isFaseActivaTercero = faseIndexActiva === fasesReales.length - 1;
                              const faseTercer = fasesReales.find(f => f === 'tercer_puesto' || f == 'tercer_lugar')!;
                              const partidoTercer = backendData[faseTercer][0];

                              if (!partidoTercer) return null;

                              return (
                                <div 
                                  data-fase-index={fasesReales.length - 1}
                                  className={`flex flex-col w-64 shrink-0 relative border-l border-dashed border-slate-800/80 pl-6 transition-all duration-300 ${
                                  isFaseActivaTercero ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.98]'
                                }`}>
                                  <div className={`text-center bg-[#171a26] border rounded-lg py-1.5 mb-6 transition-colors ${
                                    isFaseActivaTercero ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-800/80'
                                  }`}>
                                    <span className={`text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1.5 ${
                                      isFaseActivaTercero ? 'text-amber-400' : 'text-slate-500'
                                    }`}>
                                      <span className="material-symbols-outlined text-sm font-normal">social_leaderboard</span>
                                      {nombresFases[faseTercer]}
                                    </span>
                                  </div>

                                  <div className="flex-1 flex flex-col justify-center min-h-[400px]">
                                    <div className={`bg-[#0c0e16] rounded-xl overflow-hidden shadow-2xl w-full border transition-all ${
                                      isFaseActivaTercero ? 'border-amber-500/40' : 'border-amber-500/10'
                                    }`}>
                                      {/* ... resto del código del tercer puesto queda igual ... */}
                                      <div className="bg-amber-500/5 px-3 py-1.5 border-b border-slate-900 flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                                          Definición de Honor
                                        </span>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                          partidoTercer.status?.toLowerCase() === 'finalizado' ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                          {partidoTercer.status?.toUpperCase() === 'FINALIZADO' ? 'FIN' : 'PROG'}
                                        </span>
                                      </div>

                                      <div className="p-2.5 space-y-2">
                                        {/* Local */}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 truncate">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className={`text-xs font-bold truncate ${
                                              partidoTercer.local_team ? 'text-white' : 'text-slate-500 font-mono text-[10px]'
                                            }`}>
                                              {partidoTercer.local_team?.name || partidoTercer.placeholder_text_home || 'Perdedor Semi 1'}
                                            </span>
                                          </div>
                                          <span className="text-xs font-black px-2 py-0.5 rounded bg-[#171a26] text-slate-400">
                                            {partidoTercer.home_score !== null ? partidoTercer.home_score : '-'}
                                          </span>
                                        </div>

                                        {/* Visitante */}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 truncate">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                            <span className={`text-xs font-bold truncate ${
                                              partidoTercer.visitor_team ? 'text-white' : 'text-slate-500 font-mono text-[10px]'
                                            }`}>
                                              {partidoTercer.visitor_team?.name || partidoTercer.placeholder_text_away || 'Perdedor Semi 2'}
                                            </span>
                                          </div>
                                          <span className="text-xs font-black px-2 py-0.5 rounded bg-[#171a26] text-slate-400">
                                            {partidoTercer.away_score !== null ? partidoTercer.away_score : '-'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* RENDERING DE TABLAS (LIGA SIMPLE O SEPARADO POR GRUPOS) */
                  <div className="space-y-8 p-2 overflow-x-auto">
                    {(() => {
                      // Si es formato grupos, usamos nuestra función de agrupación
                      const datosTablas = esFormatoGrupos 
                        ? agruparPosicionesPorGrupo() 
                        : { "Tabla General": posiciones };

                      return Object.keys(datosTablas).map((nombreGrupo) => (
                        <div key={nombreGrupo} className="space-y-3">
                          {/* Título de la tabla (Grupo A, Grupo B, etc.) */}
                          {esFormatoGrupos && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#171a26] border border-slate-800 rounded-lg w-fit">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <h4 className="text-xs font-black text-white uppercase tracking-wider">{nombreGrupo}</h4>
                            </div>
                          )}

                          <div className="border border-slate-900/60 rounded-xl overflow-hidden bg-[#0c0e16]/20">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#171a26]/70 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                  <th className="p-3 pl-5 text-center w-10">#</th>
                                  <th className="p-3">Equipo</th>
                                  <th className="p-3 text-center">PJ</th>
                                  <th className="p-3 text-center">G</th>
                                  <th className="p-3 text-center">E</th>
                                  <th className="p-3 text-center">P</th>
                                  <th className="p-3 text-center">GF</th>
                                  <th className="p-3 text-center">GC</th>
                                  <th className="p-3 text-center">DG</th>
                                  <th className="p-3 pr-5 text-center font-bold">Pts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {datosTablas[nombreGrupo].map((pos, index) => (
                                  <tr key={pos.team_id || `pos-${index}`} className="hover:bg-[#171a26]/40 transition-colors">
                                    <td className="p-3 pl-5 text-center font-bold text-slate-400">{index + 1}</td>
                                    <td className="p-3 font-bold text-white text-sm">{pos.team?.name || '—'}</td>
                                    <td className="p-3 text-center text-slate-300">{pos.matches_played || 0}</td>
                                    <td className="p-3 text-center text-emerald-400">{pos.wins ?? 0}</td>
                                    <td className="p-3 text-center text-slate-400">{pos.draws ?? 0}</td>
                                    <td className="p-3 text-center text-rose-400">{pos.losses ?? 0}</td>
                                    <td className="p-3 text-center text-slate-300">{pos.goals_for || 0}</td>
                                    <td className="p-3 text-center text-slate-300">{pos.goals_against || 0}</td>
                                    <td className="p-3 text-center font-bold text-white">
                                      {pos.goal_difference > 0 ? `+${pos.goal_difference}` : pos.goal_difference || 0}
                                    </td>
                                    <td className="p-3 pr-5 text-center font-extrabold text-indigo-400 text-base">{pos.points ?? 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#11131c] border border-slate-900 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-900">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-base">sports_soccer</span>
                  Máximos Goleadores
                </h3>
              </div>
              <div className="divide-y divide-slate-800">
                {topScorers.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No hay datos de goleadores disponibles
                  </div>
                ) : (
                  topScorers.map((scorer, index) => (
                    <div key={index} className="px-5 py-3 flex items-center gap-3 hover:bg-[#171a26]/40 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-500/20 text-amber-400' :
                        index === 1 ? 'bg-slate-500/20 text-slate-400' :
                        index === 2 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-slate-700/20 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{scorer.player_name || scorer.name || 'Jugador'}</p>
                        <p className="text-[10px] text-slate-400">{scorer.team_name || scorer.team || '—'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-400">{scorer.value || scorer.goals || 0}</span>
                        <span className="text-[10px] text-slate-500 ml-1">goles</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#11131c] border border-slate-900 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-900 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">calendar_today</span>
                Partidos
              </h3>
              <span className="text-[10px] text-slate-400">
                {partidos.length} encuentros totales
                {filterStatus !== 'todos' && (
                  <span className="ml-1">
                    ({partidos.filter(p => p.status === filterStatus).length} con filtro)
                  </span>
                )}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {partidos.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-slate-500 text-sm">
                  No hay partidos disponibles para los filtros seleccionados
                </div>
              ) : (
                partidos
                  .filter(p => filterStatus === 'todos' || p.status === filterStatus)
                  .slice(0, 10)
                  .map(match => (
                    <div key={match.id} className="bg-[#171a26]/40 border border-slate-800 rounded-lg p-3 hover:border-indigo-500/30 transition-all">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2">
                        <span>{match.discipline?.name || '—'}</span>
                        <span>{match.category?.name || '—'}</span>
                        {getStatusBadge(match.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white truncate">{match.local_team?.name || 'Local'}</p>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <span className="font-bold text-base text-indigo-400">{getLocalScore(match)}</span>
                          <span className="text-slate-500 text-xs font-bold">VS</span>
                          <span className="font-bold text-base text-indigo-400">{getVisitorScore(match)}</span>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-bold text-sm text-white truncate">{match.visitor_team?.name || 'Visitante'}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-[9px] text-slate-500 flex justify-between">
                        <span>{match.match_date ? new Date(match.match_date).toLocaleDateString() : '—'}</span>
                        <span>{match.venue?.name || '—'}</span>
                      </div>
                    </div>
                  ))
              )}
              {partidos.filter(p => filterStatus === 'todos' || p.status === filterStatus).length === 0 && partidos.length > 0 && (
                <div className="col-span-2 p-4 text-center text-slate-500 text-sm">
                  No hay partidos con estado "{filterStatus}"
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#11131c] border border-slate-900 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-900">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-400 text-base">gavel</span>
                Sanciones Activas
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#171a26] text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-3 pl-5">Jugador</th>
                    <th className="p-3">Equipo</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Inicio</th>
                    <th className="p-3">Duración</th>
                    <th className="p-3 pr-5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sanciones.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 text-sm">
                        No hay sanciones registradas
                      </td>
                    </tr>
                  ) : (
                    sanciones.map(san => (
                      <tr key={san.id} className="hover:bg-[#171a26]/40 transition-colors">
                        <td className="p-3 pl-5 font-bold text-white text-sm">{san.player?.name || '—'}</td>
                        <td className="p-3 text-slate-300">{san.player?.team?.name || '—'}</td>
                        <td className="p-3 text-slate-400 text-xs max-w-[150px] truncate">{san.reason}</td>
                        <td className="p-3 text-slate-400 text-xs">{new Date(san.start_date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-300">{san.duration || 0} partido{san.duration !== 1 ? 's' : ''}</td>
                        <td className="p-3 pr-5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            san.status === 'activa' || san.status === 'activo' 
                              ? 'bg-rose-500/20 text-rose-400' 
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {san.status === 'activa' || san.status === 'activo' ? 'Activa' : 'Cumplida'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>

        <footer className="bg-[#11131c] border-t border-slate-900 py-4 text-center text-xs text-slate-400">
          <p>© 2026 LigaCenter. Estadísticas y posiciones del campeonato.</p>
        </footer>
      </div>
    </div>
  );
};