import { useCallback, useEffect, useState } from 'react';
import { serviciosParticipantes } from '../../servicios/api';
import type {
  Disciplina,
  Categoria,
  Equipo,
  Jugador,
  Paginacion as PaginacionApi,
} from '../../servicios/api';
import type { TabParticipantes, FiltrosEquipos, FiltrosJugadores } from '../../types/Participantes';

const ITEMS_POR_PAGINA_EQ = 10;
const ITEMS_POR_PAGINA_JUG = 8;

interface UseParticipantesDataParams {
  campeonatoId: number | null;
  tabActiva: TabParticipantes;
  delegadoTeamId: number | null;
}

export function useParticipantesData({
  campeonatoId,
  tabActiva,
  delegadoTeamId,
}: UseParticipantesDataParams) {
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  const [filtrosEq, setFiltrosEq] = useState<FiltrosEquipos>({
    busqueda: '',
    estado: 'todos',
    categoria: 'todos',
    orden: 'nombre_asc',
  });
  const [paginaEq, setPaginaEq] = useState(1);
  const [paginacionEq, setPaginacionEq] = useState<PaginacionApi>({
    total: 0,
    per_page: ITEMS_POR_PAGINA_EQ,
    current_page: 1,
    last_page: 1,
  });

  const [filtrosJug, setFiltrosJug] = useState<FiltrosJugadores>({
    busqueda: '',
    orden: 'nombre_asc',
    categoriaId: null,
    equipoId: null,
  });
  const [paginaJug, setPaginaJug] = useState(1);
  const [paginacionJug, setPaginacionJug] = useState<PaginacionApi>({
    total: 0,
    per_page: ITEMS_POR_PAGINA_JUG,
    current_page: 1,
    last_page: 1,
  });

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPaginaEq(1);
  }, [filtrosEq.busqueda, filtrosEq.estado, filtrosEq.categoria, filtrosEq.orden]);

  useEffect(() => {
    setPaginaJug(1);
  }, [filtrosJug.busqueda, filtrosJug.orden, filtrosJug.categoriaId, filtrosJug.equipoId]);

  const cargarDatos = useCallback(async () => {
    if (!campeonatoId) return;
    setCargando(true);
    setErrorLocal(null);
    try {
      if (tabActiva === 'disciplinas') {
        const res = await serviciosParticipantes.obtenerDisciplinas();
        if (res.success) setDisciplinas(res.data);
      } else if (tabActiva === 'categorias') {
        const [resCat, resDisc] = await Promise.all([
          serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoId),
          serviciosParticipantes.obtenerDisciplinas(),
        ]);
        if (resCat.success) setCategorias(resCat.data);
        if (resDisc.success) {
          setDisciplinas(
            resDisc.data.map((cd: any) => ({
              id: cd.id,
              name: cd.name || 'Desconocido',
              description: '',
              rules: '',
              status: 'active',
            }))
          );
        }
      } else if (tabActiva === 'equipos') {
        const [resEq, resDisc, resCat] = await Promise.all([
          serviciosParticipantes.obtenerEquipos({
            page: paginaEq,
            per_page: ITEMS_POR_PAGINA_EQ,
            search: filtrosEq.busqueda || undefined,
            category_id:
              filtrosEq.categoria !== 'todos' && filtrosEq.categoria !== 'sin_categoria'
                ? Number(filtrosEq.categoria)
                : undefined,
            registration_status: filtrosEq.estado === 'todos' ? undefined : filtrosEq.estado,
            sort:
              filtrosEq.orden === 'estado'
                ? 'registration_status'
                : filtrosEq.orden.startsWith('representante')
                ? 'representative'
                : 'name',
            direction: filtrosEq.orden.endsWith('_desc') ? 'desc' : 'asc',
          }),
          serviciosParticipantes.obtenerDisciplinasCampeonato(campeonatoId),
          serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoId),
        ]);
        if (resEq.success) {
          setEquipos(resEq.data.teams);
          setPaginacionEq(resEq.data.pagination);
        }
        if (resDisc.success) {
          setDisciplinas(
            resDisc.data.map((cd: any) => ({
              id: cd.id,
              name: cd.discipline?.name || 'Desconocido',
              description: cd.discipline?.description || '',
              rules: cd.discipline?.rules || '',
              status: cd.discipline?.status || 'active',
            }))
          );
        }
        if (resCat.success) setCategorias(resCat.data);
      } else if (tabActiva === 'jugadores') {
        const [resJug, resEq] = await Promise.all([
          serviciosParticipantes.obtenerJugadoresPorCampeonato({
            page: paginaJug,
            per_page: ITEMS_POR_PAGINA_JUG,
            search: filtrosJug.busqueda || undefined,
            category_id: filtrosJug.categoriaId || undefined,
            championship_team_id: filtrosJug.equipoId || undefined,
          }),
          serviciosParticipantes.obtenerTodosEquipos(),
        ]);
        if (resJug.success) {
          setJugadores(resJug.data.players);
          setPaginacionJug(resJug.data.pagination);
        }
        if (resEq.success) setEquipos(resEq.data);
      } else if (tabActiva === 'registro-equipo') {
        const [resDisc, resCat] = await Promise.all([
          serviciosParticipantes.obtenerDisciplinasCampeonato(campeonatoId),
          serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoId),
        ]);
        if (resDisc.success) {
          setDisciplinas(
            resDisc.data.map((cd: any) => ({
              id: cd.id,
              name: cd.discipline?.name || 'Desconocido',
              description: cd.discipline?.description || '',
              rules: cd.discipline?.rules || '',
              status: cd.discipline?.status || 'active',
            }))
          );
        }
        if (resCat.success) setCategorias(resCat.data);
      } else if (tabActiva === 'planilla-jugadores') {
        const resEq = await serviciosParticipantes.obtenerTodosEquipos();
        if (resEq.success) setEquipos(resEq.data);
      }
    } catch {
      setErrorLocal('Error al cargar datos del módulo.');
    } finally {
      setCargando(false);
    }
  }, [
    campeonatoId,
    tabActiva,
    paginaEq,
    paginaJug,
    filtrosEq.busqueda,
    filtrosEq.estado,
    filtrosEq.categoria,
    filtrosEq.orden,
    filtrosJug.busqueda,
    filtrosJug.orden,
    filtrosJug.categoriaId,
    filtrosJug.equipoId,
  ]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Filtro/orden client-side sobre equipos (la búsqueda por delegado se aplica aquí, no en la API)
  const equiposFiltrados = equipos
    .filter((eq) => {
      const texto = filtrosEq.busqueda.trim().toLowerCase();
      const coincideTexto =
        !texto ||
        eq.name.toLowerCase().includes(texto) ||
        (eq.representative || '').toLowerCase().includes(texto);
      const coincideEstado =
        filtrosEq.estado === 'todos' || (eq.registration_status || 'pendiente') === filtrosEq.estado;
      const coincideDelegado = delegadoTeamId === null || eq.id === delegadoTeamId;
      const coincideCategoria =
        filtrosEq.categoria === 'todos' ||
        (eq.category && String(eq.category.id) === filtrosEq.categoria) ||
        (!eq.category && filtrosEq.categoria === 'sin_categoria');
      return coincideTexto && coincideEstado && coincideDelegado && coincideCategoria;
    })
    .sort((a, b) => {
      if (filtrosEq.orden === 'nombre_asc') return a.name.localeCompare(b.name);
      if (filtrosEq.orden === 'nombre_desc') return b.name.localeCompare(a.name);
      if (filtrosEq.orden === 'representante_asc')
        return (a.representative || '').localeCompare(b.representative || '');
      if (filtrosEq.orden === 'representante_desc')
        return (b.representative || '').localeCompare(a.representative || '');
      if (filtrosEq.orden === 'estado')
        return (a.registration_status || 'pendiente').localeCompare(b.registration_status || 'pendiente');
      return 0;
    });

  const jugadoresFiltrados = jugadores
    .filter((j) => {
      const texto = filtrosJug.busqueda.trim().toLowerCase();
      const coincideTexto = !texto || j.name.toLowerCase().includes(texto);
      const teamIdJugador = j.team_id || j.team?.id;
      const coincideDelegado = delegadoTeamId === null || teamIdJugador === delegadoTeamId;
      const coincideCategoria = !filtrosJug.categoriaId || j.team?.category?.id === filtrosJug.categoriaId;
      const coincideEquipo = !filtrosJug.equipoId || teamIdJugador === filtrosJug.equipoId;
      return coincideTexto && coincideDelegado && coincideCategoria && coincideEquipo;
    })
    .sort((a, b) => {
      if (filtrosJug.orden === 'nombre_asc') return a.name.localeCompare(b.name);
      if (filtrosJug.orden === 'nombre_desc') return b.name.localeCompare(a.name);
      if (filtrosJug.orden === 'equipo_asc') return (a.team?.name || '').localeCompare(b.team?.name || '');
      if (filtrosJug.orden === 'equipo_desc') return (b.team?.name || '').localeCompare(a.team?.name || '');
      return 0;
    });

  return {
    cargando,
    errorLocal,
    disciplinas,
    categorias,
    equipos,
    jugadores,
    equiposFiltrados,
    jugadoresFiltrados,
    setDisciplinas,
    setCategorias,
    setEquipos,
    setJugadores,
    filtrosEq,
    setFiltrosEq,
    paginaEq,
    setPaginaEq,
    paginacionEq,
    filtrosJug,
    setFiltrosJug,
    paginaJug,
    setPaginaJug,
    paginacionJug,
    recargar: cargarDatos,
  };
}