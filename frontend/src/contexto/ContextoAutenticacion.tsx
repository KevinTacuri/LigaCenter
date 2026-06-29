import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Usuario, serviciosAutenticacion } from '../servicios/api';

// Interfaz para el estado de autenticación
interface PropiedadesContextoAutenticacion {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (email: string, contrasenia: string) => Promise<boolean>;
  registrar: (datos: { name: string; email: string; contrasenia: string; dni?: string; phone?: string }) => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  tieneRol: (rol: string) => boolean;
  tienePermiso: (permiso: string) => boolean;
  recargarUsuario: () => Promise<void>;
}

// Creación del Contexto
const ContextoAutenticacion = createContext<PropiedadesContextoAutenticacion | undefined>(undefined);

// Hook personalizado para consumir el contexto fácilmente
export const useAutenticacion = () => {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('useAutenticacion debe usarse dentro de un ProveedorAutenticacion');
  }
  return contexto;
};

// Proveedor de Contexto
export const ProveedorAutenticacion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token_autenticacion'));
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para verificar la sesión al cargar la app
  useEffect(() => {
    const verificarSesion = async () => {
      const tokenGuardado = localStorage.getItem('token_autenticacion');
      if (tokenGuardado) {
        try {
          const respuesta = await serviciosAutenticacion.obtenerUsuarioAutenticado();
          if (respuesta.success) {
            setUsuario(respuesta.data);
          } else {
            localStorage.removeItem('token_autenticacion');
            setToken(null);
          }
        } catch (e) {
          localStorage.removeItem('token_autenticacion');
          setToken(null);
        }
      }
      setCargando(false);
    };
    verificarSesion();
  }, []); // ← sin dependencias: solo al montar

  // Función para iniciar sesión
  const iniciarSesion = async (email: string, contrasenia: string): Promise<boolean> => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await serviciosAutenticacion.iniciarSesion({ email, password: contrasenia });
      if (respuesta.success && respuesta.data) {
        const { user, token: tokenApi } = respuesta.data;
        // Limpiar campeonato previo para evitar inconsistencia de sesión
        localStorage.removeItem('campeonato_activo_id');
        localStorage.removeItem('campeonato_activo_name');
        localStorage.removeItem('campeonato_activo_type');
        localStorage.removeItem('campeonato_activo_status');
        sessionStorage.removeItem('vista_publica_activa');
        
        localStorage.setItem('token_autenticacion', tokenApi);
        setToken(tokenApi);
        setUsuario(user);
        setCargando(false);
        return true;
      }
      setError(respuesta.message || 'Error al iniciar sesión');
      setCargando(false);
      return false;
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || 'Error de conexión con el servidor');
      setCargando(false);
      return false;
    }
  };

  // Función para registrarse
  const registrar = async (datos: {
    name: string;
    email: string;
    contrasenia: string;
    dni?: string;
    phone?: string;
  }): Promise<boolean> => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await serviciosAutenticacion.registrar({
        name: datos.name,
        email: datos.email,
        password: datos.contrasenia,
        password_confirmation: datos.contrasenia, // Requerido por la validación de Laravel
        dni: datos.dni,
        phone: datos.phone,
      });

      if (respuesta.success && respuesta.data) {
        const { user, token: tokenApi } = respuesta.data;
        // Limpiar campeonato previo para evitar inconsistencia de sesión
        localStorage.removeItem('campeonato_activo_id');
        localStorage.removeItem('campeonato_activo_name');
        localStorage.removeItem('campeonato_activo_type');
        localStorage.removeItem('campeonato_activo_status');

        localStorage.setItem('token_autenticacion', tokenApi);
        setToken(tokenApi);
        setUsuario(user);
        setCargando(false);
        return true;
      }
      setError(respuesta.message || 'Error al registrar el usuario');
      setCargando(false);
      return false;
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al procesar el registro');
      setCargando(false);
      return false;
    }
  };

  // Función para cerrar sesión
  const cerrarSesion = async (): Promise<void> => {
    setCargando(true);
    try {
      await serviciosAutenticacion.cerrarSesion();
    } catch (e) {
      console.error('Error cerrando sesión en servidor, cerrando localmente:', e);
    } finally {
      localStorage.removeItem('token_autenticacion');
      localStorage.removeItem('campeonato_activo_id');
      localStorage.removeItem('campeonato_activo_name');
      localStorage.removeItem('campeonato_activo_type');
      localStorage.removeItem('campeonato_activo_status');
      setToken(null);
      setUsuario(null);
      setCargando(false);
      // Redirigir y forzar recarga para limpiar todos los contextos en memoria
      window.location.href = '/login';
    }
  };


  // Verificar si el usuario tiene un rol determinado
  const tieneRol = (rol: string): boolean => {
    if (!usuario || !usuario.roles) return false;
    return usuario.roles.includes(rol);
  };

  // Verificar si el usuario tiene un permiso determinado
  const tienePermiso = (permiso: string): boolean => {
    if (!usuario || !usuario.permissions) return false;
    return usuario.permissions.includes(permiso);
  };

  // Recargar la información del usuario autenticado
  const recargarUsuario = async (): Promise<void> => {
    try {
      const respuesta = await serviciosAutenticacion.obtenerUsuarioAutenticado();
      if (respuesta.success) {
        setUsuario(respuesta.data);
      }
    } catch (e) {
      console.error('Error al recargar el usuario:', e);
    }
  };

  return (
    <ContextoAutenticacion.Provider
      value={{
        usuario,
        token,
        cargando,
        error,
        iniciarSesion,
        registrar,
        cerrarSesion,
        tieneRol,
        tienePermiso,
        recargarUsuario,
      }}
    >
      {children}
    </ContextoAutenticacion.Provider>
  );
};
