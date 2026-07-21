import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { useConfirm } from '@omit/react-confirm-dialog';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import {
  serviciosFixture,
  serviciosResultados,
  serviciosParticipantes
} from '../../servicios/api';
import type {
  Partido,
  ActaPartido,
  Incidencia,
  Jugador,
  Disciplina,
  Categoria
} from '../../servicios/api';

interface IncidentTypeConfig {
  type: string;
  label: string;
  icon: string;
  colorClass: string;
}

interface PeriodConfig {
  name: string;
  duration: number;
}

interface SportConfig {
  hasTimer: boolean;
  timerCountdown: boolean;
  periodLabel: string;
  periods: PeriodConfig[];
  scoreLabel: string;
  scoreType: string;
  winCondition: string;
  maxPeriods: number;
  winScore: number;
  incidentTypes: string[];
}

interface PeriodScore {
  home: number;
  away: number;
  finished: boolean;
}

const SPORT_CONFIGS: Record<string, SportConfig> = {
  futbol: {
    hasTimer: true,
    timerCountdown: false,
    periodLabel: 'Tiempo',
    periods: [
      { name: '1° Tiempo', duration: 45 },
      { name: '2° Tiempo', duration: 45 },
      { name: '1° Prórroga', duration: 15 },
      { name: '2° Prórroga', duration: 15 },
    ],
    scoreLabel: 'Goles',
    scoreType: 'goles',
    winCondition: 'goles',
    maxPeriods: 4,
    winScore: 0,
    incidentTypes: ['goal', 'yellow_card', 'red_card', 'foul', 'injury'],
  },
  voley: {
    hasTimer: false,
    timerCountdown: false,
    periodLabel: 'Set',
    periods: [
      { name: 'Set 1', duration: 0 },
      { name: 'Set 2', duration: 0 },
      { name: 'Set 3', duration: 0 },
      { name: 'Set 4', duration: 0 },
      { name: 'Set 5', duration: 0 },
    ],
    scoreLabel: 'Sets',
    scoreType: 'sets',
    winCondition: 'sets',
    maxPeriods: 5,
    winScore: 3,
    incidentTypes: ['point', 'foul', 'injury'],
  },
  basquet: {
    hasTimer: true,
    timerCountdown: true,
    periodLabel: 'Cuarto',
    periods: [
      { name: '1° Cuarto', duration: 10 },
      { name: '2° Cuarto', duration: 10 },
      { name: '3° Cuarto', duration: 10 },
      { name: '4° Cuarto', duration: 10 },
      { name: 'Prórroga', duration: 5 },
    ],
    scoreLabel: 'Puntos',
    scoreType: 'puntos',
    winCondition: 'puntos',
    maxPeriods: 5,
    winScore: 0,
    incidentTypes: ['point_2', 'point_3', 'free_throw', 'foul', 'injury'],
  },
  balonmano: {
    hasTimer: true,
    timerCountdown: false,
    periodLabel: 'Tiempo',
    periods: [
      { name: '1° Tiempo', duration: 30 },
      { name: '2° Tiempo', duration: 30 },
      { name: 'Prórroga', duration: 5 },
    ],
    scoreLabel: 'Goles',
    scoreType: 'goles',
    winCondition: 'goles',
    maxPeriods: 3,
    winScore: 0,
    incidentTypes: ['goal', 'yellow_card', 'red_card', 'exclusion', 'foul', 'injury'],
  },
};

const FUTBOL_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'goal', label: 'Gol', icon: 'sports_soccer', colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { type: 'yellow_card', label: 'T. Amarilla', icon: 'square', colorClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { type: 'red_card', label: 'T. Roja', icon: 'square', colorClass: 'bg-rose-600 hover:bg-rose-700 text-white' },
  { type: 'foul', label: 'Falta', icon: 'sports_handball', colorClass: 'bg-slate-500 hover:bg-slate-600 text-white' },
  { type: 'injury', label: 'Lesión', icon: 'medical_services', colorClass: 'bg-teal-600 hover:bg-teal-700 text-white' },
];

const VOLEY_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'point', label: 'Punto', icon: 'sports_handball', colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { type: 'foul', label: 'Falta', icon: 'sports_handball', colorClass: 'bg-slate-500 hover:bg-slate-600 text-white' },
  { type: 'injury', label: 'Lesión', icon: 'medical_services', colorClass: 'bg-teal-600 hover:bg-teal-700 text-white' },
];

