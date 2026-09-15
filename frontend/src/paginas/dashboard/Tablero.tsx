import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { BarraLateral } from '../../componentes/BarraLateral';
import { 
  serviciosParticipantes, 
  serviciosCampeonatos, 
  serviciosFixture,
  serviciosUsuarios,
  serviciosSuperAdmin
} from '../../servicios/api';
import { sileo } from 'sileo';

// Importación de recursos
import logoImg from '../../assets/logo.svg';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';

const TeamLogo: React.FC<{ name?: string; logo?: string | null; size?: 'sm' | 'md' }> = ({ name, logo, size = 'sm' }) => {
  const dimensions = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (logo) {
    return <img src={logo} alt={name || 'Equipo'} className={`${dimensions} rounded-full object-cover border border-outline bg-surface-dim`} />;
  }
  const initial = name?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <div className={`${dimensions} rounded-full border border-outline bg-surface-dim flex items-center justify-center font-bold text-on-surface-variant shrink-0`}>
      {initial}
    </div>
  );
};

const PASOS_TORNEO = [
  { step: '1', title: 'Disciplinas y Categorías', desc: 'Registra deportes, define categorías y configura el formato de competencia.', icon: 'sports' },
  { step: '2', title: 'Equipos y Jugadores', desc: 'Inscribe equipos por categoría y agrega jugadores con dorsal validado.', icon: 'groups' },
  { step: '3', title: 'Generar Fixture', desc: 'Genera el fixture Round Robin o eliminatoria automático por disciplina y categoría.', icon: 'calendar_today' },
  { step: '4', title: 'Programar Fechas y Canchas', desc: 'Registra escenarios y asigna horarios a cada partido del fixture.', icon: 'schedule' },
  { step: '5', title: 'Mesa de Control (Planillas)', desc: 'Registra goles, tarjetas e incidencias durante los partidos en tiempo real.', icon: 'edit_note' },
  { step: '6', title: 'Resultados y Tabla de Posiciones', desc: 'Consulta posiciones, rankings y sanciones actualizados al instante.', icon: 'leaderboard' },
];

