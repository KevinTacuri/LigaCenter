import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { useConfirm } from '@omit/react-confirm-dialog';
import {
  serviciosFixture,
  serviciosParticipantes,
  serviciosEventosCompetencia,
} from '../../servicios/api';
import type {
  Escenario,
  Partido,
  Disciplina,
  Categoria,
  Jugador,
  Equipo,
} from '../../servicios/api';

import FormularioEvento from '../../componentes/programacion/eventos/FormularioEvento';
import ListaParticipantesEvento from '../../componentes/programacion/eventos/ListaParticipantesEvento';
import ModalParticipantesEvento from '../../componentes/programacion/eventos/ModalParticipantesEvento';
import ListaEventos from '../../componentes/programacion/eventos/ListaEventos';
import ModalEditarEvento from '../../componentes/programacion/eventos/ModalEditarEvento';

import type {
  DatosEvento,
  DatosEdicionEvento,
  EventoCompetencia,
  ParticipanteEvento,
} from '../../types/CompetitionEvent';

type TabType = 'escenarios' | 'generar' | 'programar' | 'partidos' | 'eventos';

export const ProgramacionFixture: React.FC = () => {
  const { usuario, tienePermiso, tieneRol, cargando: cargandoAuth } = useAutenticacion();
  const { campeonatoActivo, cargandoCampeonato } = useCampeonato();
  const navegar = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const queryTab = searchParams.get('tab');

  const membresiaActiva = campeonatoActivo && usuario?.championship_memberships?.find(
    (m: any) => m.championship_id === campeonatoActivo.id
  );
  const esDelegado = membresiaActiva && membresiaActiva.role === 'team_delegate';

  const [tabActiva, setTabActiva] = useState<TabType>(() => {
    const tab = searchParams.get('tab');
    if (tab && ['escenarios', 'generar', 'programar', 'partidos', 'eventos'].includes(tab)) {
      return tab as TabType;
    }
    return 'escenarios';
  });

  useEffect(() => {
    if (esDelegado && tabActiva !== 'partidos') {
      setTabActiva('partidos');
      setSearchParams({ tab: 'partidos' });
    }
  }, [esDelegado, tabActiva]);

  // Redirigir si no hay campeonato activo
  useEffect(() => {
    if (cargandoAuth || cargandoCampeonato) return;
    if (!campeonatoActivo) {
      navegar('/tablero');
    }
  }, [campeonatoActivo, cargandoAuth, cargandoCampeonato, navegar]);

  useEffect(() => {
    if (queryTab && queryTab !== tabActiva) {
      setTabActiva(queryTab as TabType);
    }
  }, [queryTab]);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const PASOS_AYUDA_FIXTURE = [
    { paso: '1', titulo: 'Registrar Escenarios', desc: 'Agrega las canchas o recintos deportivos con su ubicación, tipo y capacidad en la pestaña "Escenarios".', icono: 'stadium' },
    { paso: '2', titulo: 'Generar el Fixture', desc: 'Ve a "Generar Fixture", selecciona la disciplina y categoría, define la fecha de inicio del campeonato y marca las canchas utilizables. NOTA: Debes tener al menos 2 equipos aprobados en la categoría.', icono: 'calendar_today' },
    { paso: '3', titulo: 'Programación de Fechas', desc: 'En "Asignar Fechas" puedes asignar automáticamente canchas y horas (separadas por comas, ej: 08:00, 10:00) a los partidos de una fecha en específico.', icono: 'schedule' },
    { paso: '4', titulo: 'Ver y Reprogramar Partidos', desc: 'En la pestaña "Partidos" verás el fixture programado. Puedes usar "Reprogramar" para ajustar manualmente la fecha, hora o escenario de un partido.', icono: 'edit' },
  ];

  // Estados de datos
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  // Filtros de la lista de Partidos
  const [filtroRondaPartidos, setFiltroRondaPartidos] = useState<number | null>(null);
  const [filtroEquipoPartidos, setFiltroEquipoPartidos] = useState<number | null>(null);
  const [filtroEstadoPartidos, setFiltroEstadoPartidos] = useState<string>('todos');
  const [filtroCanchaPartidos, setFiltroCanchaPartidos] = useState<number | null>(null);

  // Cambio entre ui para generar fixture (partidos como futbol, básquetbol, etc.) o eventos (natacion, atletismo, etc.)
  type GenerarMode = 'fixture' | 'eventos';
  const [generarMode, setGenerarMode] =
  useState<GenerarMode>('fixture');

  // Datos para generar eventos
  const [datosEvento, setDatosEvento] = useState<DatosEvento>({
    discipline_id: '',
    category_id: '',
    name: '',
    event_type: 'carrera',
    participation_type: 'individual',
    date: '',
    start_time: '',
    venue_id: '',
  });

  // Eventos de competencia (para disciplinas de atletismo, natación, etc.)
  const [eventosCompetencia, setEventosCompetencia] = useState<EventoCompetencia[]>([]);

  // estados
  const [eventoGestionado, setEventoGestionado] = useState<EventoCompetencia | null>(null);
  const [participantesEvento, setParticipantesEvento] = useState<ParticipanteEvento[]>([]);
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false);

  // estados para editar eventos
  const [eventoEditando, setEventoEditando] = useState<EventoCompetencia | null>(null);

  const [datosEdicionEvento, setDatosEdicionEvento] = useState<DatosEdicionEvento>({
    name: '',
    event_type: 'carrera',
    date: '',
    start_time: '',
    venue_id: '',
    status: 'programado',
  });

  // Abrir modal de edición de evento
  const abrirEdicionEvento = (evento: EventoCompetencia) => {
    setEventoEditando(evento);

    setDatosEdicionEvento({
      name: evento.name ?? '',
      event_type: evento.event_type,
      date: evento.date?.substring(0, 10) ?? '',
      start_time: evento.start_time?.substring(0, 5) ?? '',
      venue_id: evento.venue_id?.toString() ?? '',
      status: evento.status,
    });
  };

  // Guardar edición de evento
  const guardarEdicionEvento = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventoEditando) return;

    try {
      const res =
        await serviciosEventosCompetencia.actualizarEvento(
          eventoEditando.id,
          {
            name: datosEdicionEvento.name,
            event_type: datosEdicionEvento.event_type,
            date: datosEdicionEvento.date,
            start_time:
              datosEdicionEvento.start_time || null,
            venue_id: datosEdicionEvento.venue_id
              ? parseInt(datosEdicionEvento.venue_id)
              : null,
            status: datosEdicionEvento.status,
          }
        );

      if (res.success) {
        mostrarMensaje('Evento actualizado correctamente.');

        setEventoEditando(null);

        await cargarDatos();
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al actualizar el evento.',
        true
      );
    }
  };

  // Eliminar evento
  const eliminarEventoCompetencia = async (id: number) => {
    const confirmado = await confirm({
      title: 'Eliminar evento',
      description:
        '¿Está seguro de eliminar este evento? También se eliminarán sus participantes y resultados relacionados.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'destructive',
      },
    });

    if (!confirmado) return;

    try {
      const res =
        await serviciosEventosCompetencia.eliminarEvento(id);

      if (res.success) {
        mostrarMensaje('Evento eliminado correctamente.');
        await cargarDatos();
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al eliminar el evento.',
        true
      );
    }
  };

  // estados para agregar participantes a un evento
  const [modalParticipante, setModalParticipante] = useState(false);
  const [jugadoresDisponibles, setJugadoresDisponibles] =
    useState<Jugador[]>([]);
  const [equiposDisponibles, setEquiposDisponibles] =
    useState<Equipo[]>([]);
  const [busquedaParticipante, setBusquedaParticipante] =
    useState('');

  const [
    participantesSeleccionados,
    setParticipantesSeleccionados,
  ] = useState<number[]>([]);

  const [
    cargandoOpcionesParticipantes,
    setCargandoOpcionesParticipantes,
  ] = useState(false);

  const toggleParticipanteEvento = (id: number) => {
    setParticipantesSeleccionados((prev) =>
      prev.includes(id)
        ? prev.filter((participanteId) =>
            participanteId !== id
          )
        : [...prev, id]
    );
  };

  const seleccionarTodosParticipantes = () => {
    if (!eventoGestionado) return;

    const opciones =
      eventoGestionado.participation_type === 'team'
        ? equiposDisponibles
        : jugadoresDisponibles;

    if (
      participantesSeleccionados.length ===
      opciones.length
    ) {
      setParticipantesSeleccionados([]);
    } else {
      setParticipantesSeleccionados(
        opciones.map((opcion) => opcion.id)
      );
    }
  };

  const cargarOpcionesParticipantesEvento = async (
    search: string = ''
  ) => {
    if (!eventoGestionado) return;

    setCargandoOpcionesParticipantes(true);

    try {
      if (
        eventoGestionado.participation_type ===
        'individual'
      ) {
        const res =
          await serviciosParticipantes
            .obtenerJugadoresPorCampeonato({
              category_id:
                eventoGestionado.category_id,

              available_for_event_id:
                eventoGestionado.id,

              search: search || undefined,
              per_page: 50,
            });

        if (res.success) {
          const data = res.data as {
            players?: Jugador[];
          };

          setJugadoresDisponibles(
            data.players ?? []
          );

          setEquiposDisponibles([]);
        }
      } else {
        const res =
          await serviciosParticipantes
            .obtenerEquipos(
              { category_id: eventoGestionado.category_id }
            );

        if (res.success) {
          const equiposYaInscritos = new Set(
            participantesEvento
              .map(
                (participante) =>
                  participante.championship_team_id
              )
              .filter(
                (id): id is number =>
                  id !== null
              )
          );

          const termino =
            search.trim().toLowerCase();

          const disponibles = res.data.teams.filter(
            (equipo: Equipo) =>
              !equiposYaInscritos.has(equipo.id) &&
              (
                !termino ||
                equipo.name
                  .toLowerCase()
                  .includes(termino)
              )
          );

          setEquiposDisponibles(disponibles);
          setJugadoresDisponibles([]);
        }
      }
    } catch {
      mostrarMensaje(
        eventoGestionado.participation_type === 'team'
          ? 'Error al cargar los equipos.'
          : 'Error al cargar los jugadores.',
        true
      );
    } finally {
      setCargandoOpcionesParticipantes(false);
    }
  };

  const agregarParticipantesEvento = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!eventoGestionado) return;

    if (participantesSeleccionados.length === 0) {
      mostrarMensaje(
        eventoGestionado.participation_type === 'team'
          ? 'Selecciona al menos un equipo.'
          : 'Selecciona al menos un jugador.',
        true
      );

      return;
    }

    try {
      const esPorEquipos =
        eventoGestionado.participation_type ===
        'team';

      const respuestas = await Promise.all(
        participantesSeleccionados.map((id) =>
          serviciosEventosCompetencia
            .agregarParticipante({
              competition_event_id:
                eventoGestionado.id,

              championship_player_id:
                esPorEquipos ? null : id,

              championship_team_id:
                esPorEquipos ? id : null,

              status: 'inscrito',
            })
        )
      );

      const registrados = respuestas.filter(
        (res) => res.success
      ).length;

      mostrarMensaje(
        `${registrados} ${
          esPorEquipos
            ? 'equipo(s)'
            : 'participante(s)'
        } agregados correctamente.`
      );

      setParticipantesSeleccionados([]);
      setModalParticipante(false);

      await gestionarEvento(eventoGestionado);
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al agregar participantes.',
        true
      );
    }
  };

  const cargarEventosCompetencia = async () => {
    try {
      const res =
        await serviciosEventosCompetencia.obtenerEventos();

      if (res.success) {
        setEventosCompetencia(res.data);
      }
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    }
  };

  const abrirModalParticipantes = () => {
    setParticipantesSeleccionados([]);
    setBusquedaParticipante('');

    setJugadoresDisponibles([]);
    setEquiposDisponibles([]);

    setModalParticipante(true);

    cargarOpcionesParticipantesEvento();
  };

  // Manejo de creación de eventos
  const manejarCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoria = categorias.find(
      (c) => c.id === parseInt(datosEvento.category_id)
    );

    if (!categoria?.championship_discipline?.id) {
      mostrarMensaje(
        'No se pudo determinar la disciplina del campeonato.',
        true
      );
      return;
    }

    try {
      const res = await serviciosEventosCompetencia.crearEvento({
        championship_discipline_id:
          categoria.championship_discipline.id,

        category_id: parseInt(datosEvento.category_id),

        name: datosEvento.name,

        event_type: datosEvento.event_type,
        
        participation_type: datosEvento.participation_type,

        date: datosEvento.date,

        start_time: datosEvento.start_time || null,

        venue_id: datosEvento.venue_id
          ? parseInt(datosEvento.venue_id)
          : null,

        status: 'programado',
      });

      if (res.success) {
        mostrarMensaje('Evento programado correctamente.');

        setDatosEvento({
          discipline_id: '',
          category_id: '',
          name: '',
          event_type: 'carrera',
          date: '',
          start_time: '',
          venue_id: '',
          participation_type: 'individual',
        });

        cargarEventosCompetencia();
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al programar el evento.',
        true
      );
    }
  };

  // Manejo de gestión de eventos (ver participantes)
  const gestionarEvento = async (evento: EventoCompetencia) => {
    setEventoGestionado(evento);
    setCargandoParticipantes(true);

    try {
      const res =
        await serviciosEventosCompetencia.obtenerParticipantes(
          evento.id
        );

      if (res.success) {
        setParticipantesEvento(res.data);
      }
    } catch (err) {
      mostrarMensaje(
        'Error al cargar los participantes del evento.',
        true
      );
    } finally {
      setCargandoParticipantes(false);
    }
  };

  const quitarParticipanteEvento = async (
    participanteId: number
  ) => {
    if (!eventoGestionado) return;

    const confirmado = await confirm({
      title: 'Quitar participante',
      description:
        '¿Está seguro de quitar este participante del evento?',
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'destructive',
      },
    });

    if (!confirmado) return;

    try {
      const res =
        await serviciosEventosCompetencia.eliminarParticipante(
          participanteId
        );

      if (res.success) {
        mostrarMensaje(
          'Participante retirado correctamente.'
        );

        await gestionarEvento(eventoGestionado);
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al quitar el participante.',
        true
      );
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '-';

    const [year, month, day] = fecha
      .substring(0, 10)
      .split('-');

    return `${day}/${month}/${year}`;
  };

  // Estados de formularios
  const [nuevoEsc, setNuevoEsc] = useState({ name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active' });
  const [modalEditarEsc, setModalEditarEsc] = useState<{ abierto: boolean; id: number | null; name: string; venue_type: string; location: string; capacity: string; status: string; guardando: boolean }>({
    abierto: false, id: null, name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active', guardando: false
  });
  const [datosFixture, setDatosFixture] = useState({ 
    discipline_id: '', 
    category_id: '', 
    start_date: '', 
    venue_ids: [] as number[], 
    format: 'liga' as 'liga' | 'grupos' | 'eliminacion_directa',
    num_groups: '',
    advance_per_group: '',
    third_place: false 
  });
  
  // Asignar fecha
  const [datosFecha, setDatosFecha] = useState({ discipline_id: '', category_id: '', round: '', available_hours: '', venue_ids: [] as number[] });
  
  // Reprogramación individual
  const [partidoParaReprogramar, setPartidoParaReprogramar] = useState<Partido | null>(null);
  const [datosReprog, setDatosReprog] = useState({ match_date: '', match_time: '', venue_id: '' });

  useEffect(() => {
    if (cargandoAuth || cargandoCampeonato) return;
    if (!tienePermiso('ver_equipos') || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [tabActiva, cargandoAuth, cargandoCampeonato]);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      const champId = parseInt(localStorage.getItem('campeonato_activo_id') || '0');
      if (tabActiva === 'escenarios') {
        const res = await serviciosFixture.obtenerEscenarios();
        if (res.success) setEscenarios(res.data);
      } else if (tabActiva === 'generar') {
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        const resCat = await serviciosParticipantes.obtenerCategoriasPorCampeonato(champId);
        const resEsc = await serviciosFixture.obtenerEscenarios();
        if (resDisc.success) setDisciplinas(resDisc.data);
        if (resCat.success) setCategorias(resCat.data);
        if (resEsc.success) setEscenarios(resEsc.data);
      } else if (tabActiva === 'programar') {
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        const resCat = await serviciosParticipantes.obtenerCategoriasPorCampeonato(champId);
        const resEsc = await serviciosFixture.obtenerEscenarios();
        const resPart = await serviciosFixture.obtenerTodosPartidos();
        if (resDisc.success) setDisciplinas(resDisc.data);
        if (resCat.success) setCategorias(resCat.data);
        if (resEsc.success) setEscenarios(resEsc.data);
        if (resPart.success) setPartidos(resPart.data);
      } else if (tabActiva === 'eventos') {
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        const resCat = await serviciosParticipantes.obtenerCategoriasPorCampeonato(champId);
        const resEventos = await serviciosEventosCompetencia.obtenerEventos();
        if (resDisc.success) setDisciplinas(resDisc.data);
        if (resCat.success) setCategorias(resCat.data);
        if (resEventos.success) setEventosCompetencia(resEventos.data);
      } else if (tabActiva === 'partidos') {
        const [resPart, resEsc, resJug] = await Promise.all([
          serviciosFixture.obtenerTodosPartidos(),
          serviciosFixture.obtenerEscenarios(),
          serviciosParticipantes.obtenerTodosJugadoresPorCampeonato()
        ]);
        if (resPart.success) setPartidos(resPart.data);
        if (resEsc.success) setEscenarios(resEsc.data);
        if (resJug.success) setJugadores(resJug.data);
      }
    } catch (err: any) {
      setErrorLocal('Error al cargar datos del módulo.');
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    if (esError) {
      sileo.error({ title: 'Error', description: msg });
    } else {
      sileo.success({ title: 'Operación Exitosa', description: msg });
    }
  };

  // Escenarios
  const guardarEscenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEsc.name || !nuevoEsc.location || !nuevoEsc.venue_type) return;
    try {
      const res = await serviciosFixture.crearEscenario({
        name: nuevoEsc.name,
        venue_type: nuevoEsc.venue_type,
        location: nuevoEsc.location,
        capacity: nuevoEsc.capacity ? parseInt(nuevoEsc.capacity) : null,
        is_available: nuevoEsc.status === 'active'
      });
      if (res.success) {
        mostrarMensaje('Escenario registrado con éxito.');
        setNuevoEsc({ name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al crear escenario.', true);
    }
  };

  const abrirModalEditarEsc = (esc: Escenario) => {
    setModalEditarEsc({
      abierto: true,
      id: esc.id,
      name: esc.name,
      venue_type: esc.venue_type,
      location: esc.location,
      capacity: esc.capacity ? String(esc.capacity) : '',
      status: esc.is_available ? 'active' : 'inactive',
      guardando: false
    });
  };

  const guardarEdicionEsc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarEsc.id || !modalEditarEsc.name || !modalEditarEsc.location) return;
    setModalEditarEsc(prev => ({ ...prev, guardando: true }));
    try {
      const res = await serviciosFixture.actualizarEscenario(modalEditarEsc.id, {
        name: modalEditarEsc.name,
        venue_type: modalEditarEsc.venue_type,
        location: modalEditarEsc.location,
        capacity: modalEditarEsc.capacity ? parseInt(modalEditarEsc.capacity) : null,
        is_available: modalEditarEsc.status === 'active'
      });
      if (res.success) {
        mostrarMensaje('Escenario actualizado con éxito.');
        setModalEditarEsc({ abierto: false, id: null, name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active', guardando: false });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al actualizar escenario.', true);
      setModalEditarEsc(prev => ({ ...prev, guardando: false }));
    }
  };

  const eliminarEscenario = async (id: number) => {
    const isConfirmed = await confirm({
      title: '¿Eliminar Escenario?',
      description: '¿Está seguro de que desea eliminar este escenario? Esta acción no se puede deshacer y podría afectar a partidos ya programados.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'destructive',
      }
    });
    if (isConfirmed) {
      try {
        const res = await serviciosFixture.eliminarEscenario(id);
        if (res.success) {
          mostrarMensaje('Escenario eliminado correctamente.');
          cargarDatos();
        }
      } catch {
        mostrarMensaje('No se puede eliminar. Puede estar siendo usado en partidos.', true);
      }
    }
  };

  // Generar Fixture
  const manejarGenerarFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    const { 
      discipline_id, 
      category_id, 
      start_date, 
      venue_ids, 
      format,
      num_groups,
      advance_per_group,
      third_place
    } = datosFixture;
    if (!discipline_id || !category_id || !start_date || venue_ids.length === 0) {
      mostrarMensaje('Complete todos los campos y seleccione al menos un escenario.', true);
      return;
    }

    // Construir format_settings dinámicamente según lo seleccionado en el formulario
    let format_settings: any = null;
    if (format === 'grupos') {
      const parsedGroups = parseInt(num_groups);
      const parsedAdvance = parseInt(advance_per_group);
      if (isNaN(parsedGroups) || isNaN(parsedAdvance)) {
        mostrarMensaje('Debes ingresar el número de grupos y de clasificados.', true);
        return;
      }
      format_settings = {
        num_groups: parsedGroups,
        advance_per_group: parsedAdvance,
        third_place: third_place
      };
    } else if (format === 'eliminacion_directa') {
      format_settings = {
        third_place: third_place
      };
    } else {
      format_settings = {};
    }

    try {
      // Primero actualizar el formato de la categoría en el backend si difiere del actual
      const catOriginal = categorias.find(c => c.id === parseInt(category_id));
      if (catOriginal) {
        await serviciosParticipantes.actualizarCategoria(parseInt(category_id), {
          ...catOriginal,
          format: format,
          format_settings: format_settings
        });
        const champId = parseInt(localStorage.getItem('campeonato_activo_id') || '0');
        const resCat = await serviciosParticipantes.obtenerCategoriasPorCampeonato(champId);
        if (resCat.success) setCategorias(resCat.data);
      }

      const res = await serviciosFixture.generarFixture({
        discipline_id: parseInt(discipline_id),
        category_id: parseInt(category_id),
        start_date,
        venue_ids
      });
      if (res.success) {
        mostrarMensaje('Fixture completo generado con éxito para este campeonato.');
        setDatosFixture({ 
          discipline_id: '', 
          category_id: '', 
          start_date: '', 
          venue_ids: [], 
          format: 'liga',
          num_groups: '',
          advance_per_group: '',
          third_place: false 
        });
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error en la generación del fixture.', true);
    }
  };

  const manejarCambioCheckboxVenue = (id: number) => {
    setDatosFixture((prev) => {
      const existe = prev.venue_ids.includes(id);
      const nuevas = existe ? prev.venue_ids.filter((vId) => vId !== id) : [...prev.venue_ids, id];
      return { ...prev, venue_ids: nuevas };
    });
  };

  // Programar Horarios de una Fecha (Automatic scheduling)
  const manejarProgramarFecha = async (e: React.FormEvent) => {
    e.preventDefault();
    const { discipline_id, category_id, round, available_hours, venue_ids } = datosFecha;
    if (!discipline_id || !category_id || !round || !available_hours || venue_ids.length === 0) {
      mostrarMensaje('Complete todos los campos obligatorios.', true);
      return;
    }
    const horasArr = available_hours.split(',').map((h) => h.trim());
    try {
      const res = await serviciosFixture.programarFecha({
        discipline_id: parseInt(discipline_id),
        category_id: parseInt(category_id),
        round: parseInt(round),
        available_hours: horasArr,
        venue_ids
      });
      if (res.success) {
        mostrarMensaje('Horarios y escenarios asignados a la fecha con éxito.');
        setDatosFecha({ discipline_id: '', category_id: '', round: '', available_hours: '', venue_ids: [] });
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error en la programación de horarios.', true);
    }
  };

  const manejarCambioCheckboxVenueFecha = (id: number) => {
    setDatosFecha((prev) => {
      const existe = prev.venue_ids.includes(id);
      const nuevas = existe ? prev.venue_ids.filter((vId) => vId !== id) : [...prev.venue_ids, id];
      return { ...prev, venue_ids: nuevas };
    });
  };

  // Reprogramación
  const iniciarReprogramacion = (partido: Partido) => {
    setPartidoParaReprogramar(partido);
    setDatosReprog({
      match_date: partido.match_date ? new Date(partido.match_date).toISOString().split('T')[0] : '',
      match_time: partido.match_time || '',
      venue_id: partido.venue_id ? partido.venue_id.toString() : ''
    });
  };

  const validarConflictosReprogramacion = (
    partidoId: number,
    localTeamId: number,
    visitorTeamId: number,
    proposedDate: string,
    proposedTime: string,
    proposedVenueId: number
  ): boolean => {
    const propStart = new Date(`${proposedDate}T${proposedTime}`);
    if (isNaN(propStart.getTime())) return false;

    // 1. Cruce de Canchas (Escenario) - ±90 minutos
    const conflictoEscenario = partidos.find(p => {
      if (p.id === partidoId || !p.match_date || !p.match_time || p.venue_id !== proposedVenueId) return false;
      const otherStart = new Date(`${p.match_date}T${p.match_time}`);
      if (isNaN(otherStart.getTime())) return false;
      const diffMin = Math.abs(propStart.getTime() - otherStart.getTime()) / (1000 * 60);
      return diffMin < 90;
    });

    if (conflictoEscenario) {
      sileo.error({
        title: 'Conflicto de Escenario 🚫',
        description: `El escenario ya está reservado para el partido "${conflictoEscenario.local_team?.name} vs ${conflictoEscenario.visitor_team?.name}" programado para las ${conflictoEscenario.match_time} (Margen mínimo de 90 minutos).`
      });
      return true; // Hay conflicto
    }

    // 2. Cruce de Jugadores - ±120 minutos (2 horas)
    const jugadoresPropuestos = jugadores.filter(
      j => j.team_id === localTeamId || j.team_id === visitorTeamId
    );

    // Buscar partidos en el rango de ±2 horas
    const partidosCercanos = partidos.filter(p => {
      if (p.id === partidoId || !p.match_date || !p.match_time) return false;
      const otherStart = new Date(`${p.match_date}T${p.match_time}`);
      if (isNaN(otherStart.getTime())) return false;
      const diffMin = Math.abs(propStart.getTime() - otherStart.getTime()) / (1000 * 60);
      return diffMin < 120;
    });

    for (const pCercano of partidosCercanos) {
      const teamIdsConflicto = [
        pCercano.local_team_id || (pCercano as any).home_team_id,
        pCercano.visitor_team_id || (pCercano as any).away_team_id
      ];

      // Jugadores de los equipos en conflicto
      const jugadoresConflicto = jugadores.filter(
        j => teamIdsConflicto.includes(j.team_id)
      );

      // Buscar si algún jugador está en ambos conjuntos (intersección)
      for (const jProp of jugadoresPropuestos) {
        const coincidencia = jugadoresConflicto.find(
          jc => (jProp.dni && jc.dni && jProp.dni === jc.dni) || 
                (jProp.name.toLowerCase().trim() === jc.name.toLowerCase().trim())
        );

        if (coincidencia) {
          const equipoActual = jProp.team_id === localTeamId 
            ? (partidoParaReprogramar?.local_team?.name || `Equipo ${localTeamId}`)
            : (partidoParaReprogramar?.visitor_team?.name || `Equipo ${visitorTeamId}`);
          
          const equipoConflicto = coincidencia.team?.name || `Equipo ID ${coincidencia.team_id}`;

          sileo.error({
            title: 'Conflicto de Jugadores (Doble reserva) 🚫',
            description: `El jugador "${jProp.name}" (DNI: ${jProp.dni || 'S/D'}) inscrito en "${equipoActual}" tiene un conflicto de horarios. También juega para "${equipoConflicto}" en el partido programado a las ${pCercano.match_time} (Margen mínimo de 2 horas).`
          });
          return true; // Hay conflicto
        }
      }
    }

    return false; // No hay conflicto
  };

  const guardarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoParaReprogramar) return;
    const { match_date, match_time, venue_id } = datosReprog;
    if (!match_date || !match_time || !venue_id) return;

    // Validación de conflictos en cliente
    const localId = partidoParaReprogramar.local_team_id || (partidoParaReprogramar as any).home_team_id;
    const visitorId = partidoParaReprogramar.visitor_team_id || (partidoParaReprogramar as any).away_team_id;
    
    const tieneConflicto = validarConflictosReprogramacion(
      partidoParaReprogramar.id,
      localId,
      visitorId,
      match_date,
      match_time,
      parseInt(venue_id)
    );
    
    if (tieneConflicto) return; // Detener flujo si hay conflicto

    try {
      const res = await serviciosFixture.reprogramarPartido(partidoParaReprogramar.id, {
        match_date,
        match_time,
        venue_id: parseInt(venue_id)
      });
      if (res.success) {
        mostrarMensaje('Partido reprogramado con éxito.');
        setPartidoParaReprogramar(null);
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al reprogramar partido.', true);
    }
  };

  if (!usuario) return null;

  const rondasDisponiblesProg = Array.from(new Set(partidos.map(p => p.round))).sort((a, b) => a - b);

  const partidosDeRondaSeleccionada = partidos.filter(p =>
    datosFecha.category_id && datosFecha.round &&
    p.category_id === parseInt(datosFecha.category_id) &&
    p.round === parseInt(datosFecha.round)
  );

  const equiposEnPartidos = Array.from(
    new Map(
      partidos.flatMap(p => [
        p.local_team ? [p.local_team_id, p.local_team.name] as [number, string] : null,
        p.visitor_team ? [p.visitor_team_id, p.visitor_team.name] as [number, string] : null,
      ].filter((v): v is [number, string] => v !== null))
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const partidosFiltradosProg = partidos.filter(p => {
    const coincideRonda = !filtroRondaPartidos || p.round === filtroRondaPartidos;
    const coincideEquipo = !filtroEquipoPartidos ||
      p.local_team_id === filtroEquipoPartidos || p.visitor_team_id === filtroEquipoPartidos;
    const coincideEstado = filtroEstadoPartidos === 'todos' || p.status === filtroEstadoPartidos;
    const coincideCancha = !filtroCanchaPartidos || p.venue_id === filtroCanchaPartidos;
    return coincideRonda && coincideEquipo && coincideEstado && coincideCancha;
  });

  const hayFiltrosPartidosActivos = !!(filtroRondaPartidos || filtroEquipoPartidos || filtroEstadoPartidos !== 'todos' || filtroCanchaPartidos);

  const limpiarFiltrosPartidos = () => {
    setFiltroRondaPartidos(null);
    setFiltroEquipoPartidos(null);
    setFiltroEstadoPartidos('todos');
    setFiltroCanchaPartidos(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen izquierdo en desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar titulo="Fixture y Programación" subtitulo="Generación de Encuentros y Asignación de Canchas" />

      {/* Tabs (visibles solo en móvil ya que en desktop se navega por la barra lateral) */}
      <div className="bg-[#11131c] border-b border-slate-900 px-6 py-2 flex flex-wrap gap-2 lg:hidden">
        {(!esDelegado ? (['escenarios', 'generar', 'eventos','programar', 'partidos'] as TabType[]) : (['partidos'] as TabType[])).map((tab) => (
          <button
            key={tab}
            onClick={() => setSearchParams({ tab })}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
              tabActiva === tab
                ? 'bg-indigo-650 text-white'
                : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
            }`}
          >
            {tab === 'escenarios' ? 'Escenarios' : tab === 'generar' ? 'Generar Fixture' : tab === 'eventos' ? 'Eventos' : tab === 'programar' ? 'Asignar Fechas' : 'Partidos'}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
        {cargando && (
          <div className="flex justify-center items-center py-2 text-xs font-bold text-slate-500 gap-2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <span>Cargando datos...</span>
          </div>
        )}
        


        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Reprogramación Modal/Caja flotante */}
        {partidoParaReprogramar && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-amber-200 pb-2">
              <h3 className="font-bold text-sm text-amber-800 uppercase tracking-wide">Reprogramar Partido</h3>
              <button onClick={() => setPartidoParaReprogramar(null)} className="text-amber-800 hover:font-bold cursor-pointer text-xs">Cerrar</button>
            </div>
            <p className="text-xs text-slate-700">
              Partido: <strong>{partidoParaReprogramar.local_team?.name} vs {partidoParaReprogramar.visitor_team?.name}</strong> (Fecha {partidoParaReprogramar.round})
            </p>
            <form onSubmit={guardarReprogramacion} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nueva Fecha</label>
                <input
                  type="date" required value={datosReprog.match_date}
                  onChange={(e) => setDatosReprog({ ...datosReprog, match_date: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nueva Hora</label>
                <input
                  type="text" required placeholder="Ej: 14:00" value={datosReprog.match_time}
                  onChange={(e) => setDatosReprog({ ...datosReprog, match_time: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Escenario / Cancha</label>
                <select
                  required value={datosReprog.venue_id}
                  onChange={(e) => setDatosReprog({ ...datosReprog, venue_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 cursor-pointer"
                >
                  <option value="">Seleccione Escenario</option>
                  {escenarios.map((esc) => (
                    <option key={esc.id} value={esc.id}>{esc.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="bg-secondary text-white font-bold py-2 rounded-lg text-xs hover:brightness-105 cursor-pointer">
                Confirmar Reprogramación
              </button>
            </form>
          </div>
        )}

        {/* Tab content logic */}
        {tabActiva === 'escenarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-fit">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Registrar Cancha/Escenario</h2>
              <form onSubmit={guardarEscenario} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nombre del Escenario *</label>
                  <input
                    type="text" required placeholder="Ej: Cancha Principal, Campo B"
                    value={nuevoEsc.name} onChange={(e) => setNuevoEsc({ ...nuevoEsc, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Tipo *</label>
                    <select
                      required
                      value={nuevoEsc.venue_type}
                      onChange={(e) => setNuevoEsc({ ...nuevoEsc, venue_type: e.target.value })}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="cancha">Cancha</option>
                      <option value="estadio">Estadio</option>
                      <option value="coliseo">Coliseo</option>
                      <option value="gimnasio">Gimnasio</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Capacidad</label>
                    <input
                      type="number" placeholder="Ej: 50" min="0"
                      value={nuevoEsc.capacity} onChange={(e) => setNuevoEsc({ ...nuevoEsc, capacity: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Ubicación *</label>
                  <input
                    type="text" required placeholder="Ej: Complejo Deportivo Norte"
                    value={nuevoEsc.location} onChange={(e) => setNuevoEsc({ ...nuevoEsc, location: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Estado *</label>
                  <select
                    value={nuevoEsc.status} onChange={(e) => setNuevoEsc({ ...nuevoEsc, status: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="active">Disponible / Activo</option>
                    <option value="inactive">No Disponible</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                  Guardar Escenario
                </button>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">Lista de Escenarios</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3 pl-4">Nombre Escenario</th>
                      <th className="p-3">Ubicación</th>
                      <th className="p-3 pr-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {escenarios.map((esc) => (
                      <tr key={esc.id} className="hover:bg-slate-50/40">
                        <td className="p-3 pl-4 font-bold text-slate-900">{esc.name}</td>
                        <td className="p-3 text-slate-600">{esc.location || 'No especificada'}</td>
                        <td className="p-3 pr-4 text-right space-x-3">
                          <button onClick={() => abrirModalEditarEsc(esc)} className="text-xs font-bold text-primary hover:underline cursor-pointer">Editar</button>
                          <button onClick={() => eliminarEscenario(esc.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                    {escenarios.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-slate-500 text-xs">No hay escenarios registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tabActiva === 'generar' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
            <div>
              {/* botones internos */}
              <div className="flex gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setGenerarMode('fixture')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    generarMode === 'fixture'
                      ? 'bg-secondary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    account_tree
                  </span>
                  Fixture
                </button>

                <button
                  type="button"
                  onClick={() => setGenerarMode('eventos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    generarMode === 'eventos'
                      ? 'bg-secondary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    event
                  </span>
                  Eventos
                </button>
              </div>

              {generarMode === 'fixture' && (
              <div>
              <h2 className="font-extrabold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">Generar Calendario Round Robin (Todos contra Todos)</h2>
              <form onSubmit={manejarGenerarFixture} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                    <select
                      required value={datosFixture.discipline_id}
                      onChange={(e) => setDatosFixture({ ...datosFixture, discipline_id: e.target.value, category_id: '' })}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                    >
                      <option value="">Seleccionar Disciplina</option>
                      {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Categoría *</label>
                    <select
                      required value={datosFixture.category_id}
                      onChange={(e) => {
                        const catId = e.target.value;
                        const format = categorias.find((c) => c.id === parseInt(catId))?.format || 'liga';
                        setDatosFixture({ ...datosFixture, category_id: catId, format });
                      }}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                    >
                      <option value="">Seleccionar Categoría</option>
                      {categorias
                        .filter((c) => !datosFixture.discipline_id || c.championship_discipline?.discipline_id === parseInt(datosFixture.discipline_id))
                        .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Fecha de Inicio del Torneo *</label>
                    <input
                      type="date" required value={datosFixture.start_date}
                      onChange={(e) => setDatosFixture({ ...datosFixture, start_date: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    />
                  </div>
                  {/* Formato de Competencia */}
                    <div className="space-y-1 border-t border-slate-105 pt-3">
                      <label className="text-xs font-bold text-slate-700 block">Formato de Competencia</label>
                      <select value={datosFixture.format} onChange={(e) => setDatosFixture({ ...datosFixture, format: e.target.value as any })}
                        className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                        <option value="liga">Liga (Todos contra todos)</option>
                        <option value="grupos">Fase de Grupos + Eliminación</option>
                        <option value="eliminacion_directa">Eliminación Directa</option>
                      </select>
                    </div>

                    {/* Campos condicionales de format_settings */}
                    {datosFixture.format === 'grupos' && (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">N° de Grupos *</label>
                            <input type="number" min="2" placeholder="Ej: 4"
                              value={datosFixture.num_groups} onChange={(e) => setDatosFixture({ ...datosFixture, num_groups: e.target.value })}
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-hidden bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Clasificados/Grupo *</label>
                            <input type="number" min="1" placeholder="Ej: 2"
                              value={datosFixture.advance_per_group} onChange={(e) => setDatosFixture({ ...datosFixture, advance_per_group: e.target.value })}
                              className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-hidden bg-white" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={datosFixture.third_place} onChange={(e) => setDatosFixture({ ...datosFixture, third_place: e.target.checked })}
                            className="rounded-sm border-slate-300 text-indigo-600 outline-hidden" />
                          <span className="text-[10px] font-bold text-slate-650 uppercase">Partido por 3° Puesto</span>
                        </label>
                      </div>
                    )}

                    {datosFixture.format === 'eliminacion_directa' && (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fadeIn">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={datosFixture.third_place} onChange={(e) => setDatosFixture({ ...datosFixture, third_place: e.target.checked })}
                            className="rounded-sm border-slate-300 text-indigo-600 outline-hidden" />
                          <span className="text-[10px] font-bold text-slate-650 uppercase">Partido por 3° Puesto</span>
                        </label>
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Escenarios Disponibles para Asignar *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    {escenarios.map((esc) => (
                      <label key={esc.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox" checked={datosFixture.venue_ids.includes(esc.id)}
                          onChange={() => manejarCambioCheckboxVenue(esc.id)}
                          className="rounded-sm border-slate-300 text-secondary focus:ring-secondary cursor-pointer"
                        />
                        {esc.name}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3 rounded-lg text-sm transition-all cursor-pointer">
                  Generar Fixture del Campeonato
                </button>
              </form>
              </div>
              )}
              {generarMode === 'eventos' && (
                <FormularioEvento
                  datosEvento={datosEvento}
                  setDatosEvento={setDatosEvento}
                  disciplinas={disciplinas}
                  categorias={categorias}
                  escenarios={escenarios}
                  onSubmit={manejarCrearEvento}
                 />
              )}
            </div>

          </div>
        )}

        {tabActiva === 'programar' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto">
            <h2 className="font-extrabold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">Asignar Horarios Automáticamente</h2>
            <form onSubmit={manejarProgramarFecha} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                  <select
                    required value={datosFecha.discipline_id}
                    onChange={(e) => setDatosFecha({ ...datosFecha, discipline_id: e.target.value, category_id: '' })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                  >
                    <option value="">Seleccionar Disciplina</option>
                    {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Categoría *</label>
                  <select
                    required value={datosFecha.category_id}
                    onChange={(e) => setDatosFecha({ ...datosFecha, category_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                  >
                    <option value="">Seleccionar Categoría</option>
                    {categorias
                      .filter((c) => !datosFecha.discipline_id || c.championship_discipline?.discipline_id === parseInt(datosFecha.discipline_id))
                      .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Número de Fecha (Round) *</label>
                  <select
                    required value={datosFecha.round}
                    onChange={(e) => setDatosFecha({ ...datosFecha, round: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                  >
                    <option value="">Seleccionar Fecha</option>
                    {rondasDisponiblesProg.map((r) => (
                      <option key={r} value={r}>Fecha {r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Horas Disponibles * (Separadas por comas)</label>
                  <input
                    type="text" required placeholder="Ej: 08:00, 10:00, 12:00, 14:00" value={datosFecha.available_hours}
                    onChange={(e) => setDatosFecha({ ...datosFecha, available_hours: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
              </div>

              {datosFecha.category_id && datosFecha.round && (
                <div className="space-y-1.5 bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    Partidos en esta Fecha ({partidosDeRondaSeleccionada.length})
                  </label>
                  {partidosDeRondaSeleccionada.length === 0 ? (
                    <p className="text-xs text-slate-500">No hay partidos con esta categoría y ronda todavía.</p>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {partidosDeRondaSeleccionada.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span>{p.local_team?.name} vs {p.visitor_team?.name}</span>
                          <span className="text-slate-400">{p.match_time || 'sin hora'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Escenarios Disponibles para esta Fecha *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  {escenarios.map((esc) => (
                    <label key={esc.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox" checked={datosFecha.venue_ids.includes(esc.id)}
                        onChange={() => manejarCambioCheckboxVenueFecha(esc.id)}
                        className="rounded-sm border-slate-300 text-secondary focus:ring-secondary cursor-pointer"
                      />
                      {esc.name}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3 rounded-lg text-sm transition-all cursor-pointer">
                Programar Fecha Automáticamente
              </button>
            </form>
          </div>
        )}

        {tabActiva === 'partidos' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="font-extrabold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">Programación de Partidos</h2>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mb-4">
              {rondasDisponiblesProg.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jornada</label>
                  <select
                    value={filtroRondaPartidos ?? ''}
                    onChange={(e) => setFiltroRondaPartidos(e.target.value ? Number(e.target.value) : null)}
                    className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="">Todas</option>
                    {rondasDisponiblesProg.map(r => (
                      <option key={r} value={r}>Fecha {r}</option>
                    ))}
                  </select>
                </div>
              )}

              {equiposEnPartidos.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Equipo</label>
                  <select
                    value={filtroEquipoPartidos ?? ''}
                    onChange={(e) => setFiltroEquipoPartidos(e.target.value ? Number(e.target.value) : null)}
                    className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="">Todos</option>
                    {equiposEnPartidos.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                <select
                  value={filtroEstadoPartidos}
                  onChange={(e) => setFiltroEstadoPartidos(e.target.value)}
                  className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="todos">Todos</option>
                  <option value="programado">Programado</option>
                  <option value="en_curso">En Curso</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="reprogramado">Reprogramado</option>
                </select>
              </div>

              {escenarios.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cancha</label>
                  <select
                    value={filtroCanchaPartidos ?? ''}
                    onChange={(e) => setFiltroCanchaPartidos(e.target.value ? Number(e.target.value) : null)}
                    className="w-full sm:w-auto text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="">Todas</option>
                    {escenarios.map(esc => (
                      <option key={esc.id} value={esc.id}>{esc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {hayFiltrosPartidosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltrosPartidos}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer pb-2"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3 pl-4">Fecha (Round)</th>
                    <th className="p-3">Partido (Equipos)</th>
                    <th className="p-3">Día y Hora</th>
                    <th className="p-3">Cancha / Escenario</th>
                    <th className="p-3">Estado</th>
                    {!esDelegado && <th className="p-3 pr-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {partidosFiltradosProg.map((part) => (
                    <tr key={part.id} className="hover:bg-slate-50/40">
                      <td className="p-3 pl-4 font-bold text-slate-700">Fecha {part.round}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{part.local_team?.name}</span>
                        <span className="mx-2 text-slate-400 font-bold">VS</span>
                        <span className="font-semibold text-slate-900">{part.visitor_team?.name}</span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs">
                        {part.match_date ? new Date(part.match_date).toLocaleDateString() : 'Por definir'} | {part.match_time || 'Por definir'}
                      </td>
                      <td className="p-3 text-slate-600 text-xs">
                        {part.venue?.name || 'Por definir'}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          part.status === 'finalizado' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {part.status}
                        </span>
                      </td>
                      {!esDelegado && (
                        <td className="p-3 pr-4 text-right">
                          {part.status !== 'finalizado' && (
                            <button onClick={() => iniciarReprogramacion(part)} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                              Reprogramar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {partidos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500 text-xs">No hay partidos cargados. Genera el fixture primero.</td>
                    </tr>
                  )}
                  {partidos.length > 0 && partidosFiltradosProg.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500 text-xs">No hay partidos con los filtros seleccionados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tabActiva === 'eventos' && (
          <>
          {!eventoGestionado ? (
            <ListaEventos
              eventos={eventosCompetencia}
              onGestionar={gestionarEvento}
              onEditar={abrirEdicionEvento}
              onEliminar={eliminarEventoCompetencia}
              formatearFecha={formatearFecha}
            />
          ) : (
            <div className="space-y-5">

              {/* Cabecera */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4">

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setEventoGestionado(null);
                        setParticipantesEvento([]);
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer mb-2"
                    >
                      ← Volver a eventos
                    </button>

                    <h2 className="font-extrabold text-lg text-slate-900">
                      {eventoGestionado.name}
                    </h2>

                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      <span>
                        {eventoGestionado
                          .championship_discipline
                          ?.discipline?.name}
                      </span>

                      <span>·</span>

                      <span>
                        {eventoGestionado.category?.name}
                      </span>

                      <span>·</span>

                      <span>
                        {formatearFecha(eventoGestionado.date)}
                      </span>

                      {eventoGestionado.start_time && (
                        <>
                          <span>·</span>
                          <span>
                            {eventoGestionado.start_time}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    {eventoGestionado.status}
                  </span>

                </div>
              </div>

              {/* Participantes de Evento */}
              <ListaParticipantesEvento
                evento={eventoGestionado}
                participantes={participantesEvento}
                cargando={cargandoParticipantes}
                onAgregar={abrirModalParticipantes}
                onQuitar={quitarParticipanteEvento}
              />

            </div>
          )}
          </>
        )}

      </main>

      {/* Modal Editar Escenario */}
      {modalEditarEsc.abierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Editar Escenario</h3>
              <button
                onClick={() => setModalEditarEsc({ abierto: false, id: null, name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active', guardando: false })}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={guardarEdicionEsc} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre del Escenario *</label>
                <input
                  type="text" required
                  value={modalEditarEsc.name}
                  onChange={(e) => setModalEditarEsc(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tipo *</label>
                  <select
                    required
                    value={modalEditarEsc.venue_type}
                    onChange={(e) => setModalEditarEsc(prev => ({ ...prev, venue_type: e.target.value }))}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="cancha">Cancha</option>
                    <option value="estadio">Estadio</option>
                    <option value="coliseo">Coliseo</option>
                    <option value="gimnasio">Gimnasio</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Capacidad</label>
                  <input
                    type="number" min="0"
                    value={modalEditarEsc.capacity}
                    onChange={(e) => setModalEditarEsc(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Ubicación *</label>
                <input
                  type="text" required
                  value={modalEditarEsc.location}
                  onChange={(e) => setModalEditarEsc(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Estado *</label>
                <select
                  value={modalEditarEsc.status}
                  onChange={(e) => setModalEditarEsc(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                >
                  <option value="active">Disponible / Activo</option>
                  <option value="inactive">No Disponible</option>
                </select>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalEditarEsc({ abierto: false, id: null, name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active', guardando: false })}
                  className="px-4 py-2 text-xs font-bold text-slate-650 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalEditarEsc.guardando}
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {modalEditarEsc.guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal agregar participante a evento */}
      <ModalParticipantesEvento
        abierto={modalParticipante}
        evento={eventoGestionado}

        jugadores={jugadoresDisponibles}
        equipos={equiposDisponibles}

        seleccionados={participantesSeleccionados}

        busqueda={busquedaParticipante}
        cargando={cargandoOpcionesParticipantes}

        onCerrar={() =>
          setModalParticipante(false)
        }

        onCambiarBusqueda={
          setBusquedaParticipante
        }

        onBuscar={() =>
          cargarOpcionesParticipantesEvento(
            busquedaParticipante
          )
        }

        onToggle={toggleParticipanteEvento}

        onSeleccionarTodos={
          seleccionarTodosParticipantes
        }

        onSubmit={agregarParticipantesEvento}
      />

      {/* Modal para editar un evento */}
      <ModalEditarEvento
        evento={eventoEditando}
        datos={datosEdicionEvento}
        setDatos={setDatosEdicionEvento}
        escenarios={escenarios}
        onCerrar={() =>
          setEventoEditando(null)
        }
        onSubmit={guardarEdicionEvento}
      />

      {/* Botón Flotante de Ayuda */}
      <button
        onClick={() => setMostrarAyuda(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 cursor-pointer"
        title="¿Cómo usar esta sección?"
      >
        <span className="material-symbols-outlined text-lg">question_mark</span>
      </button>

      {/* Drawer de Ayuda */}
      {mostrarAyuda && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">help</span>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Ayuda: Fixture y Fechas</h3>
              </div>
              <button
                onClick={() => setMostrarAyuda(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Contenido del Drawer */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
                Sigue estos pasos en orden para estructurar y programar los partidos del campeonato:
              </p>
              {PASOS_AYUDA_FIXTURE.map((p) => (
                <div key={p.paso} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {p.paso}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-slate-400">{p.icono}</span>
                      {p.titulo}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie del Drawer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">💡 Consejo rápido:</p>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                La asignación de horarios calcula los partidos basándose en la relevancia de cada equipo. Los partidos de alta expectación o puntaje acumulado suelen asignarse de manera optimizada en horarios centrales.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
};
