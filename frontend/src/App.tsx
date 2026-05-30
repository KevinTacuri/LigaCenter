import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import { Login } from './paginas/Login';
import { Registro } from './paginas/Registro';
import { Tablero } from './paginas/Tablero';
import { RecuperarContrasenia } from './paginas/RecuperarContrasenia';
import { RestablecerContrasenia } from './paginas/RestablecerContrasenia';

const App: React.FC = () => {
  return (
    <ProveedorAutenticacion>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasenia" element={<RecuperarContrasenia />} />
          <Route path="/restablecer-contrasenia" element={<RestablecerContrasenia />} />

          {/* Rutas Privadas / Protegidas */}
          <Route path="/tablero" element={<Tablero />} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/tablero" replace />} />
        </Routes>
      </BrowserRouter>
    </ProveedorAutenticacion>
  );
};

export default App;
