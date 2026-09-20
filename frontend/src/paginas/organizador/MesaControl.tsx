import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { useConfirm } from '@omit/react-confirm-dialog';
import {
  serviciosFixture,
  serviciosResultados,
  serviciosParticipantes
} from '../../servicios/api';
import type {
  Partido,
  ActaPartido,
  Incidencia,
  Jugador
} from '../../servicios/api';

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
  scoreLabel: string;
  getPeriods: (durationMinutes: number) => PeriodConfig[];
}

const NORMAS_DEPORTES: Record<string, SportRules> = {
  futbol: {
    hasTimer: true,
    periodLabel: 'Tiempo',
    scoreLabel: 'Goles',
    getPeriods: (durationMinutes: number) => [
      { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: durationMinutes },
      { name: '2° Tiempo', accumulatedMinutes: durationMinutes, durationMinutes: durationMinutes },
      { name: '1° Prórroga', accumulatedMinutes: durationMinutes * 2, durationMinutes: 15 },
      { name: '2° Prórroga', accumulatedMinutes: (durationMinutes * 2) + 15, durationMinutes: 15 },
    ]
  },
  basquet: {
    hasTimer: true,
    periodLabel: 'Cuarto',
    scoreLabel: 'Puntos',
    getPeriods: (durationMinutes: number) => [
      { name: '1° Cuarto', accumulatedMinutes: 0, durationMinutes: durationMinutes },
      { name: '2° Cuarto', accumulatedMinutes: durationMinutes, durationMinutes: durationMinutes },
      { name: '3° Cuarto', accumulatedMinutes: durationMinutes * 2, durationMinutes: durationMinutes },
      { name: '4° Cuarto', accumulatedMinutes: durationMinutes * 3, durationMinutes: durationMinutes },
      { name: 'Prórroga', accumulatedMinutes: durationMinutes * 4, durationMinutes: 5 },
    ]
  },
  'balon mano': {
    hasTimer: true,
    periodLabel: 'Tiempo',
    scoreLabel: 'Goles',
    getPeriods: (durationMinutes: number) => [
      { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: durationMinutes },
      { name: '2° Tiempo', accumulatedMinutes: durationMinutes, durationMinutes: durationMinutes },
      { name: 'Prórroga', accumulatedMinutes: durationMinutes * 2, durationMinutes: 5 },
    ]
  },
  voley: {
    hasTimer: false,
    periodLabel: 'Set',
    scoreLabel: 'Sets',
    getPeriods: () => [
      { name: 'Set 1', accumulatedMinutes: 0, durationMinutes: 0 },
      { name: 'Set 2', accumulatedMinutes: 1, durationMinutes: 0 },
      { name: 'Set 3', accumulatedMinutes: 2, durationMinutes: 0 },
      { name: 'Set 4', accumulatedMinutes: 3, durationMinutes: 0 },
      { name: 'Set 5', accumulatedMinutes: 4, durationMinutes: 0 },
    ]
  }
};

