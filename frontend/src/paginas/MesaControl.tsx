import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { BarraLateral } from '../componentes/BarraLateral';
import { CabeceraEstandar } from '../componentes/CabeceraEstandar';
import { useConfirm } from '@omit/react-confirm-dialog';
import {
  serviciosFixture,
  serviciosResultados,
  serviciosParticipantes
} from '../servicios/api';
import type {
  Partido,
  ActaPartido,
  Incidencia,
  Jugador
} from '../servicios/api';

interface IncidentTypeConfig {
  type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'injury' | 'exclusion';
  label: string;
  icon: string;
  colorClass: string;
}

const FUTBOL_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'goal', label: 'Gol', icon: 'sports_soccer', colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { type: 'yellow_card', label: 'T. Amarilla', icon: 'square', colorClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { type: 'red_card', label: 'T. Roja', icon: 'square', colorClass: 'bg-rose-600 hover:bg-rose-700 text-white' },
  { type: 'foul', label: 'Falta', icon: 'sports_handball', colorClass: 'bg-slate-500 hover:bg-slate-600 text-white' },
  { type: 'injury', label: 'Lesión', icon: 'medical_services', colorClass: 'bg-teal-600 hover:bg-teal-700 text-white' },
];

const BASQUET_INCIDENTS: IncidentTypeConfig[] = [
  { type: 'goal', label: 'Canasta/Puntos', icon: 'sports_basketball', colorClass: 'bg-orange-500 hover:bg-orange-600 text-white' },
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

interface PeriodConfig {
  name: string;
  accumulatedMinutes: number;
  durationMinutes: number;
}

interface SportRules {
  hasTimer: boolean;
  periodLabel: string;
  periods: PeriodConfig[];
  scoreLabel: string;
}

const NORMAS_DEPORTES: Record<string, SportRules> = {
  futbol: {
    hasTimer: true,
    periodLabel: 'Tiempo',
    scoreLabel: 'Goles',
    periods: [
      { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: 45 },
      { name: '2° Tiempo', accumulatedMinutes: 45, durationMinutes: 45 },
      { name: '1° Prórroga', accumulatedMinutes: 90, durationMinutes: 15 },
      { name: '2° Prórroga', accumulatedMinutes: 105, durationMinutes: 15 },
    ]
  },
  basquet: {
    hasTimer: true,
    periodLabel: 'Cuarto',
    scoreLabel: 'Puntos',
    periods: [
      { name: '1° Cuarto', accumulatedMinutes: 0, durationMinutes: 10 },
      { name: '2° Cuarto', accumulatedMinutes: 10, durationMinutes: 10 },
      { name: '3° Cuarto', accumulatedMinutes: 20, durationMinutes: 10 },
      { name: '4° Cuarto', accumulatedMinutes: 30, durationMinutes: 10 },
      { name: 'Prórroga', accumulatedMinutes: 40, durationMinutes: 5 },
    ]
  },
  'balon mano': {
    hasTimer: true,
    periodLabel: 'Tiempo',
    scoreLabel: 'Goles',
    periods: [
      { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: 30 },
      { name: '2° Tiempo', accumulatedMinutes: 30, durationMinutes: 30 },
      { name: 'Prórroga', accumulatedMinutes: 60, durationMinutes: 5 },
    ]
  },
  voley: {
    hasTimer: false,
    periodLabel: 'Set',
    scoreLabel: 'Sets',
    periods: [
      { name: 'Set 1', accumulatedMinutes: 0, durationMinutes: 0 },
      { name: 'Set 2', accumulatedMinutes: 1, durationMinutes: 0 },
      { name: 'Set 3', accumulatedMinutes: 2, durationMinutes: 0 },
      { name: 'Set 4', accumulatedMinutes: 3, durationMinutes: 0 },
      { name: 'Set 5', accumulatedMinutes: 4, durationMinutes: 0 },
    ]
  }
};

export const MesaControl: React.FC = () => {
  const { usuario, tienePermiso, tieneRol } = useAutenticacion();
  const navegar = useNavigate();
  const confirm = useConfirm();

  const obtenerTiposIncidenciaDeporte = (): IncidentTypeConfig[] => {
    if (!partidoSeleccionado) return DEFAULT_INCIDENTS;
    const deporte = partidoSeleccionado.discipline?.name?.toLowerCase().trim() || '';
    if (deporte.includes('futbol') || deporte.includes('fútbol') || deporte.includes('soccer')) {
      return FUTBOL_INCIDENTS;
    }
    if (deporte.includes('basquet') || deporte.includes('básquet') || deporte.includes('basketball') || deporte.includes('baloncesto')) {
      return BASQUET_INCIDENTS;
    }
    if (deporte.includes('balon mano') || deporte.includes('balonmano') || deporte.includes('handball')) {
      return BALONMANO_INCIDENTS;
    }
    return DEFAULT_INCIDENTS;
  };

  const obtenerEtiquetaIncidencia = (tipo: string, desc?: string | null) => {
    const deporte = partidoSeleccionado?.discipline?.name?.toLowerCase().trim() || '';
    if (tipo === 'foul' && (desc?.includes('Exclusión') || desc?.includes('exclusion') || desc?.includes('Exclusion'))) {
      return { label: 'Exclusión 2m', icon: 'timer', color: 'bg-indigo-50 text-indigo-750 border-indigo-200' };
    }
    if (tipo === 'goal') {
      if (deporte.includes('basquet') || deporte.includes('básquet') || deporte.includes('basketball') || deporte.includes('baloncesto')) {
        return { label: 'Canasta/Puntos', icon: 'sports_basketball', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      }
      return { label: 'Gol', icon: 'sports_soccer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (tipo === 'yellow_card') {
      return { label: 'T. Amarilla', icon: 'square', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (tipo === 'red_card') {
      return { label: 'T. Roja', icon: 'square', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (tipo === 'foul') {
      return { label: 'Falta', icon: 'sports_handball', color: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
    if (tipo === 'injury') {
      return { label: 'Lesión', icon: 'medical_services', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    }
    return { label: tipo, icon: 'info', color: 'bg-slate-50 text-slate-650 border-slate-205' };
  };

  const obtenerNormasDeporte = (): SportRules => {
    if (!partidoSeleccionado) {
      return {
        hasTimer: true,
        periodLabel: 'Tiempo',
        scoreLabel: 'Puntos',
        periods: [{ name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: 40 }]
      };
    }
    const name = partidoSeleccionado.discipline?.name?.toLowerCase().trim() || '';
    if (name.includes('futbol') || name.includes('fútbol') || name.includes('soccer')) {
      return NORMAS_DEPORTES.futbol;
    }
    if (name.includes('basquet') || name.includes('básquet') || name.includes('basketball') || name.includes('baloncesto')) {
      return NORMAS_DEPORTES.basquet;
    }
    if (name.includes('balon mano') || name.includes('balonmano') || name.includes('handball')) {
      return NORMAS_DEPORTES['balon mano'];
    }
    if (name.includes('voley') || name.includes('voleibol') || name.includes('volleyball')) {
      return NORMAS_DEPORTES.voley;
    }
    return {
      hasTimer: true,
      periodLabel: 'Tiempo',
      scoreLabel: 'Puntos',
      periods: [
        { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: 40 },
        { name: '2° Tiempo', accumulatedMinutes: 40, durationMinutes: 40 },
      ]
    };
  };

  const [periodoActualIdx, setPeriodoActualIdx] = useState(0);

  const cambiarPeriodo = (nuevoIdx: number) => {
    const normas = obtenerNormasDeporte();
    if (nuevoIdx < 0 || nuevoIdx >= normas.periods.length) return;
    setPeriodoActualIdx(nuevoIdx);
    if (normas.hasTimer) {
      setCronometroActivo(false);
      setSegundosTranscurridos(0);
    }
  };

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

  const PASOS_AYUDA_MESA = [
    { paso: '1', titulo: 'Seleccionar Partido', desc: 'Elige un partido de la lista de la izquierda para cargar su acta oficial y planilla de incidencias.', icono: 'ads_click' },
    { paso: '2', titulo: 'Registrar Incidencias', desc: 'Agrega goles, tarjetas (amarillas/rojas) y lesiones en tiempo real. Selecciona el equipo, jugador y minuto del evento.', icono: 'sports_soccer' },
    { paso: '3', titulo: 'Guardar Marcador y Firmas', desc: 'Ingresa el nombre del árbitro y delegado de mesa. Puedes ir guardando el progreso en cualquier momento.', icono: 'edit_document' },
    { paso: '4', titulo: 'Cerrar y Bloquear Acta', desc: 'Al finalizar el encuentro, cierra el acta. Esto recalculará automáticamente la tabla de posiciones y aplicará sanciones.', icono: 'lock' },
  ];

  // Campos de formulario del acta
  const [golesLocal, setGolesLocal] = useState('0');
  const [golesVisita, setGolesVisita] = useState('0');
  const [firmaArbitro, setFirmaArbitro] = useState('');
  const [firmaDelegadoLocal, setFirmaDelegadoLocal] = useState('');
  const [firmaDelegadoVisita, setFirmaDelegadoVisita] = useState('');
  const [firmaDelegadoMesa, setFirmaDelegadoMesa] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados de cronómetro y subestado
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [subEstadoPartido, setSubEstadoPartido] = useState<'programado' | 'jugando' | 'descanso' | 'suspendido' | 'finalizado'>('programado');
  
  const [modalIncidenciaRapida, setModalIncidenciaRapida] = useState<{
    mostrar: boolean;
    teamId: number;
    teamName: string;
    type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'injury' | 'exclusion';
    capturedMinute: number;
    capturedSecond: number;
  } | null>(null);

  const [filtroJugadorModal, setFiltroJugadorModal] = useState('');

  const abrirRegistroRapido = (
    teamId: number,
    teamName: string,
    type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'injury' | 'exclusion'
  ) => {
    const normas = obtenerNormasDeporte();
    let minutoActual = 1;
    let segundoActual = 0;

    if (normas.hasTimer) {
      const periodo = normas.periods[periodoActualIdx];
      const accMin = periodo ? periodo.accumulatedMinutes : 0;
      minutoActual = Math.min(Math.max(accMin + Math.floor(segundosTranscurridos / 60) + 1, 1), 130);
      segundoActual = segundosTranscurridos % 60;
    } else {
      // Para voleibol, guardamos el número del Set (periodoActualIdx + 1) en el campo minute
      minutoActual = periodoActualIdx + 1;
      segundoActual = 0;
    }
    
    setFiltroJugadorModal(''); // Resetear buscador
    setModalIncidenciaRapida({
      mostrar: true,
      teamId,
      teamName,
      type,
      capturedMinute: minutoActual,
      capturedSecond: segundoActual
    });
  };

  const confirmarIncidenciaRapida = async (playerId: number) => {
    if (!partidoSeleccionado || !modalIncidenciaRapida) return;

    try {
      // Si el tipo es 'exclusion' (exclusión de balonmano), en el backend se guarda como 'foul' con descripción
      const res = await serviciosResultados.registrarIncidencia({
        match_id: partidoSeleccionado.id,
        team_id: modalIncidenciaRapida.teamId,
        player_id: playerId,
        incidence_type: modalIncidenciaRapida.type === 'exclusion' ? 'foul' : modalIncidenciaRapida.type,
        minute: modalIncidenciaRapida.capturedMinute,
        second: modalIncidenciaRapida.capturedSecond,
        description: `${
          modalIncidenciaRapida.type === 'goal' ? 'Gol/Punto' : 
          modalIncidenciaRapida.type === 'yellow_card' ? 'Tarjeta Amarilla' : 
          modalIncidenciaRapida.type === 'red_card' ? 'Tarjeta Roja' : 
          modalIncidenciaRapida.type === 'exclusion' ? 'Exclusión 2 Minutos' : 
          modalIncidenciaRapida.type === 'foul' ? 'Falta' : 'Lesión'
        }`
      });

      if (res.success) {
        mostrarMensaje('Incidencia en tiempo real registrada.');
        setIncidencias((prev) => [...prev, res.data]);
        
        // Si es Gol, actualizamos el marcador en caliente para comodidad
        if (modalIncidenciaRapida.type === 'goal') {
          const localId = partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id;
          if (modalIncidenciaRapida.teamId === localId) {
            setGolesLocal((prev) => (parseInt(prev) + 1).toString());
          } else {
            setGolesVisita((prev) => (parseInt(prev) + 1).toString());
          }
        }
        
        setModalIncidenciaRapida(null);
      }
    } catch (err) {
      mostrarMensaje('Error al registrar incidencia.', true);
    }
  };

  useEffect(() => {
    let intervalo: any = null;
    if (cronometroActivo) {
      intervalo = setInterval(() => {
        setSegundosTranscurridos((prev) => {
          const normas = obtenerNormasDeporte();
          if (normas.hasTimer) {
            const limit = (normas.periods[periodoActualIdx]?.durationMinutes || 0) * 60;
            const esFutbol = partidoSeleccionado?.discipline?.name?.toLowerCase().includes('futbol') || 
                              partidoSeleccionado?.discipline?.name?.toLowerCase().includes('fútbol');
            // Si no es fútbol y el límite de tiempo del periodo se alcanza, detener el reloj
            if (!esFutbol && limit > 0 && prev + 1 >= limit) {
              setCronometroActivo(false);
              mostrarMensaje(`Fin del ${normas.periods[periodoActualIdx]?.name || 'Periodo'}`);
              return limit;
            }
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalo);
    }
    return () => clearInterval(intervalo);
  }, [cronometroActivo, periodoActualIdx, partidoSeleccionado]);

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
        status: statusBackend
      });
      if (res.success) {
        setSubEstadoPartido(nuevoSubEstado);
        setPartidoSeleccionado((prev) => prev ? { ...prev, status: statusBackend } : null);
        
        if (nuevoSubEstado === 'jugando') {
          setCronometroActivo(true);
        } else {
          setCronometroActivo(false);
        }
        
        mostrarMensaje(`Estado del partido actualizado a: ${
          nuevoSubEstado === 'jugando' ? 'En Juego' :
          nuevoSubEstado === 'descanso' ? 'En Descanso' :
          nuevoSubEstado === 'suspendido' ? 'Suspendido' : 'Programado'
        }`);
        cargarPartidos();
      }
    } catch (err) {
      mostrarMensaje('Error al actualizar el estado del partido.', true);
    }
  };



  useEffect(() => {
    const localId = partidoSeleccionado?.local_team_id || (partidoSeleccionado as any)?.home_team_id;
    const visitorId = partidoSeleccionado?.visitor_team_id || (partidoSeleccionado as any)?.away_team_id;

    if (localId && visitorId) {
      const gLocal = incidencias.filter((i) => i.team_id === localId && i.incidence_type === 'goal').length;
      const gVisita = incidencias.filter((i) => i.team_id === visitorId && i.incidence_type === 'goal').length;
      setGolesLocal(gLocal.toString());
      setGolesVisita(gVisita.toString());
    }
  }, [incidencias, partidoSeleccionado]);

  useEffect(() => {
    if ((!tienePermiso('registrar_incidencias') && !tieneRol('organizador')) || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarPartidos();
    }
  }, []);

  const cargarPartidos = async () => {
    setCargando(true);
    try {
      const res = await serviciosFixture.obtenerPartidos();
      if (res.success) {
        setPartidos(res.data);
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
    
    // Inicializar campos
    setGolesLocal('0');
    setGolesVisita('0');
    setFirmaArbitro('');
    setFirmaDelegadoLocal('');
    setFirmaDelegadoVisita('');
    setFirmaDelegadoMesa('');
    setObservaciones('');

    try {
      // Cargar jugadores de ambos equipos para asociarlos a incidencias
      const resJugadores = await serviciosParticipantes.obtenerJugadores();
      if (resJugadores.success) {
        const localId = partido.local_team_id || (partido as any).home_team_id;
        const visitorId = partido.visitor_team_id || (partido as any).away_team_id;
        setJugadoresLocal(resJugadores.data.filter((j) => (j.team_id || j.team?.id) === localId));
        setJugadoresVisita(resJugadores.data.filter((j) => (j.team_id || j.team?.id) === visitorId));
      }

      // Cargar acta si ya existe
      const resActa = await serviciosResultados.obtenerActaPorPartido(partido.id);
      if (resActa.success && resActa.data) {
        const a = resActa.data;
        setActa(a);
        setGolesLocal(a.local_score.toString());
        setGolesVisita(a.visitor_score.toString());
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
    } catch (err) {
      // Si da 404 es porque no existe acta, es normal.
    }

    // Cargar incidencias del partido desde el servidor
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

    // Inicializar cronómetro y subestado según estado
    if (partido.status === 'en_curso') {
      setSubEstadoPartido('jugando');
      setCronometroActivo(false);
    } else if (partido.status === 'finalizado') {
      setSubEstadoPartido('finalizado');
      setCronometroActivo(false);
    } else {
      setSubEstadoPartido('programado');
      setCronometroActivo(false);
    }
    setSegundosTranscurridos(0);
    setPeriodoActualIdx(0);
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
          local_score: parseInt(golesLocal),
          visitor_score: parseInt(golesVisita),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: observaciones || undefined
        });
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Progreso de acta actualizado exitosamente.');
        }
      } else {
        const res = await serviciosResultados.registrarActa({
          match_id: partidoSeleccionado.id,
          local_score: parseInt(golesLocal),
          visitor_score: parseInt(golesVisita),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: observaciones || undefined
        });
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Progreso de acta guardado exitosamente.');
        }
      }
    } catch (err) {
      mostrarMensaje('Error al guardar acta de partido.', true);
    }
  };

  const bloquearActaFinal = async () => {
    if (!acta) {
      mostrarMensaje('Guarde el progreso del acta primero antes de bloquear.', true);
      return;
    }
    const isConfirmed = await confirm({
      title: '¿Desea cerrar el acta?',
      description: 'Esto es irreversible, recalculará la tabla de posiciones y registrará las sanciones correspondientes.',
      confirmText: 'Cerrar Acta',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'default',
      }
    });
    if (isConfirmed) {
      try {
        const res = await serviciosResultados.bloquearActa(acta.id);
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Acta de partido bloqueada y finalizada. Tabla actualizada.');
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
    
    const nuevoGolesLocal = esLocalForfeited ? scorePerdedor : scoreGanador;
    const nuevoGolesVisita = esLocalForfeited ? scoreGanador : scorePerdedor;

    setGolesLocal(nuevoGolesLocal);
    setGolesVisita(nuevoGolesVisita);
    setObservaciones(`[WALKOVER] forfeited_team_id: ${forfeitedTeamId}`);
    setFirmaArbitro('W.O. REGLAMENTARIO');
    setFirmaDelegadoLocal('W.O.');
    setFirmaDelegadoVisita('W.O.');
    setFirmaDelegadoMesa(usuario?.name || 'Mesa Control');

    sileo.warning({
      title: 'Walkover Declarado',
      description: `Se ha establecido el marcador reglamentario (${nuevoGolesLocal}-${nuevoGolesVisita}) y la observación correspondiente. Guarde los cambios para confirmar.`
    });
  };



  const eliminarIncidencia = async (id: number) => {
    const isConfirmed = await confirm({
      title: '¿Quitar incidencia?',
      description: '¿Desea quitar esta incidencia de la planilla? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'destructive',
      }
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

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
      <BarraLateral rol={usuario?.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
      <CabeceraEstandar
        titulo={partidoSeleccionado ? `${partidoSeleccionado.local_team?.name} vs ${partidoSeleccionado.visitor_team?.name}` : 'Mesa de Control'}
        subtitulo={partidoSeleccionado ? `${partidoSeleccionado.discipline?.name || 'Deporte'} - Jornada ${partidoSeleccionado.round} (${partidoSeleccionado.match_date ? new Date(partidoSeleccionado.match_date).toLocaleDateString() : ''})` : 'Registro de Resultados y Planillaje Oficial'}
        leftElement={partidoSeleccionado && (
          <button
            onClick={() => setPartidoSeleccionado(null)}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-800 hover:bg-[#171a26] transition-all cursor-pointer mr-2"
          >
            <span className="material-symbols-outlined text-slate-300">arrow_back</span>
          </button>
        )}
      />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
        
        {/* Toasts */}
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
          /* Vista 1: Listado completo de partidos (Full Screen Grid) */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Partidos Programados</h2>
                <p className="text-xs text-slate-400 font-medium">Seleccione un partido para abrir su mesa de control y comenzar a planillar el encuentro.</p>
              </div>
            </div>

            {cargando ? (
              <div className="py-20 text-center text-sm text-slate-400 font-bold animate-pulse">
                Cargando partidos de la mesa de control...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partidos.map((part) => {
                  const localScore = part.report?.local_score ?? 0;
                  const visitorScore = part.report?.visitor_score ?? 0;
                  return (
                    <div
                      key={part.id}
                      onClick={() => seleccionarPartido(part)}
                      className="bg-[#11131c] rounded-2xl border border-slate-900 p-5 shadow-xs hover:shadow-md hover:border-[#800f2f]/60 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Jornada {part.round}</span>
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[8px] uppercase tracking-wider border ${
                          part.status === 'finalizado' 
                            ? 'bg-[#1c1f2e] text-slate-350 border-slate-800' 
                            : part.status === 'jugando'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                            : part.status === 'descanso'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>{part.status}</span>
                      </div>

                      <div className="space-y-3 my-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-200 text-sm group-hover:text-primary transition-colors">{part.local_team?.name}</span>
                          {part.status === 'finalizado' || part.status === 'jugando' || part.status === 'descanso' ? (
                            <span className="font-black text-slate-200 text-xs bg-[#1c1f2e] px-2 py-1 rounded-md">
                              {localScore}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                          <span className="font-extrabold text-slate-200 text-sm group-hover:text-primary transition-colors">{part.visitor_team?.name}</span>
                          {part.status === 'finalizado' || part.status === 'jugando' || part.status === 'descanso' ? (
                            <span className="font-black text-slate-200 text-xs bg-[#1c1f2e] px-2 py-1 rounded-md">
                              {visitorScore}
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
                    No hay partidos programados en este momento.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Vista 2: Mesa de Control del Partido Seleccionado (Full Screen Grid con Form) */
          <form onSubmit={guardarProgresoActa} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {/* Columnas Izquierda: Marcador, Cronómetro, Incidencias Rápidas */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-900 pb-2 flex justify-between items-center">
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-white">Acta de Partido Oficial</h2>
                  {acta?.is_locked && (
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Acta Cerrada</span>
                  )}
                </div>

                {/* Cronómetro y Controles de Estado de Estadio */}
                <div className="bg-slate-950 border border-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-md">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${subEstadoPartido === 'jugando' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                      {subEstadoPartido === 'jugando' ? 'EN JUEGO' : 
                       subEstadoPartido === 'descanso' ? 'EN DESCANSO' : 
                       subEstadoPartido === 'suspendido' ? 'SUSPENDIDO' : 'PROGRAMADO'}
                    </span>
                  </div>

                  {/* Selector de Periodo / Set */}
                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl mt-4 z-10">
                    <button
                      type="button"
                      disabled={periodoActualIdx === 0}
                      onClick={() => cambiarPeriodo(periodoActualIdx - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs"
                      title={`Ver ${obtenerNormasDeporte().periodLabel} anterior`}
                    >
                      ◀
                    </button>
                    <div className="text-center px-2 min-w-[100px]">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                        {obtenerNormasDeporte().periodLabel}
                      </span>
                      <span className="font-extrabold text-sm text-white">
                        {obtenerNormasDeporte().periods[periodoActualIdx]?.name || `Periodo ${periodoActualIdx + 1}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={periodoActualIdx === obtenerNormasDeporte().periods.length - 1}
                      onClick={() => cambiarPeriodo(periodoActualIdx + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs"
                      title={`Ver ${obtenerNormasDeporte().periodLabel} siguiente`}
                    >
                      ▶
                    </button>
                  </div>

                  {/* Reloj y Controles (Si tiene cronómetro) */}
                  {obtenerNormasDeporte().hasTimer ? (
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white">
                        {formatearTiempo(segundosTranscurridos)}
                      </div>
                      
                      {!acta?.is_locked && (
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
                              onClick={() => setCronometroActivo(false)}
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

                          {subEstadoPartido !== 'finalizado' && subEstadoPartido !== 'programado' && (
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
                    </div>
                  ) : (
                    // Voleibol / Deportes sin Cronómetro por Tiempo
                    <div className="flex flex-col items-center gap-2 z-10 py-2">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Estado del Encuentro</span>
                      {!acta?.is_locked && (
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
                          {subEstadoPartido !== 'finalizado' && subEstadoPartido !== 'programado' && (
                            <button
                              type="button"
                              onClick={() => cambiarEstadoPartidoMesa('suspendido')}
                              className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Suspender
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Scoreboard Digital */}
                <div className="grid grid-cols-3 gap-4 bg-[#07080c] border border-slate-900 p-6 rounded-2xl items-center text-center">
                  <div className="font-extrabold text-sm text-slate-200 truncate">{partidoSeleccionado.local_team?.name}</div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center justify-center gap-3">
                      <input
                        type="text"
                        readOnly
                        value={golesLocal}
                        className="w-14 text-center text-2xl font-black border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 outline-hidden cursor-not-allowed select-none"
                        title="El marcador se calcula automáticamente a partir de las incidencias registradas"
                      />
                      <span className="font-black text-slate-600 text-lg">-</span>
                      <input
                        type="text"
                        readOnly
                        value={golesVisita}
                        className="w-14 text-center text-2xl font-black border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 outline-hidden cursor-not-allowed select-none"
                        title="El marcador se calcula automáticamente a partir de las incidencias registradas"
                      />
                    </div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest mt-1 block">
                      {obtenerNormasDeporte().scoreLabel}
                    </span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-200 truncate">{partidoSeleccionado.visitor_team?.name}</div>
                </div>

                {/* Opciones Especiales: Walkover (W.O.) */}
                {!acta?.is_locked && (
                  <div className="bg-[#07080c] border border-slate-900 p-4 rounded-2xl space-y-3 animate-fadeIn">
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span className="material-symbols-outlined text-xs font-bold">gavel</span>
                      Declarar Incomparecencia (Walkover / W.O.)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Si uno de los equipos no se presentó al encuentro, puedes registrar el marcador reglamentario (3-0 para Fútbol, 20-0 para Básquetbol, 3-0 para Vóley) de manera directa.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => manejarWalkover(partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id)}
                        className="bg-rose-950/30 hover:bg-rose-900 border border-rose-500/20 text-rose-350 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 font-sans"
                      >
                        <span className="material-symbols-outlined text-xs">cancel</span>
                        W.O. Local Inasistente
                      </button>
                      <button
                        type="button"
                        onClick={() => manejarWalkover(partidoSeleccionado.visitor_team_id || (partidoSeleccionado as any).away_team_id)}
                        className="bg-rose-950/30 hover:bg-rose-900 border border-rose-500/20 text-rose-350 text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 font-sans"
                      >
                        <span className="material-symbols-outlined text-xs">cancel</span>
                        W.O. Visita Inasistente
                      </button>
                    </div>
                  </div>
                )}

                {/* Botones de Incidencia Rápida (Eventos Rápidos de un Clic) */}
                {!acta?.is_locked && (
                  <div className="p-4 bg-[#07080c] border border-slate-900 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 border-b border-slate-900 pb-2">
                      <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Registrar Evento Rápido ({partidoSeleccionado.discipline?.name || 'Deporte General'})
                      </h3>
                      {subEstadoPartido !== 'jugando' && (
                        <span className="bg-amber-500/10 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                          Reloj detenido (capturará {formatearTiempo(segundosTranscurridos)})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Eventos Equipo Local */}
                      <div className="space-y-2 border-r border-slate-900 pr-2">
                        <span className="text-[10px] font-bold text-slate-200 block text-center truncate">{partidoSeleccionado.local_team?.name}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {obtenerTiposIncidenciaDeporte().map((inc) => (
                            <button
                              key={inc.type}
                              type="button"
                              onClick={() => abrirRegistroRapido(partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id, partidoSeleccionado.local_team?.name || 'Local', inc.type)}
                              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[9px] font-bold cursor-pointer transition-all hover:scale-102 hover:brightness-105 active:scale-98 ${inc.colorClass}`}
                            >
                              <span className="material-symbols-outlined text-[12px]">{inc.icon}</span>
                              {inc.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Eventos Equipo Visitante */}
                      <div className="space-y-2 pl-2">
                        <span className="text-[10px] font-bold text-slate-200 block text-center truncate">{partidoSeleccionado.visitor_team?.name}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {obtenerTiposIncidenciaDeporte().map((inc) => (
                            <button
                              key={inc.type}
                              type="button"
                              onClick={() => abrirRegistroRapido(partidoSeleccionado.visitor_team_id || (partidoSeleccionado as any).away_team_id, partidoSeleccionado.visitor_team?.name || 'Visita', inc.type)}
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

            {/* Columna Derecha: Signatures, Observations, and Event History */}
            <div className="lg:col-span-1 space-y-6">
              {/* Firmas y Observaciones */}
              <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-6 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white border-b border-slate-900 pb-2">Firmas y Cierre</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block font-sans">Firma Árbitro Principal</label>
                    <input
                      type="text" placeholder="Firma / Nombre" disabled={acta?.is_locked}
                      value={firmaArbitro} onChange={(e) => setFirmaArbitro(e.target.value)}
                      className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 placeholder:text-slate-600 font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-350 block font-sans uppercase">Delegado Mesa</label>
                      <input
                        type="text" placeholder="Nombre" disabled={acta?.is_locked}
                        value={firmaDelegadoMesa} onChange={(e) => setFirmaDelegadoMesa(e.target.value)}
                        className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 placeholder:text-slate-600 font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-355 block font-sans uppercase">Delegado Local</label>
                      <input
                        type="text" placeholder="Nombre" disabled={acta?.is_locked}
                        value={firmaDelegadoLocal} onChange={(e) => setFirmaDelegadoLocal(e.target.value)}
                        className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 placeholder:text-slate-600 font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-355 block font-sans uppercase">Delegado Visita</label>
                      <input
                        type="text" placeholder="Nombre" disabled={acta?.is_locked}
                        value={firmaDelegadoVisita} onChange={(e) => setFirmaDelegadoVisita(e.target.value)}
                        className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 placeholder:text-slate-600 font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Observaciones del Encuentro</label>
                  <textarea
                    placeholder="Ej: Retraso por clima, incidencias fuera del campo..." disabled={acta?.is_locked}
                    value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full text-xs border border-slate-900 bg-[#171a26] text-white rounded-lg p-2 min-h-[60px] placeholder:text-slate-600"
                  />
                </div>

                {!acta?.is_locked && (
                  <div className="flex flex-col gap-2 pt-2">
                    <button type="submit" className="w-full bg-[#1c1f2e] hover:bg-[#282d42] border border-slate-900 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all">
                      Guardar Marcador y Firmas
                    </button>
                    <button
                      type="button" onClick={bloquearActaFinal}
                      className="w-full bg-[#800f2f] hover:bg-[#a4133c] text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all"
                    >
                      Cerrar y Bloquear Acta
                    </button>
                  </div>
                )}
              </div>

              {/* Registro de Incidencias / Historial */}
              <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-6 shadow-xs space-y-4">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-white border-b border-slate-900 pb-2">Historial de Sucesos</h2>
                
                {incidencias.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No hay incidencias registradas en este encuentro.</p>
                ) : (
                  <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden bg-[#11131c] max-h-[300px] overflow-y-auto">
                    {incidencias.map((i) => {
                      const config = obtenerEtiquetaIncidencia(i.incidence_type, i.description);
                      return (
                        <div key={i.id} className="p-3 text-xs flex justify-between items-center hover:bg-[#171a26]/30">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold text-secondary mr-2 shrink-0">
                              {i.minute}' {i.second !== undefined && i.second !== null && i.second > 0 ? `${i.second.toString().padStart(2, '0')}"` : ''}
                            </span>
                            <span className="font-semibold text-slate-200 truncate inline-block max-w-[120px] align-middle" title={i.player?.name}>
                              {i.player?.name || 'Jugador no especificado'}
                            </span>
                            <span className="text-slate-700 mx-1.5">|</span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border align-middle ${config.color}`}>
                              <span className="material-symbols-outlined text-[9px] shrink-0">
                                {config.icon}
                              </span>
                              {config.label}
                            </span>
                          </div>
                          {!acta?.is_locked && (
                            <button type="button" onClick={() => eliminarIncidencia(i.id)} className="text-[10px] text-rose-450 font-bold hover:underline cursor-pointer shrink-0 ml-2">
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

      {/* Botón Flotante de Ayuda */}
      <button
        onClick={() => setMostrarAyuda(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#800f2f] hover:bg-[#a4133c] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 cursor-pointer"
        title="¿Cómo usar esta sección?"
      >
        <span className="material-symbols-outlined text-lg">question_mark</span>
      </button>

      {/* Drawer de Ayuda */}
      {mostrarAyuda && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-[#11131c] border-l border-slate-900 h-full shadow-2xl flex flex-col animate-slideLeft">
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900 bg-[#07080c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c9244b] text-base">help</span>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">Ayuda: Mesa de Control</h3>
              </div>
              <button
                onClick={() => setMostrarAyuda(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:bg-[#171a26] hover:text-slate-200 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Contenido del Drawer */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#11131c]">
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
                Sigue estos pasos para registrar y finalizar los partidos oficiales de tu torneo:
              </p>
              {PASOS_AYUDA_MESA.map((p) => (
                <div key={p.paso} className="flex gap-3 p-3 rounded-xl bg-[#07080c] border border-slate-900 hover:bg-[#171a26]/40 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-[#800f2f]/20 text-[#c9244b] border border-[#800f2f]/30 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {p.paso}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-slate-500">{p.icono}</span>
                      {p.titulo}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie del Drawer */}
            <div className="px-5 py-4 border-t border-slate-900 bg-[#07080c]/50">
              <p className="text-[10px] text-[#c9244b] font-semibold mb-1">⚠️ Importante:</p>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Cerrar y bloquear el acta es un paso irreversible que calcula los puntos finales del standing y genera sanciones aplicables a los jugadores para las siguientes fechas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Emergente de Incidencia Rápida (Selección de Jugador) */}
      {modalIncidenciaRapida && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#11131c] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#222738] flex flex-col max-h-[85vh] animate-scaleIn">
            {/* Cabecera */}
            <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between bg-[#07080c]">
              <div>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#c9244b]">
                    {modalIncidenciaRapida.type === 'goal' ? 'sports_soccer' :
                     modalIncidenciaRapida.type === 'yellow_card' ? 'square' :
                     modalIncidenciaRapida.type === 'red_card' ? 'square' :
                     modalIncidenciaRapida.type === 'exclusion' ? 'timer' : 'info'}
                  </span>
                  Registrar {
                    modalIncidenciaRapida.type === 'goal' ? 'Gol/Punto' : 
                    modalIncidenciaRapida.type === 'yellow_card' ? 'Tarjeta Amarilla' : 
                    modalIncidenciaRapida.type === 'red_card' ? 'Tarjeta Roja' : 
                    modalIncidenciaRapida.type === 'exclusion' ? 'Exclusión (2 min)' : 
                    modalIncidenciaRapida.type === 'foul' ? 'Falta' : 'Lesión'
                  }
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 block">
                  {modalIncidenciaRapida.teamName}
                </span>
              </div>
              <button
                onClick={() => setModalIncidenciaRapida(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#171a26] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Contenido / Listado de Jugadores del Equipo */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#11131c]">
              {/* Ajustar Tiempo Capturado */}
              <div className="bg-[#07080c] border border-slate-900 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">Ajustar Tiempo del Suceso</span>
                <div className="flex gap-3 justify-center items-center">
                  <div className="w-20">
                    <label className="text-[8px] font-bold text-slate-450 uppercase block mb-0.5 text-center">Minuto</label>
                    <input 
                      type="number" min="1" max="130"
                      value={modalIncidenciaRapida.capturedMinute}
                      onChange={(e) => setModalIncidenciaRapida({
                        ...modalIncidenciaRapida,
                        capturedMinute: Math.min(Math.max(parseInt(e.target.value) || 1, 1), 130)
                      })}
                      className="w-full text-xs font-bold border border-slate-800 rounded-lg p-1.5 bg-[#171a26] text-white text-center focus:ring-1 focus:ring-[#800f2f] focus:outline-hidden"
                    />
                  </div>
                  <span className="font-bold text-slate-650 mt-3">:</span>
                  <div className="w-20">
                    <label className="text-[8px] font-bold text-slate-450 uppercase block mb-0.5 text-center">Segundo</label>
                    <input 
                      type="number" min="0" max="59"
                      value={modalIncidenciaRapida.capturedSecond}
                      onChange={(e) => setModalIncidenciaRapida({
                        ...modalIncidenciaRapida,
                        capturedSecond: Math.min(Math.max(parseInt(e.target.value) || 0, 0), 59)
                      })}
                      className="w-full text-xs font-bold border border-slate-800 rounded-lg p-1.5 bg-[#171a26] text-white text-center focus:ring-1 focus:ring-[#800f2f] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Filtro/Buscador Rápido */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Buscar Jugador</label>
                <input
                  type="text"
                  placeholder="🔍 Ingrese nombre o número..."
                  value={filtroJugadorModal}
                  onChange={(e) => setFiltroJugadorModal(e.target.value)}
                  className="w-full text-xs border border-slate-800 rounded-xl p-2.5 bg-[#171a26] text-white focus:ring-1 focus:ring-[#800f2f] focus:outline-hidden"
                />
              </div>

              {/* Lista */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block pb-1">Seleccionar:</span>
                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                  {((modalIncidenciaRapida.teamId === (partidoSeleccionado?.local_team_id || (partidoSeleccionado as any)?.home_team_id)
                    ? jugadoresLocal 
                    : jugadoresVisita
                  ).filter((j) => {
                    if (!filtroJugadorModal) return true;
                    const search = filtroJugadorModal.toLowerCase();
                    return j.name.toLowerCase().includes(search) || 
                      (j.number && j.number.toString().includes(search)) ||
                      (j.position && j.position.toLowerCase().includes(search));
                  })).map((jug) => (
                    <button
                      key={jug.id}
                      type="button"
                      onClick={() => confirmarIncidenciaRapida(jug.id)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-900 hover:border-[#800f2f]/60 hover:bg-[#800f2f]/5 flex justify-between items-center transition-all cursor-pointer group"
                    >
                      <div>
                        <span className="font-bold text-slate-200 group-hover:text-[#c9244b] transition-colors text-xs">{jug.name}</span>
                        <span className="text-slate-500 text-[9px] block mt-0.5 uppercase font-medium">{jug.position || 'Jugador'}</span>
                      </div>
                      <span className="w-7 h-7 rounded-full bg-[#171a26] flex items-center justify-center font-extrabold text-[10px] text-slate-350 border border-slate-800 group-hover:bg-[#800f2f] group-hover:text-white group-hover:border-[#800f2f] transition-all">
                        {jug.number || '#'}
                      </span>
                    </button>
                  ))}

                  {((modalIncidenciaRapida.teamId === (partidoSeleccionado?.local_team_id || (partidoSeleccionado as any)?.home_team_id)
                    ? jugadoresLocal.length 
                    : jugadoresVisita.length
                  ) === 0) && (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                      No hay jugadores registrados para este equipo.
                    </div>
                  )}

                  {filtroJugadorModal && ((modalIncidenciaRapida.teamId === (partidoSeleccionado?.local_team_id || (partidoSeleccionado as any)?.home_team_id)
                    ? jugadoresLocal 
                    : jugadoresVisita
                  ).filter((j) => {
                    const search = filtroJugadorModal.toLowerCase();
                    return j.name.toLowerCase().includes(search) || 
                      (j.number && j.number.toString().includes(search)) ||
                      (j.position && j.position.toLowerCase().includes(search));
                  }).length === 0) && (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                      Ningún jugador coincide con la búsqueda.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-5 py-3.5 border-t border-slate-900 bg-[#07080c] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalIncidenciaRapida(null)}
                className="px-4 py-2 border border-slate-800 hover:bg-[#171a26] text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
};
