import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import deportesFondo from '../assets/deportes_fondo.png';

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

      {/* Sección 2: Formulario de Registro (Limpio y centrado sin tarjeta) */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-[380px] space-y-7">
          
          {/* Logo y Encabezado del Mockup */}
          <div className="text-center space-y-1.5">
            <header className="flex flex-col items-center justify-center gap-3 mb-2">
              <img src={logoImg} className="w-24 h-24 object-contain" alt="Logo LigaCenter" />
              <span className="text-2.5xl font-black text-white tracking-tight">
                Liga<span className="text-primary">Center</span>
              </span>
            </header>
            <h2 className="text-xl font-bold text-white tracking-tight">Registro de Usuario</h2>
            <p className="text-xs text-slate-400">Complete sus datos para crear su cuenta pública</p>
          </div>

          {errorLocal && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4">
            
            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="name">
                Nombre Completo *
              </label>
              <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">person</span>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={procesando}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="email">
                Correo Electrónico *
              </label>
              <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">mail</span>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={procesando}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                  placeholder="correo@ejemplo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>

            {/* Fila: DNI y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="dni">
                  DNI / Cédula
                </label>
                <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                  <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">badge</span>
                  <input
                    id="dni"
                    type="text"
                    disabled={procesando}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                    placeholder="12345678"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="phone">
                  Teléfono
                </label>
                <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                  <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">phone</span>
                  <input
                    id="phone"
                    type="tel"
                    disabled={procesando}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                    placeholder="987654321"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest" htmlFor="password">
                Contraseña *
              </label>
              <div className="relative flex items-center text-slate-400 focus-within:text-white transition-colors">
                <span className="material-symbols-outlined absolute left-3.5 text-lg pointer-events-none">lock</span>
                <input
                  id="password"
                  type={verContrasenia ? 'text' : 'password'}
                  required
                  disabled={procesando}
                  className="w-full pl-11 pr-11 py-3 rounded-lg border border-slate-800 bg-[#0c0e17] text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all placeholder-slate-650 font-medium"
                  placeholder="Mínimo 8 caracteres"
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

            {/* Botón Registrar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-primary hover:bg-[#99153c] text-white font-extrabold py-3.5 rounded-lg shadow-md active:scale-[0.98] transition-all duration-200 mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
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
          <div className="text-center text-xs pt-4 border-t border-slate-900/60">
            <p className="text-slate-400 font-medium">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
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
