import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { BarraLateral } from '../componentes/BarraLateral';
import { 
  serviciosParticipantes, 
  serviciosCampeonatos, 
  serviciosFixture 
} from '../servicios/api';
import { sileo } from 'sileo';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import { CabeceraEstandar } from '../componentes/CabeceraEstandar';

const PASOS_TORNEO = [
  { step: '1', title: 'Disciplinas y Categorías', desc: 'Registra deportes, define categorías y configura el formato de competencia.', icon: 'sports' },
  { step: '2', title: 'Equipos y Jugadores', desc: 'Inscribe equipos por categoría y agrega jugadores con dorsal validado.', icon: 'groups' },
  { step: '3', title: 'Generar Fixture', desc: 'Genera el fixture Round Robin o eliminatoria automático por disciplina y categoría.', icon: 'calendar_today' },
  { step: '4', title: 'Programar Fechas y Canchas', desc: 'Registra escenarios y asigna horarios a cada partido del fixture.', icon: 'schedule' },
  { step: '5', title: 'Mesa de Control (Planillas)', desc: 'Registra goles, tarjetas e incidencias durante los partidos en tiempo real.', icon: 'edit_note' },
  { step: '6', title: 'Resultados y Tabla de Posiciones', desc: 'Consulta posiciones, rankings y sanciones actualizados al instante.', icon: 'leaderboard' },
];

