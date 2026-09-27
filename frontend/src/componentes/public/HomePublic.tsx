import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { TiempoEnVivo } from '../../componentes/public/TiempoEnVivo';
import type { 
  PublicMatch, 
  PublicDiscipline, 
  PublicChampionship,
  PublicCategory
} from '../../servicios/apiPublic';
import { publicApi } from '../../servicios/apiPublic';
import { useEventosPublicos } from '../../hooks/public/useEventosPublicos';
import { FilaEventoPublico } from '../../componentes/public/eventos/FilaEventoPublico';
import { CarruselDestacados } from '../../componentes/public/CarruselDestacados';

import {
  construirEstructuraPublica,
  type CategoryGroup,
  type DisciplineGroup,
  type ExpandedState,
} from '../../utils/public/construirEstructuraPublica';

export const HomePublic: React.FC = () => {
  const [highlightedMatches, setHighlightedMatches] = useState<PublicMatch[]>([]);
  const [disciplines, setDisciplines] = useState<PublicDiscipline[]>([]);
  const [championships, setChampionships] = useState<PublicChampionship[]>([]);
  const [allMatches, setAllMatches] = useState<PublicMatch[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);

  const {events,highlightedEvents,} = useEventosPublicos(
    selectedDiscipline ?? undefined
  );
  const [expandedState, setExpandedState] = useState<ExpandedState>({});

  useEffect(() => {
    const nuevaEstructura = construirEstructuraPublica({
      matches: allMatches,
      events,
      championships,
      disciplines,
      categories,
    });

    setExpandedState(nuevaEstructura);
  }, [
    allMatches,
    events,
    championships,
    disciplines,
    categories,
  ]);

  useEffect(() => {
    loadData(true);
    const intervalo = setInterval(() => loadData(false), 20000);
    return () => clearInterval(intervalo);
  }, [selectedDiscipline]);

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

  const loadData = async (mostrarCargando: boolean = true) => {
    if (mostrarCargando) setLoading(true);
    try {
      const [matchesRes, disciplinesRes, championshipsRes, allMatchesRes, categoriesRes] = await Promise.all([
        publicApi.getHighlightedMatches(),
        publicApi.getDisciplines(),
        publicApi.getChampionships({ discipline_id: selectedDiscipline || undefined }),
        publicApi.getMatches({ discipline_id: selectedDiscipline || undefined }),
        publicApi.getCategories()
      ]);

      setHighlightedMatches(matchesRes.data.data || []);
      setDisciplines(disciplinesRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      
      const allMatchesData = allMatchesRes.data.data?.data || [];
      setAllMatches(allMatchesData);

      const champData = championshipsRes.data.data?.data || [];
      setChampionships(champData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      if (mostrarCargando) setLoading(false);
    }
  };

  const toggleChampionship = (championshipId: number) => {
    setExpandedState((prev: ExpandedState) => ({
      ...prev,
      [championshipId]: {
        ...prev[championshipId],
        expanded: !prev[championshipId]?.expanded
      }
    }));
  };

  const toggleDiscipline = (championshipId: number,disciplineId: number) => {
    setExpandedState((prev) => {
      const discipline = prev[championshipId]?.disciplines[disciplineId];

      if (!discipline) return prev;

      return {
        ...prev,
        [championshipId]: {
          ...prev[championshipId],
          disciplines: {
            ...prev[championshipId].disciplines,
            [disciplineId]: {
              ...discipline,
              expanded: !discipline.expanded,
            },
          },
        },
      };
    });
  };


  const toggleCategory = (championshipId: number, disciplineId: number, categoryId: string) => {
    setExpandedState((prev) => {
      const discipline =
        prev[championshipId]?.disciplines[disciplineId];

      const category =
        discipline?.categories[categoryId];

      if (!discipline || !category) return prev;

      return {
        ...prev,
        [championshipId]: {
          ...prev[championshipId],
          disciplines: {
            ...prev[championshipId].disciplines,
            [disciplineId]: {
              ...discipline,
              categories: {
                ...discipline.categories,
                [categoryId]: {
                  ...category,
                  expanded: !category.expanded,
                },
              },
            },
          },
        },
      };
    });
  };

  const getShortChampionshipName = (name: string): string => {
    if (name.includes(' - ')) {
      return name.split(' - ')[0];
    }
    return name;
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

        <CarruselDestacados
          matches={highlightedMatches}
          events={highlightedEvents}
          disciplines={disciplines}
          categories={categories}
          loading={loading}
        />
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
            key="todas"
          >
            Todos
          </button>
          {disciplines.map((discipline: PublicDiscipline) => (
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
            Todos los Partidos/Eventos
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
          <span className="text-[10px] text-slate-500 font-medium">
            {championships.length} competiciones
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((i: number) => (
              <div key={i} className="bg-[#11131c] rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : championships.length === 0 ? (
          <div className="bg-[#11131c] rounded-xl p-8 text-center border border-slate-800">
            <p className="text-slate-400 text-sm">No hay competiciones disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {championships.map((champ: PublicChampionship) => {
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
                        <Link
                          to={`/campeonatos/${champ.id}`}
                          className="font-bold text-white text-sm truncate block hover:text-indigo-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getShortChampionshipName(champ.name)}
                        </Link>
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
                          {disciplinesList.map((discipline: DisciplineGroup) => {
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
                                      {discipline.name}
                                    </span>
                                    {discipline.loaded && (
                                      <span className="text-[9px] text-slate-500 font-medium">
                                        ({categoriesList.reduce((acc: number, cat: CategoryGroup) => acc + cat.matches.length + cat.events.length, 0)} partidos)
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
                                        {categoriesList.map((category: CategoryGroup) => {
                                          const isCatExpanded = category.expanded || false;
                                          const matchesList = category.matches || [];
                                          const eventsList = category.events || [];

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
                                                    ({matchesList.length + eventsList.length} competencia
                                                    {matchesList.length + eventsList.length !== 1 ? 's' : ''})
                                                  </span>
                                                </div>
                                              </button>
                                              {isCatExpanded && (
                                                <div className="px-3 pb-2 pt-1">
                                                  {matchesList.length === 0 && eventsList.length == 0 ? (
                                                    <div className="text-center py-3 text-xs text-slate-500">
                                                      No hay partidos/eventos programados para esta categoría
                                                    </div>
                                                  ) : (
                                                    <div className="space-y-1.5">
                                                      {matchesList.map((match: PublicMatch) => (
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
                                                      {eventsList.map((evento) => (
                                                        <FilaEventoPublico
                                                          key={`event-${evento.id}`}
                                                          evento={evento}
                                                        />
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