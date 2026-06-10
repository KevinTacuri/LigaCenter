import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { serviciosUsuarios } from '../servicios/api';
import type { Usuario, Rol } from '../servicios/api';

export const GestionUsuarios: React.FC = () => {
  const { tienePermiso } = useAutenticacion();
  const navegar = useNavigate();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    if (!tienePermiso('gestionar_usuarios')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [pagina]);

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
            <h1 className="text-lg font-black text-slate-900 leading-none">Gestión de Usuarios</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1 block">
              Administración General de Clientes
            </span>
          </div>
        </div>
      </header>

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

        {/* Tabla / Listado */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-150 flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900">Usuarios Registrados en la App</h2>
            <span className="text-xs text-slate-500 font-medium">Lista de personas y organizadores</span>
          </div>

          {cargando ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cargando Usuarios...</span>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No hay usuarios registrados por el momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4 pl-6">Nombre</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">DNI / Cédula</th>
                    <th className="p-4">Rol en el Sistema</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{usuario.name}</div>
                        <div className="text-xs text-slate-500">{usuario.email}</div>
                      </td>
                      <td className="p-4 text-slate-600 text-xs">
                        {usuario.phone || 'No registrado'}
                      </td>
                      <td className="p-4 text-slate-600 text-xs">
                        {usuario.dni || 'No registrado'}
                      </td>
                      <td className="p-4">
                        <select
                          value={usuario.roles[0] || 'Publico'}
                          onChange={(e) => manejarCambioRol(usuario.id, e.target.value)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-semibold transition-all outline-hidden cursor-pointer"
                        >
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
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${usuario.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {usuario.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => manejarToggleEstado(usuario)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            usuario.is_active
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
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
            <div className="p-4 border-t border-slate-150 flex items-center justify-between text-xs">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-150 transition-all cursor-pointer disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-slate-500">Página {pagina} de {totalPaginas}</span>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-150 transition-all cursor-pointer disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};
