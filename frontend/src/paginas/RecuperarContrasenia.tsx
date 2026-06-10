import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { serviciosAutenticacion } from '../servicios/api';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import deportesFondo from '../assets/deportes_fondo.png';

export const RecuperarContrasenia: React.FC = () => {
  const [correo, setCorreo] = useState('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [urlDesarrollo, setUrlDesarrollo] = useState<string | null>(null);

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
    if (!correo) {
      setErrorLocal('Por favor ingresa tu correo electrónico.');
      return;
    }

    setProcesando(true);
    setErrorLocal(null);
    setMensajeExito(null);
    setUrlDesarrollo(null);

    try {
      const respuesta = await serviciosAutenticacion.solicitarRecuperacion(correo);
      if (respuesta.success) {
        setMensajeExito(respuesta.message || 'Enlace de recuperación enviado exitosamente.');
        setCorreo('');
        
        // Si el API retorna la URL de desarrollo, la guardamos
        if (respuesta.data && respuesta.data.dev_mode && respuesta.data.url) {
          setUrlDesarrollo(respuesta.data.url);
        }
      } else {
        setErrorLocal(respuesta.message || 'No se pudo enviar el enlace de recuperación.');
      }
    } catch (err: any) {
      setErrorLocal(err.response?.data?.message || 'Error al conectar con el servidor.');
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
            <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-sm font-semibold text-on-surface">{mensajeExito}</span>
          </div>
        </div>
      )}

      {/* Sección 1: Banner Izquierdo */}
      <section className="bg-primary relative flex items-center justify-center overflow-hidden">
        <img
          ref={imagenRef}
          alt="Campeonato Deportivo"
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay transition-transform duration-300 ease-out"
          src={deportesFondo}
          style={{ transform: 'scale(1.1) translate(0px, 0px)' }}
        />
        <div className="relative z-10 p-12 text-center md:text-left max-w-2xl">
          <header className="flex flex-col md:flex-row items-center gap-5 mb-6 justify-center md:justify-start">
            <div className="w-40 h-40 flex items-center justify-center">
              <img src={logoImg} className="w-full h-full object-contain" alt="Logo LigaCenter" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Recuperar Contraseña
              </h1>
              <span className="text-sm text-secondary font-bold tracking-widest uppercase mt-1 block">Gestión Deportiva</span>
            </div>
          </header>
          <div className="space-y-3">
            <p className="text-xl font-medium text-slate-200">LigaCenter</p>
            <p className="text-sm text-slate-300/90 leading-relaxed">
              Ingresa tu correo electrónico registrado y te enviaremos de inmediato un enlace seguro para restablecer tu contraseña.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary to-transparent opacity-60"></div>
      </section>

      {/* Sección 2: Formulario Derecho */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative bg-surface-container-low">
        <div className="w-full max-w-[460px] bg-surface-container-lowest p-6 sm:p-10 rounded-2xl shadow-md border border-outline-variant/40">
          
          <div className="mb-8">
            <h2 className="text-2.5xl font-black text-slate-900 mb-1">Recuperar Contraseña</h2>
            <p className="text-sm md:text-base text-on-surface-variant font-medium">
              Ingrese su correo electrónico registrado para enviarle las instrucciones de restablecimiento.
            </p>
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

            {/* Botón Enviar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-linear-to-r from-primary-container to-secondary text-white font-bold py-3.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-secondary/15 hover:brightness-105 active:scale-[0.98] transition-all duration-150 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base"
            >
              {procesando ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Enviar Instrucciones</span>
                </>
              )}
            </button>
          </form>

          {urlDesarrollo && (
            <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-950 text-sm space-y-2 animate-fadeIn">
              <p className="font-bold flex items-center gap-1 text-secondary">
                <span className="material-symbols-outlined text-base">construction</span>
                <span>Atajo de Desarrollo:</span>
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                ¡Estás en modo de desarrollo local! Haz clic en el botón de abajo para saltar directamente al formulario de cambio de contraseña sin tener que abrir logs:
              </p>
              <a
                href={urlDesarrollo}
                className="inline-flex w-full justify-center items-center gap-1.5 bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-sm transition-all text-center shadow-xs cursor-pointer"
              >
                <span>Restablecer Contraseña Directo</span>
                <span>→</span>
              </a>
            </div>
          )}

          {/* Enlace Volver */}
          <div className="mt-8 pt-6 border-t border-outline-variant/60 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-secondary font-bold hover:underline text-sm md:text-base transition-all"
            >
              <span className="material-symbols-outlined text-sm md:text-base">arrow_back</span>
              <span>Volver al inicio de sesión</span>
            </Link>
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
