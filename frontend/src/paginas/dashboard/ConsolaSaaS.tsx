import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { serviciosSuperAdmin, serviciosUsuarios, type TenantInfo } from '../../servicios/api';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';

export const ConsolaSaaS: React.FC = () => {
  const { usuario, tienePermiso } = useAutenticacion();
  const navegar = useNavigate();

  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    if (!tienePermiso('gestionar_usuarios')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      const res = await serviciosSuperAdmin.obtenerTenants();
      if (res.success) {
        setTenants(res.data);
      }
    } catch (err) {
      setErrorLocal('Error al cargar la información global de la plataforma.');
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

  const manejarToggleEstado = async (tenant: TenantInfo) => {
    setErrorLocal(null);
    setMensajeExito(null);
    const nuevoEstado = !tenant.is_active;
    try {
      // Reutiliza actualizarUsuario para deshabilitar la cuenta
      const res = await serviciosUsuarios.actualizarUsuario(tenant.id, {
        name: tenant.name,
        email: tenant.email,
        is_active: nuevoEstado
      });
      if (res.success) {
        mostrarMensaje(`Organizador ${tenant.name} ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, is_active: nuevoEstado } : t))
        );
      }
    } catch (err) {
      mostrarMensaje('No se pudo cambiar el estado del organizador.', true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
      <BarraLateral rol={usuario?.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar titulo="Consola SaaS Administrador" subtitulo="Monitoreo Global de Clientes y Licencias" />

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

        {/* Resumen SaaS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs hover:border-indigo-500/30 transition-all duration-300">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Total Organizadores</span>
            <span className="text-3xl font-black text-white">{tenants.length}</span>
          </div>
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs hover:border-indigo-500/30 transition-all duration-300">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Campeonatos Activos</span>
            <span className="text-3xl font-black text-indigo-400">
              {tenants.reduce((acc, curr) => acc + curr.championships_count, 0)}
            </span>
          </div>
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs hover:border-indigo-500/30 transition-all duration-300">
            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Estado de la Plataforma</span>
            <span className="flex items-center gap-1.5 mt-2 font-bold text-[10px] text-emerald-400 uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
              Operando Normal
            </span>
          </div>
        </section>

        {/* Listado de Tenants */}
        <section className="bg-[#11131c] rounded-2xl border border-slate-900 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-900 flex items-center justify-between">
            <h2 className="font-extrabold text-base text-white">Workspaces / Organizadores Registrados</h2>
            <span className="text-xs text-slate-400 font-medium">Auditoría general SaaS</span>
          </div>

          {cargando ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Cargando Workspaces...</span>
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No hay organizadores registrados por el momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-4 pl-6">Nombre de Cuenta</th>
                    <th className="p-4">Contacto de Correo</th>
                    <th className="p-4 text-center">Campeonatos Creados</th>
                    <th className="p-4">Estado de Cuenta</th>
                    <th className="p-4 pr-6 text-right">Acciones de Licencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 pl-6 font-bold text-white">{t.name}</td>
                      <td className="p-4 text-slate-300 text-xs">{t.email}</td>
                      <td className="p-4 text-center font-extrabold text-slate-200">{t.championships_count}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            t.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-450 border border-rose-500/25'
                          }`}
                        >
                          {t.is_active ? 'Activa' : 'Suspendida'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => manejarToggleEstado(t)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            t.is_active
                              ? 'border-rose-500/30 text-rose-450 hover:bg-rose-500/10 hover:border-rose-500/50'
                              : 'border-emerald-500/30 text-emerald-450 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                          }`}
                        >
                          {t.is_active ? 'Suspender Workspace' : 'Activar Workspace'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      </div>
    </div>
  );
};
