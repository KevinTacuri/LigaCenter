import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { serviciosAutenticacion } from '../servicios/api';

export const RestablecerContrasenia: React.FC = () => {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();

  const [token, setToken] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [confirmarContrasenia, setConfirmarContrasenia] = useState('');
  
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const tokenQuery = parametros.get('token') || '';
    const correoQuery = parametros.get('email') || '';
    setToken(tokenQuery);
    setCorreo(correoQuery);
  }, [parametros]);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !correo || !contrasenia || !confirmarContrasenia) {
      setErrorLocal('Todos los campos son obligatorios.');
      return;
    }

    if (contrasenia !== confirmarContrasenia) {
      setErrorLocal('Las contraseñas no coinciden.');
      return;
    }

    if (contrasenia.length < 8) {
      setErrorLocal('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setProcesando(true);
    setErrorLocal(null);
    setMensajeExito(null);

    try {
      const respuesta = await serviciosAutenticacion.restablecerContrasenia({
        token,
        email: correo,
        password: contrasenia,
        password_confirmation: confirmarContrasenia,
      });

      if (respuesta.success) {
        setMensajeExito(respuesta.message || 'Contraseña restablecida exitosamente.');
        setTimeout(() => {
          navegar('/login');
        }, 3000);
      } else {
        setErrorLocal(respuesta.message || 'No se pudo restablecer la contraseña.');
      }
    } catch (err: any) {
      setErrorLocal(err.response?.data?.message || 'Token inválido o expirado.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-[#1e1b4b] via-[#0f172a] to-[#020617] p-4 font-sans select-none">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:shadow-blue-500/5 hover:border-white/20">
        
        {/* Cabecera */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white via-slate-200 to-slate-400">
            Nueva Contraseña
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Ingresa tu nueva clave de acceso para tu cuenta.
          </p>
        </div>

        {/* Mensajes de Éxito o Error */}
        {mensajeExito && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{mensajeExito} Redirigiendo...</span>
          </div>
        )}

        {errorLocal && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className="space-y-4">
          
          {/* El token es invisible pero obligatorio */}
          <input type="hidden" value={token} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={procesando}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              placeholder="Mínimo 8 caracteres"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              disabled={procesando}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              placeholder="••••••••"
              value={confirmarContrasenia}
              onChange={(e) => setConfirmarContrasenia(e.target.value)}
              disabled={procesando}
            />
          </div>

          <button
            type="submit"
            disabled={procesando}
            className="w-full mt-2 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-semibold rounded-xl py-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {procesando ? (
              <span>Restableciendo...</span>
            ) : (
              <span>Cambiar Contraseña</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-4 text-sm text-slate-400">
          ¿Te acordaste?{' '}
          <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-all">
            Inicia sesión aquí
          </Link>
        </div>

      </div>
    </div>
  );
};