export const MesaControl: React.FC = () => {
  const { usuario, tienePermiso, tieneRol, cargando: cargandoAuth } = useAutenticacion();
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

  const [extraTimeMinutes, setExtraTimeMinutes] = useState(0);
  const [hasExtraTime, setHasExtraTime] = useState(false);
  const [maxExtraTime, setMaxExtraTime] = useState(5);
  const [minutosPorTiempo, setMinutosPorTiempo] = useState(45);

  const [mostrarConfigModal, setMostrarConfigModal] = useState(false);
  const [configDisciplinaId, setConfigDisciplinaId] = useState<number | null>(null);
  const [configCategoriaId, setConfigCategoriaId] = useState<number | null>(null);
  const [configMinutosTiempo, setConfigMinutosTiempo] = useState(45);
  const [configGuardando, setConfigGuardando] = useState(false);
  const [configDisciplinas, setConfigDisciplinas] = useState<any[]>([]);
  const [configCategorias, setConfigCategorias] = useState<any[]>([]);
  const [configCargandoDisciplinas, setConfigCargandoDisciplinas] = useState(false);

  const minutosPorTiempoRef = useRef(minutosPorTiempo);

  useEffect(() => {
    minutosPorTiempoRef.current = minutosPorTiempo;
  }, [minutosPorTiempo]);

  const PASOS_AYUDA_MESA = [
    { paso: '1', titulo: 'Seleccionar Partido', desc: 'Elige un partido de la lista de la izquierda para cargar su acta oficial y planilla de incidencias.', icono: 'ads_click' },
    { paso: '2', titulo: 'Registrar Incidencias', desc: 'Agrega goles, tarjetas (amarillas/rojas) y lesiones en tiempo real. Selecciona el equipo, jugador y minuto del evento.', icono: 'sports_soccer' },
    { paso: '3', titulo: 'Guardar Marcador y Firmas', desc: 'Ingresa el nombre del árbitro y delegado de mesa. Puedes ir guardando el progreso en cualquier momento.', icono: 'edit_document' },
    { paso: '4', titulo: 'Cerrar y Bloquear Acta', desc: 'Al finalizar el encuentro, cierra el acta. Esto recalculará automáticamente la tabla de posiciones y aplicará sanciones.', icono: 'lock' },
  ];

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
  
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('');

  const [modalIncidenciaRapida, setModalIncidenciaRapida] = useState<{
    mostrar: boolean;
    teamId: number;
    teamName: string;
    type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'injury' | 'exclusion';
    capturedMinute: number;
    capturedSecond: number;
  } | null>(null);

  const [filtroJugadorModal, setFiltroJugadorModal] = useState('');

  const obtenerTiposIncidenciaDeporte = (): IncidentTypeConfig[] => {
    if (!partidoSeleccionado) return DEFAULT_INCIDENTS;
    const deporte = partidoSeleccionado.discipline?.name?.toLowerCase().trim() || '';
    if (deporte.includes('futbol') || deporte.includes('fútbol') || deporte.includes('soccer') || deporte.includes('fulbito')) {
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

  const obtenerNormasDeporte = (): SportRules & { periods: PeriodConfig[] } => {
    if (!partidoSeleccionado) {
      const defaultRules = {
        hasTimer: true,
        periodLabel: 'Tiempo',
        scoreLabel: 'Puntos',
        getPeriods: (durationMinutes: number) => [{ name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: durationMinutes }]
      };
      const periods = defaultRules.getPeriods(40);
      return { ...defaultRules, periods };
    }
    const name = partidoSeleccionado.discipline?.name?.toLowerCase().trim() || '';
    let rules: SportRules;
    let duration = minutosPorTiempo;
    
    if (name.includes('futbol') || name.includes('fútbol') || name.includes('soccer') || name.includes('fulbito')) {
      rules = NORMAS_DEPORTES.futbol;
    } else if (name.includes('basquet') || name.includes('básquet') || name.includes('basketball') || name.includes('baloncesto')) {
      rules = NORMAS_DEPORTES.basquet;
      duration = 10;
    } else if (name.includes('balon mano') || name.includes('balonmano') || name.includes('handball')) {
      rules = NORMAS_DEPORTES['balon mano'];
      duration = 30;
    } else if (name.includes('voley') || name.includes('voleibol') || name.includes('volleyball')) {
      rules = NORMAS_DEPORTES.voley;
    } else {
      rules = {
        hasTimer: true,
        periodLabel: 'Tiempo',
        scoreLabel: 'Puntos',
        getPeriods: () => [
          { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: 40 },
          { name: '2° Tiempo', accumulatedMinutes: 40, durationMinutes: 40 },
        ]
      };
    }
    
    const periods = rules.getPeriods(duration);
    return { ...rules, periods };
  };

  const obtenerNormasDeporteConDuration = (durationMinutes: number): SportRules & { periods: PeriodConfig[] } => {
    if (!partidoSeleccionado) {
      const defaultRules = {
        hasTimer: true,
        periodLabel: 'Tiempo',
        scoreLabel: 'Puntos',
        getPeriods: (durationMinutes: number) => [{ name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: durationMinutes }]
      };
      const periods = defaultRules.getPeriods(durationMinutes);
      return { ...defaultRules, periods };
    }
    const name = partidoSeleccionado.discipline?.name?.toLowerCase().trim() || '';
    let rules: SportRules;
    let duration = durationMinutes;
    
    if (name.includes('futbol') || name.includes('fútbol') || name.includes('soccer') || name.includes('fulbito')) {
      rules = NORMAS_DEPORTES.futbol;
    } else if (name.includes('basquet') || name.includes('básquet') || name.includes('basketball') || name.includes('baloncesto')) {
      rules = NORMAS_DEPORTES.basquet;
      duration = 10;
    } else if (name.includes('balon mano') || name.includes('balonmano') || name.includes('handball')) {
      rules = NORMAS_DEPORTES['balon mano'];
      duration = 30;
    } else if (name.includes('voley') || name.includes('voleibol') || name.includes('volleyball')) {
      rules = NORMAS_DEPORTES.voley;
    } else {
      rules = {
        hasTimer: true,
        periodLabel: 'Tiempo',
        scoreLabel: 'Puntos',
        getPeriods: () => [
          { name: '1° Tiempo', accumulatedMinutes: 0, durationMinutes: 40 },
          { name: '2° Tiempo', accumulatedMinutes: 40, durationMinutes: 40 },
        ]
      };
    }
    
    const periods = rules.getPeriods(duration);
    return { ...rules, periods };
  };

  const formatearTiempo = (totalSegundos: number) => {
    const mins = Math.floor(totalSegundos / 60);
    const secs = totalSegundos % 60;
    const tiempoBase = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    if (hasExtraTime && extraTimeMinutes > 0) {
      return `${tiempoBase} +${extraTimeMinutes}'`;
    }
    return tiempoBase;
  };

  const partidosFiltrados = partidos.filter((part) => {
    if (filtroTexto.trim() !== '') {
      const query = filtroTexto.toLowerCase();
      const localName = part.local_team?.name?.toLowerCase() || '';
      const visitorName = part.visitor_team?.name?.toLowerCase() || '';
      if (!localName.includes(query) && !visitorName.includes(query)) {
        return false;
      }
    }

    if (filtroDisciplina !== 'todas') {
      const discId = part.discipline_id?.toString() || part.discipline?.id?.toString() || '';
      if (discId !== filtroDisciplina) {
        return false;
      }
    }

    if (filtroCategoria !== 'todas') {
      const catId = part.category_id?.toString() || part.category?.id?.toString() || '';
      if (catId !== filtroCategoria) {
        return false;
      }
    }

    if (filtroEstado !== 'todos') {
      if (filtroEstado === 'pendiente' && part.status !== 'programado' && part.status !== 'reprogramado') {
        return false;
      }
      if (filtroEstado === 'en_curso' && part.status !== 'en_curso') {
        return false;
      }
      if (filtroEstado === 'finalizado' && part.status !== 'finalizado') {
        return false;
      }
      if (filtroEstado === 'cancelado' && part.status !== 'cancelado') {
        return false;
      }
    }

    if (filtroFecha !== '') {
      const partDate = part.match_date ? new Date(part.match_date).toISOString().split('T')[0] : '';
      if (partDate !== filtroFecha) {
        return false;
      }
    }

    return true;
  });

  const disciplinasUnicas = Array.from(
    new Map(
      partidos
        .map((p) => p.discipline || (p as any).championship?.disciplines?.[0])
        .filter((d): d is any => !!d && !!d.id)
        .map((d) => [d.id, d])
    ).values()
  );

  const categoriasUnicas = Array.from(
    new Map(
      partidos
        .map((p) => p.category)
        .filter((c): c is any => !!c && !!c.id)
        .map((c) => [c.id, c])
    ).values()
  );

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
      capturedSecond: segundoActual
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
        
        if (modalIncidenciaRapida.type === 'goal') {
          const localId = partidoSeleccionado.local_team_id || (partidoSeleccionado as any).home_team_id;
          if (modalIncidenciaRapida.teamId === localId) {
            setGolesHome((prev) => (parseInt(prev) + 1).toString());
          } else {
            setGolesAway((prev) => (parseInt(prev) + 1).toString());
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
    
    if (cronometroActivo && timerStartedAt) {
      intervalo = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timerStartedAt.getTime()) / 1000);
        const totalTime = baseElapsedTime + diff;
        
        const normas = obtenerNormasDeporteConDuration(minutosPorTiempoRef.current);
        const periodo = normas.periods[periodoActualIdx];
        const duracionPeriodo = periodo ? periodo.durationMinutes * 60 : 0;
        const tiempoExtraEnSegundos = hasExtraTime ? extraTimeMinutes * 60 : 0;
        const limiteTotal = duracionPeriodo + tiempoExtraEnSegundos;
        
        if (duracionPeriodo > 0 && totalTime >= limiteTotal) {
          setSegundosTranscurridos(limiteTotal);
          setCronometroActivo(false);
          setTimerStartedAt(null);
          sincronizarTimerConBackend(limiteTotal, periodoActualIdx, 'finished');
          
          const nextIdx = periodoActualIdx + 1;
          const nextPeriodo = normas.periods[nextIdx];
          
          if (nextPeriodo && nextPeriodo.durationMinutes > 0) {
            setPeriodoActualIdx(nextIdx);
            setSegundosTranscurridos(0);
            setBaseElapsedTime(0);
            sincronizarTimerConBackend(0, nextIdx, 'stopped');
            
            sileo.info({
              title: 'Tiempo Finalizado',
              description: `${periodo?.name || 'Periodo'} completado${hasExtraTime && extraTimeMinutes > 0 ? ` (${extraTimeMinutes} min de tiempo extra incluido)` : ''}. Inicia ${nextPeriodo.name} cuando estés listo.`
            });
          } else {
            sileo.info({
              title: 'Partido Finalizado',
              description: `Todos los periodos han sido completados.${hasExtraTime && extraTimeMinutes > 0 ? ` (${extraTimeMinutes} min de tiempo extra usado)` : ''}`
            });
          }
          
          return;
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
  }, [cronometroActivo, timerStartedAt, baseElapsedTime, periodoActualIdx, hasExtraTime, extraTimeMinutes, minutosPorTiempo]);

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
      setGolesHome(gLocal.toString());
      setGolesAway(gVisita.toString());
    }
  }, [incidencias, partidoSeleccionado]);

  useEffect(() => {
    if (cargandoAuth) return;
    if ((!tienePermiso('registrar_incidencias') && !tieneRol('organizador')) || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarPartidos();
    }
  }, [cargandoAuth]);

  const cargarPartidos = async () => {
    setCargando(true);
    try {
      const res = await serviciosFixture.obtenerTodosPartidos();
      if (res.success) {
        setPartidos(res.data);
      }
    } catch (err) {
      setErrorLocal('Error al cargar partidos.');
    } finally {
      setCargando(false);
    }
  };

  const cargarDisciplinasConfig = async () => {
    setConfigCargandoDisciplinas(true);
    try {
      const res = await serviciosParticipantes.obtenerDisciplinas();
      if (res.success) {
        setConfigDisciplinas(res.data);
      }
    } catch (err) {
      console.error('Error cargando disciplinas:', err);
    } finally {
      setConfigCargandoDisciplinas(false);
    }
  };

  const cargarCategoriasConfig = async (disciplineId: number) => {
    try {
      const champId = localStorage.getItem('campeonato_activo_id');
      if (!champId) return;
      const res = await serviciosParticipantes.obtenerCategoriasPorCampeonato(parseInt(champId));
      if (res.success) {
        const filtered = res.data.filter((c: any) => c.championship_discipline?.discipline_id === disciplineId);
        setConfigCategorias(filtered);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const guardarConfiguracionTiempo = async () => {
    if (!configDisciplinaId || !configCategoriaId) {
      mostrarMensaje('Selecciona disciplina y categoría', true);
      return;
    }
    setConfigGuardando(true);
    try {
      const champId = localStorage.getItem('campeonato_activo_id');
      if (!champId) {
        mostrarMensaje('No hay campeonato activo', true);
        setConfigGuardando(false);
        return;
      }
      const discRes = await serviciosParticipantes.obtenerDisciplinasCampeonato(parseInt(champId));
      if (discRes.success) {
        const cd = discRes.data.find((d: any) => d.discipline_id === configDisciplinaId);
        if (cd) {
          await serviciosParticipantes.actualizarConfiguracionDisciplina(cd.id, {
            match_duration_minutes: configMinutosTiempo
          });
          
          const discResActualizado = await serviciosParticipantes.obtenerDisciplinasCampeonato(parseInt(champId));
          if (discResActualizado.success) {
            const cdActualizado = discResActualizado.data.find((d: any) => d.discipline_id === configDisciplinaId);
            if (cdActualizado?.match_duration_minutes) {
              setMinutosPorTiempo(cdActualizado.match_duration_minutes);
              minutosPorTiempoRef.current = cdActualizado.match_duration_minutes;
            }
          }
          
          setMostrarConfigModal(false);
          const disciplinaNombre = configDisciplinas.find(d => d.id === configDisciplinaId)?.name || '';
          mostrarMensaje(`Configuración guardada: ${configMinutosTiempo} minutos por tiempo para ${disciplinaNombre}`);
        } else {
          mostrarMensaje('No se encontró la configuración de la disciplina', true);
        }
      }
    } catch (err) {
      mostrarMensaje('Error al guardar configuración', true);
    } finally {
      setConfigGuardando(false);
    }
  };

  const guardarTiempoExtra = async () => {
    if (!partidoSeleccionado) return;
    try {
      await serviciosFixture.actualizarTiempoExtra(partidoSeleccionado.id, {
        extra_time_minutes: extraTimeMinutes,
        has_extra_time: hasExtraTime
      });
      mostrarMensaje('Configuración de tiempo extra guardada');
    } catch {
      mostrarMensaje('Error al guardar tiempo extra', true);
    }
  };

  const seleccionarPartido = async (partido: Partido) => {
    setErrorLocal(null);
    setMensajeExito(null);
    setPartidoSeleccionado(partido);
    setActa(null);
    setIncidencias([]);
    
    setGolesHome('0');
    setGolesAway('0');
    setFirmaArbitro('');
    setFirmaDelegadoLocal(partido.local_team?.representative || '');
    setFirmaDelegadoVisita(partido.visitor_team?.representative || '');
    setFirmaDelegadoMesa(usuario?.name || '');
    setObservaciones('');

    const extraTime = (partido as any).extra_time_minutes || 0;
    const hasExtra = (partido as any).has_extra_time || false;
    const maxExtra = (partido as any).max_extra_time || 5;
    setExtraTimeMinutes(extraTime);
    setHasExtraTime(hasExtra);
    setMaxExtraTime(maxExtra);

    try {
      const resJugadores = await serviciosParticipantes.obtenerTodosJugadoresPorCampeonato();
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
    } catch (err) { }

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

    try {
      const champId = (partido as any).championship_id || (partido as any).championship?.id;
      if (champId && partido.discipline_id) {
        const discRes = await serviciosParticipantes.obtenerDisciplinasCampeonato(champId);
        if (discRes.success) {
          const cd = discRes.data.find((d: any) => d.discipline_id === partido.discipline_id);
          if (cd?.match_duration_minutes) {
            setMinutosPorTiempo(cd.match_duration_minutes);
          }
        }
      }
    } catch (e) {
      console.error('Error cargando configuración de tiempo:', e);
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
          observations: observaciones || undefined
        });
        if (res.success) {
          setActa(res.data);
          mostrarMensaje('Progreso de acta actualizado exitosamente.');
        }
      } else {
        const res = await serviciosResultados.registrarActa({
          match_id: partidoSeleccionado.id,
          local_score: parseInt(golesHome),
          visitor_score: parseInt(golesAway),
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
    
    const equipoPerdedor = esLocalForfeited 
      ? partidoSeleccionado.local_team?.name || 'Local' 
      : partidoSeleccionado.visitor_team?.name || 'Visita';
    
    const equipoGanador = esLocalForfeited 
      ? partidoSeleccionado.visitor_team?.name || 'Visita' 
      : partidoSeleccionado.local_team?.name || 'Local';

    const nuevoGolesLocal = esLocalForfeited ? scorePerdedor : scoreGanador;
    const nuevoGolesVisita = esLocalForfeited ? scoreGanador : scorePerdedor;

    setGolesHome(nuevoGolesLocal);
    setGolesAway(nuevoGolesVisita);
    setObservaciones(`WALKOVER: El equipo ${equipoPerdedor} no se presentó al encuentro. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}.`);
    
    setCronometroActivo(false);
    setSubEstadoPartido('finalizado');
    
    try {
      await serviciosFixture.actualizarPartido(partidoSeleccionado.id, {
        status: 'finalizado'
      });
      
      const combinedSignature = `Local: ${firmaDelegadoLocal.trim()} | Visita: ${firmaDelegadoVisita.trim()} | Mesa: ${firmaDelegadoMesa.trim()}`;

      let actaId: number | null = acta?.id ?? null;

      if (acta) {
        await serviciosResultados.actualizarActa(acta.id, {
          local_score: parseInt(nuevoGolesLocal),
          visitor_score: parseInt(nuevoGolesVisita),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: `WALKOVER: El equipo ${equipoPerdedor} no se presentó al encuentro. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}.`
        });
      } else {
        const res = await serviciosResultados.registrarActa({
          match_id: partidoSeleccionado.id,
          local_score: parseInt(nuevoGolesLocal),
          visitor_score: parseInt(nuevoGolesVisita),
          referee_signature: firmaArbitro || undefined,
          delegate_signature: combinedSignature,
          observations: `WALKOVER: El equipo ${equipoPerdedor} no se presentó al encuentro. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}.`
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
        description: `Se ha declarado W.O. para ${equipoPerdedor}. Victoria para ${equipoGanador} por ${scoreGanador}-${scorePerdedor}. El acta quedó cerrada y las posiciones, estadísticas y sanciones ya se actualizaron.`
      });
    } catch (err) {
      console.error('Error al guardar acta con WO:', err);
      sileo.error({
        title: 'Error',
        description: 'Error al guardar el acta del Walkover. Complete las firmas y guarde manualmente.'
      });
    }
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

  const cambiarPeriodo = (nuevoIdx: number) => {
    const normas = obtenerNormasDeporte();
    if (nuevoIdx < 0 || nuevoIdx >= normas.periods.length) return;
    if (nuevoIdx < periodoActualIdx && segundosTranscurridos > 0) {
      mostrarMensaje('No puedes regresar a un periodo ya completado.', true);
      return;
    }
    setPeriodoActualIdx(nuevoIdx);
    
    if (normas.hasTimer) {
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
                <p className="text-xs text-slate-400 font-medium">Seleccione un partido para abrir su mesa de control y comenzar a planillar el encuentro.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfigMinutosTiempo(45);
                  setConfigDisciplinaId(null);
                  setConfigCategoriaId(null);
                  setConfigCategorias([]);
                  cargarDisciplinasConfig();
                  setMostrarConfigModal(true);
                }}
                className="text-[10px] font-bold bg-[#800f2f]/20 hover:bg-[#800f2f]/30 text-[#c9244b] border border-[#800f2f]/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-xs">settings</span>
                Configurar Partido
              </button>
            </div>

            <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-5 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-xs text-slate-500">search</span>
                  <input
                    type="text"
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    placeholder="Buscar equipo..."
                    className="w-full bg-[#171a26] border border-slate-850 text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <select
                    value={filtroDisciplina}
                    onChange={(e) => setFiltroDisciplina(e.target.value)}
                    className="w-full bg-[#171a26] border border-slate-850 text-xs text-slate-300 px-3 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="todas">Todas las Disciplinas</option>
                    {disciplinasUnicas.map((disc) => (
                      <option key={disc.id} value={disc.id.toString()}>{disc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full bg-[#171a26] border border-slate-850 text-xs text-slate-300 px-3 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="todas">Todas las Categorías</option>
                    {categoriasUnicas.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full bg-[#171a26] border border-slate-850 text-xs text-slate-300 px-3 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En Juego</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="w-full bg-[#171a26] border border-slate-850 text-xs text-slate-350 px-3 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden transition-all cursor-pointer"
                  />
                </div>
              </div>

              {(filtroTexto !== '' || filtroDisciplina !== 'todas' || filtroCategoria !== 'todas' || filtroEstado !== 'todos' || filtroFecha !== '') && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroTexto('');
                      setFiltroDisciplina('todas');
                      setFiltroCategoria('todas');
                      setFiltroEstado('todos');
                      setFiltroFecha('');
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs font-bold">filter_alt_off</span>
                    <span>Limpiar filtros</span>
                  </button>
                </div>
              )}
            </div>

            {cargando ? (
              <div className="py-20 text-center text-sm text-slate-400 font-bold animate-pulse">
                Cargando partidos de la mesa de control...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partidosFiltrados.map((part) => {
                  const homeScore = part.report?.local_score ?? 0;
                  const awayScore = part.report?.visitor_score ?? 0;
                  return (
                    <div
                      key={part.id}
                      onClick={() => seleccionarPartido(part)}
                      className={`bg-primary-container rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group border text-on-surface ${
                        part.status === 'en_curso' 
                          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10 hover:border-emerald-500 animate-pulse' 
                          : 'border-outline hover:border-primary/60'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        <span>Jornada {part.round}</span>
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[8px] uppercase tracking-wider border ${
                          part.status === 'finalizado' 
                            ? 'bg-surface-dim text-on-surface-variant border-outline' 
                            : part.status === 'en_curso'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 animate-pulse'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        }`}>{part.status}</span>
                      </div>

                      <div className="space-y-3 my-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-on-surface text-sm group-hover:text-primary transition-colors">{part.local_team?.name}</span>
                          {part.status === 'finalizado' || part.status === 'en_curso' ? (
                            <span className="font-black text-on-surface text-xs bg-surface px-2.5 py-1 rounded-md border border-outline shadow-2xs">
                              {homeScore}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between border-t border-outline pt-2">
                          <span className="font-extrabold text-on-surface text-sm group-hover:text-primary transition-colors">{part.visitor_team?.name}</span>
                          {part.status === 'finalizado' || part.status === 'en_curso' ? (
                            <span className="font-black text-on-surface text-xs bg-surface px-2.5 py-1 rounded-md border border-outline shadow-2xs">
                              {awayScore}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="border-t border-outline pt-3 flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant">calendar_today</span>
                          <span>{part.match_date ? new Date(part.match_date).toLocaleDateString() : 'N/A'} - {part.match_time || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 max-w-[120px] truncate" title={part.venue?.name}>
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant">location_on</span>
                          <span className="truncate">{part.venue?.name || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {partidosFiltrados.length === 0 && (
                  <div className="col-span-full bg-primary-container rounded-2xl border border-outline p-12 text-center text-on-surface-variant italic text-sm">
                    {partidos.length === 0 
                      ? 'No hay partidos programados en este momento.' 
                      : 'No se encontraron partidos que coincidan con los filtros seleccionados.'}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={guardarProgresoActa} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-primary-container rounded-2xl border border-outline p-6 shadow-xs space-y-5 text-on-surface">
                <div className="border-b border-outline pb-2 flex justify-between items-center">
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-on-surface">Acta de Partido Oficial</h2>
                  {acta?.is_locked && (
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Acta Cerrada</span>
                  )}
                </div>

                <div className="bg-surface-dim border border-outline text-on-surface p-6 rounded-2xl flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-md">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${subEstadoPartido === 'jugando' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">
                      {subEstadoPartido === 'jugando' ? 'EN JUEGO' : 
                       subEstadoPartido === 'descanso' ? 'EN DESCANSO' : 
                       subEstadoPartido === 'suspendido' ? 'SUSPENDIDO' : 'PROGRAMADO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 bg-surface border border-outline px-4 py-2 rounded-xl mt-4 z-10 text-on-surface">
                    <button
                      type="button"
                      disabled={periodoActualIdx === 0 || (periodoActualIdx > 0 && segundosTranscurridos > 0)}
                      onClick={() => cambiarPeriodo(periodoActualIdx - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-dim border border-outline hover:bg-surface-bright disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs text-on-surface"
                      title={`Ver ${obtenerNormasDeporte().periodLabel} anterior`}
                    >
                      ◀
                    </button>
                    <div className="text-center px-2 min-w-[100px]">
                      <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider block mb-0.5">
                        {obtenerNormasDeporte().periodLabel}
                      </span>
                      <span className="font-extrabold text-sm text-on-surface">
                        {obtenerNormasDeporte().periods[periodoActualIdx]?.name || `Periodo ${periodoActualIdx + 1}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={periodoActualIdx === obtenerNormasDeporte().periods.length - 1}
                      onClick={() => cambiarPeriodo(periodoActualIdx + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-dim border border-outline hover:bg-surface-bright disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold text-xs text-on-surface"
                      title={`Ver ${obtenerNormasDeporte().periodLabel} siguiente`}
                    >
                      ▶
                    </button>
                  </div>

                  {obtenerNormasDeporte().hasTimer ? (
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-on-surface">
                        {formatearTiempo(segundosTranscurridos)}
                      </div>

                      {!acta?.is_locked && subEstadoPartido !== 'finalizado' && subEstadoPartido !== 'suspendido' && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <div className="flex gap-1">
                            {!cronometroActivo ? (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('jugando')}
                                className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg hover:shadow-indigo-650/25"
                              >
                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                Iniciar
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
                                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg"
                              >
                                <span className="material-symbols-outlined text-sm">pause</span>
                                Pausar
                              </button>
                            )}
                            {subEstadoPartido === 'jugando' && (
                              <button
                                type="button"
                                onClick={() => cambiarEstadoPartidoMesa('descanso')}
                                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
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
                        </div>
                      )}

                      {subEstadoPartido === 'finalizado' && (
                        <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg mt-2">
                          Partido finalizado - No se puede modificar el timer
                        </div>
                      )}

                      {!acta?.is_locked && subEstadoPartido !== 'finalizado' && subEstadoPartido !== 'suspendido' && (
                        <div className="mt-3 border-t border-slate-800 pt-3 w-full">
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tiempo extra:</span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevo = Math.max(0, extraTimeMinutes - 1);
                                    setExtraTimeMinutes(nuevo);
                                    setHasExtraTime(nuevo > 0);
                                  }}
                                  className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  disabled={extraTimeMinutes === 0}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-white">
                                  {extraTimeMinutes}'
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevo = Math.min(maxExtraTime, extraTimeMinutes + 1);
                                    setExtraTimeMinutes(nuevo);
                                    setHasExtraTime(nuevo > 0);
                                  }}
                                  className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  disabled={extraTimeMinutes >= maxExtraTime}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={guardarTiempoExtra}
                                className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-[9px] font-bold transition-colors cursor-pointer"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
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
                          Partido finalizado - No se puede modificar el timer
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 bg-surface-dim border border-outline p-6 rounded-2xl items-center text-center text-on-surface">
                  <div className="font-extrabold text-sm text-on-surface truncate">{partidoSeleccionado.local_team?.name}</div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center justify-center gap-3">
                      <input
                        type="text"
                        readOnly
                        value={golesHome}
                        className="w-14 text-center text-2xl font-black border border-outline bg-surface text-on-surface rounded-lg p-2 outline-hidden cursor-not-allowed select-none shadow-xs"
                        title="El marcador se calcula automáticamente a partir de las incidencias registradas"
                      />
                      <span className="font-black text-on-surface-variant text-lg">-</span>
                      <input
                        type="text"
                        readOnly
                        value={golesAway}
                        className="w-14 text-center text-2xl font-black border border-outline bg-surface text-on-surface rounded-lg p-2 outline-hidden cursor-not-allowed select-none shadow-xs"
                        title="El marcador se calcula automáticamente a partir de las incidencias registradas"
                      />
                    </div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest mt-1 block">
                      {obtenerNormasDeporte().scoreLabel}
                    </span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-200 truncate">{partidoSeleccionado.visitor_team?.name}</div>
                </div>

                {!acta?.is_locked && subEstadoPartido === 'programado' && (
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

            <div className="lg:col-span-1 space-y-6">
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

      <button
        onClick={() => setMostrarAyuda(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#800f2f] hover:bg-[#a4133c] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 cursor-pointer"
        title="¿Cómo usar esta sección?"
      >
        <span className="material-symbols-outlined text-lg">question_mark</span>
      </button>

      {mostrarAyuda && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-[#11131c] border-l border-slate-900 h-full shadow-2xl flex flex-col animate-slideLeft">
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

            <div className="px-5 py-4 border-t border-slate-900 bg-[#07080c]/50">
              <p className="text-[10px] text-[#c9244b] font-semibold mb-1">Importante:</p>
              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Cerrar y bloquear el acta es un paso irreversible que calcula los puntos finales del standing y genera sanciones aplicables a los jugadores para las siguientes fechas.
              </p>
            </div>
          </div>
        </div>
      )}

      {modalIncidenciaRapida && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#11131c] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#222738] flex flex-col max-h-[85vh] animate-scaleIn">
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

            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#11131c]">
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

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Buscar Jugador</label>
                <input
                  type="text"
                  placeholder="Ingrese nombre o numero..."
                  value={filtroJugadorModal}
                  onChange={(e) => setFiltroJugadorModal(e.target.value)}
                  className="w-full text-xs border border-slate-800 rounded-xl p-2.5 bg-[#171a26] text-white focus:ring-1 focus:ring-[#800f2f] focus:outline-hidden"
                />
              </div>

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

      {mostrarConfigModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#11131c] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#222738] animate-scaleIn">
            <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between bg-[#07080c]">
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c9244b] text-base">settings</span>
                Configurar Duración de Partido
              </h3>
              <button
                onClick={() => setMostrarConfigModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#171a26] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 bg-[#11131c]">
              <p className="text-[10px] text-slate-400 font-medium">
                Configura los minutos por tiempo para una disciplina y categoría específica.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disciplina</label>
                  <select
                    value={configDisciplinaId || ''}
                    onChange={(e) => {
                      const id = parseInt(e.target.value);
                      setConfigDisciplinaId(id);
                      setConfigCategoriaId(null);
                      setConfigCategorias([]);
                      if (id) {
                        cargarCategoriasConfig(id);
                      }
                    }}
                    className="w-full text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg px-3 py-2.5 focus:border-[#800f2f] focus:outline-hidden"
                    disabled={configCargandoDisciplinas}
                  >
                    <option value="">Seleccionar disciplina</option>
                    {configDisciplinas.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                  <select
                    value={configCategoriaId || ''}
                    onChange={(e) => setConfigCategoriaId(parseInt(e.target.value) || null)}
                    className="w-full text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg px-3 py-2.5 focus:border-[#800f2f] focus:outline-hidden"
                    disabled={!configDisciplinaId}
                  >
                    <option value="">Seleccionar categoría</option>
                    {configCategorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 bg-[#07080c] border border-slate-900 p-4 rounded-xl">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Minutos por tiempo</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[#0c0e16] rounded-lg border border-slate-800 p-1">
                      <button
                        type="button"
                        onClick={() => setConfigMinutosTiempo(Math.max(1, configMinutosTiempo - 5))}
                        className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={configMinutosTiempo}
                        onChange={(e) => setConfigMinutosTiempo(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center text-sm font-bold bg-transparent text-white border-0 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setConfigMinutosTiempo(Math.min(60, configMinutosTiempo + 5))}
                        className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">minutos</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarConfigModal(false)}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-[#171a26] text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarConfiguracionTiempo}
                  disabled={configGuardando || !configDisciplinaId || !configCategoriaId}
                  className="flex-1 py-2.5 bg-[#800f2f] hover:bg-[#a4133c] text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {configGuardando ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
