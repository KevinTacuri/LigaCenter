import { useEffect, useState } from 'react';
import { serviciosParticipantes } from '../../servicios/api';
import { calcularEdad } from '../../utils/organizador/calcularEdad';
import type { FilaJugador } from '../../types/Participantes';
import type { Jugador, Equipo } from '../../servicios/api';

interface UsePlanillaJugadoresParams {
  equipoSelId: number | null;
  equipos: Equipo[];
  isDeadlineExpired: boolean;
  mostrarMensaje: (msg: string, esError?: boolean) => void;
}

export function usePlanillaJugadores({
  equipoSelId,
  equipos,
  isDeadlineExpired,
  mostrarMensaje,
}: UsePlanillaJugadoresParams) {
  const [equipoSel, setEquipoSel] = useState<Equipo | null>(null);
  const [filasJugadores, setFilasJugadores] = useState<FilaJugador[]>([]);
  const [cargandoPlanilla, setCargandoPlanilla] = useState(false);
  const [jugadoresDePlanilla, setJugadoresDePlanilla] = useState<Jugador[]>([]);

  const cargarJugadoresDeEquipo = async (teamId: number) => {
    setCargandoPlanilla(true);
    try {
      const res = await serviciosParticipantes.obtenerTodosJugadoresPorCampeonato();
      if (res.success) {
        const jugEquipo = res.data.filter((j: any) => {
          const tId = j.team_id ?? j.team?.id;
          return tId === teamId;
        });

        const filas: FilaJugador[] = jugEquipo.map((j: any) => ({
          id: j.id,
          nombre: j.name || (j.names ? `${j.names} ${j.last_names || ''}`.trim() : ''),
          dni: j.dni || j.document_number || '',
          edad: calcularEdad(j.birth_date),
          dorsal: j.number != null ? String(j.number) : '',
          guardado: true,
          foto: j.photo || null,
        }));

        setJugadoresDePlanilla(res.data.filter((j: any) => (j.team_id ?? j.team?.id) === teamId));

        if (!isDeadlineExpired) {
          filas.push({ nombre: '', dni: '', edad: '', dorsal: '', guardado: false });
        }
        setFilasJugadores(filas);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al cargar jugadores del equipo.', true);
    } finally {
      setCargandoPlanilla(false);
    }
  };

  useEffect(() => {
    if (equipoSelId !== null) {
      cargarJugadoresDeEquipo(equipoSelId);
      const eq = equipos.find((e) => e.id === equipoSelId) || null;
      setEquipoSel(eq);
    } else {
      setFilasJugadores([]);
      setEquipoSel(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipoSelId, equipos]);

  const actualizarFila = (idx: number, campo: keyof FilaJugador, valor: any) => {
    setFilasJugadores((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [campo]: valor, error: undefined } : f))
    );
  };

  const guardarFila = async (idx: number) => {
    if (!equipoSelId) return;
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    const fila = filasJugadores[idx];
    if (!fila.nombre.trim() || !fila.edad.trim()) {
      setFilasJugadores((prev) =>
        prev.map((f, i) => (i === idx ? { ...f, error: 'Nombre y edad son obligatorios.' } : f))
      );
      return;
    }
    setFilasJugadores((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, guardando: true, error: undefined } : f))
    );
    try {
      const formData = new FormData();
      formData.append('full_name', fila.nombre.trim());
      formData.append('team_id', String(equipoSelId));
      formData.append('age', fila.edad);
      if (fila.dni.trim()) formData.append('dni', fila.dni.trim());
      if (fila.dorsal.trim()) formData.append('number', fila.dorsal.trim());
      if (fila.fotoFile) formData.append('photo', fila.fotoFile);

      const res = await serviciosParticipantes.crearJugador(formData);
      if (res.success) {
        mostrarMensaje('Jugador guardado.');
        cargarJugadoresDeEquipo(equipoSelId);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar jugador.';
      setFilasJugadores((prev) =>
        prev.map((f, i) => (i === idx ? { ...f, guardando: false, error: msg } : f))
      );
    }
  };

  const eliminarFilaJugador = async (idx: number, confirmar: () => Promise<boolean>) => {
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    const fila = filasJugadores[idx];
    if (!fila.guardado) {
      setFilasJugadores((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!fila.id) return;

    const confirmado = await confirmar();
    if (!confirmado) return;

    try {
      const res = await serviciosParticipantes.eliminarJugadorDeCampeonato(fila.id);
      if (res.success) {
        setFilasJugadores((prev) => prev.filter((_, i) => i !== idx));
        mostrarMensaje('Jugador eliminado.');
        if (equipoSelId !== null) cargarJugadoresDeEquipo(equipoSelId);
      }
    } catch {
      mostrarMensaje('Error al eliminar jugador.', true);
    }
  };

  return {
    equipoSel,
    filasJugadores,
    cargandoPlanilla,
    jugadoresDePlanilla,
    cargarJugadoresDeEquipo,
    actualizarFila,
    guardarFila,
    eliminarFilaJugador,
  };
}