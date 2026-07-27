import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { BotonTema } from '../../componentes/BotonTema';

// Importación de recursos
import logoImg from '../../assets/logo.svg';
import deportesFondo from '../../assets/deportes_fondo.png';

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
    <main className="font-sans min-h-screen text-on-surface flex items-center justify-center relative p-4 bg-surface-dim transition-colors duration-300">
      {/* Imagen de fondo de pantalla completo con brillo adaptativo */}
      <img
        alt="Estadio de fútbol"
        className="absolute inset-0 w-full h-full object-cover filter brightness-95 opacity-25 dark:brightness-[0.22] dark:opacity-100 pointer-events-none select-none z-0 transition-all duration-300"
        src={deportesFondo}
      />
      {/* Capa de degradado sutil según el tema */}
      <div className="absolute inset-0 bg-gradient-to-tr from-surface-dim via-surface/60 to-surface-dim dark:from-[#05060b] dark:via-[#090a14]/80 dark:to-[#05060b] z-0 pointer-events-none" />
      
      {/* Barra superior de controles: Botón Regresar & Toggle de Tema */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          type="button"
          onClick={() => navegar('/')}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-xs font-extrabold tracking-wide transition-colors cursor-pointer bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-outline shadow-2xs"
        >
          <span className="material-symbols-outlined text-base text-primary">arrow_back</span>
          <span>Regresar al Inicio</span>
        </button>

        {/* Botón selector de Modo Claro / Oscuro */}
        <div className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-sm rounded-xl border border-outline p-0.5 shadow-2xs">
          <BotonTema />
        </div>
      </div>

      {/* Formulario en tarjeta flotante adaptativa (Glassmorphism Semántico) */}
      <section className="relative z-10 w-full max-w-[390px] bg-surface/90 dark:bg-surface-dim/85 backdrop-blur-md border border-outline rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-scaleIn text-on-surface">
        {/* Logo y Encabezado */}
        <div className="text-center space-y-2">
          <header className="flex flex-col items-center justify-center gap-2">
            <img src={logoImg} className="w-16 h-16 object-contain" alt="Logo LigaCenter" />
            <span className="text-2xl font-black text-on-surface tracking-tight">
              Liga<span className="text-primary">Center</span>
            </span>
          </header>
          <p className="text-xs text-on-surface-variant font-extrabold uppercase tracking-wider">Acceso de Usuarios</p>
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

          {/* Campo: Contraseña */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest" htmlFor="password">
                Contraseña
              </label>
              <Link
                to="/recuperar-contrasenia"
                className="text-[10px] text-primary hover:underline transition-colors font-black tracking-wider uppercase"
              >
                ¿Olvidaste tu clave?
              </Link>
            </div>
            <div className="flex items-center gap-2.5 border border-outline rounded-xl px-3.5 py-2.5 bg-surface text-on-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-lg select-none">lock</span>
              <input
                id="password"
                type={verContrasenia ? 'text' : 'password'}
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/60 outline-none font-medium border-0 p-0 focus:ring-0"
                placeholder="••••••••"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setVerContrasenia(!verContrasenia)}
                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
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
            className="w-full bg-primary hover:opacity-95 text-white font-black py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {procesando ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Ingresando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Enlace para Registro */}
        <div className="text-center text-xs pt-2 border-t border-outline">
          <p className="text-on-surface-variant font-semibold">
            ¿No tienes una cuenta?{' '}
            <Link to="/registro" className="text-primary font-black hover:underline ml-1">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 w-full hidden md:block z-10">
        <div className="flex justify-center items-center gap-3 text-on-surface-variant text-[10px] font-extrabold uppercase tracking-wider">
          <a href="#" className="hover:text-on-surface transition-colors">Privacidad</a>
          <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
          <a href="#" className="hover:text-on-surface transition-colors">Regulaciones</a>
          <span className="w-1.5 h-1.5 bg-outline rounded-full"></span>
          <span>© 2026 LigaCenter</span>
        </div>
      </footer>
    </main>
  );
};
