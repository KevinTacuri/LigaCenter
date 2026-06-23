import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { BarraLateral } from '../componentes/BarraLateral';
import { 
  serviciosParticipantes, 
  serviciosCampeonatos, 
  serviciosFixture,
  serviciosUsuarios,
  serviciosSuperAdmin
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
  const { campeonatoActivo, seleccionarCampeonato, setPanelCampeonatosAbierto } = useCampeonato();
  const navegar = useNavigate();
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [simulando, setSimulando] = useState(false);

  // Estados de datos de Administración SaaS (Simulación y Snapshot)
  const [usuariosSnapshot, setUsuariosSnapshot] = useState<any[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
  const [totalTenants, setTotalTenants] = useState<number>(3);
  const [cargandoAdminData, setCargandoAdminData] = useState(false);
  const [filtroLog, setFiltroLog] = useState<'TODOS' | 'INFO' | 'SUCCESS' | 'ERROR' | 'TRACE'>('TODOS');
  
  const [logsList, setLogsList] = useState([
    { id: 1, time: '2026-06-23 00:08:12', type: 'INFO', text: 'Servidor bootstrapped con base de datos SQLite.' },
    { id: 2, time: '2026-06-23 00:09:03', type: 'INFO', text: 'Mesa de Control enrutada con token Sanctum.' },
    { id: 3, time: '2026-06-23 00:10:05', type: 'SUCCESS', text: 'Sesión administrativa iniciada para el propietario.' },
    { id: 4, time: '2026-06-23 00:12:44', type: 'TRACE', text: 'Petición GET /api/users exitosa (status 200).' },
    { id: 5, time: '2026-06-23 00:15:13', type: 'SUCCESS', text: 'Roles de usuario cargados en memoria local.' },
    { id: 6, time: '2026-06-23 00:18:22', type: 'INFO', text: 'Vanguard Health check de servidor: 100% OK.' },
  ]);

  // Carga de snapshot y estadísticas de administradores
  useEffect(() => {
    if (usuario && tieneRol('administrador')) {
      cargarDatosAdmin();
    }
  }, [usuario]);

  const cargarDatosAdmin = async () => {
    setCargandoAdminData(true);
    try {
      const resUser = await serviciosUsuarios.obtenerUsuarios(1);
      if (resUser.success) {
        setUsuariosSnapshot(resUser.data.users.slice(0, 4));
        setTotalUsuarios(resUser.data.pagination.total);
      }
      
      const resTenants = await serviciosSuperAdmin.obtenerTenants();
      if (resTenants.success) {
        setTotalTenants(resTenants.data.length);
      }
    } catch (err) {
      console.error("Error al cargar datos de admin en el dashboard:", err);
    } finally {
      setCargandoAdminData(false);
    }
  };

  // Estados para selección/creación integrada de campeonatos
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [cargandoCampeonatos, setCargandoCampeonatos] = useState(false);
  
  // Creador
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'basico' | 'completo'>('basico');
  const [nuevoReglamento, setNuevoReglamento] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (usuario && !tieneRol('administrador') && !campeonatoActivo) {
      cargarCampeonatos();
    }
  }, [usuario, campeonatoActivo]);

  useEffect(() => {
    if (usuario && !tieneRol('administrador') && !campeonatoActivo && !cargandoCampeonatos && campeonatos.length > 0) {
      setPanelCampeonatosAbierto(true);
    }
  }, [usuario, campeonatoActivo, cargandoCampeonatos, campeonatos.length]);

  const cargarCampeonatos = async () => {
    setCargandoCampeonatos(true);
    try {
      const res = await serviciosCampeonatos.obtenerCampeonatos();
      if (res.success) {
        setCampeonatos(res.data);
      } else {
        console.error('No se pudieron obtener los campeonatos.');
      }
    } catch (err) {
      console.error('Error al conectar con el servidor para obtener campeonatos:', err);
    } finally {
      setCargandoCampeonatos(false);
    }
  };

  const manejarCrearCampeonato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setCreando(true);
    try {
      const formData = new FormData();
      formData.append('name', nuevoNombre.trim());
      formData.append('type', nuevoTipo);
      if (nuevoReglamento) {
        formData.append('rules_pdf', nuevoReglamento);
      }

      const res = await serviciosCampeonatos.crearCampeonato(formData);
      if (res.success) {
        setNuevoNombre('');
        setNuevoReglamento(null);
        sileo.success({
          title: 'Campeonato Creado',
          description: 'El nuevo campeonato se ha registrado correctamente.'
        });
        await cargarCampeonatos();
        seleccionarCampeonato(res.data);
      } else {
        sileo.error({
          title: 'Error de Creación',
          description: res.message || 'No se pudo crear el campeonato.'
        });
      }
    } catch (err) {
      sileo.error({
        title: 'Error de Creación',
        description: 'Error al conectar con el servidor para registrar el campeonato.'
      });
    } finally {
      setCreando(false);
    }
  };

  const obtenerNombreRol = (rolesArray: any[]): string => {
    if (!rolesArray || rolesArray.length === 0) return 'usuario_publico';
    const rolObj = rolesArray[0];
    return typeof rolObj === 'object' && rolObj !== null ? rolObj.name : rolObj;
  };

  const agregarLogSimulado = (tipo: 'INFO' | 'SUCCESS' | 'ERROR' | 'TRACE') => {
    const tiposTexto = {
      INFO: 'Monitoreo de CPU estable en 12%. Disco: 2.4MB.',
      SUCCESS: 'Copia de seguridad SQLite generada con éxito.',
      ERROR: 'Intento de acceso denegado a recurso restringido por IP.',
      TRACE: 'Ejecutada depuración de pila de middleware de API.'
    };
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    setLogsList(prev => [
      ...prev,
      {
        id: Date.now(),
        time: timeStr,
        type: tipo,
        text: tiposTexto[tipo]
      }
    ]);
    
    sileo.info({ title: 'Evento de Auditoría', description: `Log registrado: [${tipo}]` });
  };


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
    }
  }, [usuario, cargando, navegar]);

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
          
          {/* Banner de Bienvenida Profesional Compacto */}
          <section className="relative rounded-xl bg-[#11131c] border border-slate-900 p-4 md:p-5 shadow-xs overflow-hidden group">
            {/* Soft decorative line on top */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#800f2f] via-indigo-650 to-indigo-500"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <h2 className="text-base md:text-lg font-black text-white tracking-tight leading-none">
                  ¡Bienvenido, <span className="text-indigo-400">{usuario.name}</span>!
                </h2>
                <p className="text-slate-400 text-xs max-w-2xl font-medium leading-relaxed">
                  Gestiona campeonatos, partidos, equipos y estadísticas según tu rol asignado.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {usuario.roles?.map((rol, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-md bg-[#171a26] border border-slate-850 text-slate-350 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {rol.replace('_', ' ')}
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
          {tieneRol('administrador') ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* 1. Métricas Globales del SaaS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Organizadores */}
                <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Organizadores</span>
                    <span className="text-xl font-black text-white">{totalTenants} Activos</span>
                    <span className="text-[10px] text-slate-500 block font-semibold">Clientes en la plataforma</span>
                  </div>
                </div>

                {/* Usuarios Registrados */}
                <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">shield_person</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Usuarios del Sistema</span>
                    <span className="text-xl font-black text-white">{cargandoAdminData ? '...' : `${totalUsuarios} Totales`}</span>
                    <span className="text-[10px] text-slate-500 block font-semibold">Cuentas creadas</span>
                  </div>
                </div>

                {/* Servidor OK */}
                <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">dns</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Estado Servidor</span>
                    <span className="text-xl font-black text-emerald-400">100% Online</span>
                    <span className="text-[10px] text-slate-500 block font-semibold">CPU: 12% | RAM: 450MB</span>
                  </div>
                </div>

                {/* Base de datos SQLite */}
                <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs flex items-center gap-5 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-405 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">database</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Base de Datos</span>
                    <span className="text-xl font-black text-white">SQLite Activo</span>
                    <span className="text-[10px] text-slate-500 block font-semibold">Sincronizado / 2.4 MB</span>
                  </div>
                </div>
              </section>

              {/* 2. Sección dividida: Terminal y Tabla Snapshot */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Consola de Auditoría Interactiva (7 cols) */}
                <section className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs xl:col-span-7 flex flex-col h-[400px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4 mb-4 shrink-0">
                    <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-indigo-400">terminal</span>
                      Registro de Eventos (Auditoría del Sistema)
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={filtroLog}
                        onChange={(e) => setFiltroLog(e.target.value as any)}
                        className="bg-[#171a26] border border-slate-850 text-slate-300 text-[10px] rounded-md px-2 py-1 outline-hidden font-bold cursor-pointer"
                      >
                        <option value="TODOS">TODOS LOS LOGS</option>
                        <option value="INFO">INFO</option>
                        <option value="SUCCESS">SUCCESS</option>
                        <option value="TRACE">TRACE</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                      
                      <button 
                        onClick={() => setLogsList([])}
                        title="Limpiar Consola"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-350 p-1 rounded-md text-[10px] border border-slate-750 cursor-pointer flex items-center justify-center active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">mop</span>
                      </button>
                    </div>
                  </div>

                  {/* Terminal Log Container */}
                  <div className="flex-1 bg-black/40 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-400 space-y-2 overflow-y-auto min-h-0 select-text">
                    {logsList.filter(log => filtroLog === 'TODOS' || log.type === filtroLog).length === 0 ? (
                      <p className="text-slate-600 italic">No hay logs registrados para este filtro.</p>
                    ) : (
                      logsList
                        .filter(log => filtroLog === 'TODOS' || log.type === filtroLog)
                        .map((log) => {
                          let colorClass = 'text-slate-400';
                          if (log.type === 'SUCCESS') colorClass = 'text-emerald-400';
                          if (log.type === 'ERROR') colorClass = 'text-rose-450 font-bold';
                          if (log.type === 'TRACE') colorClass = 'text-indigo-405';
                          
                          return (
                            <div key={log.id} className="flex gap-2.5 items-start leading-relaxed border-b border-slate-905/30 pb-1.5 last:border-0">
                              <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                              <span className={`font-bold shrink-0 uppercase select-none w-14`}>[{log.type}]</span>
                              <span className={colorClass}>{log.text}</span>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Controles para simular eventos */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-900 shrink-0">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Simular Evento:</span>
                    <button 
                      onClick={() => agregarLogSimulado('INFO')}
                      className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-350 text-[8px] font-extrabold uppercase rounded-sm border border-slate-750 transition-colors cursor-pointer"
                    >
                      + Info CPU
                    </button>
                    <button 
                      onClick={() => agregarLogSimulado('SUCCESS')}
                      className="px-2 py-1 bg-emerald-950/20 hover:bg-emerald-950/45 text-emerald-400 text-[8px] font-extrabold uppercase rounded-sm border border-emerald-900/30 transition-colors cursor-pointer"
                    >
                      + Backup Exitoso
                    </button>
                    <button 
                      onClick={() => agregarLogSimulado('TRACE')}
                      className="px-2 py-1 bg-indigo-950/20 hover:bg-indigo-950/45 text-indigo-400 text-[8px] font-extrabold uppercase rounded-sm border border-indigo-900/30 transition-colors cursor-pointer"
                    >
                      + Debug API
                    </button>
                    <button 
                      onClick={() => agregarLogSimulado('ERROR')}
                      className="px-2 py-1 bg-rose-950/20 hover:bg-rose-950/45 text-rose-455 text-[8px] font-extrabold uppercase rounded-sm border border-rose-900/30 transition-colors cursor-pointer"
                    >
                      + Acceso Denegado
                    </button>
                  </div>
                </section>

                {/* Instantánea de Usuarios (5 cols) */}
                <section className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs xl:col-span-5 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4 shrink-0">
                    <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-indigo-400">group</span>
                      Usuarios Recientes
                    </h3>
                    <button 
                      onClick={() => navegar('/tablero/usuarios')}
                      className="text-[#a5d8ff] hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Gestionar</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    {cargandoAdminData ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                      </div>
                    ) : usuariosSnapshot.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                        No hay usuarios registrados en el sistema.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-500 text-[9px] uppercase font-bold tracking-wider border-b border-slate-900 pb-2">
                            <th className="pb-2 font-black">Usuario</th>
                            <th className="pb-2 font-black">Rol del Sistema</th>
                            <th className="pb-2 text-right font-black">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-905/30">
                          {usuariosSnapshot.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="py-2.5">
                                <div className="font-bold text-slate-200 leading-tight text-xs">{item.name}</div>
                                <div className="text-[10px] text-slate-500 leading-none mt-0.5">{item.email}</div>
                              </td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 rounded-md bg-[#171a26] border border-slate-850 text-slate-350 font-bold uppercase text-[9px] tracking-wide">
                                  {obtenerNombreRol(item.roles).replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                  item.is_active 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-slate-500/10 text-slate-450 border border-slate-500/20'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                  {item.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

              </div>

              {/* 3. Sección de Consolas Administrativas */}
              <section className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs">
                <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-900 pb-3">
                  <div className="w-7 h-7 rounded bg-[#171a26] flex items-center justify-center text-slate-300 border border-slate-850">
                    <span className="material-symbols-outlined text-sm">settings_applications</span>
                  </div>
                  Consola de Herramientas SaaS y Configuración
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Módulo 1: Consola SaaS */}
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/saas-admin')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Consola SaaS</h4>
                      <p className="text-xs text-slate-450 mt-1.5 leading-relaxed font-medium">Supervisa y audita organizadores registrados, cantidad de campeonatos y estado de licencias globales.</p>
                      <button className="mt-4 text-xs text-slate-455 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer bg-transparent border-0 outline-hidden">
                        <span>Auditar SaaS</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* Módulo 2: Gestión de Usuarios */}
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/usuarios')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">group</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Usuarios & Roles</h4>
                      <p className="text-xs text-slate-450 mt-1.5 leading-relaxed font-medium">Asigna y actualiza roles en el sistema (Administrador, Organizador, Mesa de Control) y gestiona la suspensión de cuentas.</p>
                      <button className="mt-4 text-xs text-slate-455 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer bg-transparent border-0 outline-hidden">
                        <span>Gestionar Roles</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* Módulo 3: Configuración General */}
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/configuracion')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">settings</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Configuración Global</h4>
                      <p className="text-xs text-slate-450 mt-1.5 leading-relaxed font-medium">Configura parámetros globales del sistema, opciones de desarrollo, plantillas de reglamentos y guías oficiales.</p>
                      <button className="mt-4 text-xs text-slate-455 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer bg-transparent border-0 outline-hidden">
                        <span>Ajustar Sistema</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : !campeonatoActivo ? (
            cargandoCampeonatos ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest animate-pulse">Cargando campeonatos...</span>
              </div>
            ) : campeonatos.length === 0 ? (
              // Vista Limpia de Onboarding (0 Campeonatos)
              <div className="max-w-md mx-auto py-8 px-4 space-y-6 text-center animate-fadeIn">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <span className="material-symbols-outlined text-3xl">sports_soccer</span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg md:text-xl font-black text-white tracking-tight">Crea tu primer campeonato</h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-sm mx-auto">
                    ¡Bienvenido a LigaCenter! Para comenzar a gestionar tus disciplinas, equipos, jugadores, fixtures y planillas de juego, registra tu primer campeonato a continuación.
                  </p>
                </div>

                {/* Formulario de onboarding */}
                <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 text-left shadow-xs space-y-4">
                  <form onSubmit={manejarCrearCampeonato} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-350 block">Nombre del Campeonato *</label>
                      <input
                        type="text" required placeholder="Ej: Torneo Clausura Colegio de Ingenieros"
                        value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                        className="w-full text-xs border border-slate-800 bg-[#171a26] text-white rounded-xl p-3 outline-none focus:border-indigo-500/50 transition-all font-medium font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-350 block">Formato / Tipo de Gestión *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                          nuevoTipo === 'basico' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-850 bg-[#171a26]/40 hover:bg-[#1a1d2a]'
                        }`}>
                          <input
                            type="radio" name="onboarding_tipo_camp" checked={nuevoTipo === 'basico'}
                            onChange={() => setNuevoTipo('basico')} className="sr-only"
                          />
                          <span className="text-xs font-extrabold text-white uppercase tracking-wider">Básico</span>
                          <span className="text-[9px] text-slate-500 leading-none">Fixture rápido</span>
                        </label>
                        <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                          nuevoTipo === 'completo' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-855 bg-[#171a26]/40 hover:bg-[#1a1d2a]'
                        }`}>
                          <input
                            type="radio" name="onboarding_tipo_camp" checked={nuevoTipo === 'completo'}
                            onChange={() => setNuevoTipo('completo')} className="sr-only"
                          />
                          <span className="text-xs font-extrabold text-white uppercase tracking-wider">Completo</span>
                          <span className="text-[9px] text-slate-500 leading-none">Multi-disciplina</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-350 block">Reglamento Oficial (PDF - Opcional)</label>
                      <input
                        type="file" accept=".pdf"
                        onChange={(e) => setNuevoReglamento(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-indigo-500/10 file:text-indigo-400 file:hover:bg-indigo-500/20 file:cursor-pointer outline-none cursor-pointer bg-[#171a26] border border-slate-800 p-2.5 rounded-xl"
                      />
                    </div>

                    <button
                      type="submit" disabled={creando}
                      className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase cursor-pointer transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      {creando ? 'Creando e Ingresando...' : 'Crear e Ingresar'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Vista de Seleccion por Panel Lateral (>= 1 Campeonatos)
              <div className="max-w-md mx-auto py-16 px-4 space-y-6 text-center animate-fadeIn">
                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
                  <span className="material-symbols-outlined text-3xl">east</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg md:text-xl font-black text-white tracking-tight">Selecciona un campeonato</h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold max-w-sm mx-auto">
                    Por favor, abre el panel de campeonatos en la barra lateral derecha para seleccionar el torneo con el que deseas trabajar.
                  </p>
                </div>
                <button
                  onClick={() => setPanelCampeonatosAbierto(true)}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 mx-auto cursor-pointer shadow-xs transition-all tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span>Abrir Panel de Campeonatos</span>
                </button>
              </div>
            )
          ) : (
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
                </div>
              </div>
            </div>
          )}
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
