import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutPublico } from '../../componentes/public/LayoutPublico';
import type { 
  PublicMatch, 
  PublicStanding, 
  PublicChampionship, 
  PublicDiscipline 
} from '../../servicios/apiPublic';
import { publicApi } from '../../servicios/apiPublic';
import { Inicio } from '../landing/Inicio';

interface Props {
  esVistaAnonima?: boolean;
}

export const VisualizacionPublica: React.FC<Props> = ({ esVistaAnonima = true }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tabActiva, setTabActivaState] = useState<string>(tabParam || 'posiciones');

  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [standings, setStandings] = useState<PublicStanding[]>([]);
  const [championship, setChampionship] = useState<PublicChampionship | null>(null);
  const [disciplines, setDisciplines] = useState<PublicDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  const [selectedChampionship, setSelectedChampionship] = useState<number | null>(null);
  const [championships, setChampionships] = useState<PublicChampionship[]>([]);

  const handleDisciplineChange = (id: number | null) => {
    setSelectedDiscipline(id);
    setSelectedChampionship(null);
  };
  
  useEffect(() => {
    if (tabParam && tabParam !== tabActiva) {
      setTabActivaState(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    loadData();
  }, [tabActiva, selectedDiscipline, selectedChampionship]); 

  const setTabActiva = (tab: string) => {
    setSearchParams({ tab });
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Disciplinas
      const disciplinesRes = await publicApi.getDisciplines();
      if (disciplinesRes.data.success) {
        setDisciplines(disciplinesRes.data.data);
      }

      // Campeonatos - EXTRAER data.data correctamente
      const champRes = await publicApi.getChampionships({
        discipline_id: selectedDiscipline || undefined
      });
      if (champRes.data.success) {
        const champData = champRes.data.data?.data || [];
        setChampionships(champData);
        if (champData.length > 0 && !selectedChampionship) {
          setSelectedChampionship(champData[0].id);
        }
      }

      if (selectedChampionship) {
        const [standingsRes, matchesRes] = await Promise.all([
          publicApi.getChampionshipStandings(selectedChampionship),
          publicApi.getChampionshipMatches(selectedChampionship)
        ]);

        if (standingsRes.data.success) {
          setStandings(standingsRes.data.data);
        }
        if (matchesRes.data.success) {
          const matchesData = matchesRes.data.data?.data || [];
          setMatches(matchesData);
        }
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  return (
    <LayoutPublico onSearch={handleSearch}>
      <Inicio
        matches={matches}
        standings={standings}
        championships={championships}
        disciplines={disciplines}
        loading={loading}
        error={error}
        tabActiva={tabActiva}
        setTabActiva={setTabActiva}
        selectedDiscipline={selectedDiscipline}
        setSelectedDiscipline={handleDisciplineChange}
        selectedChampionship={selectedChampionship}
        setSelectedChampionship={setSelectedChampionship}
      />
    </LayoutPublico>
  );
};