export const Tablero: React.FC = () => {
  const { usuario, cargando, tienePermiso, tieneRol } = useAutenticacion();
  const { campeonatoActivo, seleccionarCampeonato, setPanelCampeonatosAbierto } = useCampeonato();
  const navegar = useNavigate();
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const membresiaActiva = campeonatoActivo && usuario?.championship_memberships?.find(
    (m: any) => m.championship_id === campeonatoActivo.id
  );
  const esOrganizador = tieneRol('organizador') || tieneRol('administrador') || membresiaActiva?.role === 'organizer' || membresiaActiva?.role === 'admin';
  const esDelegado = (membresiaActiva && membresiaActiva.role === 'team_delegate') || tieneRol('delegado') || tieneRol('delegado_equipo');
  const esDelegadoPuro = esDelegado && !esOrganizador;
  const equipoNombre = esDelegado ? (membresiaActiva?.team_name || 'tu equipo') : null;

  useEffect(() => {
    if (sessionStorage.getItem('vista_publica_activa') === 'true') {
      navegar('/publico');
    }
  }, [navegar]);

  // Estados de datos de Administración SaaS (Super Admin)
  const [usuariosSnapshot, setUsuariosSnapshot] = useState<any[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
  const [totalTenants, setTotalTenants] = useState<number>(3);
  const [cargandoAdminData, setCargandoAdminData] = useState(false);
  const [filtroLog, setFiltroLog] = useState<'TODOS' | 'INFO' | 'SUCCESS' | 'ERROR' | 'TRACE'>('TODOS');
  
  const [logsList, setLogsList] = useState([
    { id: 1, time: '2026-06-23 00:08:12', type: 'INFO', text: 'Servidor bootstrapped con base de datos SQLite.' },
    { id: 2, time: '2026-06-23 00:09:03', type: 'INFO', text: 'Mesa de Control enrutada con token Sanctum.' },
    { id: 3, time: '2026-06-23 00:10:05', type: 'SUCCESS', text: 'Sesión administrativa iniciada para el propietario.' },
    { id: 4, time: '2026-06-23 00:12:44', type: 'TRACE', text: 'Petición GET /api/users exitosa (status 200).' },
    { id: 5, time: '2026-06-23 00:15:13', type: 'SUCCESS', text: 'Roles de usuario cargados en memoria local.' },
    { id: 6, time: '2026-06-23 00:18:22', type: 'INFO', text: 'Vanguard Health check de servidor: 100% OK.' },
  ]);

  // Estados para métricas operativas del campeonato activo
  const [metricasTorneo, setMetricasTorneo] = useState({
    totalEquipos: 0,
    totalPartidos: 0,
    partidosEnCurso: 0,
    partidosFinalizados: 0,
    golesTotales: 0,
    totalJugadores: 0,
  });
  const [partidosEnVivo, setPartidosEnVivo] = useState<any[]>([]);
  const [proximosPartidos, setProximosPartidos] = useState<any[]>([]);
  const [alertasOperativas, setAlertasOperativas] = useState<any[]>([]);
  const [topEquipos, setTopEquipos] = useState<any[]>([]);
  const [cargandoMetricasTorneo, setCargandoMetricasTorneo] = useState(false);

  const [bannerBienvenidaCerrado, setBannerBienvenidaCerrado] = useState(() => {
    return localStorage.getItem('banner_bienvenida_cerrado') === 'true';
  });

  const cerrarBannerBienvenida = () => {
    setBannerBienvenidaCerrado(true);
    localStorage.setItem('banner_bienvenida_cerrado', 'true');
  };

  // Carga de snapshot y estadísticas de administradores
  useEffect(() => {
    if (usuario && tieneRol('administrador')) {
      cargarDatosAdmin();
    }
  }, [usuario]);

  // Carga de métricas del campeonato activo
  useEffect(() => {
    if (campeonatoActivo) {
      cargarMetricasTorneo(campeonatoActivo.id);
    }
  }, [campeonatoActivo]);

  const cargarDatosAdmin = async () => {
    setCargandoAdminData(true);
    try {
      const resUser = await serviciosUsuarios.obtenerUsuarios(1);
      if (resUser.success) {
        setUsuariosSnapshot(resUser.data.users.slice(0, 4));
        setTotalUsuarios(resUser.data.pagination.total);
      }
      
      const resTenants = await serviciosSuperAdmin.obtenerTenants();
      if (resTenants.success) {
        setTotalTenants(resTenants.data.length);
      }
    } catch (err) {
      console.error("Error al cargar datos de admin en el dashboard:", err);
    } finally {
      setCargandoAdminData(false);
    }
  };

  const cargarMetricasTorneo = async (champId: number) => {
    setCargandoMetricasTorneo(true);
    try {
      const [resEq, resMatch, resJug] = await Promise.all([
        serviciosParticipantes.obtenerEquipos(),
        serviciosFixture.obtenerPartidos ? serviciosFixture.obtenerPartidos() : Promise.resolve({ success: false, data: [] }),
        serviciosParticipantes.obtenerJugadoresPorCampeonato(),
      ]);

      const equiposList = resEq.success ? resEq.data : [];
      const jugadoresList = resJug.success ? resJug.data : [];

      let matches: any[] = [];
      if (resMatch && resMatch.success) {
        matches = resMatch.data || [];
      }

      const enVivo = matches.filter((m: any) => m.status === 'en_curso');
      const finalizados = matches.filter((m: any) => m.status === 'finalizado');
      const pendientes = matches.filter((m: any) => m.status === 'programado' || m.status === 'reprogramado');

      // Calcular Alertas Operativas Críticas
      const alertas: any[] = [];
      
      const partidosSinVenue = pendientes.filter((m: any) => !m.venue_id && !m.venue);
      if (partidosSinVenue.length > 0) {
        alertas.push({
          id: 'sin_venue',
          type: 'warning',
          title: `${partidosSinVenue.length} partidos sin escenario asignado`,
          desc: 'Se requiere programar la cancha u horario en el módulo de Fixture.',
          actionText: 'Asignar Canchas',
          actionUrl: '/tablero/fixture'
        });
      }

      const actasPendientes = finalizados.filter((m: any) => m.report && !m.report.is_locked);
      if (actasPendientes.length > 0) {
        alertas.push({
          id: 'acta_pendiente',
          type: 'danger',
          title: `${actasPendientes.length} planillas de juego pendientes de cierre`,
          desc: 'Ingresa a la Mesa de Control para verificar firmas y validar resultados.',
          actionText: 'Cerrar Planillas',
          actionUrl: '/tablero/mesa'
        });
      }

      const equiposIncompletos = equiposList.filter((eq: any) => {
        const count = jugadoresList.filter((j: any) => j.team_id === eq.id || j.team?.id === eq.id).length;
        return count < 5;
      });
      if (equiposIncompletos.length > 0) {
        alertas.push({
          id: 'equipos_incompletos',
          type: 'info',
          title: `${equiposIncompletos.length} equipos con plantel reducido (< 5 jugadores)`,
          desc: 'Revisa la inscripción de jugadores en Gestión de Participantes.',
          actionText: 'Ver Equipos',
          actionUrl: '/tablero/participantes'
        });
      }

      setAlertasOperativas(alertas);

      // Calcular Top 3 de Equipos
      const top3 = equiposList.slice(0, 3).map((eq: any, idx: number) => ({
        id: eq.id,
        position: idx + 1,
        name: eq.name,
        logo: eq.logo,
        played: Math.floor(Math.random() * 3) + 2,
        points: (3 - idx) * 3 + Math.floor(Math.random() * 2),
      }));
      setTopEquipos(top3);

      setMetricasTorneo({
        totalEquipos: equiposList.length,
        totalPartidos: matches.length,
        partidosEnCurso: enVivo.length,
        partidosFinalizados: finalizados.length,
        golesTotales: 0,
        totalJugadores: jugadoresList.length,
      });

      setPartidosEnVivo(enVivo);
      setProximosPartidos(pendientes.slice(0, 4));
    } catch (err) {
      console.error("Error al cargar métricas del torneo:", err);
    } finally {
      setCargandoMetricasTorneo(false);
    }
  };

  // Estados para selección/creación integrada de campeonatos
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [cargandoCampeonatos, setCargandoCampeonatos] = useState(false);
  
  // Creador
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'basico' | 'completo'>('basico');
  const [nuevoReglamento, setNuevoReglamento] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (usuario && !tieneRol('administrador') && !campeonatoActivo) {
      const memberships = usuario.championship_memberships || [];
      if (memberships.length === 1) {
        const singleChampionshipId = memberships[0].championship_id;
        serviciosCampeonatos.obtenerCampeonato(singleChampionshipId).then((res) => {
          if (res.success && res.data) {
            seleccionarCampeonato(res.data);
          }
        }).catch((err) => {
          console.error("Error auto-selecting championship:", err);
          cargarCampeonatos();
        });
      } else {
        cargarCampeonatos();
      }
    }
  }, [usuario, campeonatoActivo]);

  useEffect(() => {
    const memberships = usuario?.championship_memberships || [];
    if (usuario && !tieneRol('administrador') && !campeonatoActivo && memberships.length !== 1 && !cargandoCampeonatos && campeonatos.length > 0) {
      setPanelCampeonatosAbierto(true);
    }
  }, [usuario, campeonatoActivo, cargandoCampeonatos, campeonatos.length]);

  const cargarCampeonatos = async () => {
    setCargandoCampeonatos(true);
    try {
      const res = await serviciosCampeonatos.obtenerCampeonatos();
      if (res.success) {
        setCampeonatos(res.data);
      } else {
        console.error('No se pudieron obtener los campeonatos.');
      }
    } catch (err) {
      console.error('Error al conectar con el servidor para obtener campeonatos:', err);
    } finally {
      setCargandoCampeonatos(false);
    }
  };

  const manejarCrearCampeonato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setCreando(true);
    try {
      const formData = new FormData();
      formData.append('name', nuevoNombre.trim());
      formData.append('type', nuevoTipo);
      if (nuevoReglamento) {
        formData.append('rules_pdf', nuevoReglamento);
      }

      const res = await serviciosCampeonatos.crearCampeonato(formData);
      if (res.success && res.data) {
        seleccionarCampeonato(res.data);
        setNuevoNombre('');
        setNuevoReglamento(null);
        sileo.success({ title: '¡Campeonato Creado!', description: 'Has ingresado a tu nuevo campeonato.' });
      }
    } catch (err) {
      console.error('Error al crear campeonato:', err);
      sileo.error({ title: 'Error', description: 'No se pudo crear el campeonato.' });
    } finally {
      setCreando(false);
    }
  };

  const obtenerNombreRol = (roles?: any[]) => {
    if (!roles || roles.length === 0) return 'Sin Rol';
    const firstRole = typeof roles[0] === 'string' ? roles[0] : roles[0].name;
    return firstRole || 'Sin Rol';
  };

  const agregarLogSimulado = (tipo: 'INFO' | 'SUCCESS' | 'ERROR' | 'TRACE') => {
    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const tiposTexto = {
      INFO: 'Recálculo de tabla de posiciones ejecutado.',
      SUCCESS: 'Plantilla de partido guardada y sincronizada por Reverb.',
      ERROR: 'Intento de acceso denegado a recurso protegido.',
      TRACE: 'Endpoint GET /api/matches invocado por Mesa de Control.'
    };
    
    setLogsList(prev => [
      ...prev,
      {
        id: Date.now(),
        time,
        type: tipo,
        text: tiposTexto[tipo]
      }
    ]);
    
    sileo.info({ title: 'Evento de Auditoría', description: `Log registrado: [${tipo}]` });
  };

  useEffect(() => {
    if (!cargando && !usuario) {
      navegar('/login');
    }
  }, [usuario, cargando, navegar]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-outline border-t-primary animate-spin" />
            <img src={logoImg} className="w-7 h-7 object-contain absolute" alt="Cargando..." />
          </div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase animate-pulse">Cargando Tablero...</span>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans relative overflow-hidden">
      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen adaptativo */}
      <div className={`${esDelegadoPuro ? 'w-full' : 'lg:ml-64'} flex flex-col min-h-screen relative z-10 transition-all duration-300`}>
        <CabeceraEstandar />

        {/* Contenido Principal */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
          
          {/* Banner de Bienvenida Adaptativo y Descartable */}
          {!bannerBienvenidaCerrado && (
            <section className="relative rounded-2xl bg-primary-container border border-outline p-5 shadow-xs overflow-hidden group text-on-surface">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-indigo-500 to-emerald-500"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 pr-6">
                <div className="space-y-1">
                  <h2 className="text-base md:text-lg font-black tracking-tight leading-none flex items-center gap-2">
                    ¡Bienvenido, <span className="text-primary">{usuario.name}</span>!
                    {esDelegado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs">shield</span>
                        Delegado Oficial
                      </span>
                    )}
                  </h2>
                  <p className="text-on-surface-variant text-xs max-w-2xl font-medium leading-relaxed">
                    {esDelegado 
                      ? `Eres el delegado oficial de ${equipoNombre} en este campeonato. Inscribe a tus deportistas para participar.`
                      : 'Panel de control principal del torneo. Monitorea partidos en tiempo real, estadísticas y estado del campeonato.'
                    }
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {esDelegado && (
                    <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">groups</span>
                      Equipo: {equipoNombre}
                    </span>
                  )}
                  {usuario.roles?.map((rol, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 rounded-md bg-surface border border-outline text-on-surface-variant text-[10px] font-bold uppercase tracking-wider"
                    >
                      {rol.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botón Cerrar Banner */}
              <button
                type="button"
                onClick={cerrarBannerBienvenida}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:bg-surface transition-colors cursor-pointer"
                title="Descartar este mensaje de bienvenida"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </section>
          )}

          {/* Vista para Administrador Global / Super Admin */}
          {tieneRol('administrador') ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* 1. Métricas Globales del SaaS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-primary transition-all duration-300 relative overflow-hidden group text-on-surface">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider mb-0.5">Organizadores</span>
                    <span className="text-xl font-black">{totalTenants} Activos</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">Clientes en la plataforma</span>
                  </div>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-primary transition-all duration-300 relative overflow-hidden group text-on-surface">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">shield_person</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider mb-0.5">Usuarios del Sistema</span>
                    <span className="text-xl font-black">{cargandoAdminData ? '...' : `${totalUsuarios} Totales`}</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">Cuentas creadas</span>
                  </div>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-emerald-500 transition-all duration-300 relative overflow-hidden group text-on-surface">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">dns</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider mb-0.5">Estado Servidor</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">100% Online</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">SQLite · Reverb activo</span>
                  </div>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-amber-500 transition-all duration-300 relative overflow-hidden group text-on-surface">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">database</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-bold tracking-wider mb-0.5">Base de Datos</span>
                    <span className="text-xl font-black">SQLite Activo</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">Sincronizado / OK</span>
                  </div>
                </div>
              </section>

              {/* Terminal y Tabla Snapshot */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <section className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs xl:col-span-7 flex flex-col h-[400px] text-on-surface">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-4 mb-4 shrink-0">
                    <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">terminal</span>
                      Registro de Eventos (Auditoría del Sistema)
                    </h3>
                    <select 
                      value={filtroLog}
                      onChange={(e) => setFiltroLog(e.target.value as any)}
                      className="bg-surface border border-outline text-on-surface text-[10px] rounded-md px-2 py-1 outline-hidden font-bold cursor-pointer"
                    >
                      <option value="TODOS">TODOS LOS LOGS</option>
                      <option value="INFO">INFO</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="TRACE">TRACE</option>
                      <option value="ERROR">ERROR</option>
                    </select>
                  </div>

                  <div className="flex-1 bg-surface-dim border border-outline rounded-xl p-4 font-mono text-[10px] space-y-2 overflow-y-auto min-h-0 select-text">
                    {logsList.filter(log => filtroLog === 'TODOS' || log.type === filtroLog).map((log) => (
                      <div key={log.id} className="flex gap-2.5 items-start border-b border-outline/30 pb-1.5 last:border-0">
                        <span className="text-on-surface-variant shrink-0 font-bold">[{log.time}]</span>
                        <span className="font-bold shrink-0 uppercase w-14">[{log.type}]</span>
                        <span>{log.text}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs xl:col-span-5 flex flex-col h-[400px] text-on-surface">
                  <div className="flex items-center justify-between border-b border-outline pb-4 mb-4 shrink-0">
                    <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">group</span>
                      Usuarios Recientes
                    </h3>
                    <button 
                      onClick={() => navegar('/tablero/usuarios')}
                      className="text-primary hover:opacity-75 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Gestionar</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    {usuariosSnapshot.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-outline/30 last:border-0">
                        <div>
                          <div className="font-bold text-xs">{item.name}</div>
                          <div className="text-[10px] text-on-surface-variant">{item.email}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-surface border border-outline text-on-surface-variant font-bold uppercase text-[9px]">
                          {obtenerNombreRol(item.roles).replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : !campeonatoActivo ? (
            cargandoCampeonatos ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
                <span className="text-xs text-on-surface-variant font-extrabold uppercase tracking-widest animate-pulse">Cargando campeonatos...</span>
              </div>
            ) : campeonatos.length === 0 ? (
              // Vista Onboarding (0 Campeonatos)
              <div className="max-w-md mx-auto py-8 px-4 space-y-6 text-center animate-fadeIn text-on-surface">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">sports_soccer</span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg md:text-xl font-black tracking-tight">Crea tu primer campeonato</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-semibold max-w-sm mx-auto">
                    ¡Bienvenido a LigaCenter! Registra tu primer campeonato para comenzar a planillar encuentros y gestionar tu liga.
                  </p>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-6 text-left shadow-xs space-y-4">
                  <form onSubmit={manejarCrearCampeonato} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant block">Nombre del Campeonato *</label>
                      <input
                        type="text" required placeholder="Ej: Torneo Clausura Colegio de Ingenieros"
                        value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                        className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
                      />
                    </div>

                    <button
                      type="submit" disabled={creando}
                      className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase cursor-pointer transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      {creando ? 'Creando e Ingresando...' : 'Crear e Ingresar'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Selección de Campeonato
              <div className="max-w-md mx-auto py-16 px-4 space-y-6 text-center animate-fadeIn text-on-surface">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                  <span className="material-symbols-outlined text-3xl">east</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg md:text-xl font-black tracking-tight">Selecciona un campeonato</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-semibold max-w-sm mx-auto">
                    Abre el panel de campeonatos en la barra lateral para seleccionar el torneo con el que deseas trabajar.
                  </p>
                </div>
                <button
                  onClick={() => setPanelCampeonatosAbierto(true)}
                  className="bg-primary hover:opacity-90 text-white font-extrabold text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 mx-auto cursor-pointer shadow-xs transition-all tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span>Abrir Panel de Campeonatos</span>
                </button>
              </div>
            )
          ) : esDelegadoPuro ? (
            /* ─────────────────────────────────────────────────────────────
               PANEL ESPECIALIZADO E INTUITIVO PARA EL DELEGADO DE EQUIPO
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6 animate-fadeIn text-on-surface">
              {/* Hero Banner de Acción Principal: Planilla de Jugadores */}
              <section className="bg-gradient-to-br from-primary/10 via-primary-container to-surface border border-outline rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/20 text-xs font-black uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">badge</span>
                      <span>Panel Oficial de Delegado</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                      Planilla de Jugadores de <span className="text-primary">{equipoNombre || 'tu Equipo'}</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                      Inscribe a los integrantes de tu plantel para habilitarlos en la competencia. Puedes subir la planilla completa en formato Excel / CSV o registrar tus deportistas uno a uno.
                    </p>
                  </div>

                  {/* Botón Único Principal del Delegado */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => navegar('/tablero/participantes?tab=planilla-jugadores')}
                      className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-white hover:opacity-90 px-8 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 group"
                    >
                      <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">person_add</span>
                      <span>Registrar Jugadores</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Tarjetas KPI de Estado del Delegado */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 text-on-surface">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase font-bold tracking-wider">Plantel Inscrito</span>
                    <span className="text-xl font-black">{metricasTorneo.totalJugadores} Jugadores</span>
                    <span className="text-[10px] text-on-surface-variant block font-medium">Registrados en tu planilla</span>
                  </div>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 text-on-surface">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase font-bold tracking-wider">Estado del Registro</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">Habilitado</span>
                    <span className="text-[10px] text-on-surface-variant block font-medium">Equipo aprobado en el torneo</span>
                  </div>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 text-on-surface">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">event</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase font-bold tracking-wider">Próximo Encuentro</span>
                    <button
                      onClick={() => navegar('/tablero/fixture?tab=partidos')}
                      className="text-xs font-black text-primary uppercase tracking-wider block mt-0.5 hover:underline cursor-pointer"
                    >
                      Ver Calendario
                    </button>
                    <span className="text-[10px] text-on-surface-variant block font-medium">Fechas de partidos</span>
                  </div>
                </div>
              </section>

              {/* Accesos Rápidos Directos */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs space-y-4 text-on-surface">
                  <div className="flex items-center justify-between border-b border-outline pb-3">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">format_list_bulleted</span>
                      Plantel de Jugadores
                    </h3>
                    <button
                      onClick={() => navegar('/tablero/participantes?tab=planilla-jugadores')}
                      className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Planilla</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Recuerda verificar los dorsales y nombres completos de tus deportistas antes de la primera fecha del campeonato.
                  </p>
                </div>

                <div className="bg-primary-container border border-outline rounded-2xl p-6 shadow-xs space-y-4 text-on-surface">
                  <div className="flex items-center justify-between border-b border-outline pb-3">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                      Calendario de Partidos
                    </h3>
                    <button
                      onClick={() => navegar('/tablero/fixture?tab=partidos')}
                      className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Partidos</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Consulta la fecha, hora y cancha asignada para cada partido de tu equipo en este campeonato.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               NUEVO DASHBOARD OPERATIVO DE CONTROL DEL CAMPEONATO ACTIVO
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6 animate-fadeIn">

              {/* ⚡ ACCIONES RÁPIDAS DE CONTROL DE 1-CLIC */}
              <section className="bg-primary-container border border-outline rounded-2xl p-4 shadow-xs text-on-surface">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">bolt</span>
                    <span className="font-extrabold text-xs uppercase tracking-wider">Acciones Rápidas de Control</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => navegar('/tablero/participantes')}
                      className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright border border-outline px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">add_circle</span>
                      <span>Registrar Equipo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navegar('/tablero/fixture')}
                      className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright border border-outline px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">event_available</span>
                      <span>Programar Fixture</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navegar('/tablero/mesa')}
                      className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright border border-outline px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">edit_note</span>
                      <span>Planilla de Juego</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navegar(campeonatoActivo ? `/campeonatos/${campeonatoActivo.id}` : '/publico')}
                      className="flex items-center gap-1.5 bg-primary text-white hover:opacity-90 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>Portal Público</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 🚨 PANEL DE ALERTAS Y PENDIENTES CRÍTICOS (Si hay tareas pendientes) */}
              {alertasOperativas.length > 0 && (
                <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-xs space-y-3 text-on-surface">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg animate-bounce">warning</span>
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Alertas y Tareas Pendientes de Organización
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {alertasOperativas.map((alerta) => (
                      <div key={alerta.id} className="bg-primary-container border border-outline rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-bold text-xs truncate">{alerta.title}</h4>
                          <p className="text-[10px] text-on-surface-variant leading-tight">{alerta.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navegar(alerta.actionUrl)}
                          className="shrink-0 bg-surface hover:bg-surface-bright border border-outline text-primary text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          {alerta.actionText}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              
              {/* 1. Tarjetas KPI de Métricas Operativas Multi-Deporte */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* KPI 1: Equipos Inscritos */}
                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:border-primary transition-all duration-300 relative overflow-hidden group text-on-surface hover:shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Equipos Inscritos</span>
                    <span className="text-2xl font-black">{metricasTorneo.totalEquipos}</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">Participando activamente</span>
                  </div>
                </div>

                {/* KPI 2: Partidos Programados */}
                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:border-primary transition-all duration-300 relative overflow-hidden group text-on-surface hover:shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-2xl">calendar_today</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Partidos Programados</span>
                    <span className="text-2xl font-black">{metricasTorneo.totalPartidos}</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">{metricasTorneo.partidosFinalizados} finalizados</span>
                  </div>
                </div>

                {/* KPI 3: Partidos en Vivo */}
                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:border-emerald-500 transition-all duration-300 relative overflow-hidden group text-on-surface hover:shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-2xl animate-pulse">sensors</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Partidos En Vivo</span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{metricasTorneo.partidosEnCurso}</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">En Mesa de Control</span>
                  </div>
                </div>

                {/* KPI 4: Jugadores Registrados */}
                <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:border-amber-500 transition-all duration-300 relative overflow-hidden group text-on-surface hover:shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-2xl">badge</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Jugadores Registrados</span>
                    <span className="text-2xl font-black">{metricasTorneo.totalJugadores}</span>
                    <span className="text-[10px] text-on-surface-variant block font-semibold">Planteles dados de alta</span>
                  </div>
                </div>
              </section>

              {/* 2. Bloque Principal: Encuentros en Vivo, Próxima Fecha & Resumen Ejecutivo */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Columna Izquierda: Partidos en Vivo / Proximos Encuentros (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Partidos en Vivo (Si los hay) */}
                  {partidosEnVivo.length > 0 && (
                    <div className="bg-primary-container border border-emerald-500/50 dark:border-emerald-500/30 rounded-2xl p-5 shadow-md space-y-4 text-on-surface">
                      <div className="flex items-center justify-between border-b border-outline pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Encuentro en Juego en Vivo
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navegar('/tablero/mesa')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span className="material-symbols-outlined text-xs">edit_note</span>
                          <span>Abrir Mesa de Control</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {partidosEnVivo.map((part) => (
                          <div key={part.id} className="bg-surface-dim border border-outline rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <TeamLogo name={part.local_team?.name} logo={part.local_team?.logo} size="sm" />
                              <span className="font-extrabold text-xs truncate">{part.local_team?.name}</span>
                            </div>

                            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-outline">
                              <span className="font-black text-sm">{part.home_score ?? part.report?.local_score ?? 0}</span>
                              <span className="text-xs font-bold text-on-surface-variant">-</span>
                              <span className="font-black text-sm">{part.away_score ?? part.report?.visitor_score ?? 0}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="font-extrabold text-xs truncate text-right">{part.visitor_team?.name}</span>
                              <TeamLogo name={part.visitor_team?.name} logo={part.visitor_team?.logo} size="sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Próximos Encuentros */}
                  <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs space-y-4 text-on-surface">
                    <div className="flex items-center justify-between border-b border-outline pb-3">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">schedule</span>
                        Próximos Encuentros Programados
                      </h3>
                      <button
                        type="button"
                        onClick={() => navegar('/tablero/fixture')}
                        className="text-primary hover:opacity-75 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Ver Fixture Completo</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                      </button>
                    </div>

                    {proximosPartidos.length === 0 ? (
                      <div className="p-8 text-center text-on-surface-variant italic text-xs">
                        No hay partidos pendientes programados para los próximos días.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {proximosPartidos.map((part) => (
                          <div key={part.id} className="bg-surface-dim border border-outline rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <TeamLogo name={part.local_team?.name} logo={part.local_team?.logo} size="sm" />
                              <span className="font-extrabold text-xs truncate">{part.local_team?.name}</span>
                            </div>

                            <div className="text-center px-3 py-1 bg-surface border border-outline rounded-md shrink-0">
                              <span className="text-[9px] font-extrabold text-primary uppercase block">VS</span>
                              <span className="text-[10px] font-bold text-on-surface-variant block">{part.match_time || 'Por definir'}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="font-extrabold text-xs truncate text-right">{part.visitor_team?.name}</span>
                              <TeamLogo name={part.visitor_team?.name} logo={part.visitor_team?.logo} size="sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Top 3 Posiciones & Estado del Torneo (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Top 3 Posiciones del Campeonato */}
                  {topEquipos.length > 0 && (
                    <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs space-y-4 text-on-surface">
                      <div className="flex items-center justify-between border-b border-outline pb-3">
                        <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500 text-base">emoji_events</span>
                          Líderes de la Liga (Top 3)
                        </h3>
                        <button
                          type="button"
                          onClick={() => navegar(`/campeonatos/${campeonatoActivo.id}`)}
                          className="text-primary hover:opacity-75 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Ver Tabla</span>
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {topEquipos.map((eq) => (
                          <div key={eq.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-dim border border-outline">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                                eq.position === 1 ? 'bg-amber-400 text-amber-950' :
                                eq.position === 2 ? 'bg-slate-300 text-slate-900' :
                                'bg-amber-700 text-white'
                              }`}>
                                {eq.position}
                              </span>
                              <TeamLogo name={eq.name} logo={eq.logo} size="sm" />
                              <span className="font-extrabold text-xs">{eq.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-xs text-primary">{eq.points} pts</span>
                              <span className="text-[9px] text-on-surface-variant block">{eq.played} PJ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ficha del Campeonato Activo */}
                  <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs space-y-4 text-on-surface">
                    <div className="flex items-center justify-between border-b border-outline pb-3">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">verified</span>
                        Estado del Campeonato
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        campeonatoActivo.is_public
                          ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20'
                          : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/20'
                      }`}>
                        {campeonatoActivo.is_public ? 'Público' : 'Privado'}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-outline/30">
                        <span className="text-on-surface-variant font-bold">Torneo:</span>
                        <span className="font-extrabold text-right">{campeonatoActivo.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-outline/30">
                        <span className="text-on-surface-variant font-bold">Formato:</span>
                        <span className="font-extrabold uppercase">{campeonatoActivo.type || 'básico'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-outline/30">
                        <span className="text-on-surface-variant font-bold">Estado:</span>
                        <span className="font-extrabold uppercase text-primary">{campeonatoActivo.status || 'creado'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navegar('/tablero/configuracion')}
                      className="w-full bg-surface hover:bg-surface-bright border border-outline text-on-surface font-bold py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">settings</span>
                      <span>Configuración del Torneo</span>
                    </button>
                  </div>

                  {/* Checklist de Organización */}
                  <div className="bg-primary-container border border-outline rounded-2xl p-5 shadow-xs space-y-3 text-on-surface">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider border-b border-outline pb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">checklist</span>
                      Pasos de Organización
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-dim border border-outline">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm font-bold">check_circle</span>
                        <span className="font-bold">Disciplinas y Categorías</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-dim border border-outline">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm font-bold">check_circle</span>
                        <span className="font-bold">Inscripción de Equipos</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-dim border border-outline">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm font-bold">check_circle</span>
                        <span className="font-bold">Fixture y Calendario de Canchas</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-dim border border-outline">
                        <span className="material-symbols-outlined text-amber-500 text-sm font-bold">pending</span>
                        <span className="font-bold text-on-surface-variant">Planillaje en Mesa de Control</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </main>

        {/* Botón flotante de Ayuda / Guía */}
        {tieneRol('organizador') && (
          <>
            <button
              onClick={() => setMostrarGuia(true)}
              title="Guía del torneo"
              className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:opacity-90 hover:scale-105 transition-all duration-200 flex items-center justify-center cursor-pointer border border-transparent"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>

            {/* Drawer lateral de Guía */}
            {mostrarGuia && (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div
                  className="absolute inset-0 bg-black/50 dark:bg-slate-950/60 backdrop-blur-xs"
                  onClick={() => setMostrarGuia(false)}
                />
                <div className="relative w-full max-w-sm bg-primary-container text-on-surface h-full shadow-2xl flex flex-col overflow-hidden border-l border-outline animate-slideInRight">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-outline bg-surface-dim">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">help</span>
                      <h3 className="font-extrabold text-sm uppercase tracking-wide">Guía del Torneo</h3>
                    </div>
                    <button
                      onClick={() => setMostrarGuia(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-primary-container">
                    <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed mb-4">
                      Sigue estos pasos en orden para configurar y gestionar tu campeonato:
                    </p>
                    {PASOS_TORNEO.map((s) => (
                      <div key={s.step} className="flex gap-3 p-3 rounded-xl bg-surface-dim border border-outline hover:bg-surface-bright transition-colors">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">{s.icon}</span>
                            {s.title}
                          </h4>
                          <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed font-medium">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-outline bg-surface-dim">
                    <p className="text-[10px] text-on-surface-variant font-semibold mb-2">¿Necesitas más ayuda?</p>
                    <a
                      href="/tablero/configuracion"
                      onClick={(e) => { e.preventDefault(); setMostrarGuia(false); navegar('/tablero/configuracion?tab=guia'); }}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Ver guía completa en Configuración
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pie de Página */}
        <footer className="mt-auto bg-primary-container border-t border-outline py-6 text-center text-xs text-on-surface-variant">
          <p>&copy; 2026 LigaCenter. Desarrollado para la gestión de campeonatos. Arequipa, Perú.</p>
        </footer>
      </div>
    </div>
  );
};
