import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { Paginador } from '../../componentes/Paginador';
import { InsigniaEstado } from '../../componentes/InsigniaEstado';
import { EstadoVacio } from '../../componentes/EstadoVacio';
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
import ListaEtapasEvento from '../../componentes/programacion/eventos/ListaEtapasEvento';
import ModalEtapaEvento from '../../componentes/programacion/eventos/ModalEtapaEvento';
import ListaGruposEtapaEvento from '../../componentes/programacion/eventos/ListaGruposEtapaEvento';
import ModalGrupoEtapaEvento from '../../componentes/programacion/eventos/ModalGrupoEtapaEvento';
import NavegacionEventoCompetencia from '../../componentes/programacion/eventos/NavegacionEventoCompetencia';

import type {
  DatosEvento,
  DatosEdicionEvento,
  EventoCompetencia,
  ParticipanteEvento,
  EtapaEvento,
  DatosEtapaEvento,
  GuardarEtapaEvento,
  GrupoEtapaEvento,
  DatosGrupoEtapaEvento,
  GuardarGrupoEtapaEvento,
  ParticipanteGrupoEvento,
} from '../../types/CompetitionEvent';
import ListaParticipantesGrupoEvento from '../../componentes/programacion/eventos/ListaParticipantesGrupoEvento';
import ModalParticipantesGrupoEvento from '../../componentes/programacion/eventos/ModalParticipantesGrupoEvento';
import { TabEscenariosFixture } from '../../componentes/organizador/TabEscenariosFixture';
import { TabPartidosFixture } from '../../componentes/organizador/TabPartidosFixture';
import { TabGenerarFixture } from '../../componentes/organizador/TabGenerarFixture';
import { TabProgramarFechasFixture } from '../../componentes/organizador/TabProgramarFechasFixture';
import { ModalReprogramacionPartido } from '../../componentes/organizador/ModalReprogramacionPartido';
import { PanelAyudaFixture } from '../../componentes/organizador/PanelAyudaFixture';

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
  const [paginaPartidosProg, setPaginaPartidosProg] = useState<number>(1);
  const itemsPorPaginaPartidos = 10;

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
    competition_format: 'single_final',
    rounds_count: '2',
    result_aggregation: 'sum',
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

  // estados para manejar etapas de un evento
  const [etapasEvento, setEtapasEvento] =
  useState<EtapaEvento[]>([]);

  const [cargandoEtapas, setCargandoEtapas] =
    useState(false);

  const [modalEtapa, setModalEtapa] =
    useState(false);

  const [etapaEditando, setEtapaEditando] =
    useState<EtapaEvento | null>(null);

  const [datosEtapa, setDatosEtapa] =
    useState<DatosEtapaEvento>({
      name: '',
      stage_type: 'qualifying',
      stage_number: '1',
      qualifiers_count: '',
      qualification_method: 'best_overall',
      status: 'programado',
      qualifiers_per_group: '',
      podium_places: '',
      rounds_count: '',
      result_aggregation: 'sum',
    });

  // Gestion de etapas
  const [etapaGestionada, setEtapaGestionada] =
  useState<EtapaEvento | null>(null);

  const [gruposEtapa, setGruposEtapa] =
    useState<GrupoEtapaEvento[]>([]);

  const [cargandoGrupos, setCargandoGrupos] =
    useState(false);

  const [modalGrupo, setModalGrupo] =
    useState(false);

  const [grupoEditando, setGrupoEditando] =
    useState<GrupoEtapaEvento | null>(null);

  const [datosGrupo, setDatosGrupo] = useState<DatosGrupoEtapaEvento>({
    name: '',
    group_type: 'series',
    group_number: '1',
    date: '',
    start_time: '',
    venue_id: '',
    status: 'programado',
  });

  type VistaGestionEvento =
    | 'estructura'
    | 'participantes';

  const [vistaGestionEvento, setVistaGestionEvento] =
    useState<VistaGestionEvento>('estructura');

  // Estados para gestionar participantes de un grupo o serie
  const [grupoGestionado, setGrupoGestionado] =
  useState<GrupoEtapaEvento | null>(null);

  const [
    participantesGrupo,
    setParticipantesGrupo,
  ] = useState<ParticipanteGrupoEvento[]>([]);

  const [
    cargandoParticipantesGrupo,
    setCargandoParticipantesGrupo,
  ] = useState(false);

  const [
    modalParticipantesGrupo,
    setModalParticipantesGrupo,
  ] = useState(false);

  const [
    participantesGrupoSeleccionados,
    setParticipantesGrupoSeleccionados,
  ] = useState<number[]>([]);

  const editarParticipanteGrupo = async (
    participanteGrupoId: number,
    datos: {
      lane: number | null;
      start_order: number | null;
    }
  ) => {
    if (!grupoGestionado) {
      return;
    }

    try {
      const res =
        await serviciosEventosCompetencia
          .actualizarParticipanteGrupo(
            participanteGrupoId,
            datos
          );

      if (res.success) {
        mostrarMensaje(
          'Participante actualizado correctamente.'
        );

        await cargarParticipantesGrupo(
          grupoGestionado.id
        );
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al actualizar participante.',
        true
      );
    }
  };

  const cargarParticipantesGrupo = async (
    grupoId: number
  ) => {
    setCargandoParticipantesGrupo(true);

    try {
      const res =
        await serviciosEventosCompetencia
          .obtenerParticipantesGrupo(grupoId);

      if (res.success) {
        setParticipantesGrupo(res.data);
      }
    } catch {
      mostrarMensaje(
        'Error al cargar los participantes del grupo.',
        true
      );
    } finally {
      setCargandoParticipantesGrupo(false);
    }
  };

  const gestionarGrupo = async (
    grupo: GrupoEtapaEvento
  ) => {
    setVistaGestionEvento('estructura');
    setGrupoGestionado(grupo);
    setParticipantesGrupo([]);

    await cargarParticipantesGrupo(
      grupo.id
    );
  };
  
  const obtenerParticipantesAsignadosEtapa = async () => {
    if (!etapaGestionada) {
      return new Set<number>();
    }

    const respuestas = await Promise.all(
      gruposEtapa.map((grupo) =>
        serviciosEventosCompetencia
          .obtenerParticipantesGrupo(grupo.id)
      )
    );

    const ids = respuestas
      .filter((res) => res.success)
      .flatMap((res) => res.data)
      .map(
        (participante) =>
          participante
            .competition_event_participant_id
      );

    return new Set(ids);
  };

  const abrirModalParticipantesGrupo = async () => {
    if (!grupoGestionado) return;

    const ids = await obtenerParticipantesAsignadosEtapa();

    setIdsAsignadosEtapa(ids);
    setParticipantesGrupoSeleccionados([]);
    setModalParticipantesGrupo(true);
  };

  const agregarParticipantesAlGrupo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!grupoGestionado) return;

    if (
      participantesGrupoSeleccionados.length === 0
    ) {
      mostrarMensaje(
        'Selecciona al menos un participante.',
        true
      );

      return;
    }

    try {
      await Promise.all(
        participantesGrupoSeleccionados.map(
          (
            competitionEventParticipantId,
            index
          ) =>
            serviciosEventosCompetencia
              .agregarParticipanteGrupo(
                grupoGestionado.id,
                {
                  competition_event_participant_id:
                    competitionEventParticipantId,

                  lane: null,

                  start_order:
                    participantesGrupo.length +
                    index +
                    1,
                }
              )
        )
      );

      mostrarMensaje(
        'Participantes asignados correctamente.'
      );

      setModalParticipantesGrupo(false);

      setParticipantesGrupoSeleccionados([]);

      await cargarParticipantesGrupo(
        grupoGestionado.id
      );
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al asignar participantes.',
        true
      );
    }
  };

  const quitarParticipanteGrupo = async (
    participanteGrupoId: number
  ) => {
    if (!grupoGestionado) return;

    try {
      const res =
        await serviciosEventosCompetencia
          .eliminarParticipanteGrupo(
            participanteGrupoId
          );

      if (res.success) {
        mostrarMensaje(
          'Participante retirado del grupo.'
        );

        await cargarParticipantesGrupo(
          grupoGestionado.id
        );
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al retirar participante.',
        true
      );
    }
  };

  const toggleParticipanteGrupo = (
    participanteId: number
  ) => {
    setParticipantesGrupoSeleccionados(
      (prev) =>
        prev.includes(participanteId)
          ? prev.filter(
              (id) =>
                id !== participanteId
            )
          : [
              ...prev,
              participanteId,
            ]
    );
  };

  const [idsAsignadosEtapa, setIdsAsignadosEtapa] = useState<Set<number>>(
    new Set()
  );

  const participantesDisponiblesGrupo = participantesEvento.filter((participante) =>
    !idsAsignadosEtapa.has(
      participante.id
    )
  );

  const cargarGruposEtapa = async (
    etapaId: number
  ) => {
    setCargandoGrupos(true);

    try {
      const res =
        await serviciosEventosCompetencia
          .obtenerGruposEtapa(etapaId);

      if (res.success) {
        setGruposEtapa(res.data);
      }
    } catch {
      mostrarMensaje(
        'Error al cargar los grupos de la etapa.',
        true
      );
    } finally {
      setCargandoGrupos(false);
    }
  };

  const gestionarEtapa = async (
    etapa: EtapaEvento
  ) => {
    setVistaGestionEvento('estructura');
    setEtapaGestionada(etapa);
    setGrupoGestionado(null);
    setParticipantesGrupo([]);
    setGruposEtapa([]);

    await cargarGruposEtapa(etapa.id);
  };

  const abrirNuevoGrupo = () => {
    if (!etapaGestionada) {
      return;
    }

    setGrupoEditando(null);

    setDatosGrupo({
      name: '',
      group_type: 'series',

      group_number:
        String(gruposEtapa.length + 1),

      date: '',
      start_time: '',
      venue_id: '',

      status: 'programado',
    });

    setModalGrupo(true);
  };

  const abrirEdicionGrupo = (
    grupo: GrupoEtapaEvento
  ) => {
    setGrupoEditando(grupo);

    setDatosGrupo({
      name: grupo.name,

      group_type:
        grupo.group_type,

      group_number:
        grupo.group_number.toString(),

      date:
        grupo.date?.substring(0, 10) ?? '',

      start_time:
        grupo.start_time?.substring(0, 5) ?? '',

      venue_id:
        grupo.venue_id?.toString() ?? '',

      status:
        grupo.status,
    });

    setModalGrupo(true);
  };

  const guardarGrupoEtapa = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!etapaGestionada) {
      return;
    }

    const payload: GuardarGrupoEtapaEvento = {
      name:
        datosGrupo.name.trim(),

      group_type:
        datosGrupo.group_type,

      group_number:
        parseInt(datosGrupo.group_number),

      date:
        datosGrupo.date || null,

      start_time:
        datosGrupo.start_time || null,

      venue_id:
        datosGrupo.venue_id
          ? parseInt(datosGrupo.venue_id)
          : null,

      status:
        datosGrupo.status,
    };

    try {
      const res = grupoEditando
        ? await serviciosEventosCompetencia
            .actualizarGrupoEtapa(
              grupoEditando.id,
              payload
            )
        : await serviciosEventosCompetencia
            .crearGrupoEtapa(
              etapaGestionada.id,
              payload
            );

      if (res.success) {
        mostrarMensaje(
          grupoEditando
            ? 'Grupo actualizado correctamente.'
            : 'Grupo creado correctamente.'
        );

        setModalGrupo(false);
        setGrupoEditando(null);

        await cargarGruposEtapa(
          etapaGestionada.id
        );
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al guardar el grupo.',
        true
      );
    }
  };

  const eliminarGrupoEtapa = async (
    grupoId: number
  ) => {
    if (!etapaGestionada) {
      return;
    }

    const confirmado = await confirm({
      title: 'Eliminar grupo',

      description:
        '¿Está seguro de eliminar este grupo o serie?',

      confirmText: 'Eliminar',

      cancelText: 'Cancelar',

      confirmButton: {
        variant: 'destructive',
      },
    });

    if (!confirmado) {
      return;
    }

    try {
      const res =
        await serviciosEventosCompetencia
          .eliminarGrupoEtapa(grupoId);

      if (res.success) {
        mostrarMensaje(
          'Grupo eliminado correctamente.'
        );

        await cargarGruposEtapa(
          etapaGestionada.id
        );
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al eliminar el grupo.',
        true
      );
    }
  };

  const cargarEtapasEvento = async (
    eventoId: number
  ) => {
    setCargandoEtapas(true);

    try {
      const res =
        await serviciosEventosCompetencia
          .obtenerEtapas(eventoId);

      if (res.success) {
        setEtapasEvento(res.data);
      }
    } catch {
      mostrarMensaje(
        'Error al cargar las etapas del evento.',
        true
      );
    } finally {
      setCargandoEtapas(false);
    }
  };

  const abrirNuevaEtapa = () => {
    setEtapaEditando(null);

    setDatosEtapa({
      name: '',
      stage_type: 'qualifying',
      stage_number: String(etapasEvento.length + 1),
      rounds_count: '1',
      result_aggregation: 'sum',
      qualifiers_count: '',
      qualification_method: 'best_overall',
      status: 'programado',
      qualifiers_per_group: '',
      podium_places: '',
    });

    setModalEtapa(true);
  };

  const abrirEdicionEtapa = (
    etapa: EtapaEvento
  ) => {
    setEtapaEditando(etapa);

    setDatosEtapa({
      name: etapa.name,

      stage_type:
        etapa.stage_type,

      stage_number:
        etapa.stage_number.toString(),

      qualifiers_count:
        etapa.qualifiers_count
          ?.toString() ?? '',

      qualification_method:
        etapa.qualification_method ?? '',
      
      podium_places: etapa.podium_places?.toString() ?? '',
      result_aggregation: etapa.result_aggregation,
      rounds_count: etapa.rounds_count?.toString(),
      qualifiers_per_group: etapa.qualifiers_per_group?.toString() ?? '',

      status:
        etapa.status,
    });

    setModalEtapa(true);
  };

  const guardarEtapaEvento = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!eventoGestionado) {
      return;
    }
    const esFinal = datosEtapa.stage_type === 'final';

    const payload: GuardarEtapaEvento = {
      name: datosEtapa.name.trim(),

      stage_type: datosEtapa.stage_type,

      stage_number: parseInt(datosEtapa.stage_number),

      rounds_count: parseInt(datosEtapa.rounds_count),
      result_aggregation: datosEtapa.result_aggregation,

      qualifiers_count:
        !esFinal &&
        datosEtapa.qualification_method ===
          'best_overall' &&
        datosEtapa.qualifiers_count
          ? parseInt(
              datosEtapa.qualifiers_count
            )
          : null,

      qualification_method:
        esFinal
        ? 'none'
        : datosEtapa.qualification_method ||
          null,
      
      qualifiers_per_group:
        !esFinal &&
        datosEtapa.qualification_method ===
          'best_per_group' &&
        datosEtapa.qualifiers_per_group
          ? parseInt(
              datosEtapa.qualifiers_per_group
            )
          : null,

      podium_places:
        esFinal &&
          datosEtapa.podium_places
            ? parseInt(
                datosEtapa.podium_places
              )
            : null,

      status: datosEtapa.status,
    };

    try {
      const res = etapaEditando
        ? await serviciosEventosCompetencia
            .actualizarEtapa(
              etapaEditando.id,
              payload
            )
        : await serviciosEventosCompetencia
            .crearEtapa(
              eventoGestionado.id,
              payload
            );

      if (res.success) {
        mostrarMensaje(
          etapaEditando
            ? 'Etapa actualizada correctamente.'
            : 'Etapa creada correctamente.'
        );

        setModalEtapa(false);
        setEtapaEditando(null);

        await cargarEtapasEvento(
          eventoGestionado.id
        );
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al guardar la etapa.',
        true
      );
    }
  };

  const eliminarEtapaEvento = async (
    etapaId: number
  ) => {
    if (!eventoGestionado) return;

    const confirmado = await confirm({
      title: 'Eliminar etapa',

      description:
        '¿Está seguro de eliminar esta etapa?',

      confirmText: 'Eliminar',

      cancelText: 'Cancelar',

      confirmButton: {
        variant: 'destructive',
      },
    });

    if (!confirmado) {
      return;
    }

    try {
      const res =
        await serviciosEventosCompetencia
          .eliminarEtapa(etapaId);

      if (res.success) {
        mostrarMensaje(
          'Etapa eliminada correctamente.'
        );

        await cargarEtapasEvento(
          eventoGestionado.id
        );
      }
    } catch (err: any) {
      mostrarMensaje(
        err.response?.data?.message ||
          'Error al eliminar la etapa.',
        true
      );
    }
  };

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
        championship_discipline_id: categoria.championship_discipline.id,
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
        competition_format: datosEvento.competition_format,
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
          competition_format: 'single_final',
          rounds_count: '2',
          result_aggregation: 'sum',
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

    setVistaGestionEvento('estructura');

    setEtapaGestionada(null);
    setGrupoGestionado(null);

    setCargandoParticipantes(true);
    setCargandoEtapas(true);

    try {
      const [
        resParticipantes,
        resEtapas,
      ] = await Promise.all([
        serviciosEventosCompetencia.obtenerParticipantes(evento.id),
        serviciosEventosCompetencia.obtenerEtapas(evento.id),
      ])

      if (resParticipantes.success) {
        setParticipantesEvento(
          resParticipantes.data
        );
      }

      if (resEtapas.success) {
        setEtapasEvento(resEtapas.data);
      }
    } catch (err) {
      mostrarMensaje(
        'Error al cargar la información del evento',
        true
      );
    } finally {
      setCargandoParticipantes(false);
      setCargandoEtapas(false);
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

  // Estados de formularios escenarios
  const [modalCrearEsc, setModalCrearEsc] = useState(false);
  const [guardandoEscenario, setGuardandoEscenario] = useState(false);
  const [filtroTextoEsc, setFiltroTextoEsc] = useState('');
  const [filtroTipoEsc, setFiltroTipoEsc] = useState('todos');
  const [paginaEscenarios, setPaginaEscenarios] = useState(1);
  const itemsPorPaginaEscenarios = 6;

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
    setGuardandoEscenario(true);
    try {
      const champId = campeonatoActivo?.id || parseInt(localStorage.getItem('campeonato_activo_id') || '1');
      const res = await serviciosFixture.crearEscenario({
        championship_id: champId,
        name: nuevoEsc.name,
        venue_type: nuevoEsc.venue_type,
        location: nuevoEsc.location,
        capacity: nuevoEsc.capacity ? parseInt(nuevoEsc.capacity) : null,
        is_available: nuevoEsc.status === 'active'
      });
      if (res.success) {
        mostrarMensaje('Escenario registrado con éxito.');
        setNuevoEsc({ name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active' });
        setModalCrearEsc(false);
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al crear escenario.', true);
    } finally {
      setGuardandoEscenario(false);
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

  const totalPaginasPartidosProg = Math.max(1, Math.ceil(partidosFiltradosProg.length / itemsPorPaginaPartidos));
  const partidosPaginadosProg = partidosFiltradosProg.slice((paginaPartidosProg - 1) * itemsPorPaginaPartidos, paginaPartidosProg * itemsPorPaginaPartidos);

  const escenariosFiltrados = escenarios.filter(e => {
    const coincideTexto = !filtroTextoEsc.trim() ||
      e.name?.toLowerCase().includes(filtroTextoEsc.toLowerCase()) ||
      e.location?.toLowerCase().includes(filtroTextoEsc.toLowerCase());
    const coincideTipo = filtroTipoEsc === 'todos' || e.venue_type === filtroTipoEsc;
    return coincideTexto && coincideTipo;
  });
  const totalPaginasEscenarios = Math.max(1, Math.ceil(escenariosFiltrados.length / itemsPorPaginaEscenarios));
  const escenariosPaginados = escenariosFiltrados.slice((paginaEscenarios - 1) * itemsPorPaginaEscenarios, paginaEscenarios * itemsPorPaginaEscenarios);

  const hayFiltrosPartidosActivos = !!(filtroRondaPartidos || filtroEquipoPartidos || filtroEstadoPartidos !== 'todos' || filtroCanchaPartidos);

  const limpiarFiltrosPartidos = () => {
    setFiltroRondaPartidos(null);
    setFiltroEquipoPartidos(null);
    setFiltroEstadoPartidos('todos');
    setFiltroCanchaPartidos(null);
    setPaginaPartidosProg(1);
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)] font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen izquierdo en desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar titulo="Fixture y Programación" subtitulo="Generación de Encuentros y Asignación de Canchas" />

      {/* Tabs (visibles solo en móvil ya que en desktop se navega por la barra lateral) */}
      <div className="bg-[var(--surface-container-low)] border-b border-[var(--outline)] px-6 py-2 flex flex-wrap gap-2 lg:hidden">
        {(!esDelegado ? (['escenarios', 'generar', 'eventos','programar', 'partidos'] as TabType[]) : (['partidos'] as TabType[])).map((tab) => (
          <button
            key={tab}
            onClick={() => setSearchParams({ tab })}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
              tabActiva === tab
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--on-surface-muted)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]'
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
        <ModalReprogramacionPartido
          partido={partidoParaReprogramar}
          datosReprog={datosReprog}
          escenarios={escenarios}
          onClose={() => setPartidoParaReprogramar(null)}
          onSubmit={guardarReprogramacion}
          onChange={setDatosReprog}
        />

        {/* Tab content logic */}
        {tabActiva === 'escenarios' && (
          <TabEscenariosFixture
            escenariosPaginados={escenariosPaginados}
            escenariosFiltrados={escenariosFiltrados}
            paginaEscenarios={paginaEscenarios}
            totalPaginasEscenarios={totalPaginasEscenarios}
            filtroTextoEsc={filtroTextoEsc}
            setFiltroTextoEsc={setFiltroTextoEsc}
            setPaginaEscenarios={setPaginaEscenarios}
            onCrearEscenario={() => setModalCrearEsc(true)}
            onEditarEscenario={abrirModalEditarEsc}
            onEliminarEscenario={eliminarEscenario}
          />
        )}

        {tabActiva === 'generar' && (
          <TabGenerarFixture
            generarMode={generarMode}
            setGenerarMode={setGenerarMode}
            datosFixture={datosFixture}
            setDatosFixture={setDatosFixture}
            disciplinas={disciplinas}
            categorias={categorias}
            escenarios={escenarios}
            onSubmitFixture={manejarGenerarFixture}
            onToggleVenue={manejarCambioCheckboxVenue}
            datosEvento={datosEvento}
            setDatosEvento={setDatosEvento}
            onSubmitEvento={manejarCrearEvento}
            FormularioEvento={FormularioEvento}
          />
        )}

        {tabActiva === 'programar' && (
          <TabProgramarFechasFixture
            datosFecha={datosFecha}
            setDatosFecha={setDatosFecha}
            disciplinas={disciplinas}
            categorias={categorias}
            escenarios={escenarios}
            rondasDisponiblesProg={rondasDisponiblesProg}
            partidosDeRondaSeleccionada={partidosDeRondaSeleccionada}
            onSubmit={manejarProgramarFecha}
            onToggleVenue={manejarCambioCheckboxVenueFecha}
          />
        )}

        {tabActiva === 'partidos' && (
          <TabPartidosFixture
            partidosPaginados={partidosPaginadosProg}
            escenarios={escenarios}
            filtros={{
              ronda: filtroRondaPartidos,
              equipo: filtroEquipoPartidos,
              estado: filtroEstadoPartidos,
              cancha: filtroCanchaPartidos,
            }}
            setRonda={setFiltroRondaPartidos}
            setEquipo={setFiltroEquipoPartidos}
            setEstado={setFiltroEstadoPartidos}
            setCancha={setFiltroCanchaPartidos}
            rondasDisponibles={rondasDisponiblesProg}
            equiposEnPartidos={equiposEnPartidos}
            paginaActual={paginaPartidosProg}
            totalPaginas={totalPaginasPartidosProg}
            totalRegistros={partidosFiltradosProg.length}
            onCambiarPagina={setPaginaPartidosProg}
            onLimpiarFiltros={limpiarFiltrosPartidos}
            onReprogramar={iniciarReprogramacion}
            esDelegado={Boolean(esDelegado)}
          />
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
              <div className="bg-[var(--surface-container-low)] rounded-2xl border border-[var(--outline)] p-5 shadow-xs">
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

              <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5 items-start">

                {/* Navegación izquierda */}
                <NavegacionEventoCompetencia
                  vista={vistaGestionEvento}

                  etapas={etapasEvento}

                  etapaSeleccionada={
                    etapaGestionada
                  }

                  gruposEtapa={
                    gruposEtapa
                  }

                  grupoSeleccionado={
                    grupoGestionado
                  }

                  cantidadParticipantes={
                    participantesEvento.length
                  }

                  onParticipantes={() => {
                    setVistaGestionEvento(
                      'participantes'
                    );

                    setEtapaGestionada(null);
                    setGrupoGestionado(null);
                  }}

                  onEstructura={() => {
                    setVistaGestionEvento(
                      'estructura'
                    );

                    setEtapaGestionada(null);
                    setGrupoGestionado(null);
                  }}

                  onEtapa={
                    gestionarEtapa
                  }

                  onGrupo={
                    gestionarGrupo
                  }
                />

                {/* Panel derecho */}
                <div className="min-w-0">

                  {/* PARTICIPANTES GENERALES */}
                  {vistaGestionEvento ===
                    'participantes' && (
                    <ListaParticipantesEvento
                      evento={eventoGestionado}

                      participantes={
                        participantesEvento
                      }

                      cargando={
                        cargandoParticipantes
                      }

                      onAgregar={
                        abrirModalParticipantes
                      }

                      onQuitar={
                        quitarParticipanteEvento
                      }
                    />
                  )}

                  {/* ESTRUCTURA GENERAL */}
                  {vistaGestionEvento ===
                    'estructura' &&
                    !etapaGestionada && (
                      <ListaEtapasEvento
                        etapas={etapasEvento}

                        cargando={
                          cargandoEtapas
                        }

                        onAgregar={
                          abrirNuevaEtapa
                        }

                        onGestionar={
                          gestionarEtapa
                        }

                        onEditar={
                          abrirEdicionEtapa
                        }

                        onEliminar={
                          eliminarEtapaEvento
                        }
                      />
                    )}

                  {/* ETAPA SELECCIONADA */}
                  {vistaGestionEvento ===
                    'estructura' &&
                    etapaGestionada &&
                    !grupoGestionado && (
                      <ListaGruposEtapaEvento
                        etapa={
                          etapaGestionada
                        }

                        grupos={
                          gruposEtapa
                        }

                        cargando={
                          cargandoGrupos
                        }

                        onAgregar={
                          abrirNuevoGrupo
                        }

                        onGestionar={
                          gestionarGrupo
                        }

                        onEditar={
                          abrirEdicionGrupo
                        }

                        onEliminar={
                          eliminarGrupoEtapa
                        }

                        onCerrar={() => {
                          setEtapaGestionada(
                            null
                          );

                          setGruposEtapa([]);
                        }}
                      />
                    )}

                  {/* GRUPO SELECCIONADO */}
                  {vistaGestionEvento ===
                    'estructura' &&
                    grupoGestionado && (
                      <ListaParticipantesGrupoEvento
                        grupo={
                          grupoGestionado
                        }

                        participantesGrupo={
                          participantesGrupo
                        }

                        participantesEvento={
                          participantesEvento
                        }

                        cargando={
                          cargandoParticipantesGrupo
                        }

                        onAgregar={
                          abrirModalParticipantesGrupo
                        }

                        onQuitar={
                          quitarParticipanteGrupo
                        }

                        onEditar={editarParticipanteGrupo}

                        onCerrar={() => {
                          setGrupoGestionado(
                            null
                          );

                          setParticipantesGrupo(
                            []
                          );
                        }}
                      />
                    )}
                </div>
              </div>

            </div>
          )}
          </>
        )}

      </main>

      {/* Modal Crear Escenario (Formulario Emergente) */}
      {modalCrearEsc && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">add_business</span>
                Registrar Nuevo Escenario
              </h3>
              <button
                type="button"
                onClick={() => setModalCrearEsc(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={guardarEscenario} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre del Escenario *</label>
                <input
                  type="text" required placeholder="Ej: Estadio Lusail, Cancha Principal 1"
                  value={nuevoEsc.name} onChange={(e) => setNuevoEsc({ ...nuevoEsc, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tipo *</label>
                  <select
                    required
                    value={nuevoEsc.venue_type}
                    onChange={(e) => setNuevoEsc({ ...nuevoEsc, venue_type: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-xl p-2.5 outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="cancha">Cancha</option>
                    <option value="estadio">Estadio</option>
                    <option value="coliseo">Coliseo</option>
                    <option value="gimnasio">Gimnasio</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Capacidad Aprox.</label>
                  <input
                    type="number" placeholder="Ej: 500" min="0"
                    value={nuevoEsc.capacity} onChange={(e) => setNuevoEsc({ ...nuevoEsc, capacity: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Ubicación / Dirección *</label>
                <input
                  type="text" required placeholder="Ej: Av. Independencia S/N, Complejo UNAS"
                  value={nuevoEsc.location} onChange={(e) => setNuevoEsc({ ...nuevoEsc, location: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Estado Inicial *</label>
                <select
                  value={nuevoEsc.status} onChange={(e) => setNuevoEsc({ ...nuevoEsc, status: e.target.value })}
                  className="w-full text-sm border border-slate-200 bg-white rounded-xl p-2.5 outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="active">Disponible / Activo</option>
                  <option value="inactive">No Disponible</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCrearEsc(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEscenario}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  {guardandoEscenario ? 'Guardando...' : 'Guardar Escenario'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Editar Escenario */}
      {modalEditarEsc.abierto && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
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
        </div>,
        document.body
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

      <ModalEtapaEvento
        abierto={modalEtapa}
        etapaEditando={etapaEditando}
        datos={datosEtapa}
        setDatos={setDatosEtapa}
        onCerrar={() => {
          setModalEtapa(false);
          setEtapaEditando(null);
        }}
        onSubmit={guardarEtapaEvento}
      />

      <ModalGrupoEtapaEvento
        abierto={modalGrupo}
        grupoEditando={grupoEditando}
        datos={datosGrupo}
        setDatos={setDatosGrupo}
        escenarios={escenarios}
        onCerrar={() => {
          setModalGrupo(false);
          setGrupoEditando(null);
        }}

        onSubmit={guardarGrupoEtapa}
      />

      <ModalParticipantesGrupoEvento
        abierto={modalParticipantesGrupo}

        grupo={grupoGestionado}

        participantes={
          participantesDisponiblesGrupo
        }

        seleccionados={
          participantesGrupoSeleccionados
        }

        onToggle={
          toggleParticipanteGrupo
        }

        onCerrar={() => {
          setModalParticipantesGrupo(false);

          setParticipantesGrupoSeleccionados(
            []
          );
        }}

        onSubmit={
          agregarParticipantesAlGrupo
        }
      />

      {/* Botón Flotante de Ayuda */}
      <button
        onClick={() => setMostrarAyuda(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 cursor-pointer"
        title="¿Cómo usar esta sección?"
      >
        <span className="material-symbols-outlined text-lg">question_mark</span>
      </button>

      <PanelAyudaFixture visible={mostrarAyuda} onClose={() => setMostrarAyuda(false)} pasos={PASOS_AYUDA_FIXTURE} />
      </div>

    </div>
  );
};
