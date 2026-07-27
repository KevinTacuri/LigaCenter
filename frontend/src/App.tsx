import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contexto/ContextoAutenticacion';
import { ProveedorCampeonato, useCampeonato } from './contexto/ContextoCampeonato';
import { Login } from './paginas/auth/Login';
import { Registro } from './paginas/auth/Registro';
import { Tablero } from './paginas/dashboard/Tablero';
import { RecuperarContrasenia } from './paginas/auth/RecuperarContrasenia';
import { RestablecerContrasenia } from './paginas/auth/RestablecerContrasenia';
import { GestionUsuarios } from './paginas/organizador/GestionUsuarios';
import { GestionDelegados } from './paginas/organizador/GestionDelegados';
import { GestionParticipantes } from './paginas/organizador/GestionParticipantes';
import { ProgramacionFixture } from './paginas/organizador/ProgramacionFixture';
import { MesaControl } from './paginas/organizador/MesaControl';
import { EstadisticasOrganizador } from './paginas/organizador/EstadisticasOrganizador';
import { TablaPosiciones } from './paginas/public/TablaPosiciones';
import { ConsolaSaaS } from './paginas/dashboard/ConsolaSaaS';
import { Configuracion } from './paginas/dashboard/Configuracion';
import { Perfil } from './paginas/dashboard/Perfil';
import { PanelLateralCampeonatos } from './componentes/PanelLateralCampeonatos';

import { Toaster } from 'sileo';
import { ConfirmDialogProvider } from '@omit/react-confirm-dialog';
import { Nosotros } from './paginas/landing/Nosotros';
import { HomePublic } from './componentes/public/HomePublic';

import { PartidoDetalle } from './paginas/public/PartidoDetalle';
import { ResultadosBusqueda } from './paginas/public/ResultadosBusqueda';
import { EquipoDetalle } from './paginas/public/EquipoDetalle';
import { JugadorDetalle } from './paginas/public/JugadorDetalle';
import { CampeonatoDetalle } from './paginas/public/CampeonatoDetalle';

// Componente de Guardia para proteger rutas de Organizador/Admin
const RutaProtegidaOrganizador: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, tieneRol } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();

  const membresiaActiva = campeonatoActivo && usuario?.championship_memberships?.find(
    (m: any) => m.championship_id === campeonatoActivo.id
  );
  
  const esOrganizador = tieneRol('organizador') || tieneRol('administrador') || membresiaActiva?.role === 'organizer';
  const esDelegado = (membresiaActiva && membresiaActiva.role === 'team_delegate') || tieneRol('delegado') || tieneRol('delegado_equipo');
  const esDelegadoPuro = esDelegado && !esOrganizador;

  if (esDelegadoPuro) {
    return <Navigate to="/tablero" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [tema, setTema] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  );

  useEffect(() => {
    const sync = () => {
      setTema((localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
    };
    window.addEventListener('storage', sync);
    const intervalo = setInterval(sync, 300);
    return () => {
      window.removeEventListener('storage', sync);
      clearInterval(intervalo);
    };
  }, []);

  return (
    <ProveedorAutenticacion>
      <ProveedorCampeonato>
        <ConfirmDialogProvider defaultOptions={{
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
        }}>
          <Toaster position="top-center" theme={tema} />
          <BrowserRouter>
            <Routes>
              {/* 🔥 RUTA PRINCIPAL - Landing Page con Destacados */}
              <Route path="/" element={<HomePublic />} />

              {/* 📊 Vista de Posiciones y Partidos (cuando se necesita ver tabla) */}
              <Route path="/publico" element={<TablaPosiciones />} />

              {/* Rutas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/recuperar-contrasenia" element={<RecuperarContrasenia />} />
              <Route path="/restablecer-contrasenia" element={<RestablecerContrasenia />} />
              <Route path="/nosotros" element={<Nosotros />} />
              <Route path="/partidos/:id" element={<PartidoDetalle />} />
              <Route path="/buscar" element={<ResultadosBusqueda />} />
              <Route path="/equipos/:id" element={<EquipoDetalle />} />
              <Route path="/jugadores/:id" element={<JugadorDetalle />} />
              <Route path="/campeonatos/:id" element={<CampeonatoDetalle />} />

              {/* Rutas Privadas */}
              <Route path="/tablero" element={<Tablero />} />
              <Route path="/tablero/usuarios" element={<RutaProtegidaOrganizador><GestionUsuarios /></RutaProtegidaOrganizador>} />
              <Route path="/tablero/delegados" element={<RutaProtegidaOrganizador><GestionDelegados /></RutaProtegidaOrganizador>} />
              <Route path="/tablero/participantes" element={<GestionParticipantes />} />
              <Route path="/tablero/fixture" element={<ProgramacionFixture />} />
              <Route path="/tablero/mesa" element={<RutaProtegidaOrganizador><MesaControl /></RutaProtegidaOrganizador>} />
              <Route path="/tablero/publico" element={<TablaPosiciones />} />
              <Route path="/tablero/saas-admin" element={<RutaProtegidaOrganizador><ConsolaSaaS /></RutaProtegidaOrganizador>} />
              <Route path="/tablero/configuracion" element={<RutaProtegidaOrganizador><Configuracion /></RutaProtegidaOrganizador>} />
              <Route path="/tablero/perfil" element={<Perfil />} />
              <Route path="/tablero/estadisticas" element={<EstadisticasOrganizador />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <PanelLateralCampeonatos />
          </BrowserRouter>
        </ConfirmDialogProvider>
      </ProveedorCampeonato>
    </ProveedorAutenticacion>
  );
};

export default App;