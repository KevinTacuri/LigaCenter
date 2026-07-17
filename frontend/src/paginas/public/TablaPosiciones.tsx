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
import { registrarCanalCampeonato } from '../../servicios/echo';

export const TablaPosiciones: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const campeonatoParam = searchParams.get('campeonato');
  const [tabActiva, setTabActivaState] = useState<string>(tabParam || 'posiciones');

  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [standings, setStandings] = useState<PublicStanding[]>([]);
  const [disciplines, setDisciplines] = useState<PublicDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDiscipline, setSelectedDiscipline] = useState<number | null>(null);
  const [selectedChampionship, setSelectedChampionship] = useState<number | null>(
    campeonatoParam ? Number(campeonatoParam) : null
  );
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
    if (campeonatoParam && !selectedChampionship) {
      setSelectedChampionship(Number(campeonatoParam));
    }
  }, [campeonatoParam]);

  useEffect(() => {
    loadData();
  }, [tabActiva, selectedDiscipline, selectedChampionship]);

  useEffect(() => {
    if (!selectedChampionship) return;
    const canal = registrarCanalCampeonato(selectedChampionship);

    canal.listen('.MatchUpdated', () => {
      console.log('Cambio detectado en partido del campeonato por WebSocket. Recargando posiciones...');
      loadData();
    });

    return () => {
      canal.unsubscribe();
    };
  }, [selectedChampionship]);

  const setTabActiva = (tab: string) => {
    setSearchParams({ tab, campeonato: selectedChampionship?.toString() || '' });
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

      // Campeonatos
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
        console.log('Cargando standings para campeonato:', selectedChampionship);
        
        const [standingsRes, matchesRes] = await Promise.all([
          publicApi.getChampionshipStandingsComplete(selectedChampionship),
          publicApi.getChampionshipMatches(selectedChampionship)
        ]);

        console.log('Respuesta standings:', standingsRes.data);
        
        if (standingsRes.data.success) {
          const standingsData = standingsRes.data.data || [];
          console.log('Standings data:', standingsData);
          setStandings(standingsData);
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