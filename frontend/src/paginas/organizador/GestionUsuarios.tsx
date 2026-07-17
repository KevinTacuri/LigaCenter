import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { serviciosUsuarios } from '../../servicios/api';
import type { Usuario, Rol } from '../../servicios/api';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';

export const GestionUsuarios: React.FC = () => {
  const { usuario, tienePermiso, cargando: cargandoAuth } = useAutenticacion();
  const navegar = useNavigate();

  const obtenerNombreRol = (rolesArray: any[]): string => {
    if (!rolesArray || rolesArray.length === 0) return 'usuario_publico';
    const rolObj = rolesArray[0];
    return typeof rolObj === 'object' && rolObj !== null ? rolObj.name : rolObj;
  };

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    if (cargandoAuth) return;
    if (!tienePermiso('gestionar_usuarios')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [pagina, cargandoAuth]);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      const resUsuarios = await serviciosUsuarios.obtenerUsuarios(pagina);
      if (resUsuarios.success) {
        setUsuarios(resUsuarios.data.users);
        setTotalPaginas(resUsuarios.data.pagination.last_page);
      }
      
      const resRoles = await serviciosUsuarios.obtenerRoles();
      if (resRoles.success) {
        setRoles(resRoles.data);
      }
    } catch (err: any) {
      setErrorLocal('Error al cargar la información de usuarios.');
    } finally {
      setCargando(false);
    }
  };

  const manejarCambioRol = async (usuarioId: number, nuevoRol: string) => {
    setErrorLocal(null);
    setMensajeExito(null);
    try {
      const res = await serviciosUsuarios.cambiarRolUsuario(usuarioId, nuevoRol);
      if (res.success) {
        setMensajeExito('Rol de usuario actualizado con éxito.');
        setUsuarios((prev) =>
          prev.map((u) => (u.id === usuarioId ? { ...u, roles: [nuevoRol] } : u))
        );
        setTimeout(() => setMensajeExito(null), 3000);
      }
    } catch (err: any) {
      setErrorLocal('No se pudo cambiar el rol del usuario.');
    }
  };

  const manejarToggleEstado = async (usuario: Usuario) => {
    setErrorLocal(null);
    setMensajeExito(null);
    const nuevoEstado = !usuario.is_active;
    try {
      const res = await serviciosUsuarios.actualizarUsuario(usuario.id, {
        name: usuario.name,
        email: usuario.email,
        is_active: nuevoEstado,
      });
      if (res.success) {
        setMensajeExito(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
        setUsuarios((prev) =>
          prev.map((u) => (u.id === usuario.id ? { ...u, is_active: nuevoEstado } : u))
        );
        setTimeout(() => setMensajeExito(null), 3000);
      }
    } catch (err: any) {
      setErrorLocal('No se pudo actualizar el estado del usuario.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
      <BarraLateral rol={usuario?.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar titulo="Gestión de Usuarios" subtitulo="Administración General de Clientes" />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
        
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

        {/* Tabla / Listado */}
        <section className="bg-[#11131c] rounded-2xl border border-slate-900 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <h2 className="font-extrabold text-base text-white">Usuarios Registrados en la App</h2>
            <span className="text-xs text-slate-400 font-medium">Lista de personas y organizadores</span>
          </div>

          {cargando ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Cargando Usuarios...</span>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No hay usuarios registrados por el momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4 pl-6">Nombre</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">DNI / Cédula</th>
                    <th className="p-4">Rol en el Sistema</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white">{usuario.name}</div>
                        <div className="text-xs text-slate-450">{usuario.email}</div>
                      </td>
                      <td className="p-4 text-slate-300 text-xs">
                        {usuario.phone || 'No registrado'}
                      </td>
                      <td className="p-4 text-slate-300 text-xs">
                        {usuario.dni || 'No registrado'}
                      </td>
                      <td className="p-4">
                        <select
                          value={obtenerNombreRol(usuario.roles)}
                          onChange={(e) => manejarCambioRol(usuario.id, e.target.value)}
                          className="bg-[#171a26] hover:bg-[#1f2335] border border-slate-850 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-semibold transition-all outline-hidden cursor-pointer"
                        >
                          {/* Garantizar que el rol actual esté presente en las opciones para evitar que se distorsione la selección */}
                          {obtenerNombreRol(usuario.roles) && !roles.some((rol) => rol.name === obtenerNombreRol(usuario.roles)) && (
                            <option value={obtenerNombreRol(usuario.roles)}>
                              {obtenerNombreRol(usuario.roles).replace('_', ' ').toUpperCase()}
                            </option>
                          )}
                          {roles.map((rol) => (
                            <option key={rol.id} value={rol.name}>
                              {rol.name.replace('_', ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            usuario.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/25'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${usuario.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                          {usuario.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => manejarToggleEstado(usuario)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            usuario.is_active
                              ? 'border-rose-500/30 text-rose-450 hover:bg-rose-500/10 hover:border-rose-500/50'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                          }`}
                        >
                          {usuario.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="p-4 border-t border-slate-900 flex items-center justify-between text-xs">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
                className="px-3 py-1.5 bg-[#171a26] border border-slate-850 text-slate-300 font-semibold rounded-lg hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-slate-400">Página {pagina} de {totalPaginas}</span>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
                className="px-3 py-1.5 bg-[#171a26] border border-slate-850 text-slate-300 font-semibold rounded-lg hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </section>

      </main>
      </div>
    </div>
  );
};
