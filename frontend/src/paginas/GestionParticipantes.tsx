import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { serviciosParticipantes } from '../servicios/api';
import type {
  Disciplina,
  Categoria,
  Organizacion,
  Equipo,
  Jugador
} from '../servicios/api';

type TabType = 'disciplinas' | 'categorias' | 'organizaciones' | 'equipos' | 'jugadores';

export const GestionParticipantes: React.FC = () => {
  const { tienePermiso } = useAutenticacion();
  const navegar = useNavigate();

  const [tabActiva, setTabActiva] = useState<TabType>('disciplinas');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados de datos
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  // Estados de formularios
  const [nuevaDisc, setNuevaDisc] = useState({ name: '', description: '', rules: '', status: 'active' });
  const [nuevaCat, setNuevaCat] = useState({ name: '', age_min: '', age_max: '', gender: 'Masculino', discipline_id: '' });
  const [nuevaOrg, setNuevaOrg] = useState({ name: '', representative: '', email: '', phone: '' });
  const [nuevoEq, setNuevoEq] = useState({ name: '', representative: '', organization_id: '', discipline_id: '', category_id: '' });
  const [nuevoJug, setNuevoJug] = useState({ name: '', dni: '', phone: '', team_id: '', number: '', position: 'Delantero' });

  useEffect(() => {
    if (!tienePermiso('ver_equipos')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [tabActiva]);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      if (tabActiva === 'disciplinas') {
        const res = await serviciosParticipantes.obtenerDisciplinas();
        if (res.success) setDisciplinas(res.data);
      } else if (tabActiva === 'categorias') {
        const res = await serviciosParticipantes.obtenerCategorias();
        if (res.success) setCategorias(res.data);
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        if (resDisc.success) setDisciplinas(resDisc.data);
      } else if (tabActiva === 'organizaciones') {
        const res = await serviciosParticipantes.obtenerOrganizaciones();
        if (res.success) setOrganizaciones(res.data);
      } else if (tabActiva === 'equipos') {
        const resEq = await serviciosParticipantes.obtenerEquipos();
        if (resEq.success) setEquipos(resEq.data);
        const resOrg = await serviciosParticipantes.obtenerOrganizaciones();
        if (resOrg.success) setOrganizaciones(resOrg.data);
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        if (resDisc.success) setDisciplinas(resDisc.data);
        const resCat = await serviciosParticipantes.obtenerCategorias();
        if (resCat.success) setCategorias(resCat.data);
      } else if (tabActiva === 'jugadores') {
        const resJug = await serviciosParticipantes.obtenerJugadores();
        if (resJug.success) setJugadores(resJug.data);
        const resEq = await serviciosParticipantes.obtenerEquipos();
        if (resEq.success) setEquipos(resEq.data);
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

  // Creación de recursos
  const guardarDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaDisc.name) return;
    try {
      const res = await serviciosParticipantes.crearDisciplina(nuevaDisc);
      if (res.success) {
        mostrarMensaje('Disciplina registrada exitosamente.');
        setNuevaDisc({ name: '', description: '', rules: '', status: 'active' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al registrar disciplina.', true);
    }
  };

  const guardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCat.name || !nuevaCat.discipline_id) {
      mostrarMensaje('El nombre y la disciplina son obligatorios.', true);
      return;
    }
    try {
      const res = await serviciosParticipantes.crearCategoria({
        name: nuevaCat.name,
        age_min: nuevaCat.age_min ? parseInt(nuevaCat.age_min) : null,
        age_max: nuevaCat.age_max ? parseInt(nuevaCat.age_max) : null,
        gender_type: nuevaCat.gender,
        discipline_id: parseInt(nuevaCat.discipline_id)
      });
      if (res.success) {
        mostrarMensaje('Categoría registrada exitosamente.');
        setNuevaCat({ name: '', age_min: '', age_max: '', gender: 'Masculino', discipline_id: '' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al registrar categoría.', true);
    }
  };

  const guardarOrganizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaOrg.name || !nuevaOrg.representative) return;
    try {
      const res = await serviciosParticipantes.crearOrganizacion(nuevaOrg);
      if (res.success) {
        mostrarMensaje('Organización registrada exitosamente.');
        setNuevaOrg({ name: '', representative: '', email: '', phone: '' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al registrar organización.', true);
    }
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEq.name || !nuevoEq.organization_id || !nuevoEq.discipline_id || !nuevoEq.category_id) {
      mostrarMensaje('Complete todos los campos obligatorios para el equipo.', true);
      return;
    }
    try {
      const res = await serviciosParticipantes.crearEquipo({
        name: nuevoEq.name,
        organization_id: parseInt(nuevoEq.organization_id),
        discipline_id: parseInt(nuevoEq.discipline_id),
        category_id: parseInt(nuevoEq.category_id),
        representative: nuevoEq.representative || null
      });
      if (res.success) {
        mostrarMensaje('Equipo registrado exitosamente.');
        setNuevoEq({ name: '', representative: '', organization_id: '', discipline_id: '', category_id: '' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al registrar equipo.', true);
    }
  };

  const guardarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoJug.name || !nuevoJug.team_id) return;
    try {
      const res = await serviciosParticipantes.crearJugador({
        name: nuevoJug.name,
        team_id: parseInt(nuevoJug.team_id),
        dni: nuevoJug.dni || null,
        phone: nuevoJug.phone || null,
        number: nuevoJug.number ? parseInt(nuevoJug.number) : null,
        position: nuevoJug.position
      });
      if (res.success) {
        mostrarMensaje('Jugador inscrito exitosamente.');
        setNuevoJug({ name: '', dni: '', phone: '', team_id: '', number: '', position: 'Delantero' });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al inscribir jugador.', true);
    }
  };

  // Eliminación de recursos
  const eliminarElemento = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) return;
    try {
      let res;
      if (tabActiva === 'disciplinas') res = await serviciosParticipantes.eliminarDisciplina(id);
      else if (tabActiva === 'categorias') res = await serviciosParticipantes.eliminarCategoria(id);
      else if (tabActiva === 'organizaciones') res = await serviciosParticipantes.eliminarOrganizacion(id);
      else if (tabActiva === 'equipos') res = await serviciosParticipantes.eliminarEquipo(id);
      else if (tabActiva === 'jugadores') res = await serviciosParticipantes.eliminarJugador(id);

      if (res && res.success) {
        mostrarMensaje('Registro eliminado correctamente.');
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('No se puede eliminar el registro. Puede estar en uso.', true);
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
            <h1 className="text-lg font-black text-slate-900 leading-none">Gestión de Participantes</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1 block">
              Inscripciones y Configuración del Campeonato
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex flex-wrap gap-2">
        {(['disciplinas', 'categorias', 'organizaciones', 'equipos', 'jugadores'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
              tabActiva === tab
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Toasts */}
        {mensajeExito && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{mensajeExito}</span>
          </div>
        )}

        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Formulario de Registro */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-fit">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">
              Añadir {tabActiva.slice(0, -1)}
            </h2>

            {tabActiva === 'disciplinas' && (
              <form onSubmit={guardarDisciplina} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nombre Disciplina *</label>
                  <input
                    type="text" required placeholder="Fútbol, Vóley, Básquet..."
                    value={nuevaDisc.name} onChange={(e) => setNuevaDisc({ ...nuevaDisc, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-secondary focus:ring-1 focus:ring-secondary outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Descripción</label>
                  <textarea
                    placeholder="Detalles de la disciplina..."
                    value={nuevaDisc.description} onChange={(e) => setNuevaDisc({ ...nuevaDisc, description: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 min-h-[80px] outline-hidden"
                  />
                </div>
                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                  Guardar Disciplina
                </button>
              </form>
            )}

            {tabActiva === 'categorias' && (
              <form onSubmit={guardarCategoria} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                  <select
                    required
                    value={nuevaCat.discipline_id}
                    onChange={(e) => setNuevaCat({ ...nuevaCat, discipline_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="">-- Selecciona Disciplina --</option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nombre Categoría *</label>
                  <input
                    type="text" required placeholder="Sub-15, Libres, Senior..."
                    value={nuevaCat.name} onChange={(e) => setNuevaCat({ ...nuevaCat, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Edad Mínima</label>
                    <input
                      type="number" placeholder="Ej: 10"
                      value={nuevaCat.age_min} onChange={(e) => setNuevaCat({ ...nuevaCat, age_min: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Edad Máxima</label>
                    <input
                      type="number" placeholder="Ej: 15"
                      value={nuevaCat.age_max} onChange={(e) => setNuevaCat({ ...nuevaCat, age_max: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Género</label>
                  <select
                    value={nuevaCat.gender} onChange={(e) => setNuevaCat({ ...nuevaCat, gender: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                  Guardar Categoría
                </button>
              </form>
            )}

            {tabActiva === 'organizaciones' && (
              <form onSubmit={guardarOrganizacion} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nombre Institución/Organización *</label>
                  <input
                    type="text" required placeholder="Club Deportivo, Escuela, etc."
                    value={nuevaOrg.name} onChange={(e) => setNuevaOrg({ ...nuevaOrg, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Representante *</label>
                  <input
                    type="text" required placeholder="Nombre del Delegado"
                    value={nuevaOrg.representative} onChange={(e) => setNuevaOrg({ ...nuevaOrg, representative: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email</label>
                  <input
                    type="email" placeholder="correo@ejemplo.com"
                    value={nuevaOrg.email} onChange={(e) => setNuevaOrg({ ...nuevaOrg, email: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                  Guardar Organización
                </button>
              </form>
            )}

            {tabActiva === 'equipos' && (
              <form onSubmit={guardarEquipo} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nombre del Equipo *</label>
                  <input
                    type="text" required placeholder="Ej: Real Arequipa"
                    value={nuevoEq.name} onChange={(e) => setNuevoEq({ ...nuevoEq, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Delegado/Representante</label>
                  <input
                    type="text" placeholder="Representante del equipo"
                    value={nuevoEq.representative} onChange={(e) => setNuevoEq({ ...nuevoEq, representative: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Organización Asociada *</label>
                  <select
                    required value={nuevoEq.organization_id}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, organization_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="">Seleccionar Organización</option>
                    {organizaciones.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                    <select
                      required value={nuevoEq.discipline_id}
                      onChange={(e) => setNuevoEq({ ...nuevoEq, discipline_id: e.target.value })}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="">Seleccionar Disciplina</option>
                      {disciplinas.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Categoría *</label>
                    <select
                      required value={nuevoEq.category_id}
                      onChange={(e) => setNuevoEq({ ...nuevoEq, category_id: e.target.value })}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="">Seleccionar Categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                  Guardar Equipo
                </button>
              </form>
            )}

            {tabActiva === 'jugadores' && (
              <form onSubmit={guardarJugador} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nombre Completo *</label>
                  <input
                    type="text" required placeholder="Nombre del jugador"
                    value={nuevoJug.name} onChange={(e) => setNuevoJug({ ...nuevoJug, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">DNI / Documento</label>
                    <input
                      type="text" placeholder="DNI"
                      value={nuevoJug.dni} onChange={(e) => setNuevoJug({ ...nuevoJug, dni: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Dorsal / Número</label>
                    <input
                      type="number" placeholder="Ej: 10"
                      value={nuevoJug.number} onChange={(e) => setNuevoJug({ ...nuevoJug, number: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Equipo *</label>
                  <select
                    required value={nuevoJug.team_id}
                    onChange={(e) => setNuevoJug({ ...nuevoJug, team_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="">Seleccionar Equipo</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                  Guardar Jugador
                </button>
              </form>
            )}

          </div>

          {/* Columna Derecha: Listado de Datos */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">
              Lista de {tabActiva}
            </h2>

            {cargando ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cargando registros...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3 pl-4">Detalles</th>
                      {tabActiva === 'equipos' && <th className="p-3">Organización</th>}
                      {tabActiva === 'jugadores' && <th className="p-3">Equipo</th>}
                      <th className="p-3 pr-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {tabActiva === 'disciplinas' && disciplinas.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/40">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <div className="text-xs text-slate-500">{d.description || 'Sin descripción'}</div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <button onClick={() => eliminarElemento(d.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                        </td>
                      </tr>
                    ))}

                    {tabActiva === 'categorias' && categorias.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/40">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-500">
                            Edades: {c.age_min ?? 'N/A'} - {c.age_max ?? 'N/A'} | Género: {c.gender}
                          </div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <button onClick={() => eliminarElemento(c.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                        </td>
                      </tr>
                    ))}

                    {tabActiva === 'organizaciones' && organizaciones.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/40">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-900">{o.name}</div>
                          <div className="text-xs text-slate-500">Representante: {o.representative}</div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <button onClick={() => eliminarElemento(o.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                        </td>
                      </tr>
                    ))}

                    {tabActiva === 'equipos' && equipos.map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-50/40">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-900">{eq.name}</div>
                          <div className="text-xs text-slate-500">Delegado: {eq.representative || 'No registrado'}</div>
                        </td>
                        <td className="p-3 text-slate-700">{eq.organization?.name || 'Independiente'}</td>
                        <td className="p-3 pr-4 text-right">
                          <button onClick={() => eliminarElemento(eq.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                        </td>
                      </tr>
                    ))}

                    {tabActiva === 'jugadores' && jugadores.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/40">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-900">{j.name}</div>
                          <div className="text-xs text-slate-500">DNI: {j.dni || 'No registrado'} | Camiseta: {j.number || 'N/A'} ({j.position})</div>
                        </td>
                        <td className="p-3 text-slate-700">{j.team?.name || 'Sin equipo'}</td>
                        <td className="p-3 pr-4 text-right">
                          <button onClick={() => eliminarElemento(j.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                        </td>
                      </tr>
                    ))}

                    {!cargando && (
                      (tabActiva === 'disciplinas' && disciplinas.length === 0) ||
                      (tabActiva === 'categorias' && categorias.length === 0) ||
                      (tabActiva === 'organizaciones' && organizaciones.length === 0) ||
                      (tabActiva === 'equipos' && equipos.length === 0) ||
                      (tabActiva === 'jugadores' && jugadores.length === 0)
                    ) && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-slate-500 text-xs">
                          No hay registros cargados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};
