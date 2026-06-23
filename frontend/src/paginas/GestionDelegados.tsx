import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { serviciosCampeonatos, serviciosParticipantes, serviciosUsuarios } from '../servicios/api';
import type { ChampionshipUser, Usuario, Equipo } from '../servicios/api';
import { BarraLateral } from '../componentes/BarraLateral';
import { CabeceraEstandar } from '../componentes/CabeceraEstandar';
import { sileo } from 'sileo';

interface FormularioAgregar {
  user_id: string;
  role: string;
  team_id: string;
}

const ROLES_DISPONIBLES = [
  { value: 'team_delegate', label: 'Delegado de Equipo' },
  { value: 'score_table', label: 'Encargado de Mesa' },
  { value: 'referee', label: 'Árbitro' },
];

export const GestionDelegados: React.FC = () => {
  const { usuario, tieneRol } = useAutenticacion();
  const { campeonatoActivo, seleccionarCampeonato } = useCampeonato();
  const navegar = useNavigate();

  const [miembros, setMiembros] = useState<ChampionshipUser[]>([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState<FormularioAgregar>({
    user_id: '',
    role: 'team_delegate',
    team_id: '',
  });
  const [guardando, setGuardando] = useState(false);

  const [settings, setSettings] = useState<any>({});
  const [fechasLimites, setFechasLimites] = useState<Record<string, string>>({});

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
    if (!campeonatoActivo) {
      navegar('/tablero');
      return;
    }
    if (!tieneRol('organizador')) {
      navegar('/tablero');
      return;
    }
    cargarDatos();
  }, [campeonatoActivo]);

  const cargarDatos = async () => {
    if (!campeonatoActivo) return;
    setCargando(true);
    setErrorLocal(null);
    try {
      const [resMiembros, resEquipos] = await Promise.all([
        serviciosCampeonatos.obtenerUsuariosCampeonato(campeonatoActivo.id),
        serviciosParticipantes.obtenerEquipos(),
      ]);
      if (resMiembros.success) setMiembros(resMiembros.data);
      if (resEquipos.success) setEquipos(resEquipos.data);
    } catch {
      setErrorLocal('Error al cargar los datos del campeonato.');
    } finally {
      setCargando(false);
    }
  };

  const abrirFormulario = async () => {
    setMostrarFormulario(true);
    setErrorLocal(null);
    setCargandoUsuarios(true);
    try {
      const res = await serviciosUsuarios.obtenerUsuarios(1);
      if (res.success) {
        setUsuariosDisponibles(res.data.users);
      }
    } catch {
      setErrorLocal('Error al cargar usuarios del sistema.');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const manejarAgregar = async (e: React.FormEvent) => {
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
        sileo.success({ title: 'Usuario Asignado', description: 'El usuario ha sido agregado al campeonato.' });
        setMostrarFormulario(false);
        setForm({ user_id: '', role: 'team_delegate', team_id: '' });
        cargarDatos();
      } else {
        setErrorLocal(res.message || 'Error al asignar usuario.');
      }
    } catch (err: any) {
      setErrorLocal(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarRol = async (id: number, role: string) => {
    try {
      const res = await serviciosCampeonatos.actualizarRolUsuarioCampeonato(id, { role });
      if (res.success) {
        sileo.success({ title: 'Rol Actualizado', description: 'El rol del usuario ha sido actualizado.' });
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
      sileo.error({ title: 'Error', description: 'No se pudo remover el usuario.' });
    }
  };



  const obtenerNombreEquipo = (teamId: number | null | undefined) => {
    if (!teamId) return '—';
    const eq = equipos.find(e => e.id === teamId);
    return eq ? eq.name : '—';
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans">
      <BarraLateral rol={usuario?.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <CabeceraEstandar titulo="Gestión de Usuarios del Campeonato" subtitulo="Asigna roles a los miembros del torneo" />

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
          {errorLocal && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Header con botón agregar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Usuarios del Campeonato</h2>
              <p className="text-xs text-slate-400 mt-1">
                {campeonatoActivo?.name} — {miembros.length} miembro(s) asignado(s)
              </p>
            </div>
            <button
              onClick={abrirFormulario}
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Asignar Usuario
            </button>
          </div>

          {/* Formulario de asignación */}
          {mostrarFormulario && (
            <form onSubmit={manejarAgregar} className="bg-[#11131c] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Nuevo Miembro del Campeonato
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">Usuario *</label>
                  <select
                    required
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    className="w-full text-sm bg-[#0c0e16] border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="">-- Seleccionar Usuario --</option>
                    {cargandoUsuarios ? (
                      <option disabled>Cargando usuarios...</option>
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
                  <label className="text-xs font-bold text-slate-400 block">Rol *</label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full text-sm bg-[#0c0e16] border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    {ROLES_DISPONIBLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block">
                    Equipo {form.role === 'team_delegate' ? '*' : '(opcional)'}
                  </label>
                  <select
                    value={form.team_id}
                    onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                    className="w-full text-sm bg-[#0c0e16] border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="">-- Sin equipo --</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {guardando ? 'Asignando...' : 'Asignar al Campeonato'}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer bg-transparent border-0"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Solicitudes de prórroga pendientes */}
          {settings.extension_requests && settings.extension_requests.filter((r: any) => r.status === 'pendiente').length > 0 && (
            <div className="bg-[#11131c] border border-amber-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">hourglass_empty</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Solicitudes de Prórroga Pendientes
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {settings.extension_requests.filter((r: any) => r.status === 'pendiente').map((req: any) => {
                  const equipoNombre = obtenerNombreEquipo(req.team_id);
                  return (
                    <div key={req.id} className="p-4 rounded-xl bg-[#171a26]/40 border border-slate-850 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Equipo: <span className="text-indigo-400">{equipoNombre}</span></p>
                        <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                          "Motivo: {req.reason}"
                        </p>
                        <p className="text-[10px] font-bold text-slate-300 mt-2">
                          Prórroga sugerida: <span className="text-amber-500">{new Date(req.requested_deadline).toLocaleString('es-ES')}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => manejarResolverProrroga(req.id, true)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-650 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-wider text-white cursor-pointer transition-all border-0"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => manejarResolverProrroga(req.id, false)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-650 hover:bg-rose-650 text-[10px] font-black uppercase tracking-wider text-white cursor-pointer transition-all border-0"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla de miembros */}
          {cargando ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin" />
            </div>
          ) : miembros.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-700 mb-3">group_off</span>
              <p className="text-slate-500 text-sm font-semibold">No hay usuarios asignados a este campeonato</p>
              <p className="text-slate-600 text-xs mt-1">Usa el botón "Asignar Usuario" para agregar miembros.</p>
            </div>
          ) : (
            <div className="bg-[#11131c] border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="px-5 py-3 font-black">Usuario</th>
                    <th className="px-5 py-3 font-black">Rol</th>
                    <th className="px-5 py-3 font-black">Equipo</th>
                    <th className="px-5 py-3 font-black">Fecha Límite (Roster)</th>
                    <th className="px-5 py-3 font-black">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {miembros.map((m) => (
                    <tr key={m.id} className="hover:bg-[#171a26]/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white text-xs">{m.user?.name || '—'}</div>
                        <div className="text-[10px] text-slate-500">{m.user?.email || ''}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={m.role}
                          onChange={(e) => manejarCambiarRol(m.id, e.target.value)}
                          className="bg-[#0c0e16] border border-slate-800 text-white text-[10px] rounded-lg px-2 py-1.5 outline-none cursor-pointer font-bold"
                        >
                          {ROLES_DISPONIBLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-300 font-medium">
                          {obtenerNombreEquipo(m.team_id)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {m.role === 'team_delegate' && m.team_id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="datetime-local"
                              value={fechasLimites[`team_${m.team_id}`] || ''}
                              onChange={(e) => manejarCambiarFechaLimite(m.team_id!, e.target.value)}
                              className="bg-[#0c0e16] border border-slate-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer font-bold"
                            />
                            <button
                              onClick={() => guardarFechaLimite(m.team_id!)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-[9px] font-black uppercase tracking-wider text-white transition-all cursor-pointer border-0"
                            >
                              Guardar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No aplica</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => manejarRemover(m.id, m.user?.name || '')}
                          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <span className="material-symbols-outlined text-sm">remove_circle</span>
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
