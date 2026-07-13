import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { serviciosParticipantes, serviciosCampeonatos, resolverUrlImagen } from '../../servicios/api';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';
import { useConfirm } from '@omit/react-confirm-dialog';
import type {
  Disciplina,
  Categoria,
  Equipo,
  Jugador
} from '../../servicios/api';
import { useCampeonato } from '../../contexto/ContextoCampeonato';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
type TabType = 'disciplinas' | 'categorias' | 'equipos' | 'jugadores' | 'registro-equipo' | 'planilla-jugadores';

// Fila de jugador en la tabla editable
interface FilaJugador {
  id?: number;        // si ya existe en BD
  nombre: string;
  dni: string;
  edad: string;
  dorsal: string;
  guardado: boolean;  // true = inmóvil
  guardando?: boolean;
  error?: string;
  foto?: string | null; // ruta o url de la foto de perfil
}

// ─────────────────────────────────────────────
// COMPONENTE AUTOCOMPLETE GENÉRICO
// ─────────────────────────────────────────────
interface OpcionAC { id: number; label: string; }
interface AutocompleteProps {
  label: string;
  placeholder: string;
  opciones: OpcionAC[];
  valorId: number | null;
  onChange: (id: number | null, texto: string) => void;
  onCrear?: (texto: string) => Promise<number | null>; // devuelve el id creado
  requerido?: boolean;
  deshabilitado?: boolean;
  textoCrear?: string; // label del botón "Crear"
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  label, placeholder, opciones, valorId, onChange, onCrear,
  requerido, deshabilitado, textoCrear
}) => {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sincronizar texto con valorId
  useEffect(() => {
    if (valorId !== null) {
      const op = opciones.find(o => o.id === valorId);
      if (op) setTexto(op.label);
    } else {
      setTexto('');
    }
  }, [valorId, opciones]);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtradas = opciones.filter(o =>
    o.label.toLowerCase().includes(texto.toLowerCase())
  );
  const existeExacto = opciones.some(o => o.label.toLowerCase() === texto.toLowerCase().trim());
  const mostrarCrear = onCrear && texto.trim().length > 1 && !existeExacto;

  const seleccionar = (op: OpcionAC) => {
    setTexto(op.label);
    setAbierto(false);
    onChange(op.id, op.label);
  };

  const handleCrear = async () => {
    if (!onCrear || !texto.trim()) return;
    setCreando(true);
    try {
      const nuevoId = await onCrear(texto.trim());
      if (nuevoId !== null) {
        onChange(nuevoId, texto.trim());
        setAbierto(false);
      }
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="space-y-1" ref={ref}>
      <label className="text-xs font-bold text-slate-700 block">
        {label}{requerido && ' *'}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={texto}
          disabled={deshabilitado}
          onChange={e => {
            setTexto(e.target.value);
            setAbierto(true);
            if (!e.target.value.trim()) onChange(null, '');
          }}
          onFocus={() => setAbierto(true)}
          className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          search
        </span>

        {abierto && !deshabilitado && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
            {filtradas.length === 0 && !mostrarCrear && (
              <div className="px-3 py-2.5 text-xs text-slate-400 italic">Sin resultados</div>
            )}
            {filtradas.map(op => (
              <button
                key={op.id}
                type="button"
                onClick={() => seleccionar(op)}
                className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {op.label}
              </button>
            ))}
            {mostrarCrear && (
              <button
                type="button"
                onClick={handleCrear}
                disabled={creando}
                className="w-full text-left px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 flex items-center gap-1.5 transition-colors last:rounded-b-xl disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                {creando ? 'Creando...' : `Crear "${texto.trim()}"${textoCrear ? ` como ${textoCrear}` : ''}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENTE: Selector de Logo (archivo o URL)
// ─────────────────────────────────────────────
interface LogoInputProps {
  logoFile: File | null;
  logoUrlTexto: string;
  logoActualUrl?: string | null; // logo ya guardado (modo edición)
  onFileChange: (file: File | null) => void;
  onUrlChange: (texto: string) => void;
  label?: string;
}

const LogoInput: React.FC<LogoInputProps> = ({
  logoFile, logoUrlTexto, logoActualUrl, onFileChange, onUrlChange, label = 'Logo del Equipo'
}) => {
  const [modo, setModo] = useState<'archivo' | 'url'>('archivo');
  const inputRef = useRef<HTMLInputElement>(null);

  const previewSrc = logoFile
    ? URL.createObjectURL(logoFile)
    : (modo === 'url' && logoUrlTexto ? logoUrlTexto : resolverUrlImagen(logoActualUrl || null));

  return (
    <div className="space-y-2 font-sans">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{label}</label>

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-[10px] font-bold w-fit bg-slate-50 dark:bg-[#151722]/50">
        <button type="button" onClick={() => setModo('archivo')}
          className={`px-3 py-1.5 transition-all cursor-pointer ${modo === 'archivo' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
          Subir Imagen
        </button>
        <button type="button" onClick={() => setModo('url')}
          className={`px-3 py-1.5 transition-all cursor-pointer ${modo === 'url' ? 'bg-sky-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
          Pegar URL
        </button>
      </div>

      <div className="flex items-center gap-3">
        {previewSrc && (
          <img src={previewSrc} alt="Logo preview" className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
        )}

        {modo === 'archivo' ? (
          <div className="flex-1">
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/40 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-950/60 cursor-pointer"
            />
            <p className="text-[10px] text-slate-455 mt-1">PNG, JPG o WEBP · Máx. 2MB</p>
          </div>
        ) : (
          <input
            type="url"
            placeholder="https://ejemplo.com/logo.png"
            value={logoUrlTexto}
            onChange={(e) => onUrlChange(e.target.value)}
            className="flex-1 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENTE: Logo circular pequeño (tabla de equipos)
// ─────────────────────────────────────────────
interface LogoCircularProps {
  nombre: string;
  logo?: string | null;
}

const LogoCircular: React.FC<LogoCircularProps> = ({ nombre, logo }) => {
  const urlResuelta = resolverUrlImagen(logo);
  if (urlResuelta) {
    return (
      <img
        src={urlResuelta}
        alt={nombre}
        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
      />
    );
  }
  const inicial = nombre?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
      {inicial}
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export const GestionParticipantes: React.FC = () => {
  const { usuario, tienePermiso, tieneRol, cargando: cargandoAuth } = useAutenticacion();
  const navegar = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();
  const queryTab = searchParams.get('tab');
  const { campeonatoActivo, cargandoCampeonato } = useCampeonato();

  // Iniciamos en 'categorias' porque es el módulo más utilizado y el de "disciplinas" lo ocultamos por ahora para simplificar, pero se puede cambiar fácilmente si se prefiere otro tab como predeterminado o reactivar "disciplinas"
  // const [tabActiva, setTabActiva] = useState<TabType>('disciplinas');
  const [tabActiva, setTabActiva] = useState<TabType>('categorias');

  useEffect(() => {
    if (queryTab && queryTab !== tabActiva) {
      setTabActiva(queryTab as TabType);
    }
  }, [queryTab]);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const PASOS_AYUDA_PARTICIPANTES = [
    { paso: '1', titulo: 'Disciplinas (Deportes)', desc: 'Registra los deportes que se jugarán (ej. Fútbol, Vóley).', icono: 'sports' },
    { paso: '2', titulo: 'Categorías', desc: 'Define los rangos de edad, el género y formato para cada deporte.', icono: 'category' },
    { paso: '3', titulo: 'Equipos', desc: 'Registra los equipos asociándolos a su categoría.', icono: 'groups' },
    { paso: '4', titulo: 'Jugadores', desc: 'Inscribe a los jugadores en su respectivo equipo.', icono: 'person' },
    { paso: '5', titulo: 'Registro Rápido Equipo ✨', desc: 'Crea un equipo con autocomplete — escribe y selecciona o crea disciplina y categoría al vuelo.', icono: 'bolt' },
    { paso: '6', titulo: 'Planilla de Jugadores ✨', desc: 'Selecciona un equipo y llena jugadores en una tabla estilo Excel. Cada fila se guarda individualmente.', icono: 'table' }
  ];

  // ── Estados de datos ──────────────────────
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  // ── Estado: Filtros y orden de la tabla de Equipos ──
  const [busquedaEq, setBusquedaEq] = useState('');
  const [filtroEstadoEq, setFiltroEstadoEq] = useState<'todos' | 'aprobado' | 'pendiente' | 'rechazado'>('todos');
  const [filtroCategoriaEq, setFiltroCategoriaEq] = useState<string>('todos');
  const [ordenEq, setOrdenEq] = useState<'nombre_asc' | 'nombre_desc' | 'representante_asc' | 'representante_desc' | 'estado'>('nombre_asc');

  // ── Estado: Filtros y orden de la tabla de Jugadores ──
const [busquedaJug, setBusquedaJug] = useState('');
const [ordenJug, setOrdenJug] = useState<'nombre_asc' | 'nombre_desc' | 'equipo_asc' | 'equipo_desc'>('nombre_asc');

  // ── Formularios originales ─────────────────
  const [nuevaDisc, setNuevaDisc] = useState({ name: '', description: '', rules: '', status: 'active' });
  const [customDiscName, setCustomDiscName] = useState('');
  const [nuevaCat, setNuevaCat] = useState({
    name: '',
    age_min: '',
    age_max: '',
    gender: 'Masculino',
    discipline_id: '',
  });
  const [nuevoEq, setNuevoEq] = useState({
    name: '',
    representative: '',
    discipline_id: '',
    category_id: '',
    enable_delegate: false,
    delegate_name: '',
    delegate_email: '',
    delegate_password: '',
  });
  const [nuevoJug, setNuevoJug] = useState({ name: '', dni: '', age: '', phone: '', team_id: '', number: '', position: 'Delantero' });

  // Agregar estado del modo de registro (Modo manual o Modo carga masiva)
  const [modoJugador, setModoJugador] = useState<'manual' | 'masiva'>('manual');
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [cargandoCsv, setCargandoCsv] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<{ ok: number; errores: string[] } | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  // Agregar estado del modo de registro para Excel
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [importandoExcel, setImportandoExcel] = useState(false);
  const inputExcelRef = useRef<HTMLInputElement>(null);
  const [tabCategoria, setTabCategoria] = useState<'manual' | 'masiva'>('manual');

  // Agregar función de procesamiento CSV (Modo carga masiva)
  const procesarCsvJugadores = async () => {
    const targetTeamId = delegadoTeamId !== null ? delegadoTeamId : equipoIdMasiva;
    if (!archivoCsv || targetTeamId === null) return;
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    setCargandoCsv(true);
    setResultadoCarga(null);
    try {
      const texto = await archivoCsv.text();
      const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
      const filas = lineas.slice(1);
      let ok = 0;
      const errores: string[] = [];

      for (let i = 0; i < filas.length; i++) {
        const cols = filas[i].split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
        const [nombre, dni, edad, dorsal] = cols;
        if (!nombre || !edad) {
          errores.push(`Fila ${i + 2}: Faltan campos obligatorios (nombre, edad).`);
          continue;
        }
        try {
          const res = await serviciosParticipantes.crearJugador({
            full_name: nombre,
            team_id: targetTeamId,
            dni: dni || null,
            age: parseInt(edad),
            number: dorsal ? parseInt(dorsal) : null,
            position: null,
          });
          if (res.success) ok++;
          else errores.push(`Fila ${i + 2}: ${res.message || 'Error desconocido.'}`);
        } catch (err: any) {
          errores.push(`Fila ${i + 2}: ${err.response?.data?.message || 'Error al guardar.'}`);
        }
      }

    setResultadoCarga({ ok, errores });
    if (ok > 0) {
      mostrarMensaje(`${ok} jugador(es) importado(s) exitosamente.`);
      cargarDatos();
    }
  } catch {
    mostrarMensaje('No se pudo leer el archivo CSV.', true);
  } finally {
    setCargandoCsv(false);
  }
};

  const descargarPlantilla = () => {
    const cabecera = 'nombre_completo,dni,edad,dorsal\n';
    const ejemplo  = 'Juan Pérez,12345678,22,10\n';
    const blob = new Blob([cabecera + ejemplo], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'plantilla_jugadores.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Logo: tab "equipos" (form clásico)
  const [logoEqFile, setLogoEqFile] = useState<File | null>(null);
  const [logoEqUrl, setLogoEqUrl] = useState('');

  // Logo: tab "registro-equipo" (registro rápido)
  const [logoReqFile, setLogoReqFile] = useState<File | null>(null);
  const [logoReqUrl, setLogoReqUrl] = useState('');

  // Logo: modal editar equipo
  const [logoEditFile, setLogoEditFile] = useState<File | null>(null);
  const [logoEditUrl, setLogoEditUrl] = useState('');

  // Foto: form manual "jugadores"
  const [fotoJugFile, setFotoJugFile] = useState<File | null>(null);
  const [fotoJugUrl, setFotoJugUrl] = useState('');

  // Foto: modal editar jugador
  const [fotoEditJugFile, setFotoEditJugFile] = useState<File | null>(null);
  const [fotoEditJugUrl, setFotoEditJugUrl] = useState('');

  // ── Estado: Tab "registro-equipo" ──────────
  const [reqEq, setReqEq] = useState({
    nombre: '',
    representante: '',
    discId: null as number | null,
    catId: null as number | null,
  });
  const [guardandoReqEq, setGuardandoReqEq] = useState(false);

  // ── Estado: Tab "planilla-jugadores" ──────
  const [equipoSelId, setEquipoSelId] = useState<number | null>(null);
  const [equipoSel, setEquipoSel] = useState<Equipo | null>(null);
  const [filasJugadores, setFilasJugadores] = useState<FilaJugador[]>([]);
  const [cargandoPlanilla, setCargandoPlanilla] = useState(false);
  const [equipoIdMasiva, setEquipoIdMasiva] = useState<number | null>(null);

  const [modalNuevoEqAbierto, setModalNuevoEqAbierto] = useState(false);
  const [modalVerEq, setModalVerEq] = useState<{ abierto: boolean; eq: Equipo | null }>({ abierto: false, eq: null });

  // ── Estado: Modal Editar Equipo ────────────
  const [modalEditarEq, setModalEditarEq] = useState<{
    abierto: boolean;
    eq: Equipo | null;
    nombre: string;
    representante: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    guardando: boolean;
    enable_delegate: boolean;
    delegate_name: string;
    delegate_email: string;
    delegate_password?: string;
  }>({
    abierto: false,
    eq: null,
    nombre: '',
    representante: '',
    estado: 'pendiente',
    guardando: false,
    enable_delegate: false,
    delegate_name: '',
    delegate_email: '',
    delegate_password: '',
  });

  // ── Estado: Modal Editar Jugador ───────────
  const [modalEditarJug, setModalEditarJug] = useState<{
    abierto: boolean;
    jug: Jugador | null;
    nombre: string;
    dni: string;
    numero: string;
    teamId: string;
    guardando: boolean;
  }>({ abierto: false, jug: null, nombre: '', dni: '', numero: '', teamId: '', guardando: false });

  // ── Estado: Plazos de Cierre y Prórrogas para Delegados (Frontend Custom) ──
  const [delegadoTeamId, setDelegadoTeamId] = useState<number | null>(null);
  const [championshipSettings, setChampionshipSettings] = useState<any>({});
  const [prorrogaFecha, setProrrogaFecha] = useState('');
  const [prorrogaMotivo, setProrrogaMotivo] = useState('');
  const [enviandoProrroga, setEnviandoProrroga] = useState(false);
  const [mostrarFormProrroga, setMostrarFormProrroga] = useState(false);
  const [jugadoresDePlanilla, setJugadoresDePlanilla] = useState<Jugador[]>([]);

  // Redirigir al delegado a la planilla de jugadores si está en una pestaña no permitida
  useEffect(() => {
    if (delegadoTeamId !== null && tabActiva !== 'planilla-jugadores' && tabActiva !== 'jugadores') {
      setTabActiva('planilla-jugadores');
    }
  }, [delegadoTeamId, tabActiva]);

  // ─────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (cargandoAuth || cargandoCampeonato) return;
    if (!tienePermiso('ver_equipos') || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [tabActiva, cargandoAuth, cargandoCampeonato]);

  // Al cambiar equipo seleccionado en planilla o cuando se cargan los equipos
  useEffect(() => {
    if (equipoSelId !== null) {
      cargarJugadoresDeEquipo(equipoSelId);
      const eq = equipos.find(e => e.id === equipoSelId) || null;
      setEquipoSel(eq);
    } else {
      setFilasJugadores([]);
      setEquipoSel(null);
    }
  }, [equipoSelId, equipos]);

  // ─────────────────────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────────────────────
  const cargarDatos = async () => {
    if (!campeonatoActivo) return;
    setCargando(true);
    setErrorLocal(null);
    try {
      // Cargar detalles de campeonato y relación del usuario
      try {
        const resCamp = await serviciosCampeonatos.obtenerCampeonato(campeonatoActivo.id);
        if (resCamp.success && resCamp.data) {
          setChampionshipSettings(resCamp.data.settings || {});
        }
        const resUsers = await serviciosCampeonatos.obtenerUsuariosCampeonato(campeonatoActivo.id);
        if (resUsers.success && usuario) {
          const miRel = resUsers.data.find((cu: any) => cu.user_id === usuario.id);
          if (miRel && miRel.role === 'team_delegate' && miRel.team_id) {
            setDelegadoTeamId(miRel.team_id);
            // Preseleccionar el equipo del delegado
            setEquipoSelId(miRel.team_id);
            setEquipoIdMasiva(miRel.team_id);
          }
        }
      } catch (err) {
        console.error("Error al cargar la relación del delegado o settings:", err);
      }

      if (tabActiva === 'disciplinas') {
        const res = await serviciosParticipantes.obtenerDisciplinas();
        if (res.success) setDisciplinas(res.data);
      } else if (tabActiva === 'categorias') {
        const [resCat, resDisc] = await Promise.all([
          serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoActivo.id),
          serviciosParticipantes.obtenerDisciplinas(),
        ]);
        if (resCat.success) setCategorias(resCat.data);
        if (resDisc.success) {
          const mapped = resDisc.data.map(cd => ({
            id: cd.id, // cd.id es el id de la disciplina que pertence al catalogo de disciplinas 
            name: cd.name || 'Desconocido',
            description: '',
            rules: '',
            status: 'active'
          }));
          setDisciplinas(mapped);
        }
      } else if (tabActiva === 'equipos') {
        const [resEq, resDisc, resCat] = await Promise.all([
          serviciosParticipantes.obtenerEquipos(),
          serviciosParticipantes.obtenerDisciplinasCampeonato(campeonatoActivo.id),
          serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoActivo.id),
        ]);
        if (resEq.success) setEquipos(resEq.data);
        if (resDisc.success) {
          const mapped = resDisc.data.map(cd => ({
            id: cd.id,
            name: cd.discipline?.name || 'Desconocido',
            description: cd.discipline?.description || '',
            rules: cd.discipline?.rules || '',
            status: cd.discipline?.status || 'active'
          }));
          setDisciplinas(mapped);
        }
        if (resCat.success) setCategorias(resCat.data);
      } else if (tabActiva === 'jugadores') {
        const [resJug, resEq] = await Promise.all([
          serviciosParticipantes.obtenerJugadores(),
          serviciosParticipantes.obtenerEquipos(),
        ]);
        if (resJug.success) setJugadores(resJug.data);
        if (resEq.success) setEquipos(resEq.data);
      } else if (tabActiva === 'registro-equipo') {
        const [resDisc, resCat] = await Promise.all([
          serviciosParticipantes.obtenerDisciplinasCampeonato(campeonatoActivo.id),
          serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoActivo.id),
        ]);
        if (resDisc.success) {
          const mapped = resDisc.data.map(cd => ({
            id: cd.id,
            name: cd.discipline?.name || 'Desconocido',
            description: cd.discipline?.description || '',
            rules: cd.discipline?.rules || '',
            status: cd.discipline?.status || 'active'
          }));
          setDisciplinas(mapped);
        }
        if (resCat.success) setCategorias(resCat.data);
      } else if (tabActiva === 'planilla-jugadores') {
        const resEq = await serviciosParticipantes.obtenerEquipos();
        if (resEq.success) setEquipos(resEq.data);
        // Recargar jugadores del equipo seleccionado si había uno
        if (equipoSelId !== null) cargarJugadoresDeEquipo(equipoSelId);
      }
    } catch {
      setErrorLocal('Error al cargar datos del módulo.');
    } finally {
      setCargando(false);
    }
  };

  const calcularEdad = (birthDateStr: string | null | undefined): string => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return '';
    const hoy = new Date();
    let edad = hoy.getFullYear() - birth.getFullYear();
    const mes = hoy.getMonth() - birth.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < birth.getDate())) {
      edad--;
    }
    return String(edad);
  };

  const cargarJugadoresDeEquipo = async (teamId: number) => {
    setCargandoPlanilla(true);
    try {
      const res = await serviciosParticipantes.obtenerJugadores();
      if (res.success) {
        const jugEquipo = res.data.filter((j: any) => {
          const tId = j.team_id ?? j.team?.id;
          return tId === teamId;
        });
        
        const filas: FilaJugador[] = jugEquipo.map((j: any) => ({
          id: j.id,
          nombre: j.name || (j.names ? `${j.names} ${j.last_names || ''}`.trim() : ''),
          dni: j.dni || j.document_number || '',
          edad: calcularEdad(j.birth_date),
          dorsal: j.number != null ? String(j.number) : '',
          guardado: true,
          foto: j.photo || null,
        }));
        
        // Cargar también al estado jugadoresDePlanilla local
        setJugadoresDePlanilla(res.data.filter((j: any) => (j.team_id ?? j.team?.id) === teamId));

        // Agregar fila vacía al final si el plazo no ha vencido
        if (!isDeadlineExpired) {
          filas.push({ nombre: '', dni: '', edad: '', dorsal: '', guardado: false });
        }
        setFilasJugadores(filas);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al cargar jugadores del equipo.', true);
    } finally {
      setCargandoPlanilla(false);
    }
  };

  // ─────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────
  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    try {
      if (esError) {
        sileo.error({ title: 'Error', description: msg });
      } else {
        sileo.success({ title: 'Operación Exitosa', description: msg });
      }
    } catch (e) {
      console.error("Error al mostrar mensaje con sileo:", e);
      if (esError) {
        alert("Error: " + msg);
      } else {
        alert("Éxito: " + msg);
      }
    }
  };

  // ─────────────────────────────────────────────
  // HANDLERS ORIGINALES
  // ─────────────────────────────────────────────
  const guardarDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nuevaDisc.name === 'Otro' ? customDiscName.trim() : nuevaDisc.name;
    if (!finalName) return;
    try {
      const res = await serviciosParticipantes.crearDisciplina({
        ...nuevaDisc,
        name: finalName
      });
      if (res.success) {
        mostrarMensaje('Disciplina registrada exitosamente.');
        setNuevaDisc({ name: '', description: '', rules: '', status: 'active' });
        setCustomDiscName('');
        cargarDatos();
      }
    } catch { mostrarMensaje('Error al registrar disciplina.', true); }
  };

  const guardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCat.name || !nuevaCat.discipline_id) {
      mostrarMensaje('El nombre y la disciplina son obligatorios.', true); return;
    }

    if (!campeonatoActivo) {
      mostrarMensaje('No hay un campeonato activo para asociar la categoría.', true);
      return;
    }

    try {
      const res = await serviciosParticipantes.crearCategoriaPorCampeonato(campeonatoActivo.id, {
        discipline_id: parseInt(nuevaCat.discipline_id),
        name: nuevaCat.name,
        age_min: nuevaCat.age_min ? parseInt(nuevaCat.age_min) : null,
        age_max: nuevaCat.age_max ? parseInt(nuevaCat.age_max) : null,
        gender_type: nuevaCat.gender,
      });
      if (res.success) {
        mostrarMensaje('Categoría registrada exitosamente.');
        setNuevaCat({
          name: '',
          age_min: '',
          age_max: '',
          gender: 'Masculino',
          discipline_id: ''
        });
        cargarDatos();
      }
    } catch (err: any) {
      // Capturar errores de validación HTTP 422
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const msg = errors ? Object.values(errors).flat().join('\n') : 'Datos inválidos.';
        sileo.error({
          title: 'Error de Configuración',
          description: msg
        });
      } else {
        mostrarMensaje('Error al registrar categoría.', true);
      }
    }
  };

  const importarExcel = async () => {
    if (!archivoExcel) {
      mostrarMensaje("Seleccione un archivo Excel.", true);
      return;
    }

    if (!campeonatoActivo) {
      mostrarMensaje("No se encontró el campeonato.", true);
      return;
    }

    try {
      setImportandoExcel(true);

      const formData = new FormData();
      formData.append("file", archivoExcel);

      console.log(archivoExcel);
      console.log(archivoExcel instanceof File);

      const respuesta = await serviciosParticipantes.importarCategoriasYEquipos(
        campeonatoActivo.id,
        formData
      );
      console.log(respuesta);

      mostrarMensaje(respuesta.message || "Importación exitosa.", false);

      // Limpiar selección
      setArchivoExcel(null);

      if (inputExcelRef.current) {
        inputExcelRef.current.value = "";
      }

      // Volver a cargar la información
      await cargarDatos();

    } catch (error: any) {
      mostrarMensaje(
        error.response?.data?.message ?? "Error al importar el Excel.", true
      );
    } finally {
      setImportandoExcel(false);
    }
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEq.name || !nuevoEq.discipline_id || !nuevoEq.category_id) {
      mostrarMensaje('Complete todos los campos obligatorios para el equipo.', true); return;
    }
    try {
      const formData = new FormData();
      formData.append('name', nuevoEq.name);
      formData.append('discipline_id', nuevoEq.discipline_id);
      formData.append('category_id', nuevoEq.category_id);
      formData.append('registration_status', 'aprobado');
      
      formData.append('enable_delegate', String(nuevoEq.enable_delegate));
      if (nuevoEq.enable_delegate) {
        formData.append('representative', nuevoEq.delegate_name);
        formData.append('delegate_name', nuevoEq.delegate_name);
        formData.append('delegate_email', nuevoEq.delegate_email);
        formData.append('delegate_password', nuevoEq.delegate_password);
      } else if (nuevoEq.representative) {
        formData.append('representative', nuevoEq.representative);
      }

      if (logoEqFile) formData.append('logo', logoEqFile);
      else if (logoEqUrl.trim()) formData.append('logo', logoEqUrl.trim());

      const res = await serviciosParticipantes.crearEquipo(formData);
      if (res.success) {
        if (nuevoEq.enable_delegate) {
          try {
            sileo.success({
              title: 'Equipo y Delegado Creados',
              description: `Equipo creado con éxito. Accesos del delegado:\nEmail: ${nuevoEq.delegate_email}\nContraseña: ${nuevoEq.delegate_password}`,
            });
          } catch (errSileo) {
            console.error("Error al notificar con sileo:", errSileo);
            alert(`Equipo y Delegado Creados\nEquipo creado con éxito. Accesos del delegado:\nEmail: ${nuevoEq.delegate_email}\nContraseña: ${nuevoEq.delegate_password}`);
          }
        } else {
          mostrarMensaje('Equipo registrado y aprobado exitosamente.');
        }
        setNuevoEq({
          name: '',
          representative: '',
          discipline_id: '',
          category_id: '',
          enable_delegate: false,
          delegate_name: '',
          delegate_email: '',
          delegate_password: '',
        });
        setLogoEqFile(null); setLogoEqUrl('');
        setModalNuevoEqAbierto(false);
        cargarDatos();
      }
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const msg = errors ? Object.values(errors).flat().join('\n') : (err.response.data.message || 'Datos inválidos.');
        try {
          sileo.error({ title: 'Error de Validación', description: msg });
        } catch {
          alert('Error de Validación:\n' + msg);
        }
      } else {
        mostrarMensaje(err.response?.data?.message || 'Error al registrar equipo.', true);
      }
    }
  };

  const cambiarEstadoEquipo = async (id: number, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente') => {
    try {
      const res = await serviciosParticipantes.actualizarEquipo(id, { registration_status: nuevoEstado });
      if (res.success) {
        setEquipos(prev => prev.map(e => e.id === id ? { ...e, registration_status: nuevoEstado } : e));
        mostrarMensaje(`Estado actualizado a "${nuevoEstado}" correctamente.`);
      }
    } catch { mostrarMensaje('Error al cambiar el estado del equipo.', true); }
  };

  const guardarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    const targetTeamId = delegadoTeamId !== null ? delegadoTeamId : nuevoJug.team_id;
    if (!nuevoJug.name || !targetTeamId || !nuevoJug.age) {
      mostrarMensaje('El nombre, el equipo y la edad son obligatorios.', true); return;
    }
    try {
      const formData = new FormData();
      formData.append('full_name', nuevoJug.name);
      formData.append('team_id', String(targetTeamId));
      formData.append('age', nuevoJug.age);
      if (nuevoJug.dni) formData.append('dni', nuevoJug.dni);
      if (nuevoJug.number) formData.append('number', nuevoJug.number);
      if (fotoJugFile) formData.append('photo', fotoJugFile);
      else if (fotoJugUrl.trim()) formData.append('photo', fotoJugUrl.trim());

      const res = await serviciosParticipantes.crearJugador(formData);
      if (res.success) {
        mostrarMensaje('Jugador inscrito exitosamente.');
        setNuevoJug({ name: '', dni: '', age: '', phone: '', team_id: delegadoTeamId !== null ? String(delegadoTeamId) : '', number: '', position: 'Delantero' });
        setFotoJugFile(null); setFotoJugUrl('');
        setJugadores(prev => [...prev, res.data]);
        if (delegadoTeamId !== null) {
          cargarJugadoresDeEquipo(delegadoTeamId);
        }
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al inscribir jugador.', true);
    }
  };

  const eliminarElemento = async (id: number) => {
    if (tabActiva === 'jugadores' && isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido y no se permiten modificaciones.', true);
      return;
    }
    const isConfirmed = await confirm({
      title: '¿Eliminar Registro?',
      description: '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer y podría afectar a otros registros vinculados.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'destructive',
      }
    });
    if (isConfirmed) {
      try {
        let res: any;
        if (tabActiva === 'disciplinas') res = await serviciosParticipantes.eliminarDisciplina(id);
        else if (tabActiva === 'categorias') res = await serviciosParticipantes.eliminarCategoria(id);
        else if (tabActiva === 'equipos') res = await serviciosParticipantes.eliminarEquipo(id);
        else if (tabActiva === 'jugadores') res = await serviciosParticipantes.eliminarJugador(id);
        if (res && res.success) {
          mostrarMensaje('Registro eliminado correctamente.');
          if (tabActiva === 'disciplinas') setDisciplinas(prev => prev.filter(d => d.id !== id));
          else if (tabActiva === 'categorias') setCategorias(prev => prev.filter(c => c.id !== id));
          else if (tabActiva === 'equipos') setEquipos(prev => prev.filter(e => e.id !== id));
          else if (tabActiva === 'jugadores') setJugadores(prev => prev.filter(j => j.id !== id));
        }
      } catch { mostrarMensaje('No se puede eliminar el registro. Puede estar en uso.', true); }
    }
  };

  // ─────────────────────────────────────────────
  // HANDLERS NUEVOS: Registro Rápido Equipo
  // ─────────────────────────────────────────────

  const abrirModalEditar = (eq: Equipo) => {
    setLogoEditFile(null);
    setLogoEditUrl('');
    const hasDelegate = !!eq.delegate;
    setModalEditarEq({
      abierto: true,
      eq,
      nombre: eq.name,
      representante: eq.representative || '',
      estado: (eq.registration_status || 'pendiente').toLowerCase() as 'pendiente' | 'aprobado' | 'rechazado',
      guardando: false,
      enable_delegate: hasDelegate,
      delegate_name: eq.delegate ? eq.delegate.name : '',
      delegate_email: eq.delegate ? eq.delegate.email : '',
      delegate_password: '',
    });
  };

  const guardarEdicionEq = async () => {
    if (!modalEditarEq.eq) return;
    if (!modalEditarEq.nombre.trim()) {
      mostrarMensaje('El nombre del equipo es obligatorio.', true); return;
    }
    setModalEditarEq(prev => ({ ...prev, guardando: true }));
    try {
      const formData = new FormData();
      formData.append('name', modalEditarEq.nombre.trim());
      formData.append('registration_status', modalEditarEq.estado);
      
      formData.append('enable_delegate', String(modalEditarEq.enable_delegate));
      if (modalEditarEq.enable_delegate) {
        formData.append('representative', modalEditarEq.delegate_name);
        formData.append('delegate_name', modalEditarEq.delegate_name);
        formData.append('delegate_email', modalEditarEq.delegate_email);
        if (modalEditarEq.delegate_password) {
          formData.append('delegate_password', modalEditarEq.delegate_password);
        }
      } else {
        formData.append('representative', modalEditarEq.representante.trim() || '');
      }

      if (logoEditFile) formData.append('logo', logoEditFile);
      else if (logoEditUrl.trim()) formData.append('logo', logoEditUrl.trim());

      const res = await serviciosParticipantes.actualizarEquipo(modalEditarEq.eq.id, formData);
      if (res.success) {
        setEquipos(prev => prev.map(e => e.id === modalEditarEq.eq!.id ? res.data : e));
        if (modalEditarEq.enable_delegate && modalEditarEq.delegate_password) {
          try {
            sileo.success({
              title: 'Equipo y Acceso Actualizados',
              description: `Equipo actualizado con éxito. Accesos del delegado:\nEmail: ${modalEditarEq.delegate_email}\nNueva Contraseña: ${modalEditarEq.delegate_password}`,
            });
          } catch (errSileo) {
            console.error("Error al notificar con sileo:", errSileo);
            alert(`Equipo y Acceso Actualizados\nEquipo actualizado con éxito. Accesos del delegado:\nEmail: ${modalEditarEq.delegate_email}\nNueva Contraseña: ${modalEditarEq.delegate_password}`);
          }
        } else {
          mostrarMensaje('Equipo actualizado correctamente.');
        }
        setModalEditarEq({
          abierto: false,
          eq: null,
          nombre: '',
          representante: '',
          estado: 'pendiente',
          guardando: false,
          enable_delegate: false,
          delegate_name: '',
          delegate_email: '',
          delegate_password: '',
        });
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al actualizar equipo.', true);
    } finally { setModalEditarEq(prev => ({ ...prev, guardando: false })); }
  };

  // Crear categoría inline (requiere disciplina seleccionada)
  const crearCatInline = async (nombre: string): Promise<number | null> => {
    if (!reqEq.discId) {
      mostrarMensaje('Selecciona primero una disciplina para crear la categoría.', true);
      return null;
    }
    try {
      const res = await serviciosParticipantes.crearCategoria(reqEq.discId, {
        name: nombre,
        age_min: null, age_max: null,
        gender_type: 'Mixto'
      });
      if (res.success) {
        mostrarMensaje(`Categoría "${nombre}" creada (edades pendientes).`);
        const nuevas = await serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoActivo!.id);
        if (nuevas.success) setCategorias(nuevas.data);
        return res.data.id;
      }
    } catch { mostrarMensaje('Error al crear categoría.', true); }
    return null;
  };

  const guardarReqEq = async () => {
    if (!reqEq.nombre.trim() || !reqEq.discId || !reqEq.catId) {
      mostrarMensaje('Completa todos los campos obligatorios.', true); return;
    }
    setGuardandoReqEq(true);
    try {
      const formData = new FormData();
      formData.append('name', reqEq.nombre.trim());
      formData.append('discipline_id', String(reqEq.discId));
      formData.append('category_id', String(reqEq.catId));
      if (reqEq.representante.trim()) formData.append('representative', reqEq.representante.trim());
      formData.append('registration_status', 'aprobado');
      if (logoReqFile) formData.append('logo', logoReqFile);
      else if (logoReqUrl.trim()) formData.append('logo', logoReqUrl.trim());

      const res = await serviciosParticipantes.crearEquipo(formData);
      if (res.success) {
        mostrarMensaje(`Equipo "${reqEq.nombre}" registrado y aprobado.`);
        setReqEq({ nombre: '', representante: '', discId: null, catId: null });
        setLogoReqFile(null); setLogoReqUrl('');
        const resEq = await serviciosParticipantes.obtenerEquipos();
        if (resEq.success) setEquipos(resEq.data);
      }
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const msg = errors ? Object.values(errors).flat().join('\n') : (err.response.data.message || 'Datos inválidos.');
        sileo.error({ title: 'Error de Validación', description: msg });
      } else {
        mostrarMensaje(err.response?.data?.message || 'Error al registrar el equipo.', true);
      }
    }
    finally { setGuardandoReqEq(false); }
  };

  // Categorías filtradas por disciplina seleccionada en registro rápido
  const catsFiltradas = categorias.filter(c =>
    !reqEq.discId || c.championship_discipline_id === reqEq.discId
  );

  // ─────────────────────────────────────────────
  // HANDLERS NUEVOS: Planilla Jugadores
  // ─────────────────────────────────────────────
  const actualizarFila = (idx: number, campo: keyof FilaJugador, valor: any) => {
    setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, [campo]: valor, error: undefined } : f));
  };

  const guardarFila = async (idx: number) => {
    if (!equipoSelId) return;
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    const fila = filasJugadores[idx];
    if (!fila.nombre.trim() || !fila.edad.trim()) {
      setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, error: 'Nombre y edad son obligatorios.' } : f));
      return;
    }
    // Marcar como guardando
    setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, guardando: true, error: undefined } : f));
    try {
      const formData = new FormData();
      formData.append('full_name', fila.nombre.trim());
      formData.append('team_id', String(equipoSelId));
      formData.append('age', fila.edad);
      if (fila.dni.trim()) formData.append('dni', fila.dni.trim());
      if (fila.dorsal.trim()) formData.append('number', fila.dorsal.trim());
      if (fila.fotoFile) {
        formData.append('photo', fila.fotoFile);
      }

      const res = await serviciosParticipantes.crearJugador(formData);
      if (res.success) {
        mostrarMensaje('Jugador guardado.');
        cargarJugadoresDeEquipo(equipoSelId);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar jugador.';
      setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, guardando: false, error: msg } : f));
    }
  };



  const abrirModalEditarJugador = (j: Jugador) => {
    // Fallback: si team_id no viene en el objeto, lo tomamos de team.id
    const idEquipo = j.team_id ?? j.team?.id;
    setFotoEditJugFile(null);
    setFotoEditJugUrl('');
    setModalEditarJug({
      abierto: true,
      jug: j,
      nombre: j.name,
      dni: j.dni || '',
      numero: j.number != null ? String(j.number) : '',
      teamId: idEquipo !== undefined ? String(idEquipo) : '',
      guardando: false,
    });
  };

  const guardarEdicionJugador = async () => {
    if (!modalEditarJug.jug) return;
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    if (!modalEditarJug.nombre.trim() || !modalEditarJug.teamId) {
      mostrarMensaje('El nombre y el equipo son obligatorios.', true); return;
    }
    setModalEditarJug(prev => ({ ...prev, guardando: true }));
    try {
      const formData = new FormData();
      formData.append('full_name', modalEditarJug.nombre.trim());
      if (modalEditarJug.dni.trim()) formData.append('dni', modalEditarJug.dni.trim());
      if (modalEditarJug.numero.trim()) formData.append('number', modalEditarJug.numero.trim());
      formData.append('team_id', modalEditarJug.teamId);
      if (fotoEditJugFile) formData.append('photo', fotoEditJugFile);
      else if (fotoEditJugUrl.trim()) formData.append('photo', fotoEditJugUrl.trim());

      const res = await serviciosParticipantes.actualizarJugador(modalEditarJug.jug.id, formData);
      if (res.success) {
        setJugadores(prev => prev.map(j => j.id === modalEditarJug.jug!.id ? res.data : j));
        mostrarMensaje('Jugador actualizado correctamente.');
        setModalEditarJug({ abierto: false, jug: null, nombre: '', dni: '', numero: '', teamId: '', guardando: false });
        if (equipoSelId !== null) {
          cargarJugadoresDeEquipo(equipoSelId);
        }
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al actualizar el jugador.', true);
    } finally {
      setModalEditarJug(prev => ({ ...prev, guardando: false }));
    }
  };

  const eliminarFilaJugador = async (idx: number) => {
    if (isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    const fila = filasJugadores[idx];
    if (!fila.guardado) {
      // Fila nueva no guardada: solo quitar de UI
      setFilasJugadores(prev => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!fila.id) return;
    const isConfirmed = await confirm({
      title: '¿Eliminar Jugador?',
      description: '¿Está seguro de que desea eliminar este jugador de la planilla?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: {
        variant: 'destructive',
      }
    });
    if (isConfirmed) {
      try {
        const res = await serviciosParticipantes.eliminarJugador(fila.id!);
        if (res.success) {
          setFilasJugadores(prev => prev.filter((_, i) => i !== idx));
          mostrarMensaje('Jugador eliminado.');
          if (equipoSelId !== null) {
            cargarJugadoresDeEquipo(equipoSelId);
          }
        }
      } catch { mostrarMensaje('Error al eliminar jugador.', true); }
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  // Opciones para autocompletes
  const opcsCats: { id: number; label: string }[] = catsFiltradas.map(c => ({ id: c.id, label: c.name }));
  const opcsEquipos: { id: number; label: string }[] = (delegadoTeamId !== null ? equipos.filter(e => e.id === delegadoTeamId) : equipos).map(e => ({ id: e.id, label: e.name }));

  // Lista de equipos filtrada y ordenada para la tabla (no modifica `equipos` original)
  const equiposFiltrados = equipos
    .filter(eq => {
      const texto = busquedaEq.trim().toLowerCase();
      const coincideTexto = !texto ||
        eq.name.toLowerCase().includes(texto) ||
        (eq.representative || '').toLowerCase().includes(texto);
      const coincideEstado = filtroEstadoEq === 'todos' || (eq.registration_status || 'pendiente') === filtroEstadoEq;
      const coincideEquipoDelegado = delegadoTeamId === null || eq.id === delegadoTeamId;
      const coincideCategoria = filtroCategoriaEq === 'todos' || 
        (eq.category && String(eq.category.id) === filtroCategoriaEq) ||
        (!eq.category && filtroCategoriaEq === 'sin_categoria');
      return coincideTexto && coincideEstado && coincideEquipoDelegado && coincideCategoria;
    })
    .sort((a, b) => {
      if (ordenEq === 'nombre_asc') return a.name.localeCompare(b.name);
      if (ordenEq === 'nombre_desc') return b.name.localeCompare(a.name);
      if (ordenEq === 'representante_asc') return (a.representative || '').localeCompare(b.representative || '');
      if (ordenEq === 'representante_desc') return (b.representative || '').localeCompare(a.representative || '');
      if (ordenEq === 'estado') return (a.registration_status || 'pendiente').localeCompare(b.registration_status || 'pendiente');
      return 0;
    });

  // Lista de jugadores filtrada y ordenada para la tabla (no modifica `jugadores` original)
  const jugadoresFiltrados = jugadores
    .filter(j => {
      const texto = busquedaJug.trim().toLowerCase();
      const coincideTexto = !texto || j.name.toLowerCase().includes(texto);
      const coincideEquipoDelegado = delegadoTeamId === null || j.team_id === delegadoTeamId;
      return coincideTexto && coincideEquipoDelegado;
    })
    .sort((a, b) => {
      if (ordenJug === 'nombre_asc') return a.name.localeCompare(b.name);
      if (ordenJug === 'nombre_desc') return b.name.localeCompare(a.name);
      if (ordenJug === 'equipo_asc') return (a.team?.name || '').localeCompare(b.team?.name || '');
      if (ordenJug === 'equipo_desc') return (b.team?.name || '').localeCompare(a.team?.name || '');
      return 0;
    });



  // Plazo de Cierre
  const limiteStr = delegadoTeamId && championshipSettings?.roster_deadlines?.[`team_${delegadoTeamId}`];
  const limiteDate = limiteStr ? new Date(limiteStr) : null;
  const isDeadlineExpired = limiteDate ? new Date() > limiteDate : false;

  // Inicializar team_id en el formulario de registro manual del delegado
  useEffect(() => {
    if (delegadoTeamId !== null) {
      setNuevoJug(prev => ({ ...prev, team_id: String(delegadoTeamId) }));
    }
  }, [delegadoTeamId]);

  const enviarSolicitudProrroga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campeonatoActivo || !delegadoTeamId || !prorrogaFecha || !prorrogaMotivo.trim()) return;

    setEnviandoProrroga(true);
    try {
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const newRequest = {
        id: nowTimestamp,
        team_id: delegadoTeamId,
        requested_deadline: new Date(prorrogaFecha).toISOString(),
        reason: prorrogaMotivo.trim(),
        status: 'pendiente'
      };

      const updatedSettings = {
        ...championshipSettings,
        extension_requests: [
          ...(championshipSettings.extension_requests || []),
          newRequest
        ]
      };

      const res = await serviciosCampeonatos.actualizarCampeonato(campeonatoActivo.id, {
        name: campeonatoActivo.name,
        settings: updatedSettings
      });

      if (res.success) {
        setChampionshipSettings(updatedSettings);
        setProrrogaFecha('');
        setProrrogaMotivo('');
        setMostrarFormProrroga(false);
        mostrarMensaje('Solicitud de prórroga enviada con éxito.');
      } else {
        mostrarMensaje(res.message || 'Error al enviar la solicitud.', true);
      }
    } catch (err) {
      mostrarMensaje('Error al enviar la solicitud.', true);
    } finally {
      setEnviandoProrroga(false);
    }
  };

  const renderBannerPlazoExpirado = () => {
    if (delegadoTeamId === null || !limiteDate) return null;

    const prorrogaPendiente = (championshipSettings?.extension_requests || []).some(
      (r: any) => r.team_id === delegadoTeamId && r.status === 'pendiente'
    );

    if (mostrarFormProrroga) {
      return (
        <div className="p-5 rounded-2xl border bg-[#11131c] border-slate-800 text-slate-100 mb-6 animate-fadeIn">
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-indigo-455 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">schedule</span>
            Solicitar Prórroga de Inscripción
          </h3>
          <form onSubmit={enviarSolicitudProrroga} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block font-sans">Nueva fecha propuesta *</label>
                <input
                  type="datetime-local"
                  required
                  value={prorrogaFecha}
                  onChange={(e) => setProrrogaFecha(e.target.value)}
                  className="w-full text-sm border border-slate-700 bg-slate-800 rounded-lg p-2.5 text-white outline-hidden font-sans"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 block font-sans">Motivo o justificación *</label>
              <textarea
                required
                placeholder="Explica brevemente por qué necesitas más tiempo (ej. Dificultad para recolectar fotos de los DNI)..."
                value={prorrogaMotivo}
                onChange={(e) => setProrrogaMotivo(e.target.value)}
                className="w-full text-sm border border-slate-700 bg-slate-800 rounded-lg p-2.5 text-white min-h-[80px] outline-hidden font-sans"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMostrarFormProrroga(false)}
                className="px-4 py-2 border border-slate-700 text-slate-400 hover:bg-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer font-sans"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviandoProrroga}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-60 text-white font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 font-sans"
              >
                {enviandoProrroga ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-xs">send</span>
                )}
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className={`p-5 rounded-2xl border ${isDeadlineExpired ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'} mb-6 shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-2xl mt-0.5 ${isDeadlineExpired ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {isDeadlineExpired ? 'history_toggle_off' : 'verified'}
            </span>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-sans">
                Plazo de Inscripción de Plantilla
              </h3>
              <p className="text-xs mt-1 text-slate-350 font-sans">
                La fecha límite para inscribir o modificar jugadores de tu equipo es el:{' '}
                <span className="font-bold text-white">
                  {limiteDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                .
              </p>
              {isDeadlineExpired ? (
                <p className="text-xs mt-1 text-amber-400 font-bold font-sans">
                  ❌ El plazo ha vencido. Los formularios de edición y carga de jugadores están deshabilitados.
                </p>
              ) : (
                <p className="text-xs mt-1 text-emerald-400 font-bold font-sans">
                  ✓ El plazo está vigente. Aún puedes registrar y editar jugadores.
                </p>
              )}
            </div>
          </div>

          {isDeadlineExpired && (
            <div className="w-full md:w-auto">
              {prorrogaPendiente ? (
                <div className="bg-amber-650/20 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-amber-400 font-sans">Solicitud de prórroga pendiente</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Tu organizador la revisará pronto.</p>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarFormProrroga(true)}
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-650 text-[#0a0b10] font-bold text-xs uppercase tracking-wide px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                >
                  <span className="material-symbols-outlined text-sm font-bold">schedule_send</span>
                  Solicitar Prórroga
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen izquierdo en desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar titulo="Gestión de Participantes" subtitulo="Inscripciones y Configuración del Campeonato" />



      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">

        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {renderBannerPlazoExpirado()}

        {/* ════════════════════════════════════════════
            TABS ORIGINALES (sin tocar)
        ════════════════════════════════════════════ */}
        {(tabActiva === 'disciplinas' || tabActiva === 'categorias' || tabActiva === 'equipos' || tabActiva === 'jugadores') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Formulario de Registro */}
            {tabActiva !== 'equipos' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-fit">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">
                  Añadir {tabActiva.slice(0, -1)}
                </h2>

              {tabActiva === 'disciplinas' && (
                <form onSubmit={guardarDisciplina} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nombre Disciplina *</label>
                    <select
                      required
                      value={nuevaDisc.name}
                      onChange={(e) => setNuevaDisc({ ...nuevaDisc, name: e.target.value })}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 focus:border-secondary outline-hidden cursor-pointer"
                    >
                      <option value="">-- Selecciona Disciplina --</option>
                      <option value="Fútbol">Fútbol</option>
                      <option value="Futsal">Futsal</option>
                      <option value="Vóley">Vóley</option>
                      <option value="Básquetbol">Básquetbol</option>
                      <option value="Atletismo">Atletismo</option>
                      <option value="Natación">Natación</option>
                      <option value="Tenis">Tenis</option>
                      <option value="Otro">Otro...</option>
                    </select>
                  </div>
                  {nuevaDisc.name === 'Otro' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Nombre Disciplina Personalizado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Balonmano, Karate, etc."
                        value={customDiscName}
                        onChange={(e) => setCustomDiscName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-secondary focus:ring-1 focus:ring-secondary outline-hidden"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Descripción</label>
                    <textarea placeholder="Detalles de la disciplina..."
                      value={nuevaDisc.description} onChange={(e) => setNuevaDisc({ ...nuevaDisc, description: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 min-h-[80px] outline-hidden" />
                  </div>
                  <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                    Guardar Disciplina
                  </button>
                </form>
              )}

              {tabActiva === 'categorias' && (
                <div className="space-y-4">
                {/* Importación Excel */}
                <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
                  <button
                      type="button"
                      onClick={() => setTabCategoria('manual')}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tabCategoria === 'manual'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Registro Manual
                  </button>
                  <button 
                      type="button"
                      onClick={() => setTabCategoria('masiva')}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        tabCategoria === 'masiva'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Carga Masiva (Excel)
                  </button>
                </div>

                {tabCategoria === 'manual' && (
                  <form onSubmit={guardarCategoria} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                      <select required value={nuevaCat.discipline_id}
                        onChange={(e) => setNuevaCat({ ...nuevaCat, discipline_id: e.target.value })}
                        className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                        <option value="">-- Selecciona Disciplina --</option>
                        {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Nombre Categoría *</label>
                      <input type="text" required placeholder="Sub-15, Libres, Senior..."
                        value={nuevaCat.name} onChange={(e) => setNuevaCat({ ...nuevaCat, name: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Edad Mínima</label>
                        <input type="number" placeholder="Ej: 10"
                          value={nuevaCat.age_min} onChange={(e) => setNuevaCat({ ...nuevaCat, age_min: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Edad Máxima</label>
                        <input type="number" placeholder="Ej: 15"
                          value={nuevaCat.age_max} onChange={(e) => setNuevaCat({ ...nuevaCat, age_max: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Género</label>
                      <select value={nuevaCat.gender} onChange={(e) => setNuevaCat({ ...nuevaCat, gender: e.target.value })}
                        className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Mixto">Mixto</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                      Guardar Categoría
                    </button>
                  </form>
                )}

                {tabCategoria === 'masiva' && (
                    // selector de Excel + botón importar
                  <div className="mb-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      ref={inputExcelRef}
                      className="hidden"
                      onChange={(e) => setArchivoExcel(e.target.files?.[0] ?? null)}
                    />
                    {/* Drop zone */}
                      {isDeadlineExpired ? (
                        <div className="border-2 border-dashed border-amber-500/25 bg-amber-500/5 rounded-xl p-6 text-center">
                          <span className="material-symbols-outlined text-3xl text-amber-500 block mb-2">lock</span>
                          <p className="text-xs font-bold text-amber-300 font-sans">Carga Masiva Deshabilitada</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans">El plazo de inscripción de categorias ha vencido.</p>
                        </div>
                      ) : (
                        <div
                          onClick={() => inputExcelRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && (file.name.endsWith('.xlsx'))) {
                              setArchivoExcel(file);
                            } else {
                              mostrarMensaje('Solo se permiten archivos Excel.', true);
                            }
                          }}
                          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-all"
                        >
                          <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">cloud_upload</span>
                          {archivoExcel ? (
                            <div>
                              <p className="text-xs font-bold text-sky-700">{archivoExcel.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(archivoExcel.size / 1024).toFixed(1)} KB · Haz clic para cambiar</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-bold text-slate-600">Arrastra tu archivo aquí</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Formatos permitidos: .XLSX (Máx. 10MB)</p>
                            </div>
                          )}
                          <input
                            ref={inputExcelRef}
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) { setArchivoExcel(file)}
                            }}
                          />
                        </div>
                      )}


                    <button
                      type="button"
                      onClick={() => importarExcel()}
                      disabled={!archivoExcel || importandoExcel}
                      className="
                          w-full relative overflow-hidden
                          py-3 rounded-xl text-xs font-bold tracking-wide uppercase font-sans
                          bg-indigo-650 hover:bg-indigo-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all
                          flex items-center justify-center gap-2
                          transition-all duration-200 cursor-pointer
                          focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                          bg-sky-600 hover:bg-sky-500 active:bg-sky-700
                          shadow-md hover:shadow-sky-500/40 hover:shadow-lg active:shadow-none
                          active:scale-[0.98] hover:scale-[1.01]
                          text-white
                        "
                    >
                      {importandoExcel ? "Importando..." : "Iniciar Carga"}
                    </button >
                  </div>
                )}
     
                 </div>
              )}



              {tabActiva === 'jugadores' && (
                <div className="space-y-4">

                  {/* Toggle Modo */}
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => { setModoJugador('manual'); setResultadoCarga(null); }}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        modoJugador === 'manual'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Registro Manual
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModoJugador('masiva'); setResultadoCarga(null); }}
                      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        modoJugador === 'masiva'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      Carga Masiva
                    </button>
                  </div>

                  {/* ── MODO MANUAL ── */} 
                  {modoJugador === 'manual' && (
                    <form onSubmit={guardarJugador} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Nombre Completo *</label>
                        <input type="text" required placeholder="Nombre del jugador"
                          value={nuevoJug.name} onChange={(e) => setNuevoJug({ ...nuevoJug, name: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">DNI / Documento</label>
                          <input type="text" placeholder="DNI"
                            value={nuevoJug.dni} onChange={(e) => setNuevoJug({ ...nuevoJug, dni: e.target.value })}
                            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">Edad *</label>
                          <input type="number" required placeholder="Edad" min="1"
                            value={nuevoJug.age} onChange={(e) => setNuevoJug({ ...nuevoJug, age: e.target.value })}
                            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">Dorsal</label>
                          <input type="number" placeholder="Ej: 10"
                            value={nuevoJug.number} onChange={(e) => setNuevoJug({ ...nuevoJug, number: e.target.value })}
                            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block font-sans">Equipo *</label>
                        <select
                          required
                          value={delegadoTeamId !== null ? String(delegadoTeamId) : nuevoJug.team_id}
                          disabled={delegadoTeamId !== null}
                          onChange={(e) => setNuevoJug({ ...nuevoJug, team_id: e.target.value })}
                          className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500 font-sans"
                        >
                          <option value="">Seleccionar Equipo</option>
                          {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                        </select>
                      </div>
                      <LogoInput
                        logoFile={fotoJugFile}
                        logoUrlTexto={fotoJugUrl}
                        onFileChange={setFotoJugFile}
                        onUrlChange={setFotoJugUrl}
                        label="Foto del Jugador"
                      />
                      <button
                        type="submit"
                        disabled={isDeadlineExpired}
                        className="w-full bg-secondary hover:bg-secondary-container disabled:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer font-sans"
                      >
                        {isDeadlineExpired ? 'Plazo de Inscripción Expirado' : 'Guardar Jugador'}
                      </button>
                    </form>
                  )}

                  {/* ── MODO CARGA MASIVA ── */}
                  {modoJugador === 'masiva' && (
                    <div className="space-y-3">

                        {/* Selector de equipo — NUEVO */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block font-sans">Equipo destino *</label>
                          <select
                            value={delegadoTeamId !== null ? delegadoTeamId : (equipoIdMasiva ?? '')}
                            disabled={delegadoTeamId !== null}
                            onChange={(e) => {
                              setEquipoIdMasiva(e.target.value ? parseInt(e.target.value) : null);
                              setResultadoCarga(null);
                              setArchivoCsv(null);  // ← limpiar también el archivo
                              if (inputArchivoRef.current) inputArchivoRef.current.value = '';
                            }}
                            className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500 font-sans"
                          >
                            <option value="">-- Selecciona el equipo --</option>
                            {equipos.map((eq) => (
                              <option key={eq.id} value={eq.id}>{eq.name}</option>
                            ))}
                          </select>
                        </div>

                      {/* Drop zone */}
                      {isDeadlineExpired ? (
                        <div className="border-2 border-dashed border-amber-500/25 bg-amber-500/5 rounded-xl p-6 text-center">
                          <span className="material-symbols-outlined text-3xl text-amber-500 block mb-2">lock</span>
                          <p className="text-xs font-bold text-amber-300 font-sans">Carga Masiva Deshabilitada</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans">El plazo de inscripción de jugadores ha vencido.</p>
                        </div>
                      ) : (
                        <div
                          onClick={() => inputArchivoRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
                              setArchivoCsv(file);
                              setResultadoCarga(null);
                            } else {
                              mostrarMensaje('Solo se permiten archivos CSV.', true);
                            }
                          }}
                          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-all"
                        >
                          <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">cloud_upload</span>
                          {archivoCsv ? (
                            <div>
                              <p className="text-xs font-bold text-sky-700">{archivoCsv.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{(archivoCsv.size / 1024).toFixed(1)} KB · Haz clic para cambiar</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-bold text-slate-600">Arrastra tu archivo aquí</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Formatos permitidos: .CSV (Máx. 10MB)</p>
                            </div>
                          )}
                          <input
                            ref={inputArchivoRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) { setArchivoCsv(file); setResultadoCarga(null); }
                            }}
                          />
                        </div>
                      )}

                      {/* Acciones inferiores */}
                      <div className="flex items-center justify-between text-[10px]">
                        <button
                          type="button"
                          onClick={descargarPlantilla}
                          className="flex items-center gap-1 text-sky-600 font-bold hover:underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">download</span>
                          Descargar Plantilla .XLSX
                        </button>
                        <span className="flex items-center gap-1 text-slate-400 font-semibold">
                          <span className="material-symbols-outlined text-xs text-amber-500">info</span>
                          Validación automática activa
                        </span>
                      </div>

                      {/* Botón procesar */}
                      <button
                        type="button"
                        onClick={procesarCsvJugadores}
                        disabled={!archivoCsv || !equipoIdMasiva || cargandoCsv || isDeadlineExpired}
                        className="
                          w-full relative overflow-hidden
                          py-3 rounded-xl text-xs font-bold tracking-wide uppercase font-sans
                          bg-indigo-650 hover:bg-indigo-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all
                          flex items-center justify-center gap-2
                          transition-all duration-200 cursor-pointer
                          focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2
                          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                          bg-sky-600 hover:bg-sky-500 active:bg-sky-700
                          shadow-md hover:shadow-sky-500/40 hover:shadow-lg active:shadow-none
                          active:scale-[0.98] hover:scale-[1.01]
                          text-white
                        "
                      >
                        {/* Brillo superior al hacer hover */}
                        <span className="absolute inset-x-0 top-0 h-px bg-white/30 rounded-full pointer-events-none" />

                        {cargandoCsv ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">cloud_upload</span>
                            Iniciar Carga
                          </>
                        )}
                      </button>

                      {/* Resultado */}
                      {resultadoCarga && (
                        <div className="rounded-xl border overflow-hidden text-xs">
                          {resultadoCarga.ok > 0 && (
                            <div className="bg-emerald-50 border-emerald-200 px-3 py-2 flex items-center gap-1.5 text-emerald-700 font-bold">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              {resultadoCarga.ok} jugador(es) importado(s) correctamente.
                            </div>
                          )}
                          {resultadoCarga.errores.length > 0 && (
                            <div className="bg-rose-50 border-t border-rose-100 px-3 py-2 space-y-1">
                              <p className="font-bold text-rose-700 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">error</span>
                                {resultadoCarga.errores.length} error(es):
                              </p>
                              {resultadoCarga.errores.map((err, i) => (
                                <p key={i} className="text-rose-600 pl-4">• {err}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Columna Derecha: Listado */}
            <div className={`${tabActiva === 'equipos' ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-2xl border border-slate-200 p-6 shadow-xs`}>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                  Lista de {tabActiva}
                </h2>
                {tabActiva === 'equipos' && (
                  <button
                    onClick={() => setModalNuevoEqAbierto(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#800f2f] hover:bg-[#991238] text-white text-xs font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-all shadow-xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                    Añadir Equipo
                  </button>
                )}
              </div>

              {/* ── Filtros y orden (solo tab Equipos) ── */}
              {tabActiva === 'equipos' && (
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Buscador */}
                    <div className="relative md:col-span-1">
                      <input
                        type="text"
                        placeholder="Buscar por nombre o representante..."
                        value={busquedaEq}
                        onChange={(e) => setBusquedaEq(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 pr-8 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                        search
                      </span>
                    </div>

                    {/* Filtro Categoría */}
                    <select
                      value={filtroCategoriaEq}
                      onChange={(e) => setFiltroCategoriaEq(e.target.value)}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="todos">Todas las categorías</option>
                      {categorias.map((c) => {
                        const discName = c.championship_discipline?.discipline?.name || '';
                        return (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}{discName ? ` (${discName})` : ''}
                          </option>
                        );
                      })}
                      <option value="sin_categoria">Sin categoría</option>
                    </select>

                    {/* Filtro Estado */}
                    <select
                      value={filtroEstadoEq}
                      onChange={(e) => setFiltroEstadoEq(e.target.value as any)}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="rechazado">Rechazado</option>
                    </select>

                    {/* Orden */}
                    <select
                      value={ordenEq}
                      onChange={(e) => setOrdenEq(e.target.value as any)}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="nombre_asc">Nombre (A-Z)</option>
                      <option value="nombre_desc">Nombre (Z-A)</option>
                      <option value="representante_asc">Representante (A-Z)</option>
                      <option value="representante_desc">Representante (Z-A)</option>
                      <option value="estado">Estado</option>
                    </select>
                  </div>

                  {/* Contador de resultados */}
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Mostrando {equiposFiltrados.length} de {equipos.length} equipos
                  </p>
                </div>
              )}
              {tabActiva === 'jugadores' && (
                <div className="mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Buscador */}
                    <div className="relative md:col-span-2">
                      <input
                        type="text"
                        placeholder="Buscar por nombre del jugador..."
                        value={busquedaJug}
                        onChange={(e) => setBusquedaJug(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 pr-8 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                        search
                      </span>
                    </div>

                    {/* Orden */}
                    <select
                      value={ordenJug}
                      onChange={(e) => setOrdenJug(e.target.value as any)}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="nombre_asc">Nombre (A-Z)</option>
                      <option value="nombre_desc">Nombre (Z-A)</option>
                      <option value="equipo_asc">Equipo (A-Z)</option>
                      <option value="equipo_desc">Equipo (Z-A)</option>
                    </select>
                  </div>

                  {/* Contador de resultados */}
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Mostrando {jugadoresFiltrados.length} de {jugadores.length} jugadores
                  </p>
                </div>
              )}
              {cargando ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cargando registros...</span>
                </div>
              ) : tabActiva === 'equipos' ? (
                /* Matrix/Grid Layout for Teams */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 py-4 animate-fadeIn">
                  {equiposFiltrados.map((eq) => (
                    <div
                      key={eq.id}
                      onClick={() => setModalVerEq({ abierto: true, eq })}
                      className="group flex flex-col items-center p-5 bg-slate-50 hover:bg-slate-100/70 dark:bg-[#171a26]/40 dark:hover:bg-[#171a26] border border-slate-200 dark:border-slate-800/80 rounded-2xl transition-all cursor-pointer text-center relative overflow-hidden shadow-xs hover:shadow-md"
                    >
                      {/* Logo wrapper */}
                      <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden bg-white dark:bg-[#11131c] mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        {eq.logo ? (
                          <img src={resolverUrlImagen(eq.logo) || ''} alt={eq.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl text-slate-400 dark:text-slate-500 font-extrabold uppercase">{eq.name[0] || '?'}</span>
                        )}
                      </div>

                      {/* Info */}
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {eq.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider line-clamp-1 mb-2">
                        {eq.representative || <span className="text-slate-400 dark:text-slate-500 italic">Sin delegado</span>}
                      </p>

                      {/* Status pill */}
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                        eq.registration_status === 'aprobado'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          : eq.registration_status === 'rechazado'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20'
                      }`}>
                        {eq.registration_status || 'pendiente'}
                      </span>
                    </div>
                  ))}
                  {equiposFiltrados.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-slate-450 dark:text-slate-500">
                      <span className="material-symbols-outlined text-4xl text-slate-350">group_off</span>
                      <p className="text-xs font-bold uppercase tracking-wider">No se encontraron equipos</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Classic Table Layout for other tabs */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        {tabActiva === 'jugadores' ? (
                          <>
                            <th className="p-3 pl-4 w-12"></th>
                            <th className="p-3">Nombre Completo</th>
                            <th className="p-3">DNI</th>
                            <th className="p-3">Dorsal</th>
                            <th className="p-3">Equipo</th>
                            <th className="p-3 pr-4 text-right">Acciones</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3 pl-4">Detalles</th>
                            <th className="p-3 pr-4 text-right">Acciones</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {tabActiva === 'disciplinas' && disciplinas.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{d.name}</div>
                            <div className="text-xs text-slate-500">{d.description || 'Sin descripción'}</div>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <button onClick={() => eliminarElemento(d.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {tabActiva === 'categorias' && categorias.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-500">
                              Edades: {c.age_min ?? 'N/A'} - {c.age_max ?? 'N/A'} | Género: {c.gender_type || c.gender || 'N/A'} | Disciplina: {c.championship_discipline?.discipline?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <button onClick={() => eliminarElemento(c.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {tabActiva === 'jugadores' && jugadoresFiltrados.map((j) => (
                        <tr key={j.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4">
                            <LogoCircular nombre={j.name} logo={j.photo} />
                          </td>
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{j.name}</div>
                          </td>
                          <td className="p-3 text-sm text-slate-700">
                            {j.dni || <span className="text-slate-400 italic text-xs">No registrado</span>}
                          </td>
                          <td className="p-3 text-sm text-slate-700">
                            {j.number != null ? j.number : <span className="text-slate-400 italic text-xs">N/A</span>}
                          </td>
                          <td className="p-3 text-sm text-slate-700">
                            {j.team?.name || <span className="text-slate-400 italic text-xs">Sin equipo</span>}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => abrirModalEditarJugador(j)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                Editar
                              </button>
                              <button
                                onClick={() => eliminarElemento(j.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!cargando && (
                        (tabActiva === 'disciplinas' && disciplinas.length === 0) ||
                        (tabActiva === 'categorias' && categorias.length === 0) ||
                        (tabActiva === 'jugadores' && jugadoresFiltrados.length === 0)
                      ) && (
                        <tr>
                          <td colSpan={tabActiva === 'jugadores' ? 6 : 4} className="p-10 text-center text-slate-500 text-xs">No hay registros cargados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            TAB NUEVO: REGISTRO RÁPIDO EQUIPO
        ════════════════════════════════════════════ */}
        {tabActiva === 'registro-equipo' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Banner info */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-400 text-base mt-0.5">bolt</span>
              <div>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Registro Rápido</p>
                <p className="text-xs text-emerald-200/70 mt-0.5 leading-relaxed">
                  Escribe para buscar. Si no existe lo que buscas, aparecerá la opción de crearlo en el momento. Los datos provisionales (delegado, edades) se pueden completar después en las pestañas individuales.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Datos del Equipo
              </h2>

              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre del Equipo *</label>
                <input
                  type="text"
                  placeholder="Ej: Real Arequipa"
                  value={reqEq.nombre}
                  onChange={e => setReqEq(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
              </div>

              {/* Representante */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Delegado / Representante</label>
                <input
                  type="text"
                  placeholder="Nombre del representante (opcional)"
                  value={reqEq.representante}
                  onChange={e => setReqEq(prev => ({ ...prev, representante: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
              </div>



              {/* Disciplina */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                <select
                  required
                  value={reqEq.discId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReqEq(prev => ({ ...prev, discId: val ? parseInt(val) : null, catId: null }));
                  }}
                  className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                >
                  <option value="">-- Selecciona Disciplina --</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Categoría (filtrada por disciplina) */}
              <Autocomplete
                label="Categoría"
                placeholder={reqEq.discId ? 'Escribe el nombre de la categoría...' : 'Selecciona primero una disciplina'}
                opciones={opcsCats}
                valorId={reqEq.catId}
                onChange={(id) => setReqEq(prev => ({ ...prev, catId: id }))}
                onCrear={reqEq.discId ? crearCatInline : undefined}
                requerido
                deshabilitado={!reqEq.discId}
                textoCrear="categoría"
              />
              {/* Ingreso de logo */}
              <LogoInput
                logoFile={logoReqFile}
                logoUrlTexto={logoReqUrl}
                onFileChange={setLogoReqFile}
                onUrlChange={setLogoReqUrl}
              />

              {/* Resumen */}
              {(reqEq.discId || reqEq.catId) && (
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wide mb-1">Vista previa</p>
                  {reqEq.nombre && <p><span className="font-semibold">Equipo:</span> {reqEq.nombre}</p>}
                  {reqEq.discId && <p><span className="font-semibold">Disciplina:</span> {disciplinas.find(d => d.id === reqEq.discId)?.name}</p>}
                  {reqEq.catId && <p><span className="font-semibold">Categoría:</span> {categorias.find(c => c.id === reqEq.catId)?.name}</p>}
                </div>
              )}

              <button
                onClick={guardarReqEq}
                disabled={guardandoReqEq || !reqEq.nombre.trim() || !reqEq.discId || !reqEq.catId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {guardandoReqEq
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
                  : <><span className="material-symbols-outlined text-sm">check_circle</span>Guardar Equipo</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            TAB NUEVO: PLANILLA JUGADORES
        ════════════════════════════════════════════ */}
        {tabActiva === 'planilla-jugadores' && (
          <div className="space-y-5">
            {/* Selector de equipo o Info de Delegado */}
            {delegadoTeamId !== null ? (
              <div className="relative rounded-xl bg-gradient-to-r from-slate-900 via-[#11131c] to-slate-900 border border-slate-800 p-5 shadow-xs overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 pl-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <span className="material-symbols-outlined text-xs">shield</span>
                      Delegado de Equipo Autorizado
                    </span>
                    <h3 className="text-base font-black text-white tracking-tight leading-none">
                      Panel de Inscripción de {equipoSel?.name || 'Cargando equipo...'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                      Como delegado oficial, tienes permisos para inscribir jugadores, dorsales y gestionar tu planilla.
                    </p>
                  </div>
                  {equipoSel?.logo && (
                    <div className="w-14 h-14 rounded-xl bg-[#0c0e17] border border-slate-800 flex items-center justify-center p-2 shrink-0">
                      <img src={equipoSel.logo} className="w-full h-full object-contain" alt="Logo Equipo" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="max-w-md">
                  <Autocomplete
                    label="Seleccionar Equipo"
                    placeholder="Escribe el nombre del equipo..."
                    opciones={opcsEquipos}
                    valorId={equipoSelId}
                    onChange={(id) => setEquipoSelId(id)}
                    requerido
                  />
                </div>
              </div>
            )}

            {/* Panel de datos del equipo (inmóvil) */}
            {equipoSel && (
              <div className="bg-[#11131c] border border-slate-800 rounded-2xl p-5">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3">Datos del Equipo — solo lectura</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Equipo</p>
                    <p className="text-sm font-bold text-white mt-0.5">{equipoSel.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Representante</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{equipoSel.representative || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Estado</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-0.5 ${
                      equipoSel.registration_status === 'aprobado'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {equipoSel.registration_status || 'pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de jugadores */}
            {equipoSel && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                    Jugadores de {equipoSel.name}
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">
                    {filasJugadores.filter(f => f.guardado).length} registrados
                  </span>
                </div>

                {cargandoPlanilla ? (
                  <div className="p-10 flex flex-col items-center gap-3">
                    <div className="w-7 h-7 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
                    <span className="text-xs text-slate-400 font-semibold">Cargando jugadores...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 pl-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                          <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12 text-center">Foto</th>
                          <th className="p-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo *</th>
                          <th className="p-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-32">DNI</th>
                          <th className="p-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Edad *</th>
                          <th className="p-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Dorsal</th>
                          <th className="p-3 pr-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasJugadores.map((fila, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-slate-100 transition-colors ${
                              fila.guardado ? 'bg-white' : 'bg-indigo-50/40'
                            }`}
                          >
                            {/* Número de fila */}
                            <td className="p-3 pl-5 text-slate-400 text-xs font-bold">{idx + 1}</td>

                             {/* Foto */}
                            <td className="p-2 w-12 text-center">
                              {fila.guardado ? (
                                fila.foto ? (
                                  <img
                                    src={fila.foto}
                                    alt={fila.nombre}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs mx-auto"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-2xs mx-auto">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                  </div>
                                )
                              ) : (
                                <div className="relative group w-8 h-8 mx-auto">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id={`input-foto-${idx}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        actualizarFila(idx, 'fotoFile', file);
                                        actualizarFila(idx, 'fotoUrlLocal', URL.createObjectURL(file));
                                      }
                                    }}
                                  />
                                  {fila.fotoUrlLocal ? (
                                    <button
                                      type="button"
                                      onClick={() => document.getElementById(`input-foto-${idx}`)?.click()}
                                      className="w-8 h-8 rounded-full overflow-hidden border border-indigo-400 shadow-2xs focus:outline-hidden cursor-pointer"
                                      title="Cambiar Foto"
                                    >
                                      <img
                                        src={fila.fotoUrlLocal}
                                        alt="Previsualización"
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => document.getElementById(`input-foto-${idx}`)?.click()}
                                      className="w-8 h-8 rounded-full bg-indigo-50/50 hover:bg-indigo-100/70 flex items-center justify-center text-indigo-500 border border-indigo-200 border-dashed focus:outline-hidden transition-all cursor-pointer"
                                      title="Subir Foto"
                                    >
                                      <span className="material-symbols-outlined text-xs">add_a_photo</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Nombre */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={fila.nombre}
                                disabled={fila.guardado || isDeadlineExpired}
                                onChange={e => actualizarFila(idx, 'nombre', e.target.value)}
                                placeholder="Nombre completo"
                                className={`w-full text-sm rounded-lg px-3 py-2 outline-hidden transition-all ${
                                  fila.guardado
                                    ? 'bg-transparent text-slate-800 font-semibold cursor-default border-transparent'
                                    : 'border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 bg-white'
                                }`}
                              />
                            </td>

                            {/* DNI */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={fila.dni}
                                disabled={fila.guardado || isDeadlineExpired}
                                onChange={e => actualizarFila(idx, 'dni', e.target.value)}
                                placeholder="DNI"
                                className={`w-full text-sm rounded-lg px-3 py-2 outline-hidden transition-all ${
                                  fila.guardado
                                    ? 'bg-transparent text-slate-700 cursor-default border-transparent'
                                    : 'border border-slate-200 focus:border-indigo-400 bg-white'
                                }`}
                              />
                            </td>

                            {/* Edad */}
                            <td className="p-2">
                              <input
                                type="number"
                                value={fila.edad}
                                disabled={fila.guardado || isDeadlineExpired}
                                onChange={e => actualizarFila(idx, 'edad', e.target.value)}
                                placeholder="Edad"
                                min="1"
                                className={`w-full text-sm rounded-lg px-3 py-2 outline-hidden transition-all ${
                                  fila.guardado
                                    ? 'bg-transparent text-slate-700 cursor-default border-transparent'
                                    : 'border border-slate-200 focus:border-indigo-400 bg-white'
                                }`}
                              />
                            </td>

                            {/* Dorsal */}
                            <td className="p-2">
                              <input
                                type="number"
                                value={fila.dorsal}
                                disabled={fila.guardado || isDeadlineExpired}
                                onChange={e => actualizarFila(idx, 'dorsal', e.target.value)}
                                placeholder="#"
                                min="1"
                                className={`w-full text-sm rounded-lg px-3 py-2 outline-hidden transition-all ${
                                  fila.guardado
                                    ? 'bg-transparent text-slate-700 cursor-default border-transparent'
                                    : 'border border-slate-200 focus:border-indigo-400 bg-white'
                                }`}
                              />
                            </td>

                            {/* Acciones */}
                            <td className="p-2 pr-5 text-right flex justify-end gap-2.5 items-center">
                              {fila.guardado ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const jug = jugadoresDePlanilla.find(j => j.id === fila.id);
                                      if (jug) abrirModalEditarJugador(jug);
                                    }}
                                    disabled={isDeadlineExpired}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-850 disabled:opacity-50 disabled:cursor-not-allowed hover:underline cursor-pointer transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    onClick={() => { if (!isDeadlineExpired) eliminarFilaJugador(idx); }}
                                    disabled={isDeadlineExpired}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline hover:underline cursor-pointer transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => guardarFila(idx)}
                                  disabled={fila.guardando || isDeadlineExpired}
                                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                                >
                                  {fila.guardando
                                    ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    : <span className="material-symbols-outlined text-xs">save</span>
                                  }
                                  {fila.guardando ? 'Guardando' : 'Guardar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}

                        {/* Error inline */}
                        {filasJugadores.map((fila, idx) =>
                          fila.error ? (
                            <tr key={`err-${idx}`} className="bg-rose-50">
                              <td colSpan={6} className="px-5 py-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">error</span>
                                Fila {idx + 1}: {fila.error}
                              </td>
                            </tr>
                          ) : null
                        )}

                        {filasJugadores.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 text-xs">
                              Sin jugadores aún. Completa la primera fila y guarda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pie con tip */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-slate-400">info</span>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Cada fila se guarda individualmente. Las filas guardadas quedan en gris y no se pueden editar desde aquí.
                  </p>
                </div>
              </div>
            )}

            {/* Estado vacío */}
            {!equipoSel && !cargando && (
              <div className="bg-[#11131c] border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-600">group_add</span>
                <p className="text-slate-400 text-sm font-semibold">Selecciona un equipo para ver y llenar su planilla de jugadores.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal Añadir Equipo ── */}
      {modalNuevoEqAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#11131c] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-150 dark:border-slate-800/80 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-855 bg-slate-50 dark:bg-[#151722]/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-650 dark:text-indigo-400 text-base">group_add</span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide">Añadir Nuevo Equipo</h3>
              </div>
              <button
                onClick={() => {
                  setModalNuevoEqAbierto(false);
                  setNuevoEq({ name: '', representative: '', discipline_id: '', category_id: '', enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' });
                  setLogoEqFile(null); setLogoEqUrl('');
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={guardarEquipo} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto font-sans">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Nombre del Equipo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Real Arequipa"
                  value={nuevoEq.name}
                  onChange={(e) => setNuevoEq({ ...nuevoEq, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                />
              </div>

              {!nuevoEq.enable_delegate && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Delegado/Representante (Solo Nombre)</label>
                  <input
                    type="text"
                    placeholder="Representante del equipo"
                    value={nuevoEq.representative}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, representative: e.target.value })}
                    className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                  />
                </div>
              )}

              <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/55 dark:bg-[#151722]/30 rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={nuevoEq.enable_delegate}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, enable_delegate: e.target.checked })}
                    className="w-4 h-4 text-indigo-650 border-slate-350 dark:border-slate-800 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-855 dark:text-slate-200">Habilitar cuenta de acceso para el Delegado</span>
                </label>
                
                {nuevoEq.enable_delegate && (
                  <div className="space-y-2.5 pt-1.5 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block">Nombre del Delegado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre completo"
                        value={nuevoEq.delegate_name}
                        onChange={(e) => setNuevoEq({ ...nuevoEq, delegate_name: e.target.value })}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="correo@ejemplo.com"
                        value={nuevoEq.delegate_email}
                        onChange={(e) => setNuevoEq({ ...nuevoEq, delegate_email: e.target.value })}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block">Contraseña Temporal *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Clave de 8+ caracteres"
                          value={nuevoEq.delegate_password}
                          onChange={(e) => setNuevoEq({ ...nuevoEq, delegate_password: e.target.value })}
                          className="flex-1 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2 outline-hidden focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                            let pass = '';
                            for (let i = 0; i < 10; i++) {
                              pass += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setNuevoEq({ ...nuevoEq, delegate_password: pass });
                          }}
                          className="px-2.5 py-2 text-xs font-bold text-indigo-655 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-855 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                          Generar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Disciplina *</label>
                  <select
                    required
                    value={nuevoEq.discipline_id}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, discipline_id: e.target.value, category_id: '' })}
                    className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="">Seleccionar Disciplina</option>
                    {disciplinas.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Categoría *</label>
                  <select
                    required
                    value={nuevoEq.category_id}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, category_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="">Seleccionar Categoría</option>
                    {categorias
                      .filter((c) => !nuevoEq.discipline_id || c.championship_discipline_id === parseInt(nuevoEq.discipline_id))
                      .map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <LogoInput
                logoFile={logoEqFile}
                logoUrlTexto={logoEqUrl}
                onFileChange={setLogoEqFile}
                onUrlChange={setLogoEqUrl}
              />

              <div className="pt-2 border-t border-slate-100 dark:border-slate-855 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevoEqAbierto(false);
                    setNuevoEq({ name: '', representative: '', discipline_id: '', category_id: '', enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' });
                    setLogoEqFile(null); setLogoEqUrl('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-855 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-655 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">save</span>
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Ver Detalles del Equipo ── */}
      {modalVerEq.abierto && modalVerEq.eq && (() => {
        const eq = modalVerEq.eq;
        const jugadoresDelEquipo = jugadores.filter(j => (j.team_id ?? j.team?.id) === eq.id);
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#11131c] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151722]/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-base">info</span>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">Detalle del Equipo</h3>
                </div>
                <button
                  onClick={() => setModalVerEq({ abierto: false, eq: null })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Logo y Nombre principal */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-24 h-24 rounded-full border border-slate-200 dark:border-slate-850 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#171a26] mb-3 shadow-inner">
                    {eq.logo ? (
                      <img src={resolverUrlImagen(eq.logo) || ''} alt={eq.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-400 dark:text-slate-500 font-extrabold uppercase">{eq.name[0] || '?'}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{eq.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-bold uppercase tracking-wider mt-1">
                    Delegado: {eq.representative || <span className="text-slate-400 dark:text-slate-500 italic">No registrado</span>}
                  </p>
                </div>

                {/* Grid de Información Técnica */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="bg-slate-50 dark:bg-[#171a26] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Disciplina</p>
                    <p className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">{eq.discipline?.name || 'No asignada'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#171a26] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Categoría</p>
                    <p className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">{eq.category?.name || 'No asignada'}</p>
                  </div>
                </div>

                {/* Selector de Estado */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#171a26] p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs font-sans">
                  <span className="text-slate-550 dark:text-slate-550 font-bold uppercase tracking-wider">Estado del Registro:</span>
                  <select
                    value={eq.registration_status || 'pendiente'}
                    onChange={async (e) => {
                      const nuevoEstado = e.target.value as 'pendiente' | 'aprobado' | 'rechazado';
                      await cambiarEstadoEquipo(eq.id, nuevoEstado);
                      setModalVerEq(prev => prev.eq ? { ...prev, eq: { ...prev.eq, registration_status: nuevoEstado } } : prev);
                    }}
                    className={`text-xs font-bold uppercase tracking-wide rounded px-2.5 py-1 border cursor-pointer outline-hidden transition-colors ${
                      eq.registration_status === 'aprobado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : eq.registration_status === 'rechazado'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20'
                    }`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>

                {/* Jugadores Inscritos */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 font-sans">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Jugadores Inscritos ({jugadoresDelEquipo.length})</h4>
                  {jugadoresDelEquipo.length === 0 ? (
                    <p className="text-xs text-slate-450 dark:text-slate-500 italic py-2">No hay jugadores inscritos en este equipo.</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {jugadoresDelEquipo.map(j => (
                        <li key={j.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-[#11131c] border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                          <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                          <span className="font-semibold">{j.full_name || j.name}</span>
                          {j.jersey_number && <span className="ml-auto text-slate-400 dark:text-slate-500 font-mono">#{j.jersey_number}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Delegado */}
                {eq.delegate && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3 text-xs font-sans">
                    <p className="text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Cuenta de Delegado</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{eq.delegate.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{eq.delegate.email}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2 bg-slate-50 dark:bg-[#151722]/50">
                {delegadoTeamId === null && (
                  <>
                    <button
                      onClick={async () => {
                        setModalVerEq({ abierto: false, eq: null });
                        await eliminarElemento(eq.id);
                      }}
                      className="mr-auto px-3 py-2 text-xs font-bold text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-950/30 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      Eliminar
                    </button>
                    <button
                      onClick={() => {
                        setModalVerEq({ abierto: false, eq: null });
                        abrirModalEditar(eq);
                      }}
                      className="px-4 py-2 text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-850 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      Editar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setModalVerEq({ abierto: false, eq: null })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal Editar Equipo ── */}
      {modalEditarEq.abierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#11131c] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-150 dark:border-slate-800/80 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-[#151722]/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-base">edit</span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide">Editar Equipo</h3>
              </div>
              <button
                onClick={() => setModalEditarEq({ abierto: false, eq: null, nombre: '', representante: '', estado: 'pendiente', guardando: false, enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' })}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Nombre del Equipo *</label>
                <input
                  type="text"
                  value={modalEditarEq.nombre}
                  onChange={e => setModalEditarEq(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del equipo"
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                />
              </div>

              {/* Representante */}
              {!modalEditarEq.enable_delegate && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Representante / Delegado (Solo Nombre)</label>
                  <input
                    type="text"
                    value={modalEditarEq.representante}
                    onChange={e => setModalEditarEq(prev => ({ ...prev, representante: e.target.value }))}
                    placeholder="Nombre del representante"
                    className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                  />
                </div>
              )}

              <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/55 dark:bg-[#151722]/30 rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalEditarEq.enable_delegate}
                    onChange={(e) => setModalEditarEq(prev => ({ ...prev, enable_delegate: e.target.checked }))}
                    className="w-4 h-4 text-indigo-650 border-slate-350 dark:border-slate-800 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-855 dark:text-slate-200">Habilitar cuenta de acceso para el Delegado</span>
                </label>

                {modalEditarEq.enable_delegate && (
                  <div className="space-y-2.5 pt-1.5 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block">Nombre del Delegado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre completo"
                        value={modalEditarEq.delegate_name}
                        onChange={(e) => setModalEditarEq(prev => ({ ...prev, delegate_name: e.target.value }))}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="correo@ejemplo.com"
                        value={modalEditarEq.delegate_email}
                        onChange={(e) => setModalEditarEq(prev => ({ ...prev, delegate_email: e.target.value }))}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase block">Contraseña Temporal / Restablecer</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Dejar en blanco para no cambiar"
                          value={modalEditarEq.delegate_password || ''}
                          onChange={(e) => setModalEditarEq(prev => ({ ...prev, delegate_password: e.target.value }))}
                          className="flex-1 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2 outline-hidden focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                            let pass = '';
                            for (let i = 0; i < 10; i++) {
                              pass += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setModalEditarEq(prev => ({ ...prev, delegate_password: pass }));
                          }}
                          className="px-2.5 py-2 text-xs font-bold text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-850 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex items-center gap-1"
                        >
                          Generar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Estado de Registro</label>
                <select
                  value={modalEditarEq.estado}
                  onChange={e => setModalEditarEq(prev => ({ ...prev, estado: e.target.value as 'pendiente' | 'aprobado' | 'rechazado' }))}
                  className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#171a26] text-slate-900 dark:text-slate-100 rounded-lg p-2.5 outline-hidden cursor-pointer"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <LogoInput
                logoFile={logoEditFile}
                logoUrlTexto={logoEditUrl}
                logoActualUrl={modalEditarEq.eq?.logo}
                onFileChange={setLogoEditFile}
                onUrlChange={setLogoEditUrl}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-855 flex items-center justify-end gap-3 bg-slate-50 dark:bg-[#171a26]/20">
              <button
                onClick={() => setModalEditarEq({ abierto: false, eq: null, nombre: '', representante: '', estado: 'pendiente', guardando: false, enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' })}
                disabled={modalEditarEq.guardando}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-855 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionEq}
                disabled={modalEditarEq.guardando || !modalEditarEq.nombre.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-650 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {modalEditarEq.guardando
                  ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
                  : <><span className="material-symbols-outlined text-xs">save</span>Guardar Cambios</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Jugador ── */}
      {modalEditarJug.abierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-base">edit</span>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Editar Jugador</h3>
              </div>
              <button
                onClick={() => setModalEditarJug(prev => ({ ...prev, abierto: false }))}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre Completo *</label>
                <input
                  type="text"
                  value={modalEditarJug.nombre}
                  onChange={e => setModalEditarJug(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del jugador"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                />
              </div>

              {/* DNI y Dorsal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">DNI</label>
                  <input
                    type="text"
                    value={modalEditarJug.dni}
                    onChange={e => setModalEditarJug(prev => ({ ...prev, dni: e.target.value }))}
                    placeholder="DNI"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Dorsal</label>
                  <input
                    type="number"
                    value={modalEditarJug.numero}
                    onChange={e => setModalEditarJug(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="Ej: 10"
                    min="1"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                  />
                </div>
              </div>

              {/* Equipo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Equipo *</label>
                <select
                  value={delegadoTeamId !== null ? String(delegadoTeamId) : modalEditarJug.teamId}
                  disabled={delegadoTeamId !== null}
                  onChange={e => setModalEditarJug(prev => ({ ...prev, teamId: e.target.value }))}
                  className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500"
                >
                  <option value="">Seleccionar Equipo</option>
                  {equipos.map((eq) => <option key={eq.id} value={String(eq.id)}>{eq.name}</option>)}
                </select>
              </div>

              <LogoInput
                logoFile={fotoEditJugFile}
                logoUrlTexto={fotoEditJugUrl}
                logoActualUrl={modalEditarJug.jug?.photo}
                onFileChange={setFotoEditJugFile}
                onUrlChange={setFotoEditJugUrl}
                label="Foto del Jugador"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalEditarJug(prev => ({ ...prev, abierto: false }))}
                disabled={modalEditarJug.guardando}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionJugador}
                disabled={modalEditarJug.guardando || !modalEditarJug.nombre.trim() || !modalEditarJug.teamId}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {modalEditarJug.guardando
                  ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
                  : <><span className="material-symbols-outlined text-xs">save</span>Guardar Cambios</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante de Ayuda */}
      <button
        onClick={() => setMostrarAyuda(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 cursor-pointer"
        title="¿Cómo usar esta sección?"
      >
        <span className="material-symbols-outlined text-lg">question_mark</span>
      </button>

      {/* Drawer de Ayuda */}
      {mostrarAyuda && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">help</span>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Ayuda: Equipos y Jugadores</h3>
              </div>
              <button
                onClick={() => setMostrarAyuda(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
                Sigue estos pasos en orden para inscribir correctamente a los competidores de tu torneo:
              </p>
              {PASOS_AYUDA_PARTICIPANTES.map((p) => (
                <div key={p.paso} className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                  p.paso === '6' || p.paso === '7'
                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                }`}>
                  <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border ${
                    p.paso === '6' || p.paso === '7'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {p.paso}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-slate-400">{p.icono}</span>
                      {p.titulo}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">💡 Consejo rápido:</p>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                Si un jugador no aparece para registrar, asegúrate de que el equipo esté aprobado. El fixture Round Robin solo se podrá generar con equipos aprobados.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
};
