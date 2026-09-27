import { useMemo, useState } from 'react';
import type { Escenario, Partido } from '../../servicios/api';
import { calcularTotalPaginas, obtenerEquiposEnPartidos, obtenerRondasDisponibles } from '../../utils/organizador/fixtureFechas';

interface UseFixtureFiltrosParams {
  partidos: Partido[];
  escenarios: Escenario[];
  itemsPorPaginaPartidos?: number;
  itemsPorPaginaEscenarios?: number;
}

export function useFixtureFiltros({
  partidos,
  escenarios,
  itemsPorPaginaPartidos = 10,
  itemsPorPaginaEscenarios = 6,
}: UseFixtureFiltrosParams) {
  const [filtroRondaPartidos, setFiltroRondaPartidos] = useState<number | null>(null);
  const [filtroEquipoPartidos, setFiltroEquipoPartidos] = useState<number | null>(null);
  const [filtroEstadoPartidos, setFiltroEstadoPartidos] = useState<string>('todos');
  const [filtroCanchaPartidos, setFiltroCanchaPartidos] = useState<number | null>(null);
  const [paginaPartidosProg, setPaginaPartidosProg] = useState<number>(1);
  const [filtroTextoEsc, setFiltroTextoEsc] = useState('');
  const [filtroTipoEsc, setFiltroTipoEsc] = useState('todos');
  const [paginaEscenarios, setPaginaEscenarios] = useState(1);

  const rondasDisponiblesProg = useMemo(
    () => obtenerRondasDisponibles(partidos),
    [partidos]
  );

  const equiposEnPartidos = useMemo(
    () => obtenerEquiposEnPartidos(partidos),
    [partidos]
  );

  const partidosFiltradosProg = useMemo(() => {
    return partidos.filter((partido) => {
      const coincideRonda = !filtroRondaPartidos || partido.round === filtroRondaPartidos;
      const coincideEquipo =
        !filtroEquipoPartidos ||
        partido.local_team_id === filtroEquipoPartidos ||
        partido.visitor_team_id === filtroEquipoPartidos;
      const coincideEstado = filtroEstadoPartidos === 'todos' || partido.status === filtroEstadoPartidos;
      const coincideCancha = !filtroCanchaPartidos || partido.venue_id === filtroCanchaPartidos;
      return coincideRonda && coincideEquipo && coincideEstado && coincideCancha;
    });
  }, [partidos, filtroRondaPartidos, filtroEquipoPartidos, filtroEstadoPartidos, filtroCanchaPartidos]);

  const totalPaginasPartidosProg = useMemo(
    () => calcularTotalPaginas(partidosFiltradosProg.length, itemsPorPaginaPartidos),
    [partidosFiltradosProg.length, itemsPorPaginaPartidos]
  );

  const partidosPaginadosProg = useMemo(
    () =>
      partidosFiltradosProg.slice(
        (paginaPartidosProg - 1) * itemsPorPaginaPartidos,
        paginaPartidosProg * itemsPorPaginaPartidos
      ),
    [partidosFiltradosProg, paginaPartidosProg, itemsPorPaginaPartidos]
  );

  const escenariosFiltrados = useMemo(() => {
    return escenarios.filter((escenario) => {
      const coincideTexto =
        !filtroTextoEsc.trim() ||
        escenario.name?.toLowerCase().includes(filtroTextoEsc.toLowerCase()) ||
        escenario.location?.toLowerCase().includes(filtroTextoEsc.toLowerCase());
      const coincideTipo = filtroTipoEsc === 'todos' || escenario.venue_type === filtroTipoEsc;
      return coincideTexto && coincideTipo;
    });
  }, [escenarios, filtroTextoEsc, filtroTipoEsc]);

  const totalPaginasEscenarios = useMemo(
    () => calcularTotalPaginas(escenariosFiltrados.length, itemsPorPaginaEscenarios),
    [escenariosFiltrados.length, itemsPorPaginaEscenarios]
  );

  const escenariosPaginados = useMemo(
    () =>
      escenariosFiltrados.slice(
        (paginaEscenarios - 1) * itemsPorPaginaEscenarios,
        paginaEscenarios * itemsPorPaginaEscenarios
      ),
    [escenariosFiltrados, paginaEscenarios, itemsPorPaginaEscenarios]
  );

  const hayFiltrosPartidosActivos = !!(
    filtroRondaPartidos ||
    filtroEquipoPartidos ||
    filtroEstadoPartidos !== 'todos' ||
    filtroCanchaPartidos
  );

  const limpiarFiltrosPartidos = () => {
    setFiltroRondaPartidos(null);
    setFiltroEquipoPartidos(null);
    setFiltroEstadoPartidos('todos');
    setFiltroCanchaPartidos(null);
    setPaginaPartidosProg(1);
  };

  return {
    filtroRondaPartidos,
    setFiltroRondaPartidos,
    filtroEquipoPartidos,
    setFiltroEquipoPartidos,
    filtroEstadoPartidos,
    setFiltroEstadoPartidos,
    filtroCanchaPartidos,
    setFiltroCanchaPartidos,
    paginaPartidosProg,
    setPaginaPartidosProg,
    filtroTextoEsc,
    setFiltroTextoEsc,
    filtroTipoEsc,
    setFiltroTipoEsc,
    paginaEscenarios,
    setPaginaEscenarios,
    rondasDisponiblesProg,
    equiposEnPartidos,
    partidosFiltradosProg,
    totalPaginasPartidosProg,
    partidosPaginadosProg,
    escenariosFiltrados,
    totalPaginasEscenarios,
    escenariosPaginados,
    hayFiltrosPartidosActivos,
    limpiarFiltrosPartidos,
  };
}
