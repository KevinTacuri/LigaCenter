import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';

// Importación de recursos
import logoImg from '../../assets/logo.svg';
import deportesFondo from '../../assets/deportes_fondo.png';

export const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [verContrasenia, setVerContrasenia] = useState(false);
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const { registrar } = useAutenticacion();
  const navegar = useNavigate();

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !correo || !contrasenia) {
      setErrorLocal('Nombre, Correo y Contraseña son campos obligatorios.');
      return;
    }

    if (contrasenia.length < 8) {
      setErrorLocal('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setProcesando(true);
    setErrorLocal(null);

    try {
      const exito = await registrar({
        name: nombre,
        email: correo,
        contrasenia: contrasenia,
        dni: dni || undefined,
        phone: telefono || undefined,
      });

      if (exito) {
        navegar('/tablero');
      } else {
        setErrorLocal('Error al registrar. El correo o DNI ya pueden estar en uso.');
      }
    } catch (err: any) {
      setErrorLocal('Ocurrió un error inesperado al conectar con el servidor.');
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
        onClick={() => navegar('/login')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold tracking-wide transition-colors cursor-pointer z-20"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Regresar al Login</span>
      </button>

      {/* Formulario en tarjeta flotante (Glassmorphism) */}
      <section className="relative z-10 w-full max-w-[420px] bg-slate-900/60 backdrop-blur-md border border-slate-800/85 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-5 animate-scaleIn my-8">
        {/* Logo y Encabezado */}
        <div className="text-center space-y-1.5">
          <header className="flex flex-col items-center justify-center gap-2">
            <img src={logoImg} className="w-14 h-14 object-contain" alt="Logo LigaCenter" />
            <span className="text-lg font-black text-white tracking-tight">
              Liga<span className="text-indigo-400">Center</span>
            </span>
          </header>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Crear Nueva Cuenta</p>
        </div>

        {errorLocal && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-4">
          
          {/* Nombre Completo */}
          <div className="space-y-1">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="name">
              Nombre Completo *
            </label>
            <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-lg select-none">person</span>
              <input
                id="name"
                type="text"
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 focus:ring-0"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="email">
              Correo Electrónico *
            </label>
            <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-lg select-none">mail</span>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 focus:ring-0"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
          </div>

          {/* Fila: DNI y Teléfono */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="dni">
                DNI / Cédula
              </label>
              <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-lg select-none">badge</span>
                <input
                  id="dni"
                  type="text"
                  disabled={procesando}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 focus:ring-0 w-full"
                  placeholder="12345678"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="phone">
                Teléfono
              </label>
              <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
                <span className="material-symbols-outlined text-slate-400 text-lg select-none">phone</span>
                <input
                  id="phone"
                  type="tel"
                  disabled={procesando}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 w-full"
                  placeholder="987654321"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="password">
              Contraseña *
            </label>
            <div className="flex items-center gap-2 border border-slate-800 rounded-lg px-3 py-2 bg-[#090a10]/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-lg select-none">lock</span>
              <input
                id="password"
                type={verContrasenia ? 'text' : 'password'}
                required
                disabled={procesando}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-hidden font-medium border-0 p-0 focus:ring-0"
                placeholder="Mínimo 8 caracteres"
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

          {/* Botón Registrar */}
          <button
            type="submit"
            disabled={procesando}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {procesando ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span>Registrando...</span>
              </>
            ) : (
              <span>Crear Cuenta</span>
            )}
          </button>
        </form>

        {/* Enlace Volver */}
        <div className="text-center text-xs pt-3 border-t border-slate-800/80">
          <p className="text-slate-400 font-medium">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </section>

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
    </main>
  );
};
