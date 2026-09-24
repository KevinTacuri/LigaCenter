import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { serviciosCampeonatos, serviciosParticipantes, clienteApi } from '../../servicios/api';
import type { ChampionshipUser, Usuario, Equipo } from '../../servicios/api';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { Paginador } from '../../componentes/Paginador';
import { EstadoVacio } from '../../componentes/EstadoVacio';
import { sileo } from 'sileo';

interface FormularioAgregar {
  user_id: string;
  role: string;
  team_id: string;
}

interface FormularioCrearNuevo {
  name: string;
  email: string;
  password: string;
  role: string;
}

const ROLES_OFICIALES = [
  { value: 'score_table', label: 'Encargado de Mesa de Control' },
  { value: 'referee', label: 'Árbitro de Encuentros' },
];

export const GestionDelegados: React.FC = () => {
  const { usuario, tieneRol, cargando: cargandoAuth } = useAutenticacion();
  const { campeonatoActivo, seleccionarCampeonato, cargandoCampeonato } = useCampeonato();
  const navegar = useNavigate();

  const [miembros, setMiembros] = useState<ChampionshipUser[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [modoModal, setModoModal] = useState<'asignar' | 'crear'>('crear');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  const [form, setForm] = useState<FormularioAgregar>({
    user_id: '',
    role: 'score_table',
    team_id: '',
  });

  const [formNuevo, setFormNuevo] = useState<FormularioCrearNuevo>({
    name: '',
    email: '',
    password: '',
    role: 'score_table',
  });

  const [guardando, setGuardando] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [fechasLimites, setFechasLimites] = useState<Record<string, string>>({});

  // Paginación
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 8;
  const totalPaginas = Math.max(1, Math.ceil(miembros.length / itemsPorPagina));
  const miembrosPaginados = miembros.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(1);
    }
  }, [miembros.length, totalPaginas, pagina]);

  useEffect(() => {
    if (campeonatoActivo) {
      const activeSettings = campeonatoActivo.settings || {};
      setSettings(activeSettings);
      setFechasLimites(activeSettings.roster_deadlines || {});
    }
  }, [campeonatoActivo]);

  const manejarCambiarFechaLimite = (teamId: number, valor: string) => {
    setFechasLimites(prev => ({
      ...prev,
      [`team_${teamId}`]: valor
    }));
  };

  const guardarFechaLimite = async (teamId: number) => {
    if (!campeonatoActivo) return;
    try {
      const nuevosSettings = {
        ...settings,
        roster_deadlines: {
          ...(settings.roster_deadlines || {}),
          [`team_${teamId}`]: fechasLimites[`team_${teamId}`] || ''
        }
      };
      
      const res = await serviciosCampeonatos.actualizarCampeonato(campeonatoActivo.id, {
        name: campeonatoActivo.name,
        settings: nuevosSettings
      });
      if (res.success) {
        setSettings(nuevosSettings);
        seleccionarCampeonato(res.data);
        sileo.success({ title: 'Plazo Guardado', description: 'La fecha límite de inscripción ha sido actualizada.' });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo guardar la fecha límite.' });
    }
  };

  const manejarResolverProrroga = async (requestId: number, aprobado: boolean) => {
    if (!campeonatoActivo) return;
    try {
      const requestToUpdate = (settings.extension_requests || []).find((r: any) => r.id === requestId);
      if (!requestToUpdate) return;
      
      const nuevosRequests = (settings.extension_requests || []).map((r: any) => {
        if (r.id === requestId) {
          return { ...r, status: aprobado ? 'aprobado' : 'rechazado' };
        }
        return r;
      });

      const nuevosDeadlines = {
        ...(settings.roster_deadlines || {})
      };

      if (aprobado && requestToUpdate.requested_deadline) {
        nuevosDeadlines[`team_${requestToUpdate.team_id}`] = requestToUpdate.requested_deadline;
      }

      const nuevosSettings = {
        ...settings,
        roster_deadlines: nuevosDeadlines,
        extension_requests: nuevosRequests
      };

      const res = await serviciosCampeonatos.actualizarCampeonato(campeonatoActivo.id, {
        name: campeonatoActivo.name,
        settings: nuevosSettings
      });
      if (res.success) {
        setSettings(nuevosSettings);
        seleccionarCampeonato(res.data);
        sileo.success({ 
          title: aprobado ? 'Prórroga Aprobada' : 'Prórroga Rechazada', 
          description: aprobado ? 'La fecha límite ha sido extendida.' : 'La solicitud ha sido rechazada.' 
        });
      }
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo procesar la solicitud.' });
    }
  };

  useEffect(() => {
    if (cargandoAuth || cargandoCampeonato) return;
    if (!campeonatoActivo) {
      navegar('/tablero');
      return;
    }
    if (!tieneRol('organizador')) {
      navegar('/tablero');
      return;
    }
    cargarDatos();
  }, [campeonatoActivo, cargandoAuth, cargandoCampeonato]);

  const cargarDatos = async () => {
    if (!campeonatoActivo) return;
    setCargando(true);
    setErrorLocal(null);
    try {
      const [resMiembros, resEquipos] = await Promise.all([
        serviciosCampeonatos.obtenerUsuariosCampeonato(campeonatoActivo.id),
        serviciosParticipantes.obtenerTodosEquipos(),
      ]);
      if (resMiembros.success) setMiembros(resMiembros.data);
      if (resEquipos.success) setEquipos(resEquipos.data);
    } catch {
      setErrorLocal('Error al cargar los oficiales del campeonato.');
    } finally {
      setCargando(false);
    }
  };

  const abrirFormulario = async () => {
    setMostrarFormulario(true);
    setErrorLocal(null);
    setCargandoUsuarios(true);
    try {
      const res = await clienteApi.get('/users?exclude_privileged=1&per_page=100');
      if (res.data && res.data.data && Array.isArray(res.data.data.users)) {
        const aptos = res.data.data.users.filter((u: Usuario) => 
          !u.roles?.some(r => r === 'administrador' || r === 'organizador')
        );
        setUsuariosDisponibles(aptos);
      }
    } catch {
      setErrorLocal('Error al cargar usuarios disponibles.');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const manejarAgregarExistente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campeonatoActivo || !form.user_id) return;
    setGuardando(true);
    setErrorLocal(null);
    try {
      const res = await serviciosCampeonatos.agregarUsuarioCampeonato(campeonatoActivo.id, {
        user_id: parseInt(form.user_id),
        role: form.role,
        team_id: form.team_id ? parseInt(form.team_id) : null,
      });
      if (res.success) {
        sileo.success({ title: 'Oficial Asignado', description: 'El oficial ha sido asignado al campeonato.' });
        setMostrarFormulario(false);
        setForm({ user_id: '', role: 'score_table', team_id: '' });
        cargarDatos();
      } else {
        setErrorLocal(res.message || 'Error al asignar oficial.');
      }
    } catch (err: any) {
      setErrorLocal(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCrearNuevoOficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campeonatoActivo || !formNuevo.name || !formNuevo.email || !formNuevo.password) return;
    setGuardando(true);
    setErrorLocal(null);
    try {
      // 1. Registrar usuario
      const resReg = await clienteApi.post('/register', {
        name: formNuevo.name,
        email: formNuevo.email,
        password: formNuevo.password,
        password_confirmation: formNuevo.password,
      });

      const nuevoUsuario = resReg.data?.data?.user || resReg.data?.user;
      if (!nuevoUsuario?.id) {
        throw new Error('No se pudo obtener el ID del usuario registrado.');
      }

      // 2. Vincular al campeonato
      const resVinculo = await serviciosCampeonatos.agregarUsuarioCampeonato(campeonatoActivo.id, {
        user_id: nuevoUsuario.id,
        role: formNuevo.role,
        team_id: null,
      });

      if (resVinculo.success) {
        sileo.success({ title: 'Cuenta Creada', description: `Oficial registrado como ${formNuevo.role === 'score_table' ? 'Encargado de Mesa' : 'Árbitro'}.` });
        setMostrarFormulario(false);
        setFormNuevo({ name: '', email: '', password: '', role: 'score_table' });
        cargarDatos();
      }
    } catch (err: any) {
      setErrorLocal(err.response?.data?.message || err.message || 'Error al crear la cuenta del oficial.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarRol = async (id: number, role: string) => {
    try {
      const res = await serviciosCampeonatos.actualizarRolUsuarioCampeonato(id, { role });
      if (res.success) {
        sileo.success({ title: 'Rol Actualizado', description: 'El rol del oficial ha sido actualizado.' });
        cargarDatos();
      }
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo actualizar el rol.' });
    }
  };

  const manejarRemover = async (id: number, nombre: string) => {
    try {
      const res = await serviciosCampeonatos.removerUsuarioCampeonato(id);
      if (res.success) {
        sileo.success({ title: 'Usuario Removido', description: `${nombre} ha sido removido del campeonato.` });
        cargarDatos();
      }
    } catch {
      sileo.error({ title: 'Error', description: 'No se pudo remover el oficial.' });
    }
  };

  const obtenerNombreEquipo = (teamId: number | null | undefined) => {
    if (!teamId) return '—';
    const eq = equipos.find(e => e.id === teamId);
    return eq ? eq.name : '—';
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <BarraLateral rol={usuario?.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <CabeceraEstandar titulo="Encargados de Mesa y Oficiales" subtitulo="Gestión de Operadores de Mesa de Control y Árbitros" />

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
          {errorLocal && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Banner Informativo de Gestión de Delegados por Equipo */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-on-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">groups</span>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-wider">¿Deseas administrar los Delegados de tus Equipos?</h4>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  Cada delegado está vinculado directamente a su equipo. Administra y crea sus cuentas en la pestaña de Equipos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navegar('/tablero/participantes?tab=equipos')}
              className="shrink-0 bg-primary text-white hover:opacity-90 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Ir a Gestión de Equipos</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          {/* Header con botón agregar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-on-surface tracking-tight">Oficiales del Campeonato</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {campeonatoActivo?.name} — {miembros.length} personal registrado
              </p>
            </div>
            <button
              onClick={abrirFormulario}
              className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Registrar / Asignar Oficial
            </button>
          </div>

          {/* Formulario Modal Dual */}
          {mostrarFormulario && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-primary-container border border-outline text-on-surface rounded-2xl p-6 space-y-4 shadow-2xl w-full max-w-2xl animate-scaleIn">
                <div className="flex items-center justify-between border-b border-outline pb-3">
                  <h3 className="text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">badge</span>
                    Alta de Personal de Apoyo Técnico
                  </h3>

                  {/* Tabs del Modal */}
                  <div className="flex bg-surface rounded-xl border border-outline p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setModoModal('crear')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        modoModal === 'crear' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      ➕ Registrar Cuenta
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoModal('asignar')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        modoModal === 'asignar' ? 'bg-primary text-white shadow-2xs' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      👤 Asignar Usuario
                    </button>
                  </div>
                </div>

                {modoModal === 'crear' ? (
                  <form onSubmit={manejarCrearNuevoOficial} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant block">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Carlos Ramírez"
                          value={formNuevo.name}
                          onChange={(e) => setFormNuevo({ ...formNuevo, name: e.target.value })}
                          className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant block">Correo Electrónico *</label>
                        <input
                          type="email"
                          required
                          placeholder="mesa@torneo.com"
                          value={formNuevo.email}
                          onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })}
                          className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant block">Contraseña de Acceso *</label>
                        <input
                          type="password"
                          required
                          minLength={8}
                          placeholder="Mínimo 8 caracteres"
                          value={formNuevo.password}
                          onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })}
                          className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant block">Rol de Campo / Mesa *</label>
                        <select
                          required
                          value={formNuevo.role}
                          onChange={(e) => setFormNuevo({ ...formNuevo, role: e.target.value })}
                          className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary cursor-pointer"
                        >
                          {ROLES_OFICIALES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-outline">
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-outline hover:bg-surface-bright text-on-surface-variant cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={guardando}
                        className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {guardando ? 'Registrando...' : 'Crear Cuenta de Oficial'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={manejarAgregarExistente} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant block">Usuario Disponible *</label>
                        <select
                          required
                          value={form.user_id}
                          onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                          className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="">-- Seleccionar Usuario --</option>
                          {cargandoUsuarios ? (
                            <option disabled>Cargando usuarios...</option>
                          ) : usuariosDisponibles.length === 0 ? (
                            <option disabled>No hay usuarios disponibles sin rol organizativo</option>
                          ) : (
                            usuariosDisponibles.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant block">Rol de Campo / Mesa *</label>
                        <select
                          required
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="w-full text-xs border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary cursor-pointer"
                        >
                          {ROLES_OFICIALES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-outline">
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-outline hover:bg-surface-bright text-on-surface-variant cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={guardando}
                        className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {guardando ? 'Asignando...' : 'Asignar Oficial'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Tabla de Miembros del Campeonato */}
          <div className="bg-primary-container border border-outline rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-outline bg-surface-dim">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                Personal Técnico y Oficiales Asignados
              </h3>
            </div>

            {cargando ? (
              <div className="p-12 text-center text-on-surface-variant text-xs font-bold animate-pulse">Cargando oficialidad...</div>
            ) : miembros.length === 0 ? (
              <EstadoVacio
                icono="badge"
                titulo="No hay oficiales ni técnicos asignados"
                descripcion="No se han registrado encargados de mesa ni árbitros en este torneo aún."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface border-b border-outline text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3 pl-4">Usuario</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Rol Técnico</th>
                      <th className="p-3">Equipo Asociado</th>
                      <th className="p-3 pr-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline text-on-surface">
                    {miembrosPaginados.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-bright/50 transition-colors">
                        <td className="p-3 pl-4 font-extrabold">{m.user?.name || 'Usuario Desconocido'}</td>
                        <td className="p-3 text-on-surface-variant">{m.user?.email || '—'}</td>
                        <td className="p-3">
                          <select
                            value={m.role}
                            onChange={(e) => manejarCambiarRol(m.id, e.target.value)}
                            className="bg-surface border border-outline text-on-surface text-[11px] font-bold rounded-lg p-1.5 outline-none cursor-pointer"
                          >
                            <option value="score_table">Encargado de Mesa</option>
                            <option value="referee">Árbitro</option>
                            <option value="team_delegate">Delegado de Equipo</option>
                            <option value="organizer">Organizador</option>
                          </select>
                        </td>
                        <td className="p-3 text-on-surface-variant font-medium">
                          {m.team?.name || obtenerNombreEquipo(m.team_id)}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <button
                            onClick={() => manejarRemover(m.id, m.user?.name || 'Usuario')}
                            className="text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Paginador
              paginaActual={pagina}
              totalPaginas={totalPaginas}
              totalRegistros={miembros.length}
              onCambiarPagina={setPagina}
              etiqueta="oficiales"
            />
          </div>
        </main>
      </div>
    </div>
  );
};