const BASQUET_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'point_2', label: 'Canasta 2', icon: 'sports_basketball', colorClass: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { type: 'point_3', label: 'Triple', icon: 'sports_basketball', colorClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { type: 'free_throw', label: 'Tiro Libre', icon: 'sports_basketball', colorClass: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { type: 'foul', label: 'Falta', icon: 'sports_handball', colorClass: 'bg-slate-500 hover:bg-slate-600 text-white' },
  { type: 'injury', label: 'Lesión', icon: 'medical_services', colorClass: 'bg-teal-600 hover:bg-teal-700 text-white' },
];

const BALONMANO_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'goal', label: 'Gol', icon: 'sports_handball', colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { type: 'yellow_card', label: 'T. Amarilla', icon: 'square', colorClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { type: 'red_card', label: 'T. Roja', icon: 'square', colorClass: 'bg-rose-600 hover:bg-rose-700 text-white' },
  { type: 'exclusion', label: 'Exclusión 2m', icon: 'timer', colorClass: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  { type: 'foul', label: 'Falta', icon: 'sports_handball', colorClass: 'bg-slate-500 hover:bg-slate-600 text-white' },
  { type: 'injury', label: 'Lesión', icon: 'medical_services', colorClass: 'bg-teal-600 hover:bg-teal-700 text-white' },
];

const DEFAULT_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'goal', label: 'Punto/Gol', icon: 'emoji_events', colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { type: 'yellow_card', label: 'T. Amarilla', icon: 'square', colorClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { type: 'red_card', label: 'T. Roja', icon: 'square', colorClass: 'bg-rose-600 hover:bg-rose-700 text-white' },
  { type: 'foul', label: 'Falta', icon: 'flag', colorClass: 'bg-slate-500 hover:bg-slate-600 text-white' },
  { type: 'injury', label: 'Lesión', icon: 'medical_services', colorClass: 'bg-teal-600 hover:bg-teal-700 text-white' },
];

const getSportType = (disciplineName: string): string => {
  const name = disciplineName.toLowerCase().trim();
  if (name.includes('voley') || name.includes('voleibol') || name.includes('volleyball')) {
    return 'voley';
  }
  if (name.includes('basquet') || name.includes('basketball') || name.includes('baloncesto')) {
    return 'basquet';
  }
  if (name.includes('balon mano') || name.includes('balonmano') || name.includes('handball')) {
    return 'balonmano';
  }
  return 'futbol';
};

const getSportConfig = (disciplineName: string): SportConfig => {
  const sportType = getSportType(disciplineName);
  return SPORT_CONFIGS[sportType] || SPORT_CONFIGS['futbol'];
};

const getIncidentTypes = (disciplineName: string): IncidentTypeConfig[] => {
  const sportType = getSportType(disciplineName);
  switch (sportType) {
    case 'voley':
      return VOLEY_INCIDENTS;
    case 'basquet':
      return BASQUET_INCIDENTS;
    case 'balonmano':
      return BALONMANO_INCIDENTS;
    default:
      return FUTBOL_INCIDENTS;
  }
};

export const MesaControl: React.FC = () => {
  const { usuario, tienePermiso, tieneRol, cargando: cargandoAuth } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();
  const navegar = useNavigate();
  const confirm = useConfirm();

  const [periodoActualIdx, setPeriodoActualIdx] = useState(0);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);
  const [acta, setActa] = useState<ActaPartido | null>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [jugadoresLocal, setJugadoresLocal] = useState<Jugador[]>([]);
  const [jugadoresVisita, setJugadoresVisita] = useState<Jugador[]>([]);

  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Categoria[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [sportConfig, setSportConfig] = useState<SportConfig>(SPORT_CONFIGS['futbol']);
  const [sportType, setSportType] = useState<string>('futbol');
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);

  const [golesHome, setGolesHome] = useState('0');
  const [golesAway, setGolesAway] = useState('0');
  const [firmaArbitro, setFirmaArbitro] = useState('');
  const [firmaDelegadoLocal, setFirmaDelegadoLocal] = useState('');
  const [firmaDelegadoVisita, setFirmaDelegadoVisita] = useState('');
  const [firmaDelegadoMesa, setFirmaDelegadoMesa] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [subEstadoPartido, setSubEstadoPartido] = useState<'programado' | 'jugando' | 'descanso' | 'suspendido' | 'finalizado'>('programado');
  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(null);
  const [baseElapsedTime, setBaseElapsedTime] = useState(0);

  const [modalIncidenciaRapida, setModalIncidenciaRapida] = useState<{
    mostrar: boolean;
    teamId: number;
    teamName: string;
    type: string;
    capturedMinute: number;
    capturedSecond: number;
  } | null>(null);

  const [filtroJugadorModal, setFiltroJugadorModal] = useState('');

  const PASOS_AYUDA_MESA = [
    { paso: '1', titulo: 'Seleccionar Partido', desc: 'Elige un partido de la lista para cargar su acta oficial.', icono: 'ads_click' },
    { paso: '2', titulo: 'Registrar Incidencias', desc: 'Agrega goles, puntos, tarjetas y lesiones en tiempo real.', icono: 'sports_soccer' },
    { paso: '3', titulo: 'Guardar Marcador y Firmas', desc: 'Ingresa el nombre del árbitro y delegado de mesa.', icono: 'edit_document' },
    { paso: '4', titulo: 'Cerrar y Bloquear Acta', desc: 'Al finalizar, cierra el acta. Recalculará la tabla de posiciones.', icono: 'lock' },
  ];

  const sincronizarTimerConBackend = async (
    elapsedTime: number,
    period: number,
    status: 'stopped' | 'running' | 'paused' | 'finished'
  ) => {
    if (!partidoSeleccionado) return;
    try {
      let startedAt = null;
      let baseTime = elapsedTime;
      if (status === 'running') {
        startedAt = timerStartedAt ? timerStartedAt.toISOString() : new Date().toISOString();
        baseTime = baseElapsedTime;
      }
      await serviciosFixture.sincronizarTimer(partidoSeleccionado.id, {
        current_elapsed_time: baseTime,
        current_period: period,
        timer_status: status,
        timer_started_at: startedAt,
      });
    } catch (err) {
      console.error('Error al sincronizar timer:', err);
    }
  };

  const abrirRegistroRapido = (teamId: number, teamName: string, type: string) => {
    let minutoActual = 1;
    let segundoActual = 0;
    if (sportConfig.hasTimer) {
      const periodo = sportConfig.periods[periodoActualIdx];
      const accMin = periodo ? 0 : 0;
      minutoActual = Math.min(Math.max(accMin + Math.floor(segundosTranscurridos / 60) + 1, 1), 130);
      segundoActual = segundosTranscurridos % 60;
    } else {
      minutoActual = periodoActualIdx + 1;
      segundoActual = 0;
    }
    setFiltroJugadorModal('');
    setModalIncidenciaRapida({
      mostrar: true,
      teamId,
      teamName,
      type,
      capturedMinute: minutoActual,
      capturedSecond: segundoActual,
    });
  };

  const confirmarIncidenciaRapida = async (playerId: number) => {
    if (!partidoSeleccionado || !modalIncidenciaRapida) return;
    try {
      const res = await serviciosResultados.registrarIncidencia({
        match_id: partidoSeleccionado.id,
        team_id: modalIncidenciaRapida.teamId,
        player_id: playerId,
        incidence_type: modalIncidenciaRapida.type === 'exclusion' ? 'foul' : modalIncidenciaRapida.type,
        minute: modalIncidenciaRapida.capturedMinute,
        second: modalIncidenciaRapida.capturedSecond,
        description: `${modalIncidenciaRapida.type}`,
      });
      if (res.success) {
        mostrarMensaje('Incidencia registrada.');
        setIncidencias((prev) => [...prev, res.data]);
        actualizarPuntuacionDesdeIncidencia(modalIncidenciaRapida.teamId, modalIncidenciaRapida.type);
        setModalIncidenciaRapida(null);
      }
    } catch (err) {
      mostrarMensaje('Error al registrar incidencia.', true);
    }
  };

  const actualizarPuntuacionDesdeIncidencia = (teamId: number, type: string) => {
    if (!partidoSeleccionado) return;
    const isHome = teamId === (partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id);
    let puntos = 0;
    if (type === 'goal' || type === 'point' || type === 'point_2') puntos = 1;
    else if (type === 'point_3') puntos = 3;
    else if (type === 'free_throw') puntos = 1;
    else return;
    const currentHome = parseInt(golesHome) || 0;
    const currentAway = parseInt(golesAway) || 0;
    if (isHome) {
      setGolesHome((currentHome + puntos).toString());
    } else {
      setGolesAway((currentAway + puntos).toString());
    }
  };

  useEffect(() => {
    let intervalo: any = null;
    if (cronometroActivo && timerStartedAt) {
      intervalo = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timerStartedAt.getTime()) / 1000);
        let totalTime = baseElapsedTime + diff;
        if (sportConfig.timerCountdown) {
          const periodo = sportConfig.periods[periodoActualIdx];
          const maxDuration = periodo ? periodo.duration * 60 : 600;
          totalTime = Math.max(0, maxDuration - totalTime);
        }
        setSegundosTranscurridos(totalTime);
        if (totalTime % 15 === 0) {
          sincronizarTimerConBackend(totalTime, periodoActualIdx, 'running');
        }
      }, 1000);
    }
    return () => {
      clearInterval(intervalo);
    };
  }, [cronometroActivo, timerStartedAt, baseElapsedTime, sportConfig.timerCountdown, periodoActualIdx]);

  const formatearTiempo = (totalSegundos: number) => {
    const mins = Math.floor(totalSegundos / 60);
    const secs = totalSegundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cambiarEstadoPartidoMesa = async (nuevoSubEstado: 'jugando' | 'descanso' | 'suspendido' | 'finalizado' | 'programado') => {
    if (!partidoSeleccionado) return;
    let statusBackend = 'programado';
    if (nuevoSubEstado === 'jugando' || nuevoSubEstado === 'descanso') {
      statusBackend = 'en_curso';
    } else if (nuevoSubEstado === 'finalizado') {
      statusBackend = 'finalizado';
    } else if (nuevoSubEstado === 'suspendido') {
      statusBackend = 'cancelado';
    }
    try {
      const res = await serviciosFixture.actualizarPartido(partidoSeleccionado.id, {
        status: statusBackend,
      });
      if (res.success) {
        setSubEstadoPartido(nuevoSubEstado);
        setPartidoSeleccionado((prev) => (prev ? { ...prev, status: statusBackend } : null));
        if (nuevoSubEstado === 'jugando') {
          const now = new Date();
          setTimerStartedAt(now);
          setBaseElapsedTime(segundosTranscurridos);
          setCronometroActivo(true);
          await sincronizarTimerConBackend(segundosTranscurridos, periodoActualIdx, 'running');
        } else {
          setCronometroActivo(false);
          const currentTime = segundosTranscurridos;
          setBaseElapsedTime(currentTime);
          setTimerStartedAt(null);
          const timerStatus = nuevoSubEstado === 'finalizado' ? 'finished' : 'paused';
          await sincronizarTimerConBackend(currentTime, periodoActualIdx, timerStatus);
        }
        mostrarMensaje(`Estado actualizado a: ${
          nuevoSubEstado === 'jugando' ? 'En Juego' :
          nuevoSubEstado === 'descanso' ? 'En Descanso' :
          nuevoSubEstado === 'suspendido' ? 'Suspendido' : 'Programado'
        }`);
        cargarPartidos();
      }
    } catch (err) {
      mostrarMensaje('Error al actualizar el estado.', true);
    }
  };

  useEffect(() => {
    const localId = partidoSeleccionado?.local_team_id || (partidoSeleccionado as any)?.home_team_id;
    const visitorId = partidoSeleccionado?.visitor_team_id || (partidoSeleccionado as any)?.away_team_id;

    if (localId && visitorId) {
      const calcularPuntos = (teamId: number) => {
        return incidencias
          .filter((i) => i.team_id === teamId)
          .reduce((total, i) => {
            switch (i.incidence_type) {
              case 'goal':
              case 'point':
              case 'point_2':
                return total + 1;
              case 'point_3':
                return total + 3;
              case 'free_throw':
                return total + 1;
              default:
                return total;
            }
          }, 0);
      };

      const gLocal = calcularPuntos(localId);
      const gVisita = calcularPuntos(visitorId);
      setGolesHome(gLocal.toString());
      setGolesAway(gVisita.toString());
    }
  }, [incidencias, partidoSeleccionado]);

  const cargarFiltros = async () => {
    try {
      const champId = campeonatoActivo?.id;
      if (!champId) return;
      const [discRes, catRes] = await Promise.all([
        serviciosParticipantes.obtenerDisciplinasCampeonato(champId),
        serviciosParticipantes.obtenerCategoriasPorCampeonato(champId),
      ]);
      if (discRes.success) {
        const discList = discRes.data.map((cd: any) => cd.discipline).filter(Boolean);
        setDisciplinas(discList);
      }
      if (catRes.success) {
        setCategorias(catRes.data);
      }
    } catch (err) {
      console.error('Error cargando filtros:', err);
    }
  };

  useEffect(() => {
    if (cargandoAuth) return;
    if ((!tienePermiso('registrar_incidencias') && !tieneRol('organizador')) || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarPartidos();
      cargarFiltros();
    }
  }, [cargandoAuth]);

  useEffect(() => {
    if (selectedDiscipline) {
      const filtered = categorias.filter((c) => c.championship_discipline_id === selectedDiscipline);
      setCategoriasFiltradas(filtered);
    } else {
      setCategoriasFiltradas(categorias);
    }
  }, [selectedDiscipline, categorias]);

  useEffect(() => {
    if (!partidoSeleccionado) {
      cargarPartidos();
    }
  }, [selectedDiscipline, selectedCategory]);

  const cargarPartidos = async () => {
    setCargando(true);
    try {
      const res = await serviciosFixture.obtenerPartidos();
      if (res.success) {
        let partidosData = res.data || [];
        if (selectedDiscipline) {
          partidosData = partidosData.filter((p) => p.discipline_id === selectedDiscipline);
        }
        if (selectedCategory) {
          const categoriaSeleccionada = categorias.find((c) => c.id === selectedCategory);
          if (categoriaSeleccionada) {
            partidosData = partidosData.filter((p) => {
              const catId = p.category?.id || p.category_id;
              if (catId === selectedCategory) return true;
              const catName = p.category?.name || '';
              return catName === categoriaSeleccionada.name;
            });
          }
        }
        setPartidos(partidosData);
      }
    } catch (err) {
      setErrorLocal('Error al cargar partidos.');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarPartido = async (partido: Partido) => {
    setErrorLocal(null);
    setMensajeExito(null);
    setPartidoSeleccionado(partido);
    setActa(null);
    setIncidencias([]);

    const disciplineName = partido.discipline?.name || '';
    const config = getSportConfig(disciplineName);
    const type = getSportType(disciplineName);
    setSportConfig(config);
    setSportType(type);

    const numPeriods = config.periods.length;
    const initialScores: PeriodScore[] = [];
    for (let i = 0; i < numPeriods; i++) {
      initialScores.push({ home: 0, away: 0, finished: false });
    }
    setPeriodScores(initialScores);

    setGolesHome('0');
    setGolesAway('0');
    setFirmaArbitro('');
    setFirmaDelegadoLocal(partido.local_team?.representative || '');
    setFirmaDelegadoVisita(partido.visitor_team?.representative || '');
    setFirmaDelegadoMesa(usuario?.name || '');
    setObservaciones('');

    try {
      const resJugadores = await serviciosParticipantes.obtenerJugadores();
      if (resJugadores.success) {
        const localId = partido.local_team_id || (partido as any).home_team_id;
        const visitorId = partido.visitor_team_id || (partido as any).away_team_id;
        setJugadoresLocal(resJugadores.data.filter((j) => (j.team_id || j.team?.id) === localId));
        setJugadoresVisita(resJugadores.data.filter((j) => (j.team_id || j.team?.id) === visitorId));
      }

      const resActa = await serviciosResultados.obtenerActaPorPartido(partido.id);
      if (resActa.success && resActa.data) {
        const a = resActa.data;
        setActa(a);
        setGolesHome(a.local_score.toString());
        setGolesAway(a.visitor_score.toString());
        setFirmaArbitro(a.referee_signature || '');
        const sig = a.delegate_signature || '';
        if (sig.includes('Local:') || sig.includes('Visita:')) {
          const parts = sig.split(' | ');
          let loc = '';
          let vis = '';
          let mes = '';
          parts.forEach((p: string) => {
            if (p.startsWith('Local:')) loc = p.substring(6).trim();
            else if (p.startsWith('Visita:')) vis = p.substring(7).trim();
            else if (p.startsWith('Mesa:')) mes = p.substring(5).trim();
          });
          setFirmaDelegadoLocal(loc);
          setFirmaDelegadoVisita(vis);
          setFirmaDelegadoMesa(mes);
        } else {
          setFirmaDelegadoMesa(sig);
          setFirmaDelegadoLocal('');
          setFirmaDelegadoVisita('');
        }
        setObservaciones(a.observations || '');
      }
    } catch (err) {}

    try {
      const resInc = await serviciosResultados.obtenerIncidenciasPorPartido(partido.id);
      if (resInc.success) {
        setIncidencias(resInc.data);
      } else if (partido.incidences) {
        setIncidencias(partido.incidences);
      }
    } catch (err) {
      if (partido.incidences) {
        setIncidencias(partido.incidences);
      }
    }

    const timerData = (partido as any).current_elapsed_time || 0;
    const currentPeriod = (partido as any).current_period || 0;
    const timerStatus = (partido as any).timer_status || 'stopped';
    const timerStartedAtValue = (partido as any).timer_started_at || null;

    if (timerStatus === 'running' && timerStartedAtValue) {
      const start = new Date(timerStartedAtValue);
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      const totalTime = timerData + diffSeconds;
      setSegundosTranscurridos(totalTime);
      setTimerStartedAt(start);
      setBaseElapsedTime(timerData);
      setCronometroActivo(true);
    } else {
      setSegundosTranscurridos(timerData);
      setTimerStartedAt(null);
      setBaseElapsedTime(timerData);
      setCronometroActivo(false);
    }

    setPeriodoActualIdx(currentPeriod);

    if (partido.status === 'en_curso') {
      setSubEstadoPartido(timerStatus === 'running' ? 'jugando' : 'descanso');
    } else if (partido.status === 'finalizado') {
      setSubEstadoPartido('finalizado');
    } else {
      setSubEstadoPartido('programado');
    }
  };

  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    if (esError) {
      sileo.error({ title: 'Error', description: msg });
    } else {
      sileo.success({ title: 'Operación Exitosa', description: msg });
    }
  };

  const guardarProgresoActa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoSeleccionado) return;
    const combinedSignature = `Local: ${firmaDelegadoLocal.trim()} | Visita: ${firmaDelegadoVisita.trim()} | Mesa: ${firmaDelegadoMesa.trim()}`;
    try {
      if (acta) {
        const res = await serviciosResultados.actualizarActa(acta.id, {
          local_score: parseInt(golesHome),
          visitor_score: parseInt(golesAway),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: observaciones || undefined,
        });
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Progreso de acta actualizado.');
        }
      } else {
        const res = await serviciosResultados.registrarActa({
          match_id: partidoSeleccionado.id,
          local_score: parseInt(golesHome),
          visitor_score: parseInt(golesAway),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: observaciones || undefined,
        });
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Progreso de acta guardado.');
        }
      }
    } catch (err) {
      mostrarMensaje('Error al guardar acta.', true);
    }
  };

  const bloquearActaFinal = async () => {
    if (!acta) {
      mostrarMensaje('Guarde el progreso del acta primero.', true);
      return;
    }
    const isConfirmed = await confirm({
      title: '¿Cerrar el acta?',
      description: 'Esto es irreversible, recalculará la tabla de posiciones.',
      confirmText: 'Cerrar Acta',
      cancelText: 'Cancelar',
      confirmButton: { variant: 'default' },
    });
    if (isConfirmed) {
      try {
        const res = await serviciosResultados.bloquearActa(acta.id);
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Acta bloqueada y finalizada.');
          cargarPartidos();
          setPartidoSeleccionado(null);
        }
      } catch {
        mostrarMensaje('Error al bloquear acta.', true);
      }
    }
  };

  const manejarWalkover = async (forfeitedTeamId: number) => {
    if (!partidoSeleccionado) return;
    const name = partidoSeleccionado.discipline?.name?.toLowerCase().trim() || '';
    let scoreGanador = '3';
    let scorePerdedor = '0';
    if (name.includes('basquet') || name.includes('básquet') || name.includes('basketball') || name.includes('baloncesto')) {
      scoreGanador = '20';
    } else if (name.includes('voley') || name.includes('voleibol') || name.includes('volleyball')) {
      scoreGanador = '3';
    }
    const esLocalForfeited = forfeitedTeamId === (partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id);
    const equipoPerdedor = esLocalForfeited ? partidoSeleccionado.local_team?.name || 'Local' : partidoSeleccionado.visitor_team?.name || 'Visita';
    const equipoGanador = esLocalForfeited ? partidoSeleccionado.visitor_team?.name || 'Visita' : partidoSeleccionado.local_team?.name || 'Local';
    const nuevoGolesLocal = esLocalForfeited ? scorePerdedor : scoreGanador;
    const nuevoGolesVisita = esLocalForfeited ? scoreGanador : scorePerdedor;

    setGolesHome(nuevoGolesLocal);
    setGolesAway(nuevoGolesVisita);
    setObservaciones(`WALKOVER: ${equipoPerdedor} no se presentó. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}.`);
    setCronometroActivo(false);
    setSubEstadoPartido('finalizado');

    try {
      await serviciosFixture.actualizarPartido(partidoSeleccionado.id, { status: 'finalizado' });
      const combinedSignature = `Local: ${firmaDelegadoLocal.trim()} | Visita: ${firmaDelegadoVisita.trim()} | Mesa: ${firmaDelegadoMesa.trim()}`;
      let actaId: number | null = acta?.id ?? null;
      if (acta) {
        await serviciosResultados.actualizarActa(acta.id, {
          local_score: parseInt(nuevoGolesLocal),
          visitor_score: parseInt(nuevoGolesVisita),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: `WALKOVER: ${equipoPerdedor} no se presentó. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}.`,
        });
      } else {
        const res = await serviciosResultados.registrarActa({
          match_id: partidoSeleccionado.id,
          local_score: parseInt(nuevoGolesLocal),
          visitor_score: parseInt(nuevoGolesVisita),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: `WALKOVER: ${equipoPerdedor} no se presentó. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}.`,
        });
        if (res.success) {
          setActa(res.data);
          actaId = res.data.id;
        }
      }
      if (actaId) {
        const resLock = await serviciosResultados.bloquearActa(actaId);
        if (resLock.success) {
          setActa(resLock.data);
        }
      }
      await cargarPartidos();
      sileo.warning({
        title: 'Walkover Declarado',
        description: `W.O. para ${equipoPerdedor}. Victoria ${equipoGanador} ${scoreGanador}-${scorePerdedor}.`,
      });
    } catch (err) {
      sileo.error({ title: 'Error', description: 'Error al guardar el acta del Walkover.' });
    }
  };

  const eliminarIncidencia = async (id: number) => {
    const isConfirmed = await confirm({
      title: '¿Quitar incidencia?',
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: { variant: 'destructive' },
    });
    if (isConfirmed) {
      try {
        const res = await serviciosResultados.eliminarIncidencia(id);
        if (res.success) {
          setIncidencias((prev) => prev.filter((i) => i.id !== id));
          mostrarMensaje('Incidencia eliminada.');
        }
      } catch {
        mostrarMensaje('Error al quitar incidencia.', true);
      }
    }
  };

  const cambiarPeriodo = (nuevoIdx: number) => {
    if (nuevoIdx < 0 || nuevoIdx >= sportConfig.periods.length) return;
    setPeriodoActualIdx(nuevoIdx);
    if (sportConfig.hasTimer) {
      setCronometroActivo(false);
      setSegundosTranscurridos(0);
      setTimerStartedAt(null);
      setBaseElapsedTime(0);
      if (partidoSeleccionado) {
        sincronizarTimerConBackend(0, nuevoIdx, 'stopped');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
      <BarraLateral rol={usuario?.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar
          titulo={partidoSeleccionado ? `${partidoSeleccionado.local_team?.name} vs ${partidoSeleccionado.visitor_team?.name}` : 'Mesa de Control'}
          subtitulo={partidoSeleccionado
            ? `${partidoSeleccionado.discipline?.name || 'Deporte'} - ${sportConfig.periodLabel} ${periodoActualIdx + 1}`
            : 'Registro de Resultados'}
          leftElement={partidoSeleccionado && (
            <button
              onClick={() => setPartidoSeleccionado(null)}
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-800 hover:bg-[#171a26] transition-all cursor-pointer mr-2"
            >
              <span className="material-symbols-outlined text-slate-300">arrow_back</span>
            </button>
          )}
        />

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
          {mensajeExito && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{mensajeExito}</span>
            </div>
          )}

          {errorLocal && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          {!partidoSeleccionado ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Partidos Programados</h2>
                  <p className="text-xs text-slate-400 font-medium">Seleccione un partido para abrir su mesa de control.</p>
                </div>
              </div>

              <div className="bg-[#11131c] border border-slate-900 rounded-xl p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  {disciplinas.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disciplina</label>
                      <select
                        value={selectedDiscipline || ''}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          setSelectedDiscipline(value);
                          setSelectedCategory(null);
                        }}
                        className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                      >
                        <option value="">Todas</option>
                        {disciplinas.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {categoriasFiltradas.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                        className="text-xs bg-[#0c0e16] border border-slate-800 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500/50 w-full min-w-[150px]"
                      >
                        <option value="">Todas</option>
                        {categoriasFiltradas.map((c) => {
                          const discName = disciplinas.find((d) => d.id === c.championship_discipline_id)?.name || '';
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} {discName ? `(${discName})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {(selectedDiscipline || selectedCategory) && (
                    <button
                      onClick={() => {
                        setSelectedDiscipline(null);
                        setSelectedCategory(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold mt-auto"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {cargando ? (
                <div className="py-20 text-center text-sm text-slate-400 font-bold animate-pulse">
                  Cargando partidos...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partidos.map((part) => {
                    const homeScore = part.report?.local_score ?? 0;
                    const awayScore = part.report?.visitor_score ?? 0;
                    const partConfig = getSportConfig(part.discipline?.name || '');
                    return (
                      <div
                        key={part.id}
                        onClick={() => seleccionarPartido(part)}
                        className="bg-[#11131c] rounded-2xl border border-slate-900 p-5 shadow-xs hover:shadow-md hover:border-[#800f2f]/60 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Jornada {part.round}</span>
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[8px] uppercase tracking-wider border ${part.status === 'finalizado'
                            ? 'bg-[#1c1f2e] text-slate-350 border-slate-800'
                            : part.status === 'en_curso'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>{part.status}</span>
                        </div>
                        <div className="text-center text-xs text-slate-500">
                          {partConfig.periodLabel}s: {partConfig.periods.length}
                        </div>
                        <div className="space-y-3 my-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-200 text-sm">{part.local_team?.name}</span>
                            {part.status === 'finalizado' || part.status === 'en_curso' ? (
                              <span className="font-black text-slate-200 text-xs bg-[#1c1f2e] px-2 py-1 rounded-md">
                                {homeScore}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                            <span className="font-extrabold text-slate-200 text-sm">{part.visitor_team?.name}</span>
                            {part.status === 'finalizado' || part.status === 'en_curso' ? (
                              <span className="font-black text-slate-200 text-xs bg-[#1c1f2e] px-2 py-1 rounded-md">
                                {awayScore}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-slate-550">calendar_today</span>
                            <span>{part.match_date ? new Date(part.match_date).toLocaleDateString() : 'N/A'} - {part.match_time || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 max-w-[120px] truncate" title={part.venue?.name}>
                            <span className="material-symbols-outlined text-[13px] text-slate-550">location_on</span>
                            <span className="truncate">{part.venue?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {partidos.length === 0 && (
                    <div className="col-span-full bg-[#11131c] rounded-2xl border border-slate-900 p-12 text-center text-slate-400 italic text-sm">
                      No hay partidos para los filtros seleccionados.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={guardarProgresoActa} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-white">
                      Acta - {sportConfig.periodLabel} {periodoActualIdx + 1}
                    </h2>
                    {acta?.is_locked && (
                      <span className="bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Acta Cerrada</span>
                    )}
                  </div>

                  <div className="bg-slate-950 border border-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-md">
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${subEstadoPartido === 'jugando' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                        {subEstadoPartido === 'jugando' ? 'EN JUEGO' :
                          subEstadoPartido === 'descanso' ? 'EN DESCANSO' :
                            subEstadoPartido === 'suspendido' ? 'SUSPENDIDO' : 'PROGRAMADO'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl mt-4 z-10">
                      <button
                        type="button"
                        disabled={periodoActualIdx === 0}
                        onClick={() => cambiarPeriodo(periodoActualIdx - 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs"
                        title={`Ver ${sportConfig.periodLabel} anterior`}
                      >
                        ◀
                      </button>
                      <div className="text-center px-2 min-w-[100px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                          {sportConfig.periodLabel}
                        </span>
                        <span className="font-extrabold text-sm text-white">
                          {sportConfig.periods[periodoActualIdx]?.name || `${sportConfig.periodLabel} ${periodoActualIdx + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={periodoActualIdx === sportConfig.periods.length - 1}
                        onClick={() => cambiarPeriodo(periodoActualIdx + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs"
                        title={`Ver ${sportConfig.periodLabel} siguiente`}
                      >
                        ▶
                      </button>
                    </div>

                    {sportConfig.hasTimer ? (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white">
                          {formatearTiempo(segundosTranscurridos)}
                        </div>
                        {sportConfig.timerCountdown && (
                          <span className="text-[10px] text-amber-400 font-bold">Cuenta regresiva</span>
                        )}
                        {!acta?.is_locked && subEstadoPartido !== 'finalizado' && subEstadoPartido !== 'suspendido' && (
                          <div className="flex gap-2.5 mt-2">
                            {!cronometroActivo ? (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('jugando')}
                                className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-indigo-650/25"
                              >
                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                Iniciar / Continuar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setCronometroActivo(false);
                                  const currentTime = segundosTranscurridos;
                                  setBaseElapsedTime(currentTime);
                                  setTimerStartedAt(null);
                                  sincronizarTimerConBackend(currentTime, periodoActualIdx, 'paused');
                                }}
                                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg"
                              >
                                <span className="material-symbols-outlined text-sm">pause</span>
                                Pausar
                              </button>
                            )}
                            {subEstadoPartido === 'jugando' && (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('descanso')}
                                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">coffee</span>
                                Descanso
                              </button>
                            )}
                            {(subEstadoPartido === 'jugando' || subEstadoPartido === 'descanso') && (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('suspendido')}
                                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">block</span>
                                Suspender
                              </button>
                            )}
                          </div>
                        )}
                        {subEstadoPartido === 'finalizado' && (
                          <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg mt-2">
                            Partido finalizado - No se puede modificar el timer
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 z-10 py-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Estado del Encuentro</span>
                        {!acta?.is_locked && subEstadoPartido !== 'finalizado' && subEstadoPartido !== 'suspendido' && (
                          <div className="flex gap-2">
                            {subEstadoPartido !== 'jugando' && (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('jugando')}
                                className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                              >
                                Iniciar Juego
                              </button>
                            )}
                            {subEstadoPartido === 'jugando' && (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('descanso')}
                                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                              >
                                Fin de Set / Descanso
                              </button>
                            )}
                            {(subEstadoPartido === 'jugando' || subEstadoPartido === 'descanso') && (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('suspendido')}
                                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">block</span>
                                Suspender
                              </button>
                            )}
                          </div>
                        )}
                        {subEstadoPartido === 'finalizado' && (
                          <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg mt-2">
                            Partido finalizado
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-[#07080c] border border-slate-900 p-6 rounded-2xl items-center text-center">
                    <div className="font-extrabold text-sm text-slate-200 truncate">{partidoSeleccionado.local_team?.name}</div>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center justify-center gap-3">
                        <input
                          type="text"
                          readOnly
                          value={golesHome}
                          className="w-14 text-center text-2xl font-black border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 outline-hidden cursor-not-allowed select-none"
                          title="Marcador calculado automáticamente"
                        />
                        <span className="font-black text-slate-600 text-lg">-</span>
                        <input
                          type="text"
                          readOnly
                          value={golesAway}
                          className="w-14 text-center text-2xl font-black border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 outline-hidden cursor-not-allowed select-none"
                          title="Marcador calculado automáticamente"
                        />
                      </div>
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest mt-1 block">
                        {sportConfig.scoreLabel}
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-slate-200 truncate">{partidoSeleccionado.visitor_team?.name}</div>
                  </div>

                  {sportType === 'voley' && (
                    <div className="bg-[#07080c] border border-slate-900 p-4 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">Resumen de Sets</h4>
                      <div className="flex justify-center gap-4">
                        {sportConfig.periods.map((p, idx) => (
                          <div key={idx} className="text-center">
                            <span className="text-[9px] text-slate-500 block">{p.name}</span>
                            <span className="text-sm font-bold text-white">
                              {periodScores[idx]?.home ?? '-'} - {periodScores[idx]?.away ?? '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!acta?.is_locked && subEstadoPartido === 'programado' && (
                    <div className="bg-[#07080c] border border-slate-900 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Declarar Walkover</h4>
                      <p className="text-[10px] text-slate-400">Si un equipo no se presentó, registra el marcador reglamentario.</p>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => manejarWalkover(partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id)}
                          className="bg-rose-950/30 hover:bg-rose-900 border border-rose-500/20 text-rose-350 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer"
                        >
                          W.O. Local
                        </button>
                        <button
                          type="button"
                          onClick={() => manejarWalkover(partidoSeleccionado.visitor_team_id || (partidoSeleccionado as any).away_team_id)}
                          className="bg-rose-950/30 hover:bg-rose-900 border border-rose-500/20 text-rose-350 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer"
                        >
                          W.O. Visita
                        </button>
                      </div>
                    </div>
                  )}

                  {!acta?.is_locked && (
                    <div className="p-4 bg-[#07080c] border border-slate-900 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 border-b border-slate-900 pb-2">
                        <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          Registrar Evento Rápido ({partidoSeleccionado.discipline?.name || 'General'})
                        </h3>
                        {subEstadoPartido !== 'jugando' && (
                          <span className="bg-amber-500/10 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                            Reloj detenido
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 border-r border-slate-900 pr-2">
                          <span className="text-[10px] font-bold text-slate-200 block text-center truncate">{partidoSeleccionado.local_team?.name}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                            {getIncidentTypes(partidoSeleccionado.discipline?.name || '').map((inc) => (
                              <button
                                key={inc.type}
                                type="button"
                                onClick={() => abrirRegistroRapido(
                                  partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id,
                                  partidoSeleccionado.local_team?.name || 'Local',
                                  inc.type
                                )}
                                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[9px] font-bold cursor-pointer transition-all hover:scale-102 hover:brightness-105 active:scale-98 ${inc.colorClass}`}
                              >
                                <span className="material-symbols-outlined text-[12px]">{inc.icon}</span>
                                {inc.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2 pl-2">
                          <span className="text-[10px] font-bold text-slate-200 block text-center truncate">{partidoSeleccionado.visitor_team?.name}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                            {getIncidentTypes(partidoSeleccionado.discipline?.name || '').map((inc) => (
                              <button
                                key={inc.type}
                                type="button"
                                onClick={() => abrirRegistroRapido(
                                  partidoSeleccionado.visitor_team_id || (partidoSeleccionado as any).away_team_id,
                                  partidoSeleccionado.visitor_team?.name || 'Visita',
                                  inc.type
                                )}
                                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[9px] font-bold cursor-pointer transition-all hover:scale-102 hover:brightness-105 active:scale-98 ${inc.colorClass}`}
                              >
                                <span className="material-symbols-outlined text-[12px]">{inc.icon}</span>
                                {inc.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-6 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-white border-b border-slate-900 pb-2">Firmas y Cierre</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 block">Firma Árbitro Principal</label>
                      <input
                        type="text"
                        placeholder="Firma / Nombre"
                        disabled={acta?.is_locked}
                        value={firmaArbitro}
                        onChange={(e) => setFirmaArbitro(e.target.value)}
                        className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 placeholder:text-slate-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-350 block uppercase">Delegado Mesa</label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          disabled={acta?.is_locked}
                          value={firmaDelegadoMesa}
                          onChange={(e) => setFirmaDelegadoMesa(e.target.value)}
                          className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-355 block uppercase">Delegado Local</label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          disabled={acta?.is_locked}
                          value={firmaDelegadoLocal}
                          onChange={(e) => setFirmaDelegadoLocal(e.target.value)}
                          className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-355 block uppercase">Delegado Visita</label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          disabled={acta?.is_locked}
                          value={firmaDelegadoVisita}
                          onChange={(e) => setFirmaDelegadoVisita(e.target.value)}
                          className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Observaciones</label>
                    <textarea
                      placeholder="Incidencias fuera del campo..."
                      disabled={acta?.is_locked}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 min-h-[60px]"
                    />
                  </div>

                  {!acta?.is_locked && (
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="submit"
                        className="w-full bg-[#1c1f2e] hover:bg-[#282d42] border border-slate-900 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all"
                      >
                        Guardar Marcador y Firmas
                      </button>
                      <button
                        type="button"
                        onClick={bloquearActaFinal}
                        className="w-full bg-[#800f2f] hover:bg-[#a4133c] text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all"
                      >
                        Cerrar y Bloquear Acta
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-6 shadow-xs space-y-4">
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-white border-b border-slate-900 pb-2">Historial de Sucesos</h2>
                  {incidencias.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-4 text-center">No hay incidencias registradas.</p>
                  ) : (
                    <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden bg-[#11131c] max-h-[300px] overflow-y-auto">
                      {incidencias.map((i) => {
                        const config = { label: i.incidence_type, icon: 'info', color: 'bg-slate-50 text-slate-600 border-slate-200' };
                        return (
                          <div key={i.id} className="p-3 text-xs flex justify-between items-center hover:bg-[#171a26]/30">
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="font-bold text-secondary mr-2 shrink-0">
                                {i.minute}' {i.second !== undefined && i.second !== null && i.second > 0 ? `${i.second.toString().padStart(2, '0')}"` : ''}
                              </span>
                              <span className="font-semibold text-slate-200 truncate inline-block max-w-[120px]" title={i.player?.name}>
                                {i.player?.name || 'Jugador'}
                              </span>
                              <span className="text-slate-700 mx-1.5">|</span>
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border align-middle ${config.color}`}>
                                <span className="material-symbols-outlined text-[9px] shrink-0">{config.icon}</span>
                                {i.incidence_type}
                              </span>
                            </div>
                            {!acta?.is_locked && (
                              <button
                                type="button"
                                onClick={() => eliminarIncidencia(i.id)}
                                className="text-[10px] text-rose-450 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};