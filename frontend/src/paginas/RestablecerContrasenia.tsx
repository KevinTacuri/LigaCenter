import React, { useState, useEffect, useRef } from 'react';
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

  const imagenRef = useRef<HTMLImageElement | null>(null);

  // Parallax sutil en la imagen al mover el mouse
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
    <main className="golden-grid font-sans min-h-screen text-on-surface select-none">
      
      {/* Toast de Éxito Flotante */}
      {mensajeExito && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-surface border border-outline-variant px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-sm font-semibold text-on-surface">{mensajeExito} Redirigiendo...</span>
          </div>
        </div>
      )}

      {/* Sección 1: Banner Izquierdo */}
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
              Nueva Contraseña
            </h1>
          </header>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-on-primary-container opacity-90">LigaCenter</p>
            <p className="text-base text-on-primary-container/80 leading-relaxed">
              Ingresa tu nueva clave de acceso para tu cuenta y recupera el acceso de inmediato a todas las funciones.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary-container to-transparent opacity-60"></div>
      </section>

      {/* Sección 2: Formulario Derecho */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative bg-surface-container-low">
        <div className="w-full max-w-[440px] bg-surface-container-lowest p-8 rounded-xl shadow-md border border-outline-variant/40">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary mb-1">Nueva Contraseña</h2>
            <p className="text-sm text-on-surface-variant">Ingrese sus nuevos datos para cambiar la clave de acceso.</p>
          </div>

          {errorLocal && (
            <div className="mb-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4">
            
            <input type="hidden" value={token} />

            {/* Campo: Correo */}
            <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="ejemplo@ligacenter.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            {/* Campo: Nueva Contraseña */}
            <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                Nueva Contraseña *
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={procesando}
                className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="Mínimo 8 caracteres"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
              />
            </div>

            {/* Campo: Confirmar Contraseña */}
            <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password_confirmation">
                Confirmar Contraseña *
              </label>
              <input
                id="password_confirmation"
                type="password"
                required
                disabled={procesando}
                className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="••••••••"
                value={confirmarContrasenia}
                onChange={(e) => setConfirmarContrasenia(e.target.value)}
              />
            </div>

            {/* Botón Cambiar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-primary-container text-on-primary-container font-semibold py-3 rounded-lg shadow-xs hover:brightness-110 active:scale-[0.98] transition-all duration-150 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Cambiando Clave...</span>
                </>
              ) : (
                <span>Cambiar Contraseña</span>
              )}
            </button>
          </form>

          {/* Enlace Volver */}
          <div className="mt-6 pt-4 border-t border-outline-variant/60 text-center">
            <p className="text-sm text-on-surface-variant">
              ¿Recordaste tu contraseña? <br />
              <Link to="/login" className="text-on-primary-container font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 left-0 w-full hidden lg:block">
          <div className="flex justify-center items-center gap-3 text-on-surface-variant/60 text-xs">
            <a href="#" className="hover:underline">Privacidad</a>
            <span className="w-1.5 h-1.5 bg-outline-variant rounded-full"></span>
            <a href="#" className="hover:underline">Soporte</a>
            <span className="w-1.5 h-1.5 bg-outline-variant rounded-full"></span>
            <span>© 2026 LigaCenter</span>
          </div>
        </footer>

      </section>

    </main>
  );
};
