import { useCallback, useEffect, useState } from 'react';
import {
  serviciosFixture,
  serviciosParticipantes,
  serviciosEventosCompetencia,
} from '../../servicios/api';
import type { Disciplina, Categoria, Escenario, Jugador, Partido } from '../../servicios/api';
import type { FixtureHookState } from '../../types/Fixture';

interface UseFixtureDataParams {
  campeonatoId: number | null;
}

export function useFixtureData({ campeonatoId }: UseFixtureDataParams): FixtureHookState {
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!campeonatoId) return;

    setCargando(true);
    setErrorLocal(null);

    try {
      const [resEscenarios, resPartidos, resDisciplinas, resCategorias, resJugadores] = await Promise.all([
        serviciosFixture.obtenerEscenarios(),
        serviciosFixture.obtenerTodosPartidos(),
        serviciosParticipantes.obtenerDisciplinasCampeonato(campeonatoId),
        serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoId),
        serviciosParticipantes.obtenerJugadoresPorCampeonato({ page: 1, per_page: 500 }),
      ]);

      if (resEscenarios.success) setEscenarios(resEscenarios.data);
      if (resPartidos.success) setPartidos(resPartidos.data);
      if (resDisciplinas.success) {
        setDisciplinas(
          resDisciplinas.data.map((d: any) => ({
            id: d.id,
            name: d.discipline?.name || 'Desconocida',
            description: d.discipline?.description || '',
            rules: d.discipline?.rules || '',
            status: d.discipline?.status || 'active',
            championship_discipline_id: d.id,
            championship_id: campeonatoId,
            disciple_id: d.discipline_id,
          })) as Disciplina[]
        );
      }
      if (resCategorias.success) setCategorias(resCategorias.data);
      if (resJugadores.success) setJugadores(resJugadores.data.players || []);
    } catch {
      setErrorLocal('Error al cargar datos del fixture.');
    } finally {
      setCargando(false);
    }
  }, [campeonatoId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return {
    escenarios,
    partidos,
    disciplinas,
    categorias,
    jugadores,
    cargando,
    errorLocal,
    recargar,
  };
}
