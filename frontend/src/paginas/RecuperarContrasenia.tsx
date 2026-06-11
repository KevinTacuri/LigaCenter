import React, { useState, useEffect } from 'react';
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
    <main className="golden-grid font-sans min-h-screen text-on-surface select-none relative bg-surface">
      
      {/* Toast de Éxito Flotante */}
      {mensajeExito && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[#11131c] border border-slate-800 px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-sm font-semibold text-white">{mensajeExito}</span>
          </div>
        </div>
      )}

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

      {/* Sección 2: Formulario (Limpio y centrado sin tarjeta) */}
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
            <h2 className="text-xl font-bold text-white tracking-tight">Recuperar Contraseña</h2>
            <p className="text-xs text-slate-400">Ingrese su correo para recibir las instrucciones</p>
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

            {/* Botón Enviar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-primary hover:bg-[#99153c] text-white font-extrabold py-3.5 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {procesando ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Enviar Instrucciones</span>
              )}
            </button>
          </form>

          {urlDesarrollo && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2 animate-fadeIn">
              <p className="font-bold flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-base">construction</span>
                <span>Atajo de Desarrollo:</span>
              </p>
              <p className="leading-relaxed font-medium">
                ¡Estás en modo de desarrollo local! Haz clic en el botón de abajo para saltar directamente al formulario de cambio de contraseña:
              </p>
              <a
                href={urlDesarrollo}
                className="inline-flex w-full justify-center items-center gap-1.5 bg-primary hover:bg-[#99153c] text-white font-bold py-2.5 rounded-lg text-xs transition-all text-center shadow-xs cursor-pointer uppercase tracking-wider"
              >
                <span>Restablecer Contraseña Directo</span>
                <span>→</span>
              </a>
            </div>
          )}

          {/* Enlace Volver */}
          <div className="text-center text-xs pt-4 border-t border-slate-900/60">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-primary font-bold hover:underline transition-all"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>

        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 left-0 w-full hidden md:block">
          <div className="flex justify-center items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            <a href="#" className="hover:text-slate-400 transition-colors">Soporte</a>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            <span>© 2026 LigaCenter</span>
          </div>
        </footer>

      </section>

    </main>
  );
};
