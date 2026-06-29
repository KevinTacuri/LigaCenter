import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

interface Props {
  children: React.ReactNode;
  roles?: string[]; // opcional: restringir por rol
}

export const RutaProtegida: React.FC<Props> = ({ children, roles }) => {
  const { usuario, cargando } = useAutenticacion();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

    const tokenGuardado = localStorage.getItem('token_autenticacion');
    if (!usuario && !tokenGuardado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;
    }
    if (!usuario && tokenGuardado) {
    // Hay token pero el contexto aún no hidrato el usuario — mostrar spinner
    return (
        <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
        </div>
    );
    }

  if (roles && roles.length > 0) {
    const tieneRol = roles.some(r => usuario.roles?.includes(r));
    if (!tieneRol) {
      return <Navigate to="/tablero" replace />;
    }
  }

  return <>{children}</>;
};