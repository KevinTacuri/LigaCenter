import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import deportesFondo from '../assets/deportes_fondo.png';

export const Login: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const { iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();

  const imagenRef = useRef<HTMLImageElement | null>(null);

  // Parallax interactivo sutil en el fondo
  useEffect(() => {
    const manejarMovimientoMouse = (e: MouseEvent) => {
      if (imagenRef.current) {
        const x = (window.innerWidth - e.pageX * 2) / 120;
        const y = (window.innerHeight - e.pageY * 2) / 120;
        imagenRef.current.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;
      }
    };

    window.addEventListener('mousemove', manejarMovimientoMouse);
    return () => {
      window.removeEventListener('mousemove', manejarMovimientoMouse);
    };
  }, []);

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
    <main className="golden-grid font-sans min-h-screen text-on-surface select-none">
      
      {/* Sección 1: Banner Izquierdo con Parallax deportivo */}
      <section className="bg-primary relative flex items-center justify-center overflow-hidden">
        <img
          ref={imagenRef}
          alt="Campeonato Deportivo"
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay transition-transform duration-300 ease-out"
          src={deportesFondo}
          style={{ transform: 'scale(1.1) translate(0px, 0px)' }}
        />
        <div className="relative z-10 p-12 text-center md:text-left max-w-2xl">
          <header className="flex flex-col md:flex-row items-center gap-4 mb-6 justify-center md:justify-start">
            <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-center border border-white/20 shadow-xl shadow-black/10">
              <img src={logoImg} className="w-full h-full object-contain" alt="Logo LigaCenter" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                LigaCenter
              </h1>
              <span className="text-xs text-secondary font-bold tracking-widest uppercase">Gestión Deportiva</span>
            </div>
          </header>
          <div className="space-y-3">
            <p className="text-xl font-medium text-slate-200">El control total de tus campeonatos</p>
            <p className="text-sm text-slate-300/90 leading-relaxed">
              Administra equipos, inscripciones de jugadores, cronogramas de partidos, estadísticas en vivo y tablas de posiciones desde una plataforma unificada.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary to-transparent opacity-60"></div>
      </section>

      {/* Sección 2: Formulario Derecho */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative bg-[#f4f6f7]">
        <div className="w-full max-w-[460px] bg-surface-container-lowest p-6 sm:p-10 rounded-2xl shadow-md border border-outline-variant/60">
          
          <div className="mb-8 text-center">
            <h2 className="text-2.5xl font-black text-slate-900 mb-1">Bienvenido</h2>
            <p className="text-sm md:text-base text-on-surface-variant font-medium">Ingrese sus credenciales para continuar</p>
          </div>

          {errorLocal && (
            <div className="mb-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-6">
            {/* Campo: Correo */}
            <div className="space-y-2 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-sm font-bold text-slate-700 tracking-wide" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-hidden text-base shadow-xs transition-all"
                placeholder="ejemplo@ligacenter.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-2 transition-transform duration-200 focus-within:scale-[1.01]">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-slate-700 tracking-wide" htmlFor="password">
                  Contraseña
                </label>
                <Link
                  to="/recuperar-contrasenia"
                  className="text-xs md:text-sm text-secondary hover:underline transition-all font-bold"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                disabled={procesando}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-bright text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-hidden text-base shadow-xs transition-all"
                placeholder="••••••••"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
              />
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-linear-to-r from-secondary to-[#00a38f] text-white font-bold py-3.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-secondary/15 hover:brightness-105 active:scale-[0.98] transition-all duration-150 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
            >
              {procesando ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>

          {/* Enlace para Registro */}
          <div className="mt-8 pt-6 border-t border-outline-variant/60 text-center">
            <p className="text-sm md:text-base text-on-surface-variant font-medium">
              ¿No tienes una cuenta? <br />
              <Link to="/registro" className="text-secondary font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 left-0 w-full hidden md:block">
          <div className="flex justify-center items-center gap-3 text-on-surface-variant/60 text-xs">
            <a href="#" className="hover:underline">Privacidad</a>
            <span className="w-1.5 h-1.5 bg-outline-variant rounded-full"></span>
            <a href="#" className="hover:underline">Regulaciones</a>
            <span className="w-1.5 h-1.5 bg-outline-variant rounded-full"></span>
            <span>© 2026 LigaCenter</span>
          </div>
        </footer>

      </section>

      {/* FAB Flotante de Ayuda */}
      <div className="fixed bottom-6 right-6 z-50">
        <button aria-label="Ayuda" className="bg-primary-container text-white border border-white/10 p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
        </button>
      </div>

    </main>
  );
};
