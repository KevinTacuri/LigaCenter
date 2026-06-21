import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import { ProveedorCampeonato } from './contexto/ContextoCampeonato';
import { Login } from './paginas/Login';
import { Registro } from './paginas/Registro';
import { Tablero } from './paginas/Tablero';
import { RecuperarContrasenia } from './paginas/RecuperarContrasenia';
import { RestablecerContrasenia } from './paginas/RestablecerContrasenia';
import { GestionUsuarios } from './paginas/GestionUsuarios';
import { GestionParticipantes } from './paginas/GestionParticipantes';
import { ProgramacionFixture } from './paginas/ProgramacionFixture';
import { MesaControl } from './paginas/MesaControl';
import { VisualizacionPublica } from './paginas/VisualizacionPublica';
import { SeleccionCampeonato } from './paginas/SeleccionCampeonato';
import { ConsolaSaaS } from './paginas/ConsolaSaaS';
import { Configuracion } from './paginas/Configuracion';
import { Perfil } from './paginas/Perfil';

const App: React.FC = () => {
  return (
    <ProveedorAutenticacion>
      <ProveedorCampeonato>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-contrasenia" element={<RecuperarContrasenia />} />
            <Route path="/restablecer-contrasenia" element={<RestablecerContrasenia />} />

            {/* Rutas Privadas / Protegidas */}
            <Route path="/seleccion-campeonato" element={<SeleccionCampeonato />} />
            <Route path="/tablero" element={<Tablero />} />
            <Route path="/tablero/usuarios" element={<GestionUsuarios />} />
            <Route path="/tablero/participantes" element={<GestionParticipantes />} />
            <Route path="/tablero/fixture" element={<ProgramacionFixture />} />
            <Route path="/tablero/mesa" element={<MesaControl />} />
            <Route path="/tablero/publico" element={<VisualizacionPublica />} />
            <Route path="/tablero/saas-admin" element={<ConsolaSaaS />} />
            <Route path="/tablero/configuracion" element={<Configuracion />} />
            <Route path="/tablero/perfil" element={<Perfil />} />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/tablero" replace />} />
          </Routes>
        </BrowserRouter>
      </ProveedorCampeonato>
    </ProveedorAutenticacion>
  );
};

export default App;
