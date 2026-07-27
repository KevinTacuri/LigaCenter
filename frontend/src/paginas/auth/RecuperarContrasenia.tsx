import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { serviciosAutenticacion } from '../../servicios/api';
import { BotonTema } from '../../componentes/BotonTema';

// Importación de recursos
import logoImg from '../../assets/logo.svg';
import deportesFondo from '../../assets/deportes_fondo.png';

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
    <main className="font-sans min-h-screen text-on-surface flex items-center justify-center relative p-4 bg-surface-dim transition-colors duration-300">
      {/* Imagen de fondo de pantalla completo con brillo adaptativo */}
      <img
        alt="Estadio de fútbol"
        className="absolute inset-0 w-full h-full object-cover filter brightness-95 opacity-25 dark:brightness-[0.22] dark:opacity-100 pointer-events-none select-none z-0 transition-all duration-300"
        src={deportesFondo}
      />
      {/* Capa de degradado sutil según el tema */}
      <div className="absolute inset-0 bg-gradient-to-tr from-surface-dim via-surface/60 to-surface-dim dark:from-[#05060b] dark:via-[#090a14]/80 dark:to-[#05060b] z-0 pointer-events-none" />
      
      {/* Toast de Éxito Flotante */}
      {mensajeExito && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-primary-container border border-outline px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-sm font-bold">{mensajeExito}</span>
          </div>
        </div>
      )}

      {/* Barra superior de controles: Botón Regresar & Toggle de Tema */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-xs font-extrabold tracking-wide transition-colors cursor-pointer bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-outline shadow-2xs"
        >
          <span className="material-symbols-outlined text-base text-primary">arrow_back</span>
          <span>Atrás</span>
        </button>

        {/* Botón selector de Modo Claro / Oscuro */}
        <div className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-sm rounded-xl border border-outline p-0.5 shadow-2xs">
          <BotonTema />
        </div>
      </div>

      {/* Formulario en tarjeta flotante adaptativa */}
      <section className="relative z-10 w-full max-w-[390px] bg-surface/90 dark:bg-surface-dim/85 backdrop-blur-md border border-outline rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-scaleIn text-on-surface">
        {/* Logo y Encabezado */}
        <div className="text-center space-y-2">
          <header className="flex flex-col items-center justify-center gap-2">
            <img src={logoImg} className="w-16 h-16 object-contain" alt="Logo LigaCenter" />
            <span className="text-2xl font-black text-on-surface tracking-tight">
              Liga<span className="text-primary">Center</span>
            </span>
          </header>
          <p className="text-xs text-on-surface-variant font-extrabold uppercase tracking-wider">Recuperar Contraseña</p>
        </div>

        {errorLocal && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* Campo: Correo */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="flex items-center gap-2.5 border border-outline rounded-xl px-3.5 py-2.5 bg-surface text-on-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-lg select-none">mail</span>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none font-medium border-0 p-0 focus:ring-0"
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
            className="w-full bg-primary hover:opacity-95 text-white font-black py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {procesando ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Enviar Instrucciones</span>
              </>
            )}
          </button>
        </form>

        {urlDesarrollo && (
          <div className="p-4 rounded-2xl bg-surface border border-outline text-on-surface text-[11px] space-y-2 animate-fadeIn shadow-inner">
            <p className="font-bold flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-sm">construction</span>
              <span>Modo Desarrollo:</span>
            </p>
            <p className="leading-relaxed text-on-surface-variant font-medium">
              ¡Estás en modo de desarrollo local! Haz clic abajo para ir directo al formulario de cambio de clave:
            </p>
            <a
              href={urlDesarrollo}
              className="inline-flex w-full justify-center items-center gap-1.5 bg-primary hover:opacity-90 text-white font-black py-2.5 rounded-xl text-[10px] transition-all text-center shadow-xs cursor-pointer uppercase tracking-wider"
            >
              <span>Restablecer Contraseña Directo</span>
              <span>→</span>
            </a>
          </div>
        )}

        {/* Enlace Volver */}
        <div className="text-center text-xs pt-3 border-t border-outline">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-primary font-black hover:underline transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Volver al inicio de sesión</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 w-full hidden md:block z-10">
        <div className="flex justify-center items-center gap-3 text-on-surface-variant text-[10px] font-extrabold uppercase tracking-wider">
          <a href="#" className="hover:text-on-surface transition-colors">Privacidad</a>
          <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
          <a href="#" className="hover:text-on-surface transition-colors">Soporte</a>
          <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
          <span>© 2026 LigaCenter</span>
        </div>
      </footer>
    </main>
  );
};
