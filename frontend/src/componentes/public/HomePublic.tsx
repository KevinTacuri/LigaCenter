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

interface CategoryGroup {
  id: string;
  name: string;
  discipline_id: string;
  matches: PublicMatch[];
  loaded: boolean;
  loading: boolean;
  expanded: boolean;
}

interface DisciplineGroup {
  id: string;
  name: string;
  categories: {
    [categoryId: string]: CategoryGroup;
  };
  expanded: boolean;
  loaded: boolean;
  loading: boolean;
}

interface ExpandedState {
  [championshipId: number]: {
    expanded: boolean;
    disciplines: {
      [disciplineId: string]: DisciplineGroup;
    }
  }
}

export const HomePublic: React.FC = () => {
  const [highlightedMatches, setHighlightedMatches] = useState<PublicMatch[]>([]);
  const [disciplines, setDisciplines] = useState<PublicDiscipline[]>([]);
  const [championships, setChampionships] = useState<PublicChampionship[]>([]);
  const [allMatches, setAllMatches] = useState<PublicMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  
  const [expandedState, setExpandedState] = useState<ExpandedState>({});
  
  const [position, setPosition] = useState(0);
  const animationRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadData(true);
    const intervalo = setInterval(() => loadData(false), 20000);
    return () => clearInterval(intervalo);
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

  const extraerInfoDelNombre = (nombreEquipo: string): { equipo: string; disciplina: string; categoria: string } => {
    const partes = nombreEquipo.split(' - ');
    if (partes.length >= 3) {
      return {
        equipo: partes[0],
        disciplina: partes[1],
        categoria: partes[2]
      };
    }
    return {
      equipo: nombreEquipo,
      disciplina: 'Sin disciplina',
      categoria: 'Sin categoría'
    };
  };

  const loadData = async (mostrarCargando: boolean = true) => {
    if (mostrarCargando) setLoading(true);
    try {
      const [matchesRes, disciplinesRes, championshipsRes, allMatchesRes] = await Promise.all([
        publicApi.getHighlightedMatches(),
        publicApi.getDisciplines(),
        publicApi.getChampionships({ discipline_id: selectedDiscipline || undefined }),
        publicApi.getMatches({ discipline_id: selectedDiscipline || undefined })
      ]);

      setHighlightedMatches(matchesRes.data.data || []);
      setDisciplines(disciplinesRes.data.data || []);
      
      const allMatchesData = allMatchesRes.data.data?.data || [];
      setAllMatches(allMatchesData);

      let champData = championshipsRes.data.data?.data || [];
      
      if (selectedDiscipline !== null) {
        // Obtener los IDs de los campeonatos que tienen partidos de la disciplina seleccionada
        const champIdsConDisciplina = new Set<number>();
        allMatchesData.forEach(match => {
          const champId = match.championship?.id;
          if (!champId) return;
          
          // Verificar si el partido tiene la disciplina seleccionada (del nombre del equipo)
          const homeInfo = extraerInfoDelNombre(match.home_team?.name || '');
          const awayInfo = extraerInfoDelNombre(match.away_team?.name || '');
          
          // Buscar la disciplina en el nombre de los equipos
          const disciplinaEncontrada = 
            homeInfo.disciplina === disciplines.find(d => d.id === selectedDiscipline)?.name ||
            awayInfo.disciplina === disciplines.find(d => d.id === selectedDiscipline)?.name;
            
          if (disciplinaEncontrada) {
            champIdsConDisciplina.add(champId);
          }
        });
        
        // Filtrar campeonatos que tienen la disciplina seleccionada
        champData = champData.filter(champ => champIdsConDisciplina.has(champ.id));
      }
      
      setChampionships(champData);

      // Inicializar estado del acordeón solo con los campeonatos filtrados
      const newExpandedState: ExpandedState = {};
      
      const matchesPorCampeonato: { [champId: number]: PublicMatch[] } = {};
      allMatchesData.forEach(match => {
        const champId = match.championship?.id;
        if (!champId) return;
        // Solo procesar si el campeonato está en la lista filtrada
        if (!champData.some(c => c.id === champId)) return;
        if (!matchesPorCampeonato[champId]) {
          matchesPorCampeonato[champId] = [];
        }
        matchesPorCampeonato[champId].push(match);
      });

      Object.keys(matchesPorCampeonato).forEach(champIdStr => {
        const champId = parseInt(champIdStr);
        const champMatches = matchesPorCampeonato[champId];
        
        newExpandedState[champId] = {
          expanded: false,
          disciplines: {}
        };

        const disciplinasUnicas = new Set<string>();
        champMatches.forEach(match => {
          const homeInfo = extraerInfoDelNombre(match.home_team?.name || '');
          const awayInfo = extraerInfoDelNombre(match.away_team?.name || '');
          if (homeInfo.disciplina !== 'Sin disciplina') {
            disciplinasUnicas.add(homeInfo.disciplina);
          }
          if (awayInfo.disciplina !== 'Sin disciplina') {
            disciplinasUnicas.add(awayInfo.disciplina);
          }
        });

        disciplinasUnicas.forEach(disciplina => {
          const categoriasUnicas = new Set<string>();
          champMatches.forEach(match => {
            const homeInfo = extraerInfoDelNombre(match.home_team?.name || '');
            const awayInfo = extraerInfoDelNombre(match.away_team?.name || '');
            if (homeInfo.disciplina === disciplina) {
              categoriasUnicas.add(homeInfo.categoria);
            }
            if (awayInfo.disciplina === disciplina) {
              categoriasUnicas.add(awayInfo.categoria);
            }
          });

          const categories: { [catId: string]: CategoryGroup } = {};
          let catIndex = 0;
          categoriasUnicas.forEach(categoria => {
            const catId = `cat-${disciplina}-${catIndex}`;
            categories[catId] = {
              id: catId,
              name: categoria,
              discipline_id: disciplina,
              matches: [],
              loaded: false,
              loading: false,
              expanded: false
            };
            catIndex++;
          });

          if (Object.keys(categories).length === 0) {
            categories[`cat-${disciplina}-default`] = {
              id: `cat-${disciplina}-default`,
              name: 'Categoría Única',
              discipline_id: disciplina,
              matches: [],
              loaded: false,
              loading: false,
              expanded: false
            };
          }

          newExpandedState[champId].disciplines[disciplina] = {
            id: disciplina,
            name: disciplina,
            categories: categories,
            expanded: false,
            loaded: false,
            loading: false
          };
        });
      });

      setExpandedState(newExpandedState);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      if (mostrarCargando) setLoading(false);
    }
  };

  const toggleChampionship = (championshipId: number) => {
    setExpandedState(prev => ({
      ...prev,
      [championshipId]: {
        ...prev[championshipId],
        expanded: !prev[championshipId]?.expanded
      }
    }));
  };

  const toggleDiscipline = (championshipId: number, disciplineId: string) => {
    const discipline = expandedState[championshipId]?.disciplines[disciplineId];
    if (!discipline) return;

    if (!discipline.expanded && !discipline.loaded) {
      const champMatches = allMatches.filter(m => m.championship?.id === championshipId);
      
      const updatedCategories: { [catId: string]: CategoryGroup } = {};
      
      Object.keys(discipline.categories).forEach(catId => {
        const category = discipline.categories[catId];
        const categoryMatches = champMatches.filter(match => {
          const homeInfo = extraerInfoDelNombre(match.home_team?.name || '');
          const awayInfo = extraerInfoDelNombre(match.away_team?.name || '');
          return (homeInfo.disciplina === disciplineId && homeInfo.categoria === category.name) ||
                 (awayInfo.disciplina === disciplineId && awayInfo.categoria === category.name);
        });
        
        updatedCategories[catId] = {
          ...category,
          matches: categoryMatches,
          loaded: true,
          expanded: true
        };
      });

      setExpandedState(prev => ({
        ...prev,
        [championshipId]: {
          ...prev[championshipId],
          disciplines: {
            ...prev[championshipId]?.disciplines,
            [disciplineId]: {
              ...discipline,
              categories: updatedCategories,
              loaded: true,
              expanded: true
            }
          }
        }
      }));
      return;
    }

    setExpandedState(prev => ({
      ...prev,
      [championshipId]: {
        ...prev[championshipId],
        disciplines: {
          ...prev[championshipId]?.disciplines,
          [disciplineId]: {
            ...discipline,
            expanded: !discipline.expanded
          }
        }
      }
    }));
  };

  const toggleCategory = (championshipId: number, disciplineId: string, categoryId: string) => {
    setExpandedState(prev => {
      const discipline = prev[championshipId]?.disciplines[disciplineId];
      if (!discipline) return prev;
      
      const category = discipline.categories[categoryId];
      if (!category) return prev;

      return {
        ...prev,
        [championshipId]: {
          ...prev[championshipId],
          disciplines: {
            ...prev[championshipId]?.disciplines,
            [disciplineId]: {
              ...discipline,
              categories: {
                ...discipline.categories,
                [categoryId]: {
                  ...category,
                  expanded: !category.expanded
                }
              }
            }
          }
        }
      };
    });
  };

  const obtenerNombreEquipo = (nombreCompleto: string | undefined): string => {
    if (!nombreCompleto) return '—';
    const partes = nombreCompleto.split(' - ');
    return partes[0] || nombreCompleto;
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

  const getShortChampionshipName = (name: string): string => {
    if (name.includes(' - ')) {
      return name.split(' - ')[0];
    }
    return name;
  };

  const getShortDisciplineName = (name: string): string => {
    if (name.includes(' - ')) {
      return name.split(' - ')[0];
    }
    return name;
  };

  return (
    <LayoutPublico onSearch={handleSearch}>
      {/* SECCIÓN 1: PARTIDOS DESTACADOS - CON DISCIPLINA Y CATEGORÍA */}
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
              {highlightedMatches.map(match => {
                // Extraer información del equipo local para obtener disciplina y categoría
                const homeInfo = extraerInfoDelNombre(match.home_team?.name || '');
                const disciplina = homeInfo.disciplina !== 'Sin disciplina' ? homeInfo.disciplina : '';
                const categoria = homeInfo.categoria !== 'Sin categoría' ? homeInfo.categoria : '';
                
                return (
                  <Link
                    key={match.id}
                    to={`/partidos/${match.id}`}
                    className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02] min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <div className="flex justify-between items-start gap-1 mb-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-bold truncate">
                          {match.championship?.name || 'Competición'}
                        </span>
                        {/* Mostrar disciplina y categoría */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {disciplina && (
                            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                              {disciplina}
                            </span>
                          )}
                          {categoria && (
                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                              {categoria}
                            </span>
                          )}
                        </div>
                      </div>
                      {match.status === 'en_vivo' ? (
                        <TiempoEnVivo elapsedTime={match.elapsed_time} status={match.status} timerStatus={match.timer_status} size="sm" />
                      ) : (
                        getStatusBadge(match.status)
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-200 truncate">
                          {obtenerNombreEquipo(match.home_team?.name)}
                        </span>
                        <span className="font-bold text-base text-white">
                          {match.status === 'en_vivo' ? (match.home_score ?? 0) : (match.home_score ?? '-')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-200 truncate">
                          {obtenerNombreEquipo(match.away_team?.name)}
                        </span>
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
                );
              })}
              {highlightedMatches.map(match => {
                const homeInfo = extraerInfoDelNombre(match.home_team?.name || '');
                const disciplina = homeInfo.disciplina !== 'Sin disciplina' ? homeInfo.disciplina : '';
                const categoria = homeInfo.categoria !== 'Sin categoría' ? homeInfo.categoria : '';
                
                return (
                  <Link
                    key={`dup-${match.id}`}
                    to={`/partidos/${match.id}`}
                    className="bg-[#11131c] rounded-xl p-4 border border-slate-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02] min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <div className="flex justify-between items-start gap-1 mb-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-bold truncate">
                          {match.championship?.name || 'Competición'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {disciplina && (
                            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                              {disciplina}
                            </span>
                          )}
                          {categoria && (
                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                              {categoria}
                            </span>
                          )}
                        </div>
                      </div>
                      {match.status === 'en_vivo' ? (
                        <TiempoEnVivo elapsedTime={match.elapsed_time} status={match.status} timerStatus={match.timer_status} size="sm" />
                      ) : (
                        getStatusBadge(match.status)
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-200 truncate">
                          {obtenerNombreEquipo(match.home_team?.name)}
                        </span>
                        <span className="font-bold text-base text-white">
                          {match.status === 'en_vivo' ? (match.home_score ?? 0) : (match.home_score ?? '-')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-200 truncate">
                          {obtenerNombreEquipo(match.away_team?.name)}
                        </span>
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
                );
              })}
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0b10] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0b10] to-transparent pointer-events-none" />
          </div>
        )}
      </section>

      {/* SECCIÓN 2: FILTROS POR DISCIPLINA */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDiscipline(null)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedDiscipline === null
                ? 'bg-indigo-650 text-white'
                : 'bg-[#11131c] text-slate-400 hover:bg-[#1a1d2a] hover:text-white border border-slate-800'
            }`}
            key="todas"
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

      {/* SECCIÓN 3: NAVEGACIÓN DE TABS */}
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

      {/* SECCIÓN 4: ACORDEÓN DE COMPETICIONES */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">🏆 Competiciones</h2>
          <span className="text-[10px] text-slate-500 font-medium">
            {championships.length} competiciones
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#11131c] rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : championships.length === 0 ? (
          <div className="bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
            <p className="text-slate-400 text-sm">No hay competiciones disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {championships.map(champ => {
              const champState = expandedState[champ.id];
              const isExpanded = champState?.expanded || false;
              const disciplinesList = Object.values(champState?.disciplines || {});

              return (
                <div 
                  key={champ.id} 
                  className="bg-[#11131c] rounded-xl border border-slate-800 overflow-hidden transition-all hover:border-indigo-500/30"
                >
                  <button
                    onClick={() => toggleChampionship(champ.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#171a26]/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        chevron_right
                      </span>
                      <div className="text-left min-w-0">
                        <span className="font-bold text-white text-sm truncate block">
                          {getShortChampionshipName(champ.name)}
                        </span>
                        {champ.description && (
                          <span className="text-[10px] text-slate-500 truncate block">
                            {champ.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {disciplinesList.length} deporte{disciplinesList.length !== 1 ? 's' : ''}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        champ.status === 'en_curso' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {champ.status === 'en_curso' ? 'En curso' : champ.status}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-800/60">
                      {disciplinesList.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">
                          No hay disciplinas registradas en esta competición
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800/40">
                          {disciplinesList.map(discipline => {
                            const isDiscExpanded = discipline.expanded || false;
                            const categoriesList = Object.values(discipline.categories || {});

                            return (
                              <div key={`disc-${discipline.id}`}>
                                <button
                                  onClick={() => toggleDiscipline(champ.id, discipline.id)}
                                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#171a26]/30 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-slate-500 text-sm transition-transform duration-200 ${isDiscExpanded ? 'rotate-90' : ''}`}>
                                      chevron_right
                                    </span>
                                    <span className="font-bold text-slate-300 text-xs">
                                      {getShortDisciplineName(discipline.name)}
                                    </span>
                                    {discipline.loaded && (
                                      <span className="text-[9px] text-slate-500 font-medium">
                                        ({categoriesList.reduce((acc, cat) => acc + cat.matches.length, 0)} partidos)
                                      </span>
                                    )}
                                  </div>
                                </button>

                                {isDiscExpanded && (
                                  <div className="pl-8 pr-4 pb-3 pt-1">
                                    {!discipline.loaded ? (
                                      <div className="flex items-center justify-center py-4">
                                        <span className="text-xs text-slate-500">Cargando partidos...</span>
                                      </div>
                                    ) : categoriesList.length === 0 ? (
                                      <div className="text-center py-4 text-xs text-slate-500">
                                        No hay categorías registradas para esta disciplina
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {categoriesList.map(category => {
                                          const isCatExpanded = category.expanded || false;
                                          const matchesList = category.matches || [];

                                          return (
                                            <div key={`cat-${category.id}`} className="border border-slate-800/50 rounded-lg overflow-hidden">
                                              <button
                                                onClick={() => toggleCategory(champ.id, discipline.id, category.id)}
                                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#171a26]/30 transition-colors cursor-pointer"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className={`material-symbols-outlined text-slate-500 text-sm transition-transform duration-200 ${isCatExpanded ? 'rotate-90' : ''}`}>
                                                    chevron_right
                                                  </span>
                                                  <span className="font-semibold text-slate-300 text-xs">
                                                    {category.name}
                                                  </span>
                                                  <span className="text-[9px] text-slate-500 font-medium">
                                                    ({matchesList.length} partido{matchesList.length !== 1 ? 's' : ''})
                                                  </span>
                                                </div>
                                              </button>

                                              {isCatExpanded && (
                                                <div className="px-3 pb-2 pt-1">
                                                  {matchesList.length === 0 ? (
                                                    <div className="text-center py-3 text-xs text-slate-500">
                                                      No hay partidos programados para esta categoría
                                                    </div>
                                                  ) : (
                                                    <div className="space-y-1.5">
                                                      {matchesList.map(match => (
                                                        <Link
                                                          key={match.id}
                                                          to={`/partidos/${match.id}`}
                                                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0c0e16] hover:bg-[#171a26] border border-slate-800/50 hover:border-indigo-500/30 transition-all group"
                                                        >
                                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 truncate">
                                                              <span className="truncate">
                                                                {obtenerNombreEquipo(match.home_team?.name)}
                                                              </span>
                                                              <span className="text-slate-600 font-bold">vs</span>
                                                              <span className="truncate">
                                                                {obtenerNombreEquipo(match.away_team?.name)}
                                                              </span>
                                                            </div>
                                                          </div>

                                                          <div className="flex items-center gap-3 shrink-0">
                                                            {match.status === 'en_vivo' ? (
                                                              <>
                                                                <TiempoEnVivo 
                                                                  elapsedTime={match.elapsed_time} 
                                                                  status={match.status} 
                                                                  timerStatus={match.timer_status}
                                                                  size="sm" 
                                                                />
                                                                <span className="font-bold text-sm text-white min-w-[50px] text-center">
                                                                  {match.home_score ?? 0} : {match.away_score ?? 0}
                                                                </span>
                                                              </>
                                                            ) : match.status === 'finalizado' ? (
                                                              <>
                                                                <span className="font-bold text-sm text-slate-300 min-w-[50px] text-center">
                                                                  {match.home_score ?? '-'} : {match.away_score ?? '-'}
                                                                </span>
                                                                <span className="text-[9px] text-slate-500">FT</span>
                                                              </>
                                                            ) : (
                                                              <>
                                                                <span className="text-[10px] text-slate-500 font-medium">
                                                                  {match.match_date ? new Date(match.match_date + 'T' + (match.match_time || '00:00')).toLocaleString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                  }) : '—'}
                                                                </span>
                                                                <span className="text-[9px] text-slate-600">VS</span>
                                                              </>
                                                            )}
                                                          </div>
                                                        </Link>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </LayoutPublico>
  );
};