export const Tablero: React.FC = () => {
  const { usuario, cargando, tienePermiso, tieneRol } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();
  const navegar = useNavigate();
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [simulando, setSimulando] = useState(false);

  const handleSimularMundial = async () => {
    setSimulando(true);
    sileo.info({ title: 'Simulación Mundial', description: 'Iniciando simulación de la Copa Mundial...' });

    try {
      let activeChampionshipId: number;
      
      if (campeonatoActivo) {
        activeChampionshipId = campeonatoActivo.id;
        sileo.info({ title: 'Campeonato Activo', description: `Inyectando datos en: ${campeonatoActivo.name}` });
      } else {
        const resChamps = await serviciosCampeonatos.obtenerCampeonatos();
        const mundialExistente = resChamps.data?.find(c => c.name.toLowerCase().includes('copa mundial'));
        
        if (mundialExistente) {
          activeChampionshipId = mundialExistente.id;
          sileo.info({ title: 'Campeonato Encontrado', description: 'Usando campeonato existente.' });
        } else {
          const resChamp = await serviciosCampeonatos.crearCampeonato({
            name: 'Copa Mundial FIFA 2026',
            type: 'completo'
          });
          if (resChamp.success && resChamp.data) {
            activeChampionshipId = resChamp.data.id;
            sileo.success({ title: 'Campeonato Creado', description: 'Copa Mundial FIFA 2026 creado con éxito.' });
          } else {
            throw new Error('No se pudo crear el campeonato.');
          }
        }

        localStorage.setItem('campeonato_activo_id', activeChampionshipId.toString());
        localStorage.setItem('campeonato_activo_name', 'Copa Mundial FIFA 2026');
        localStorage.setItem('campeonato_activo_type', 'completo');
        localStorage.setItem('campeonato_activo_status', 'creado');
      }

      // 2. Crear o buscar disciplina "Fútbol"
      let disciplineId: number;
      const resDiscs = await serviciosParticipantes.obtenerDisciplinas();
      const discExistente = resDiscs.data?.find(d => d.name.toLowerCase().includes('fútbol') || d.name.toLowerCase().includes('futbol'));
      
      if (discExistente) {
        disciplineId = discExistente.id;
      } else {
        const resDisc = await serviciosParticipantes.crearDisciplina({ name: 'Fútbol' });
        if (resDisc.success && resDisc.data) {
          disciplineId = resDisc.data.id;
        } else {
          throw new Error('No se pudo crear la disciplina Fútbol.');
        }
      }

      // 2.5 Asociar la disciplina al campeonato actual
      let champDisciplineId: number;
      const resChampDiscs = await serviciosParticipantes.obtenerDisciplinasCampeonato(activeChampionshipId);
      const champDiscExistente = resChampDiscs.data?.find(cd => cd.discipline_id === disciplineId);

      if (champDiscExistente) {
        champDisciplineId = champDiscExistente.id;
      } else {
        const resCD = await serviciosParticipantes.agregarDisciplinaCampeonato(activeChampionshipId, {
          discipline_id: disciplineId,
          specific_rules: 'Reglas de juego del mundial: 90 minutos de juego, 5 cambios.'
        });
        if (resCD.success && resCD.data) {
          champDisciplineId = resCD.data.id;
        } else {
          throw new Error('No se pudo asociar la disciplina Fútbol al campeonato.');
        }
      }

      // 3. Crear o buscar categoría "Selecciones Libres"
      let categoryId: number;
      const resCats = await serviciosParticipantes.obtenerCategorias(champDisciplineId);
      const catExistente = resCats.data?.find(c => 
        c.championship_discipline_id === champDisciplineId && 
        (c.name.toLowerCase().includes('selecciones') || c.name.toLowerCase().includes('libres'))
      );

      if (catExistente) {
        categoryId = catExistente.id;
      } else {
        const resCat = await serviciosParticipantes.crearCategoria(champDisciplineId, {
          name: 'Selecciones Libres',
          age_min: 16,
          age_max: 45,
          gender_type: 'Masculino',
          format: 'liga',
          format_settings: {}
        });
        if (resCat.success && resCat.data) {
          categoryId = resCat.data.id;
        } else {
          throw new Error('No se pudo crear la categoría Selecciones Libres.');
        }
      }

      // 4. Crear o buscar escenario "Estadio Lusail"
      let venueId: number;
      const resVenues = await serviciosFixture.obtenerEscenarios();
      const venueExistente = resVenues.data?.find(v => v.name.toLowerCase().includes('lusail'));
      
      if (venueExistente) {
        venueId = venueExistente.id;
      } else {
        const resVenue = await serviciosFixture.crearEscenario({
          name: 'Estadio Lusail',
          venue_type: 'cancha',
          location: 'Doha, Qatar',
          capacity: 80000,
          is_available: true
        });
        if (resVenue.success && resVenue.data) {
          venueId = resVenue.data.id;
        } else {
          throw new Error('No se pudo crear el Estadio Lusail.');
        }
      }

      // 5. Crear Selecciones y Jugadores
      const selecciones = [
        {
          nombre: 'Argentina',
          representante: 'Lionel Scaloni',
          jugadores: [
            { nombre: 'Lionel Messi', dorsal: 10, edad: 38, posicion: 'Delantero' },
            { nombre: 'Angel Di Maria', dorsal: 11, edad: 37, posicion: 'Delantero' },
            { nombre: 'Alexis Mac Allister', dorsal: 20, edad: 27, posicion: 'Mediocampista' },
            { nombre: 'Rodrigo De Paul', dorsal: 7, edad: 31, posicion: 'Mediocampista' },
            { nombre: 'Lautaro Martinez', dorsal: 22, edad: 28, posicion: 'Delantero' },
            { nombre: 'Cristian Romero', dorsal: 13, edad: 27, posicion: 'Defensa' },
            { nombre: 'Emiliano Martinez', dorsal: 23, edad: 33, posicion: 'Arquero' },
          ]
        },
        {
          nombre: 'Francia',
          representante: 'Didier Deschamps',
          jugadores: [
            { nombre: 'Kylian Mbappe', dorsal: 10, edad: 27, posicion: 'Delantero' },
            { nombre: 'Antoine Griezmann', dorsal: 7, edad: 34, posicion: 'Delantero' },
            { nombre: 'Ousmane Dembele', dorsal: 11, edad: 28, posicion: 'Delantero' },
            { nombre: 'Aurelien Tchouameni', dorsal: 8, edad: 25, posicion: 'Mediocampista' },
            { nombre: 'Adrien Rabiot', dorsal: 14, edad: 30, posicion: 'Mediocampista' },
            { nombre: 'Raphael Varane', dorsal: 4, edad: 32, posicion: 'Defensa' },
            { nombre: 'Hugo Lloris', dorsal: 1, edad: 39, posicion: 'Arquero' },
          ]
        },
        {
          nombre: 'Brasil',
          representante: 'Dorival Júnior',
          jugadores: [
            { nombre: 'Neymar Jr', dorsal: 10, edad: 34, posicion: 'Delantero' },
            { nombre: 'Vinicius Jr', dorsal: 7, edad: 25, posicion: 'Delantero' },
            { nombre: 'Rodrygo Goes', dorsal: 11, edad: 25, posicion: 'Delantero' },
            { nombre: 'Casemiro Santos', dorsal: 5, edad: 34, posicion: 'Mediocampista' },
            { nombre: 'Lucas Paqueta', dorsal: 8, edad: 28, posicion: 'Mediocampista' },
            { nombre: 'Thiago Silva', dorsal: 3, edad: 41, posicion: 'Defensa' },
            { nombre: 'Alisson Becker', dorsal: 1, edad: 33, posicion: 'Arquero' },
          ]
        },
        {
          nombre: 'Portugal',
          representante: 'Roberto Martínez',
          jugadores: [
            { nombre: 'Cristiano Ronaldo', dorsal: 7, edad: 41, posicion: 'Delantero' },
            { nombre: 'Bruno Fernandes', dorsal: 8, edad: 31, posicion: 'Mediocampista' },
            { nombre: 'Bernardo Silva', dorsal: 10, edad: 31, posicion: 'Mediocampista' },
            { nombre: 'Joao Felix', dorsal: 11, edad: 26, posicion: 'Delantero' },
            { nombre: 'Ruben Dias', dorsal: 4, edad: 28, posicion: 'Defensa' },
            { nombre: 'Diogo Costa', dorsal: 22, edad: 26, posicion: 'Arquero' },
            { nombre: 'Rafael Leao', dorsal: 17, edad: 26, posicion: 'Delantero' },
          ]
        },
        {
          nombre: 'España',
          representante: 'Luis de la Fuente',
          jugadores: [
            { nombre: 'Pedri Gonzalez', dorsal: 20, edad: 23, posicion: 'Mediocampista' },
            { nombre: 'Gavi Paez', dorsal: 9, edad: 21, posicion: 'Mediocampista' },
            { nombre: 'Alvaro Morata', dorsal: 7, edad: 33, posicion: 'Delantero' },
            { nombre: 'Nico Williams', dorsal: 17, edad: 23, posicion: 'Delantero' },
            { nombre: 'Lamine Yamal', dorsal: 19, edad: 18, posicion: 'Delantero' },
            { nombre: 'Rodri Hernandez', dorsal: 16, edad: 29, posicion: 'Mediocampista' },
            { nombre: 'Unai Simon', dorsal: 23, edad: 28, posicion: 'Arquero' },
          ]
        },
        {
          nombre: 'Alemania',
          representante: 'Julian Nagelsmann',
          jugadores: [
            { nombre: 'Jamal Musiala', dorsal: 10, edad: 23, posicion: 'Mediocampista' },
            { nombre: 'Florian Wirtz', dorsal: 17, edad: 23, posicion: 'Mediocampista' },
            { nombre: 'Kai Havertz', dorsal: 7, edad: 26, posicion: 'Delantero' },
            { nombre: 'Ilkay Gundogan', dorsal: 21, edad: 35, posicion: 'Mediocampista' },
            { nombre: 'Joshua Kimmich', dorsal: 6, edad: 31, posicion: 'Defensa' },
            { nombre: 'Antonio Rudiger', dorsal: 2, edad: 33, posicion: 'Defensa' },
            { nombre: 'Manuel Neuer', dorsal: 1, edad: 40, posicion: 'Arquero' },
          ]
        },
        {
          nombre: 'Italia',
          representante: 'Luciano Spalletti',
          jugadores: [
            { nombre: 'Nicolo Barella', dorsal: 18, edad: 29, posicion: 'Mediocampista' },
            { nombre: 'Federico Chiesa', dorsal: 14, edad: 28, posicion: 'Delantero' },
            { nombre: 'Gianluigi Donnarumma', dorsal: 1, edad: 27, posicion: 'Arquero' },
            { nombre: 'Alessandro Bastoni', dorsal: 23, edad: 26, posicion: 'Defensa' },
            { nombre: 'Jorginho Filho', dorsal: 8, edad: 34, posicion: 'Mediocampista' },
            { nombre: 'Ciro Immobile', dorsal: 17, edad: 36, posicion: 'Delantero' },
            { nombre: 'Marco Verratti', dorsal: 6, edad: 33, posicion: 'Mediocampista' },
          ]
        },
        {
          nombre: 'Inglaterra',
          representante: 'Gareth Southgate',
          jugadores: [
            { nombre: 'Harry Kane', dorsal: 9, edad: 32, posicion: 'Delantero' },
            { nombre: 'Jude Bellingham', dorsal: 10, edad: 22, posicion: 'Mediocampista' },
            { nombre: 'Bukayo Saka', dorsal: 7, edad: 24, posicion: 'Delantero' },
            { nombre: 'Phil Foden', dorsal: 11, edad: 25, posicion: 'Delantero' },
            { nombre: 'Declan Rice', dorsal: 4, edad: 27, posicion: 'Mediocampista' },
            { nombre: 'John Stones', dorsal: 5, edad: 32, posicion: 'Defensa' },
            { nombre: 'Jordan Pickford', dorsal: 1, edad: 32, posicion: 'Arquero' },
          ]
        }
      ];

      const resEquiposExistentes = await serviciosParticipantes.obtenerEquipos();
      const equiposExistentes = resEquiposExistentes.data || [];

      for (const sel of selecciones) {
        let teamId: number;
        const found = equiposExistentes.find(e => 
          e.name.toLowerCase().trim() === sel.nombre.toLowerCase().trim()
        );

        if (found) {
          teamId = found.id;
        } else {
          const resTeam = await serviciosParticipantes.crearEquipo({
            name: sel.nombre,
            discipline_id: disciplineId,
            category_id: categoryId,
            representative: sel.representante,
            registration_status: 'aprobado'
          });
          if (resTeam.success && resTeam.data) {
            teamId = resTeam.data.id;
          } else {
            console.error(`Error al crear selección: ${sel.nombre}`);
            continue;
          }
        }

        for (const j of sel.jugadores) {
          try {
            await serviciosParticipantes.crearJugador({
              full_name: j.nombre,
              team_id: teamId,
              dni: Math.floor(10000000 + Math.random() * 90000000).toString(),
              age: j.edad,
              number: j.dorsal,
              position: j.posicion
            });
          } catch (err: any) {
            console.log(`Jugador ${j.nombre} ya existía:`, err.message);
          }
        }
      }

      sileo.success({ title: 'Selecciones Creadas', description: 'Equipos y jugadores del mundial listos.' });

      try {
        await serviciosFixture.generarFixture({
          discipline_id: disciplineId,
          category_id: categoryId,
          start_date: new Date().toISOString().split('T')[0],
          venue_ids: [venueId]
        });
        sileo.success({ title: 'Fixture Generado', description: 'Partidos programados automáticamente.' });
      } catch (fixErr) {
        console.error('Error generando fixture:', fixErr);
        sileo.warning({ title: 'Aviso de Fixture', description: 'Los equipos están listos, genera el fixture en la pestaña Fixture.' });
      }

      sileo.success({ title: 'Simulación Completada', description: 'Mundial simulado con éxito.' });
      window.location.reload();

    } catch (err) {
      console.error(err);
      sileo.error({ title: 'Error', description: 'No se pudo generar la simulación completa.' });
    } finally {
      setSimulando(false);
    }
  };

  useEffect(() => {
    if (!cargando && !usuario) {
      navegar('/login');
    } else if (!cargando && usuario && !campeonatoActivo && !usuario.roles?.includes('administrador')) {
      navegar('/seleccion-campeonato');
    }
  }, [usuario, cargando, navegar, campeonatoActivo]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f7] text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
            <img src={logoImg} className="w-7 h-7 object-contain absolute" alt="Cargando..." />
          </div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase animate-pulse">Cargando Tablero...</span>
        </div>
      </div>
    );
  }

  if (!usuario) return null;


  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen izquierdo en desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar />

        {/* Contenido Principal */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
          
          {/* Banner de Bienvenida Profesional Claro */}
          <section className="relative rounded-2xl bg-[#11131c] border border-slate-900 p-8 shadow-xs overflow-hidden group">
            {/* Soft decorative line on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#800f2f] via-indigo-650 to-indigo-500"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2.5xl font-black text-white tracking-tight leading-none">
                  ¡Bienvenido de nuevo, <span className="text-indigo-400">{usuario.name}</span>!
                </h2>
                <p className="text-slate-300 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                  Desde aquí puedes gestionar los campeonatos, partidos, equipos y estadísticas según tu rol asignado en el sistema LigaCenter.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {usuario.roles?.map((rol, i) => (
                  <span 
                    key={i} 
                    className="px-3.5 py-1.5 rounded-lg bg-[#171a26] border border-slate-850 text-slate-350 text-xs font-bold uppercase tracking-wider"
                  >
                    Rol: {rol.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Tarjeta de Desarrollador condicional */}
          {import.meta.env.DEV && (usuario.roles?.includes('organizador') || usuario.roles?.includes('administrador')) && (
            <section className="relative rounded-2xl bg-gradient-to-r from-slate-900/40 to-indigo-950/10 border border-indigo-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm backdrop-blur-xs overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500"></div>
              <div className="space-y-1.5 flex-1 pl-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-lg animate-pulse">biotech</span>
                  Herramientas de Desarrollador (Simulación de Datos)
                </h4>
                <p className="text-xs text-slate-400 font-medium max-w-3xl leading-relaxed">
                  Genera instantáneamente una Copa Mundial de simulación en la base de datos para el campeonato actual. Creará la disciplina Fútbol, la categoría Selecciones Libres, el Estadio Lusail y 8 selecciones nacionales (Argentina, Brasil, Francia, etc.) con sus estrellas reales y fixture programado.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimularMundial}
                disabled={simulando}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-emerald-800 disabled:to-teal-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer select-none active:scale-95 disabled:scale-100"
              >
                {simulando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Inyectando Datos...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">public</span>
                    <span>Simular Copa Mundial FIFA</span>
                  </>
                )}
              </button>
            </section>
          )}

          {/* Base grid layout */}
          <div className="grid grid-cols-1 gap-6">

            {/* Card: Acciones y Módulos según Permisos */}
            <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs hover:border-[#800f2f]/60 transition-all duration-200">
              <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-905 pb-3">
                <div className="w-7 h-7 rounded bg-[#171a26] flex items-center justify-center text-slate-300 border border-slate-850">
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                </div>
                Módulos Disponibles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Módulo: Gestión de Usuarios (Solo Administrador) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/usuarios')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">group</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Gestión de Usuarios</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Administra accesos, roles y activa o desactiva usuarios.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Acceder Módulo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Consola SaaS (Solo Super Administrador / App Owner) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/saas-admin')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Consola SaaS Administrador</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Supervisa organizadores, estadísticas globales de torneos y licencias.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Auditar SaaS</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Equipos y Jugadores (Organizador, Encargado, Publico) */}
                {campeonatoActivo && tienePermiso('ver_equipos') && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/participantes')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">groups</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Equipos y Jugadores</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Consulta los planteles, crea nuevos equipos e inscribe jugadores.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Ver Equipos</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Fixture y Escenarios (Organizador, Administrador) */}
                {campeonatoActivo && tienePermiso('ver_equipos') && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/fixture')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">calendar_today</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Fixture y Calendario</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Genera emparejamientos y programa canchas y horarios oficiales.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Gestionar Fixture</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Gestión de Planillas y Partidos (Mesa, Organizador) */}
                {campeonatoActivo && (tienePermiso('registrar_incidencias') || tieneRol('organizador')) && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/mesa')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">assignment</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Planilla de Partidos</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Registra goles, faltas, tarjetas e incidencias de los encuentros.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Mesa de Control</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Tablas de Posición (Cualquiera) */}
                {campeonatoActivo && tienePermiso('ver_tablas') && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/publico')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">leaderboard</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Posiciones y Estadísticas</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Visualiza los resultados en vivo, anotadores y tablas oficiales.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Ver Posiciones</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensaje Informativo si no hay Campeonato seleccionado */}
                {!campeonatoActivo && !tieneRol('administrador') && (
                  <div className="md:col-span-2 p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200 flex flex-col items-center justify-center text-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-amber-500">warning_amber</span>
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-300">Sin Campeonato Seleccionado</h4>
                      <p className="text-xs text-amber-400 mt-1.5 max-w-md leading-relaxed font-medium">
                        Para poder gestionar equipos, jugadores, fixtures y actas de partidos, por favor selecciona un campeonato de trabajo.
                      </p>
                    </div>
                    <button
                      onClick={() => navegar('/seleccion-campeonato')}
                      className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">sports_soccer</span>
                      <span>Seleccionar / Crear Campeonato</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Botón flotante de Ayuda / Guía ? */}
        {!tieneRol('administrador') && (
          <>
            <button
              onClick={() => setMostrarGuia(true)}
              title="Guía del torneo"
              className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-650 text-white shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>

            {/* Drawer lateral de Guía */}
            {mostrarGuia && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
                  onClick={() => setMostrarGuia(false)}
                />
                {/* Panel */}
                <div className="relative w-full max-w-sm bg-[#11131c] h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-900 animate-slideInRight">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-400 text-base">help</span>
                      <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">Guía del Torneo</h3>
                    </div>
                    <button
                      onClick={() => setMostrarGuia(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:bg-[#171a26] hover:text-white transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mb-4">
                      Sigue estos pasos en orden para configurar y gestionar tu campeonato:
                    </p>
                    {PASOS_TORNEO.map((s) => (
                      <div key={s.step} className="flex gap-3 p-3 rounded-xl bg-[#171a26] border border-slate-850 hover:bg-[#1c1f2e] transition-colors">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-slate-400">{s.icon}</span>
                            {s.title}
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed font-medium">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-slate-900 bg-[#171a26]/40">
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">¿Necesitas más ayuda?</p>
                    <a
                      href="/tablero/configuracion"
                      onClick={(e) => { e.preventDefault(); setMostrarGuia(false); navegar('/tablero/configuracion?tab=guia'); }}
                      className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Ver guía completa en Configuración
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pie de Página */}
        <footer className="mt-auto bg-[#11131c] border-t border-slate-900 py-6 text-center text-xs text-slate-400">
          <p>&copy; 2026 LigaCenter. Desarrollado para la gestión de campeonatos. Arequipa, Perú.</p>
        </footer>
      </div>
    </div>
  );
};
