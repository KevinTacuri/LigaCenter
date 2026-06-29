import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export const RutaProtegida: React.FC<Props> = ({ children, roles }) => {
  const { usuario } = useAutenticacion();

    if (!usuario) {
    return <Navigate to="/publico" replace />;
    }

  if (roles && roles.length > 0) {
    const tieneRol = roles.some(r => usuario.roles?.includes(r));
    if (!tieneRol) {
      return <Navigate to="/tablero" replace />;
    }
  }

  return <>{children}</>;
};