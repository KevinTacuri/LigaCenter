import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Campeonato } from '../servicios/api';

interface PropiedadesContextoCampeonato {
  campeonatoActivo: Campeonato | null;
  seleccionarCampeonato: (camp: Campeonato) => void;
  limpiarCampeonato: () => void;
  cargandoCampeonato: boolean;
}

const ContextoCampeonato = createContext<PropiedadesContextoCampeonato | undefined>(undefined);

export const useCampeonato = () => {
  const contexto = useContext(ContextoCampeonato);
  if (!contexto) {
    throw new Error('useCampeonato debe usarse dentro de un ProveedorCampeonato');
  }
  return contexto;
};

export const ProveedorCampeonato: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campeonatoActivo, setCampeonatoActivo] = useState<Campeonato | null>(null);
  const [cargandoCampeonato, setCargandoCampeonato] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('campeonato_activo_id');
    const name = localStorage.getItem('campeonato_activo_name');
    const type = localStorage.getItem('campeonato_activo_type');

    if (id && name && type) {
      setCampeonatoActivo({
        id: parseInt(id),
        name,
        type: type as 'basico' | 'completo',
        status: localStorage.getItem('campeonato_activo_status') || 'creado'
      });
    }
    setCargandoCampeonato(false);
  }, []);

  const seleccionarCampeonato = (camp: Campeonato) => {
    setCampeonatoActivo(camp);
    localStorage.setItem('campeonato_activo_id', camp.id.toString());
    localStorage.setItem('campeonato_activo_name', camp.name);
    localStorage.setItem('campeonato_activo_type', camp.type);
    localStorage.setItem('campeonato_activo_status', camp.status);
  };

  const limpiarCampeonato = () => {
    setCampeonatoActivo(null);
    localStorage.removeItem('campeonato_activo_id');
    localStorage.removeItem('campeonato_activo_name');
    localStorage.removeItem('campeonato_activo_type');
    localStorage.removeItem('campeonato_activo_status');
  };

  return (
    <ContextoCampeonato.Provider
      value={{
        campeonatoActivo,
        seleccionarCampeonato,
        limpiarCampeonato,
        cargandoCampeonato
      }}
    >
      {children}
    </ContextoCampeonato.Provider>
  );
};
