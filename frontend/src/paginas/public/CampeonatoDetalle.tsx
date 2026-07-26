import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import { TablaPosicionesPublica } from '../../componentes/public/TablaPosicionesPublica';
import { publicApi } from '../../servicios/apiPublic';
import type { 
    PublicChampionship, 
    PublicMatch, 
    PublicStanding,
    PublicCategory,
    PublicChampionshipDiscipline
} from '../../servicios/apiPublic';

interface Team {
    id: number;
    name: string;
    logo: string | null;
}

interface MatchWithTeams extends PublicMatch {
    local_team?: Team;
    visitor_team?: Team;
}

export const CampeonatoDetalle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const championshipId = Number(id);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [championship, setChampionship] = useState<PublicChampionship | null>(null);
    const [disciplines, setDisciplines] = useState<PublicChampionshipDiscipline[]>([]);
    const [categories, setCategories] = useState<PublicCategory[]>([]);
    const [standings, setStandings] = useState<PublicStanding[]>([]);
    const [allMatches, setAllMatches] = useState<MatchWithTeams[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('todos');
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

    const [stats, setStats] = useState({
        totalTeams: 0,
        totalMatches: 0,
        totalGoals: 0,
        avgGoals: 0
    });

    const obtenerNombreEquipo = (nombreCompleto: string | undefined): string => {
        if (!nombreCompleto) return '—';
        if (nombreCompleto.includes(' - ')) {
            return nombreCompleto.split(' - ')[0];
        }
        return nombreCompleto;
    };

    const getDisciplinaActual = () => {
        return disciplines.find(d => d.id === selectedDiscipline);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'en_vivo':
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 animate-pulse">EN VIVO</span>;
            case 'finalizado':
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700/50 text-slate-400">FINALIZADO</span>;
            default:
                return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400">PROGRAMADO</span>;
        }
    };

    const getLocalScore = (match: MatchWithTeams): number => {
        return match.home_score ?? 0;
    };

    const getVisitorScore = (match: MatchWithTeams): number => {
        return match.away_score ?? 0;
    };

    const categoriesForDiscipline = useMemo(() => {
        if (!selectedDiscipline) return categories;
        return categories.filter(c => c.discipline_id === selectedDiscipline);
    }, [categories, selectedDiscipline]);

    const matchesFiltered = useMemo(() => {
        return allMatches.filter(m => {
            const coincideDisciplina = !selectedDiscipline || m.discipline_id === selectedDiscipline;
            const coincideCategoria = !selectedCategory || m.category_id === selectedCategory;
            const coincideEstado = filterStatus === 'todos' || m.status === filterStatus;
            const coincideRonda = !selectedRound || m.round === selectedRound;
            const coincideEquipo = !selectedTeam ||
                (m.home_team?.id === selectedTeam || m.visitor_team?.id === selectedTeam);
            return coincideDisciplina && coincideCategoria && coincideEstado && coincideRonda && coincideEquipo;
        });
    }, [allMatches, selectedDiscipline, selectedCategory, filterStatus, selectedRound, selectedTeam]);

    const rondasDisponibles = useMemo(() => {
        const matchesWithRound = allMatches.filter(m => 
            (!selectedDiscipline || m.discipline_id === selectedDiscipline) &&
            (!selectedCategory || m.category_id === selectedCategory)
        );
        return Array.from(new Set(matchesWithRound.map(m => m.round).filter((r): r is number => r !== null))).sort((a, b) => a - b);
    }, [allMatches, selectedDiscipline, selectedCategory]);

    const teamsForFilter = useMemo(() => {
        const teamsInMatches = new Set<number>();
        allMatches.forEach(m => {
            if (m.home_team?.id) teamsInMatches.add(m.home_team.id);
            if (m.visitor_team?.id) teamsInMatches.add(m.visitor_team.id);
        });
        return teams.filter(t => teamsInMatches.has(t.id));
    }, [teams, allMatches]);

    useEffect(() => {
        if (championshipId) {
            loadData();
        }
    }, [championshipId]);

    useEffect(() => {
        if (selectedDiscipline) {
            loadCategoriesAndData();
        }
    }, [selectedDiscipline]);

    useEffect(() => {
        if (selectedCategory && selectedDiscipline) {
            loadStandingsAndMatches();
        }
    }, [selectedCategory, selectedDiscipline]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [champRes, disciplinesRes, teamsRes] = await Promise.all([
                publicApi.getChampionship(championshipId),
                publicApi.getChampionshipDisciplines(championshipId),
                publicApi.getTeams({ championship_id: championshipId })
            ]);

            if (champRes.data.success) {
                setChampionship(champRes.data.data.championship);
            }

            if (disciplinesRes.data.success) {
                const discData = disciplinesRes.data.data || [];
                setDisciplines(discData);
                if (discData.length > 0 && !selectedDiscipline) {
                    setSelectedDiscipline(discData[0].id);
                }
            }

            if (teamsRes.data.success) {
                const teamData = teamsRes.data.data?.data || [];
                setTeams(teamData);
            }

        } catch (err) {
            console.error('Error cargando datos:', err);
            setError('Error al cargar los datos del campeonato');
        } finally {
            setLoading(false);
        }
    };

    const loadCategoriesAndData = async () => {
        if (!selectedDiscipline) return;
        setLoading(true);
        try {
            const categoriesRes = await publicApi.getChampionshipCategories(championshipId, {
                discipline_id: selectedDiscipline
            });

            if (categoriesRes.data.success) {
                const catData = categoriesRes.data.data || [];
                setCategories(catData);
                if (catData.length > 0) {
                    const firstCategory = catData[0].id;
                    setSelectedCategory(firstCategory);
                } else {
                    setSelectedCategory(null);
                    setStandings([]);
                    setAllMatches([]);
                    setStats({
                        totalTeams: 0,
                        totalMatches: 0,
                        totalGoals: 0,
                        avgGoals: 0
                    });
                }
            }
        } catch (err) {
            console.error('Error cargando categorías:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStandingsAndMatches = async () => {
        if (!selectedCategory || !selectedDiscipline) {
            console.log('No hay categoría o disciplina seleccionada');
            setStandings([]);
            setAllMatches([]);
            setStats({
                totalTeams: 0,
                totalMatches: 0,
                totalGoals: 0,
                avgGoals: 0
            });
            return;
        }

        console.log('Cargando standings para:', {
            championshipId,
            category_id: selectedCategory,
            discipline_id: selectedDiscipline
        });

        setLoading(true);
        try {
            const [standingsRes, matchesRes] = await Promise.all([
                publicApi.getChampionshipStandingsComplete(championshipId, {
                    category_id: selectedCategory,
                    discipline_id: selectedDiscipline
                }),
                publicApi.getChampionshipMatches(championshipId)
            ]);

            console.log('Respuesta standings COMPLETA:', standingsRes);
            console.log('Respuesta matches COMPLETA:', matchesRes);

            let standingData: PublicStanding[] = [];
            let matchData: MatchWithTeams[] = [];

            if (standingsRes.data?.success) {
                standingData = standingsRes.data.data || [];
                console.log('Datos de standings PROCESADOS:', standingData);
                console.log('Cantidad de standings:', standingData.length);
                setStandings(standingData);
            }

            if (matchesRes.data?.success) {
                const allMatchData = matchesRes.data.data?.data || [];
                console.log('Todos los partidos:', allMatchData);
                
                // Filtrar partidos por categoría y disciplina
                // Usamos category_id y discipline_id si existen, si no, usamos el grupo o la relación
                matchData = allMatchData.filter((m: any) => {
                    // Intentar obtener category_id de diferentes fuentes
                    const matchCategoryId = m.category_id || m.group?.category_id || m.category?.id;
                    const matchDisciplineId = m.discipline_id || m.discipline?.id || m.championship?.disciplines?.[0]?.id;
                    
                    const coincide = matchCategoryId === selectedCategory && matchDisciplineId === selectedDiscipline;
                    
                    if (!coincide) {
                        console.log(`Partido ${m.id}: category_id=${matchCategoryId} (buscado ${selectedCategory}), discipline_id=${matchDisciplineId} (buscado ${selectedDiscipline})`);
                    }
                    return coincide;
                });
                console.log('Partidos filtrados:', matchData);
                setAllMatches(matchData);
            }

            // Calcular estadísticas
            let totalGoals = 0;
            matchData.forEach((m: any) => {
                if (m.status === 'finalizado') {
                    totalGoals += (m.home_score ?? 0) + (m.away_score ?? 0);
                }
            });

            setStats({
                totalTeams: standingData.length,
                totalMatches: matchData.length,
                totalGoals,
                avgGoals: matchData.length > 0 
                    ? Number((totalGoals / matchData.length).toFixed(2))
                    : 0
            });

        } catch (err) {
            console.error('Error cargando standings y partidos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
    };

    if (loading) {
        return (
            <LayoutPublico onSearch={handleSearch}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Cargando campeonato...</span>
                        </div>
                    </div>
                </div>
            </LayoutPublico>
        );
    }

    if (error || !championship) {
        return (
            <LayoutPublico onSearch={handleSearch}>
                <div className="max-w-7xl mx-auto">
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{error || 'Campeonato no encontrado'}</span>
                    </div>
                </div>
            </LayoutPublico>
        );
    }

    return (
        <LayoutPublico onSearch={handleSearch}>
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold tracking-wide transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span>Volver</span>
                    </Link>
                </div>

                <div className="bg-[#11131c] rounded-xl border border-slate-800 p-6 mb-6">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-white">{championship.name}</h2>
                            {championship.description && (
                                <p className="text-sm text-slate-400 mt-1">{championship.description}</p>
                            )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            championship.status === 'en_curso' 
                                ? 'bg-red-500/20 text-red-400 animate-pulse' 
                                : championship.status === 'finalizado'
                                    ? 'bg-slate-700/50 text-slate-400'
                                    : 'bg-blue-500/20 text-blue-400'
                        }`}>
                            {championship.status === 'en_curso' ? 'EN CURSO' : championship.status === 'finalizado' ? 'FINALIZADO' : 'CREADO'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {championship.start_date && (
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">event</span>
                                Inicio: {championship.start_date}
                            </span>
                        )}
                        {championship.end_date && (
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">event_available</span>
                                Fin: {championship.end_date}
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-[#11131c] border border-slate-900 rounded-xl p-5 space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                        {disciplines.length > 0 && (
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disciplina</label>
                                <select
                                    value={selectedDiscipline || ''}
                                    onChange={(e) => {
                                        const newDiscipline = e.target.value ? Number(e.target.value) : null;
                                        setSelectedDiscipline(newDiscipline);
                                        setSelectedCategory(null);
                                    }}
                                    className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                                >
                                    {disciplines.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {categoriesForDiscipline.length > 0 && (
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                                <select
                                    value={selectedCategory || ''}
                                    onChange={(e) => {
                                        const newCategory = e.target.value ? Number(e.target.value) : null;
                                        setSelectedCategory(newCategory);
                                    }}
                                    className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                                >
                                    {categoriesForDiscipline.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {allMatches.length > 0 && (
                            <>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="pendiente">Programados</option>
                                        <option value="en_vivo">En Vivo</option>
                                        <option value="finalizado">Finalizados</option>
                                    </select>
                                </div>

                                {rondasDisponibles.length > 0 && (
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jornada</label>
                                        <select
                                            value={selectedRound ?? ''}
                                            onChange={(e) => setSelectedRound(e.target.value ? Number(e.target.value) : null)}
                                            className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                                        >
                                            <option value="">Todas</option>
                                            {rondasDisponibles.map(r => (
                                                <option key={r} value={r}>Fecha {r}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {teamsForFilter.length > 0 && (
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipo</label>
                                        <select
                                            value={selectedTeam ?? ''}
                                            onChange={(e) => setSelectedTeam(e.target.value ? Number(e.target.value) : null)}
                                            className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                                        >
                                            <option value="">Todos</option>
                                            {teamsForFilter.map(eq => (
                                                <option key={eq.id} value={eq.id}>{obtenerNombreEquipo(eq.name)}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="ml-auto">
                            <button
                                onClick={() => {
                                    setSelectedDiscipline(null);
                                    setSelectedCategory(null);
                                    setFilterStatus('todos');
                                    setSelectedRound(null);
                                    setSelectedTeam(null);
                                    setStandings([]);
                                    setAllMatches([]);
                                    setStats({
                                        totalTeams: 0,
                                        totalMatches: 0,
                                        totalGoals: 0,
                                        avgGoals: 0
                                    });
                                    loadData();
                                }}
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
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                </div>

                <div className="bg-[#11131c] border border-slate-900 rounded-xl overflow-hidden mb-6">
                    <div className="px-5 py-3 border-b border-slate-900">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-400 text-base">leaderboard</span>
                            Tabla de Posiciones
                        </h3>
                    </div>
                    <div className="w-full p-2">
                        {!selectedCategory ? (
                            <div className="p-8 text-center text-slate-400">
                                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">info</span>
                                <p className="text-sm font-medium">Selecciona una categoría para ver la tabla de posiciones</p>
                            </div>
                        ) : standings.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No hay posiciones disponibles para la categoría seleccionada
                            </div>
                        ) : (
                            <TablaPosicionesPublica
                                standings={standings}
                                discipline={getDisciplinaActual()?.name || 'futbol'}
                                loading={loading}
                            />
                        )}
                    </div>
                </div>

                <div className="bg-[#11131c] border border-slate-900 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-900 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-400 text-base">calendar_today</span>
                            Partidos
                        </h3>
                        <span className="text-[10px] text-slate-400">
                            {matchesFiltered.length} encuentros
                        </span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matchesFiltered.length === 0 ? (
                            <div className="col-span-2 p-6 text-center text-slate-500 text-sm">
                                No hay partidos disponibles para los filtros seleccionados
                            </div>
                        ) : (
                            matchesFiltered.map(match => (
                                <div key={match.id} className="bg-[#171a26]/40 border border-slate-800 rounded-lg p-3 hover:border-indigo-500/30 transition-all">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2">
                                        <span>{getDisciplinaActual()?.name || '—'}</span>
                                        <span>{categories.find(c => c.id === match.category_id)?.name || '—'}</span>
                                        {getStatusBadge(match.status)}
                                    </div>
                                    
                                    {/* PARTIDO EN FORMA VERTICAL (más claro) */}
                                    <div className="space-y-1">
                                        {/* Equipo Local */}
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-white truncate">
                                                {match.home_team?.name ? obtenerNombreEquipo(match.home_team.name) : 'Local'}
                                            </span>
                                            <span className="font-bold text-base text-indigo-400 min-w-[30px] text-right">
                                                {getLocalScore(match)}
                                            </span>
                                        </div>
                                        
                                        {/* VS */}
                                        <div className="flex items-center justify-center">
                                            <span className="text-[10px] text-slate-500 font-bold">VS</span>
                                        </div>
                                        
                                        {/* Equipo Visitante */}
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-white truncate">
                                                {match.away_team?.name ? obtenerNombreEquipo(match.away_team.name) : 'Visitante'}
                                            </span>
                                            <span className="font-bold text-base text-indigo-400 min-w-[30px] text-right">
                                                {getVisitorScore(match)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 text-[9px] text-slate-500 flex justify-between border-t border-slate-800/50 pt-2">
                                        <span>{match.match_date ? new Date(match.match_date).toLocaleDateString() : '—'}</span>
                                        <span>{match.venue?.name || '—'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </LayoutPublico>
    );
};