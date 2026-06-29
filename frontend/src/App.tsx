import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contexto/ContextoAutenticacion';
import { ProveedorCampeonato, useCampeonato } from './contexto/ContextoCampeonato';
import { Login } from './paginas/Login';
import { Registro } from './paginas/Registro';
import { Tablero } from './paginas/Tablero';
import { RecuperarContrasenia } from './paginas/RecuperarContrasenia';
import { RestablecerContrasenia } from './paginas/RestablecerContrasenia';
import { GestionUsuarios } from './paginas/GestionUsuarios';
import { GestionDelegados } from './paginas/GestionDelegados';
import { GestionParticipantes } from './paginas/GestionParticipantes';
import { ProgramacionFixture } from './paginas/ProgramacionFixture';
import { MesaControl } from './paginas/MesaControl';
import { VisualizacionPublica } from './paginas/VisualizacionPublica';
import { ConsolaSaaS } from './paginas/ConsolaSaaS';
import { Configuracion } from './paginas/Configuracion';
import { Perfil } from './paginas/Perfil';
import { PanelLateralCampeonatos } from './componentes/PanelLateralCampeonatos';

import { Toaster } from 'sileo';
import { ConfirmDialogProvider } from '@omit/react-confirm-dialog';

import { RutaProtegida } from './componentes/RutaProtegida';

// Landing pages
import { Inicio }        from './paginas/landing/Inicio';
import { Nosotros }      from './paginas/landing/Nosotros';
import { Logros }        from './paginas/landing/Logros';
import { Tecnologias }   from './paginas/landing/Tecnologias';
import { Documentacion } from './paginas/landing/Documentacion';

// Componente que bloquea el render hasta que ambos contextos estén listos
const AppLista: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cargando: cargandoAuth } = useAutenticacion();
  const { cargandoCampeonato } = useCampeonato();

  if (cargandoAuth || cargandoCampeonato) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ProveedorAutenticacion>
      <ProveedorCampeonato>
        <ConfirmDialogProvider defaultOptions={{
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
        }}>
          <Toaster position="top-center" />
          <BrowserRouter>
            <AppLista>
              <Routes>
                {/* Rutas Públicas — sin autenticación */}
                <Route path="/"                       element={<Navigate to="/publico" replace />} />
                <Route path="/publico"                element={<VisualizacionPublica esVistaAnonima={true} />} />
                <Route path="/nosotros"               element={<Nosotros />} />
                <Route path="/logros"                 element={<Logros />} />
                <Route path="/tecnologias"            element={<Tecnologias />} />
                <Route path="/documentacion"          element={<Documentacion />} />
                <Route path="/login"                  element={<Login />} />
                <Route path="/registro"               element={<Registro />} />
                <Route path="/recuperar-contrasenia"  element={<RecuperarContrasenia />} />
                <Route path="/restablecer-contrasenia" element={<RestablecerContrasenia />} />

                {/* Rutas Protegidas — requieren sesión */}
                <Route path="/tablero" element={
                  <RutaProtegida><Tablero /></RutaProtegida>
                } />
                <Route path="/tablero/usuarios" element={
                  <RutaProtegida roles={['administrador', 'organizador']}><GestionUsuarios /></RutaProtegida>
                } />
                <Route path="/tablero/delegados" element={
                  <RutaProtegida><GestionDelegados /></RutaProtegida>
                } />
                <Route path="/tablero/participantes" element={
                  <RutaProtegida><GestionParticipantes /></RutaProtegida>
                } />
                <Route path="/tablero/fixture" element={
                  <RutaProtegida><ProgramacionFixture /></RutaProtegida>
                } />
                <Route path="/tablero/mesa" element={
                  <RutaProtegida><MesaControl /></RutaProtegida>
                } />
                <Route path="/tablero/publico" element={
                  <RutaProtegida><VisualizacionPublica /></RutaProtegida>
                } />
                <Route path="/tablero/saas-admin" element={
                  <RutaProtegida roles={['administrador']}><ConsolaSaaS /></RutaProtegida>
                } />
                <Route path="/tablero/configuracion" element={
                  <RutaProtegida><Configuracion /></RutaProtegida>
                } />
                <Route path="/tablero/perfil" element={
                  <RutaProtegida><Perfil /></RutaProtegida>
                } />

                <Route path="*" element={<Navigate to="/publico" replace />} />
              </Routes>
              <PanelLateralCampeonatos />
            </AppLista>
          </BrowserRouter>
        </ConfirmDialogProvider>
      </ProveedorCampeonato>
    </ProveedorAutenticacion>
  );
};

export default App;