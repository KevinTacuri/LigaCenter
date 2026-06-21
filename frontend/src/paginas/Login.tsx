import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import deportesFondo from '../assets/deportes_fondo.png';

export const Login: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [verContrasenia, setVerContrasenia] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const { iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !contrasenia) {
      setErrorLocal('Por favor ingresa tu usuario o correo electrónico y contraseña.');
      return;
    }

    setProcesando(true);
    setErrorLocal(null);

    try {
      const exito = await iniciarSesion(correo, contrasenia);
      if (exito) {
        navegar('/tablero');
      } else {
        setErrorLocal('Credenciales inválidas o cuenta desactivada.');
      }
    } catch (err: any) {
      setErrorLocal('Error al conectar con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main className="golden-grid font-sans min-h-screen text-on-surface select-none relative bg-surface">
      
      {/* Sección 1: Banner Izquierdo con imagen de estadio en escala de grises */}
      <section className="relative flex items-end p-8 md:p-16 overflow-hidden bg-black border-r border-slate-900/40">
        <img
          alt="Estadio de fútbol"
          className="absolute inset-0 w-full h-full object-cover filter grayscale brightness-[0.35] pointer-events-none select-none z-0"
          src={deportesFondo}
        />
        {/* Degradado para mejorar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b10] via-transparent to-[#0a0b10]/40 z-0" />
        
        {/* Contenido de texto en la esquina inferior izquierda */}
        <div className="relative z-10 text-left max-w-lg space-y-3">
          <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight leading-tight">
            Domina el juego con LigaCenter
          </h2>
          <p className="text-xs md:text-sm text-slate-350 leading-relaxed font-medium">
            La plataforma definitiva para la gestión de torneos de alto rendimiento. Diseñada por y para profesionales del deporte.
          </p>
        </div>
      </section>

      {/* Sección 2: Formulario de Acceso (Limpio y centrado sin tarjeta) */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[360px] space-y-7">
          
          {/* Logo y Encabezado del Mockup */}
          <div className="text-center space-y-1.5">
            <header className="flex flex-col items-center justify-center gap-3 mb-2">
              <img src={logoImg} className="w-24 h-24 object-contain" alt="Logo LigaCenter" />
              <span className="text-2.5xl font-black text-white tracking-tight">
                Liga<span className="text-primary">Center</span>
              </span>
            </header>
            <h2 className="text-xl font-bold text-white tracking-tight">Acceso Élite Deportiva</h2>
            <p className="text-xs text-slate-400">Inicia sesión para gestionar tus campeonatos</p>
          </div>

          {errorLocal && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-5">
            {/* Campo: Correo */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">mail</span>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={procesando}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                  placeholder="ejemplo@ligacenter.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="password">
                  Contraseña
                </label>
                <Link
                  to="/recuperar-contrasenia"
                  className="text-[9px] text-primary hover:text-indigo-300 hover:underline transition-colors font-extrabold tracking-wider uppercase"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">lock</span>
                <input
                  id="password"
                  type={verContrasenia ? 'text' : 'password'}
                  required
                  disabled={procesando}
                  className="w-full pl-11 pr-11 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                  placeholder="••••••••"
                  value={contrasenia}
                  onChange={(e) => setContrasenia(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasenia(!verContrasenia)}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {verContrasenia ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-primary hover:bg-[#99153c] text-white font-extrabold py-3.5 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Divisor O ACCEDE CON */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-900/60"></div>
            <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">O accede con</span>
            <div className="flex-grow border-t border-slate-900/60"></div>
          </div>

          {/* Botones de Social Login (Google y Apple) */}
          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-slate-350 hover:bg-[#11131c] hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.578 0-6.478-2.883-6.478-6.478s2.9-6.48 6.478-6.48c1.58 0 3.03.572 4.17 1.57l3.078-3.078C19.299 2.22 15.908 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.895 0 10.865-4.04 10.865-11.24 0-.668-.06-1.3-.18-1.955H12.24z"/>
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-slate-350 hover:bg-[#11131c] hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Enlace para Registro */}
          <div className="text-center text-xs pt-4">
            <p className="text-slate-400 font-medium">
              ¿No tienes una cuenta?{' '}
              <Link to="/registro" className="text-primary font-bold hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 left-0 w-full hidden md:block">
          <div className="flex justify-center items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            <a href="#" className="hover:text-slate-400 transition-colors">Regulaciones</a>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            <span>© 2026 LigaCenter</span>
          </div>
        </footer>

      </section>

    </main>
  );
};
