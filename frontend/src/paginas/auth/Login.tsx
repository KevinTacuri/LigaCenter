import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';

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
    <main className="font-sans min-h-screen text-slate-100 flex items-center justify-center relative p-4 bg-[#05060b]">
      {/* Imagen de fondo de pantalla completo */}
      <img
        alt="Estadio de fútbol"
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] pointer-events-none select-none z-0"
        src={deportesFondo}
      />
      {/* Capa de degradado oscuro */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#05060b] via-[#090a14]/70 to-[#05060b] z-0" />
      
      {/* Botón Regresar */}
      <button
        type="button"
        onClick={() => navegar('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold tracking-wide transition-colors cursor-pointer z-20"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Regresar</span>
      </button>

      {/* Formulario en tarjeta flotante (Glassmorphism) */}
      <section className="relative z-10 w-full max-w-[380px] bg-slate-900/60 backdrop-blur-md border border-slate-800/85 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-scaleIn">
        {/* Logo y Encabezado */}
        <div className="text-center space-y-2">
          <header className="flex flex-col items-center justify-center gap-2">
            <img src={logoImg} className="w-16 h-16 object-contain" alt="Logo LigaCenter" />
            <span className="text-xl font-black text-white tracking-tight">
              Liga<span className="text-indigo-400">Center</span>
            </span>
          </header>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Acceso de Usuarios</p>
        </div>

        {errorLocal && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* Campo: Correo */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="flex items-center gap-2.5 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-lg select-none">mail</span>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 focus:ring-0"
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
                className="text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-extrabold tracking-wider uppercase font-sans"
              >
                ¿Olvidaste tu clave?
              </Link>
            </div>
            <div className="flex items-center gap-2.5 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-lg select-none">lock</span>
              <input
                id="password"
                type={verContrasenia ? 'text' : 'password'}
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 focus:ring-0"
                placeholder="••••••••"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setVerContrasenia(!verContrasenia)}
                className="text-slate-500 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
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

        {/* Enlace para Registro */}
        <div className="text-center text-xs pt-2">
          <p className="text-slate-400 font-medium">
            ¿No tienes una cuenta?{' '}
            <Link to="/registro" className="text-indigo-400 font-bold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </section>

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
    </main>
  );
};
