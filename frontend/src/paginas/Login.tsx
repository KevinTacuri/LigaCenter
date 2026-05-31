import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

export const Login: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const { iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();

  const imagenRef = useRef<HTMLImageElement | null>(null);

  // Efecto Parallax sutil en la imagen de fondo (idéntico al mockup)
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
      
      {/* Sección 1: Banner Izquierdo (Proporción áurea) */}
      <section className="bg-primary-container relative flex items-center justify-center overflow-hidden">
        <img
          ref={imagenRef}
          alt="Institución Deportiva"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-300 ease-out"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmQAm57BlNbbDwN2i6XcKFTXuv1qTEBkRKxmWkWt7REVKNpgizNc7yWFVnjazJItuqiOXiptjuFLjEdIO2zNVHV05-flSliAEXP7bhcG63XcRnmu1h2-gWCIjGF7FGR0CpG3sP_xJcWZk0zGJkdbbc-8sWo4g3DNyj-2XkGZWwjiSEb-clMnTr6biZ0b2-Fdttgg3oRrK0weUjDQ3vkUjjcfluCU6m3w5WL1LfnO76ZOxUQ34jNLhrgCp2rmIolTgeKQ2aJHASAyVj"
          style={{ transform: 'scale(1.1) translate(0px, 0px)' }}
        />
        <div className="relative z-10 p-12 text-center md:text-left max-w-2xl">
          <header className="flex items-center gap-3 mb-5 justify-center md:justify-start">
            <span className="material-symbols-outlined text-on-primary-container text-[48px]">account_balance</span>
            <h1 className="text-3xl font-extrabold text-on-primary-container tracking-tight">
              Iniciar Sesión
            </h1>
          </header>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-on-primary-container opacity-90">LigaCenter</p>
            <p className="text-base text-on-primary-container/80 leading-relaxed">
              Sistema integral para la gestión, seguimiento, rendimiento y control estadístico de campeonatos deportivos multidisciplinarios.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary-container to-transparent opacity-60"></div>
      </section>

      {/* Sección 2: Formulario Derecho (Proporción áurea) */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative bg-[#f4f6f7]">
        <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 rounded-xl shadow-md border border-outline-variant/60">
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-primary mb-1">Bienvenido</h2>
            <p className="text-sm text-on-surface-variant">Ingrese sus credenciales para continuar</p>
          </div>

          {errorLocal && (
            <div className="mb-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-5">
            {/* Campo: Correo */}
            <div className="space-y-1.5 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="w-full px-4 py-2.5 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="ejemplo@ligacenter.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5 transition-transform duration-200 focus-within:scale-[1.01]">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                  Contraseña
                </label>
                <Link
                  to="/recuperar-contrasenia"
                  className="text-xs text-on-primary-container hover:underline transition-all font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                disabled={procesando}
                className="w-full px-4 py-2.5 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="••••••••"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
              />
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-primary-container text-on-primary-container font-semibold py-3 rounded-lg shadow-xs hover:brightness-110 active:scale-[0.98] transition-all duration-150 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            <p className="text-sm text-on-surface-variant">
              ¿No tienes una cuenta? <br />
              <Link to="/registro" className="text-on-primary-container font-bold hover:underline">
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
        <button aria-label="Ayuda" className="bg-primary-container text-on-primary-container p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
        </button>
      </div>

    </main>
  );
};
