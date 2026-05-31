import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

export const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const { registrar } = useAutenticacion();
  const navegar = useNavigate();

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
    <main className="golden-grid font-sans min-h-screen text-on-surface select-none">
      
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
              Crear Cuenta
            </h1>
          </header>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-on-primary-container opacity-90">LigaCenter</p>
            <p className="text-base text-on-primary-container/80 leading-relaxed">
              Únete hoy mismo para inscribir a tus equipos, consultar calendarios oficiales y hacer seguimiento en tiempo real de todos los campeonatos de tu institución.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-primary-container to-transparent opacity-60"></div>
      </section>

      {/* Sección 2: Formulario Derecho */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 relative bg-surface-container-low">
        <div className="w-full max-w-[480px] bg-surface-container-lowest p-8 rounded-xl shadow-md border border-outline-variant/40">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary mb-1">Registro de Usuario</h2>
            <p className="text-sm text-on-surface-variant">Complete sus datos para crear su cuenta pública.</p>
          </div>

          {errorLocal && (
            <div className="mb-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorLocal}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4">
            
            {/* Nombre Completo */}
            <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="name">
                Nombre Completo *
              </label>
              <input
                id="name"
                type="text"
                required
                disabled={procesando}
                className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="email">
                Correo Electrónico *
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={procesando}
                className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            {/* Fila: DNI y Teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="dni">
                  DNI / Cédula
                </label>
                <input
                  id="dni"
                  type="text"
                  disabled={procesando}
                  className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                  placeholder="12345678"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="phone">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  disabled={procesando}
                  className="w-full px-4 py-2 rounded border border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-sm shadow-xs transition-all"
                  placeholder="987654321"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1 transition-transform duration-200 focus-within:scale-[1.01]">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                Contraseña *
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

            {/* Botón Registrar */}
            <button
              type="submit"
              disabled={procesando}
              className="w-full bg-primary-container text-on-primary-container font-semibold py-3 rounded-lg shadow-xs hover:brightness-110 active:scale-[0.98] transition-all duration-150 mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="mt-6 pt-4 border-t border-outline-variant/60 text-center">
            <p className="text-sm text-on-surface-variant">
              ¿Ya tienes una cuenta? <br />
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
