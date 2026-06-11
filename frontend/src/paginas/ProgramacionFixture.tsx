import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import {
  serviciosFixture,
  serviciosParticipantes
} from '../servicios/api';
import type {
  Escenario,
  Partido,
  Disciplina,
  Categoria
} from '../servicios/api';

type TabType = 'escenarios' | 'generar' | 'programar' | 'partidos';

export const ProgramacionFixture: React.FC = () => {
  const { tienePermiso, tieneRol } = useAutenticacion();
  const navegar = useNavigate();

  const [tabActiva, setTabActiva] = useState<TabType>('escenarios');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const PASOS_AYUDA_FIXTURE = [
    { paso: '1', titulo: 'Registrar Escenarios', desc: 'Agrega las canchas o recintos deportivos con su ubicación, tipo y capacidad en la pestaña "Escenarios".', icono: 'stadium' },
    { paso: '2', titulo: 'Generar el Fixture', desc: 'Ve a "Generar Fixture", selecciona la disciplina y categoría, define la fecha de inicio del campeonato y marca las canchas utilizables. NOTA: Debes tener al menos 2 equipos aprobados en la categoría.', icono: 'calendar_today' },
    { paso: '3', titulo: 'Programación de Fechas', desc: 'En "Programar Horarios" puedes asignar automáticamente canchas y horas (separadas por comas, ej: 08:00, 10:00) a los partidos de una fecha en específico.', icono: 'schedule' },
    { paso: '4', titulo: 'Ver y Reprogramar Partidos', desc: 'En la pestaña "Partidos" verás el fixture programado. Puedes usar "Reprogramar" para ajustar manualmente la fecha, hora o escenario de un partido.', icono: 'edit' },
  ];

  // Estados de datos
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Estados de formularios
  const [nuevoEsc, setNuevoEsc] = useState({ name: '', venue_type: 'cancha', location: '', capacity: '', status: 'active' });
  const [datosFixture, setDatosFixture] = useState({ discipline_id: '', category_id: '', start_date: '', venue_ids: [] as number[] });
  
  // Asignar fecha
  const [datosFecha, setDatosFecha] = useState({ discipline_id: '', category_id: '', round: '', available_hours: '', venue_ids: [] as number[] });
  
  // Reprogramación individual
  const [partidoParaReprogramar, setPartidoParaReprogramar] = useState<Partido | null>(null);
  const [datosReprog, setDatosReprog] = useState({ match_date: '', match_time: '', venue_id: '' });

  useEffect(() => {
    if (!tienePermiso('ver_equipos') || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [tabActiva]);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      if (tabActiva === 'escenarios') {
        const res = await serviciosFixture.obtenerEscenarios();
        if (res.success) setEscenarios(res.data);
      } else if (tabActiva === 'generar') {
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        const resCat = await serviciosParticipantes.obtenerCategorias();
        const resEsc = await serviciosFixture.obtenerEscenarios();
        if (resDisc.success) setDisciplinas(resDisc.data);
        if (resCat.success) setCategorias(resCat.data);
        if (resEsc.success) setEscenarios(resEsc.data);
      } else if (tabActiva === 'programar') {
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        const resCat = await serviciosParticipantes.obtenerCategorias();
        const resEsc = await serviciosFixture.obtenerEscenarios();
        if (resDisc.success) setDisciplinas(resDisc.data);
        if (resCat.success) setCategorias(resCat.data);
        if (resEsc.success) setEscenarios(resEsc.data);
      } else if (tabActiva === 'partidos') {
        const resPart = await serviciosFixture.obtenerPartidos();
        if (resPart.success) setPartidos(resPart.data);
        const resEsc = await serviciosFixture.obtenerEscenarios();
        if (resEsc.success) setEscenarios(resEsc.data);
      }
    } catch (err: any) {
      setErrorLocal('Error al cargar datos del módulo.');
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    if (esError) {
      setErrorLocal(msg);
      setTimeout(() => setErrorLocal(null), 4000);
    } else {
      setMensajeExito(msg);
      setTimeout(() => setMensajeExito(null), 3000);
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
        setNuevoEsc({ name: '', location: '', capacity: '', status: 'active' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al crear escenario.', true);
    }
  };

  const eliminarEscenario = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este escenario?')) return;
    try {
      const res = await serviciosFixture.eliminarEscenario(id);
      if (res.success) {
        mostrarMensaje('Escenario eliminado correctamente.');
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('No se puede eliminar. Puede estar siendo usado en partidos.', true);
    }
  };

  // Generar Fixture
  const manejarGenerarFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    const { discipline_id, category_id, start_date, venue_ids } = datosFixture;
    if (!discipline_id || !category_id || !start_date || venue_ids.length === 0) {
      mostrarMensaje('Complete todos los campos y seleccione al menos un escenario.', true);
      return;
    }
    try {
      const res = await serviciosFixture.generarFixture({
        discipline_id: parseInt(discipline_id),
        category_id: parseInt(category_id),
        start_date,
        venue_ids
      });
      if (res.success) {
        mostrarMensaje('Fixture completo generado con éxito para este campeonato.');
        setDatosFixture({ discipline_id: '', category_id: '', start_date: '', venue_ids: [] });
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

  const guardarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoParaReprogramar) return;
    const { match_date, match_time, venue_id } = datosReprog;
    if (!match_date || !match_time || !venue_id) return;
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

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-800 font-sans flex flex-col">
      {/* Cabecera */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navegar('/tablero')}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-700">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Fixture y Programación</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1 block">
              Generación de Encuentros y Asignación de Canchas
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex flex-wrap gap-2">
        {(['escenarios', 'generar', 'programar', 'partidos'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
              tabActiva === tab
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'escenarios' ? 'Escenarios' : tab === 'generar' ? 'Generar Fixture' : tab === 'programar' ? 'Programar Horarios' : 'Partidos'}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {cargando && (
          <div className="flex justify-center items-center py-2 text-xs font-bold text-slate-500 gap-2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <span>Cargando datos...</span>
          </div>
        )}
        
        {/* Toasts */}
        {mensajeExito && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{mensajeExito}</span>
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
                        <td className="p-3 pr-4 text-right">
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
                    onChange={(e) => setDatosFixture({ ...datosFixture, category_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 cursor-pointer outline-hidden"
                  >
                    <option value="">Seleccionar Categoría</option>
                    {categorias
                      .filter((c) => !datosFixture.discipline_id || c.discipline_id === parseInt(datosFixture.discipline_id))
                      .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Fecha de Inicio del Torneo *</label>
                <input
                  type="date" required value={datosFixture.start_date}
                  onChange={(e) => setDatosFixture({ ...datosFixture, start_date: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
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
                      .filter((c) => !datosFecha.discipline_id || c.discipline_id === parseInt(datosFecha.discipline_id))
                      .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Número de Fecha (Round) *</label>
                  <input
                    type="number" required placeholder="Ej: 1" min="1" value={datosFecha.round}
                    onChange={(e) => setDatosFecha({ ...datosFecha, round: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
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
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3 pl-4">Fecha (Round)</th>
                    <th className="p-3">Partido (Equipos)</th>
                    <th className="p-3">Día y Hora</th>
                    <th className="p-3">Cancha / Escenario</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 pr-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {partidos.map((part) => (
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
                      <td className="p-3 pr-4 text-right">
                        {part.status !== 'finalizado' && (
                          <button onClick={() => iniciarReprogramacion(part)} className="text-xs font-bold text-primary hover:underline cursor-pointer">
                            Reprogramar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {partidos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500 text-xs">No hay partidos cargados. Genera el fixture primero.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

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
  );
};
