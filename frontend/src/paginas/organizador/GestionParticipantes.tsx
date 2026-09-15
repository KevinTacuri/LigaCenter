import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  fotoFile?: File | null; // archivo de foto para subir
  fotoUrlLocal?: string | null; // url local para previsualización
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
// COMPONENTE: Paginación reutilizable
// ─────────────────────────────────────────────
interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  totalItems: number;
  itemsPorPagina: number;
  onCambiar: (pagina: number) => void;
}

const Paginacion: React.FC<PaginacionProps> = ({
  paginaActual, totalPaginas, totalItems, itemsPorPagina, onCambiar
}) => {
  if (totalPaginas <= 1) return null;
  const desde = (paginaActual - 1) * itemsPorPagina + 1;
  const hasta = Math.min(paginaActual * itemsPorPagina, totalItems);

  return (
    <div className="col-span-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-outline">
      <p className="text-[11px] text-on-surface-variant font-semibold">
        Mostrando {desde}–{hasta} de {totalItems}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onCambiar(Math.max(1, paginaActual - 1))}
          disabled={paginaActual === 1}
          className="w-8 h-8 rounded-lg border border-outline flex items-center justify-center text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-bright transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        <span className="text-xs font-bold text-on-surface px-2 select-none">
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={() => onCambiar(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual === totalPaginas}
          className="w-8 h-8 rounded-lg border border-outline flex items-center justify-center text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-bright transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

const PASOS_AYUDA_DELEGADO = [
  { paso: '1', titulo: 'Seleccionar tu Equipo', desc: 'Verifica los datos y categoría de tu equipo asignado.', icono: 'groups' },
  { paso: '2', titulo: 'Modalidad de Carga', desc: 'Descarga la plantilla Excel/CSV para carga masiva o usa el formulario uno por uno.', icono: 'upload_file' },
  { paso: '3', titulo: 'Dorsales y DNI Únicos', desc: 'El número de dorsal no se puede repetir en el mismo equipo y cada deportista debe tener un DNI/cédula único.', icono: 'badge' },
  { paso: '4', titulo: 'Foto de Perfil', desc: 'Adjunta la foto de cada jugador para su carnet digital oficial.', icono: 'add_a_photo' },
  { paso: '5', titulo: 'Habilitación de Planilla', desc: 'El organizador del torneo validará tus deportistas para su participación.', icono: 'check_circle' },
];

const PASOS_AYUDA_PARTICIPANTES = [
  { paso: '1', titulo: 'Crear Disciplina', desc: 'Registra los deportes a disputar en el torneo (Fútbol, Básquet, Volley...).', icono: 'sports' },
  { paso: '2', titulo: 'Crear Categorías', desc: 'Define las divisiones por edad o género para cada disciplina (Sub-15, Libres...).', icono: 'category' },
  { paso: '3', titulo: 'Inscribir Equipos', desc: 'Registra los clubes o representativos asignando su categoría correspondiente.', icono: 'shield' },
  { paso: '4', titulo: 'Asignar Delegados', desc: 'Vincula al representante oficial responsable de la planilla de cada equipo.', icono: 'badge' },
  { paso: '5', titulo: 'Cargar Jugadores', desc: 'Inscribe deportistas individualmente o mediante plantilla de carga masiva Excel/CSV.', icono: 'person_add' },
  { paso: '6', titulo: 'Validación de Dorsales', desc: 'Asegura que no existan dorsales duplicados en el mismo plantel.', icono: 'tag' },
  { paso: '7', titulo: 'Estado de Planilla', desc: 'Aprueba la nómina del equipo para habilitarlo en el fixture oficial.', icono: 'how_to_reg' },
];

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
  const [tabActiva, setTabActiva] = useState<TabType>(
    (queryTab as TabType) || 'categorias'
  );

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
  const [paginaEq, setPaginaEq] = useState(1);
  const ITEMS_POR_PAGINA_EQ = 10; // ajusta la cantidad de tarjetas por página aquí

  // ── Estado: Filtros y orden de la tabla de Categorías ──
  const [busquedaCat, setBusquedaCat] = useState('');
  const [filtroGenderCat, setFiltroGenderCat] = useState('todos');
  const [filtroDiscCat, setFiltroDiscCat] = useState('todos');
  const [modalNuevaCatAbierto, setModalNuevaCatAbierto] = useState(false);

  // ── Estado: Filtros y orden de la tabla de Jugadores ──
  const [busquedaJug, setBusquedaJug] = useState('');
  const [ordenJug, setOrdenJug] = useState<'nombre_asc' | 'nombre_desc' | 'equipo_asc' | 'equipo_desc'>('nombre_asc');
  const [filtroCategoriaJug, setFiltroCategoriaJug] = useState<number | null>(null);
  const [filtroEquipoJug, setFiltroEquipoJug] = useState<number | null>(null);
  const [paginaJug, setPaginaJug] = useState(1);
  const ITEMS_POR_PAGINA_JUG = 8; // ajusta la cantidad de tarjetas por página 

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
  const [modalNuevoJugAbierto, setModalNuevoJugAbierto] = useState(false);
  const [modalCargaMasivaAbierto, setModalCargaMasivaAbierto] = useState(false);
  const [modalVerEq, setModalVerEq] = useState<{ abierto: boolean; eq: Equipo | null }>({ abierto: false, eq: null });

  const cerrarModalNuevoJug = () => {
    setModalNuevoJugAbierto(false);
    setNuevoJug({ name: '', dni: '', age: '', phone: '', team_id: delegadoTeamId !== null ? String(delegadoTeamId) : (equipoSelId ? String(equipoSelId) : ''), number: '', position: 'Delantero' });
    setFotoJugFile(null);
    setFotoJugUrl('');
  };

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

  const [modalEditarCat, setModalEditarCat] = useState<{
    abierto: boolean;
    id: number | null;
    name: string;
    age_min: string;
    age_max: string;
    gender: string;
    guardando: boolean;
  }>({
    abierto: false,
    id: null,
    name: '',
    age_min: '',
    age_max: '',
    gender: 'Masculino',
    guardando: false,
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

    // Volver a la página 1 cada vez que cambian los filtros de Equipos
  useEffect(() => {
    setPaginaEq(1);
  }, [busquedaEq, filtroEstadoEq, filtroCategoriaEq, ordenEq]);

  // Volver a la página 1 cada vez que cambian los filtros de Jugadores
  useEffect(() => {
    setPaginaJug(1);
  }, [busquedaJug, ordenJug, filtroCategoriaJug, filtroEquipoJug]);

  // Cierre de modales con la tecla Escape (a11y)
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalEditarJug.abierto) {
          setModalEditarJug(prev => ({ ...prev, abierto: false }));
        }
        if (modalNuevoEqAbierto) {
          setModalNuevoEqAbierto(false);
          setNuevoEq({ name: '', representative: '', discipline_id: '', category_id: '', enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' });
          setLogoEqFile(null); setLogoEqUrl('');
        }
        if (modalEditarEq.abierto) {
          setModalEditarEq(prev => ({ ...prev, abierto: false }));
        }
        if (mostrarAyuda) {
          setMostrarAyuda(false);
        }
      }
    };
    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [modalEditarJug.abierto, modalNuevoEqAbierto, modalEditarEq.abierto, mostrarAyuda]);

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
        setModalNuevaCatAbierto(false);
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

  const abrirModalEditarCat = (c: Categoria) => {
    setModalEditarCat({
      abierto: true,
      id: c.id,
      name: c.name,
      age_min: c.age_min != null ? String(c.age_min) : '',
      age_max: c.age_max != null ? String(c.age_max) : '',
      gender: c.gender_type || 'Masculino',
      guardando: false
    });
  };

  const guardarEdicionCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarCat.id || !modalEditarCat.name) return;
    setModalEditarCat(prev => ({ ...prev, guardando: true }));
    try {
      const res = await serviciosParticipantes.actualizarCategoria(modalEditarCat.id, {
        name: modalEditarCat.name,
        age_min: modalEditarCat.age_min ? parseInt(modalEditarCat.age_min) : null,
        age_max: modalEditarCat.age_max ? parseInt(modalEditarCat.age_max) : null,
        gender_type: modalEditarCat.gender,
      });
      if (res.success) {
        mostrarMensaje('Categoría actualizada exitosamente.');
        setModalEditarCat({ abierto: false, id: null, name: '', age_min: '', age_max: '', gender: 'Masculino', guardando: false });
        cargarDatos();
      }
    } catch (err) {
      mostrarMensaje('Error al actualizar categoría.', true);
      setModalEditarCat(prev => ({ ...prev, guardando: false }));
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

    
  // Paginación sobre la lista ya filtrada/ordenada
  const totalPaginasEq = Math.max(1, Math.ceil(equiposFiltrados.length / ITEMS_POR_PAGINA_EQ));
  const equiposPaginados = equiposFiltrados.slice(
    (paginaEq - 1) * ITEMS_POR_PAGINA_EQ,
    paginaEq * ITEMS_POR_PAGINA_EQ
  );

  // Lista de jugadores filtrada y ordenada para la tabla (no modifica `jugadores` original)
  const jugadoresFiltrados = jugadores
    .filter(j => {
      const texto = busquedaJug.trim().toLowerCase();
      const coincideTexto = !texto || j.name.toLowerCase().includes(texto);
      const teamIdJugador = j.team_id || j.team?.id;
      const coincideEquipoDelegado = delegadoTeamId === null || teamIdJugador === delegadoTeamId;
      const coincideCategoria = !filtroCategoriaJug || j.team?.category?.id === filtroCategoriaJug;
      const coincideEquipo = !filtroEquipoJug || teamIdJugador === filtroEquipoJug;
      return coincideTexto && coincideEquipoDelegado && coincideCategoria && coincideEquipo;
    })
    .sort((a, b) => {
      if (ordenJug === 'nombre_asc') return a.name.localeCompare(b.name);
      if (ordenJug === 'nombre_desc') return b.name.localeCompare(a.name);
      if (ordenJug === 'equipo_asc') return (a.team?.name || '').localeCompare(b.team?.name || '');
      if (ordenJug === 'equipo_desc') return (b.team?.name || '').localeCompare(a.team?.name || '');
      return 0;
    });

  // Paginación sobre la lista ya filtrada/ordenada
  const totalPaginasJug = Math.max(1, Math.ceil(jugadoresFiltrados.length / ITEMS_POR_PAGINA_JUG));
  const jugadoresPaginados = jugadoresFiltrados.slice(
    (paginaJug - 1) * ITEMS_POR_PAGINA_JUG,
    paginaJug * ITEMS_POR_PAGINA_JUG
  );



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
    <div className="min-h-screen bg-background text-on-surface font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen adaptativo */}
      <div className={`${delegadoTeamId !== null ? 'w-full' : 'lg:ml-64'} flex flex-col min-h-screen relative z-10 transition-all duration-300`}>
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
          <div className="w-full space-y-4">
            {/* Columna de Contenido Principal (Categorías, Equipos, Jugadores) */}
            <div className="bg-primary-container text-on-surface rounded-2xl border border-outline p-6 shadow-xs space-y-4 w-full">
              
              {/* Encabezado Principal del Tab con Botón de Acción Modal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-4">
                <div>
                  <h2 className="font-black text-base uppercase tracking-wide text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {tabActiva === 'categorias' ? 'category' : tabActiva === 'equipos' ? 'groups' : 'person'}
                    </span>
                    Gestión de {tabActiva === 'categorias' ? 'Categorías' : tabActiva === 'equipos' ? 'Equipos' : 'Jugadores'}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                    {tabActiva === 'categorias' && `Total: ${categorias.length} categorías registradas.`}
                    {tabActiva === 'equipos' && `Total: ${equipos.length} equipos en el campeonato.`}
                    {tabActiva === 'jugadores' && `Total: ${jugadores.length} jugadores inscritos.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {tabActiva === 'categorias' && (
                    <button
                      type="button"
                      onClick={() => setModalNuevaCatAbierto(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      Añadir Categoría
                    </button>
                  )}
                  {tabActiva === 'equipos' && (
                    <button
                      type="button"
                      onClick={() => setModalNuevoEqAbierto(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      Añadir Equipo
                    </button>
                  )}
                  {tabActiva === 'jugadores' && (
                    <button
                      type="button"
                      onClick={() => setModalNuevoJugAbierto(true)}
                      disabled={isDeadlineExpired}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Añadir Jugador
                    </button>
                  )}
                </div>
              </div>

              {/* ── Barra de Filtros y Búsqueda (Categorías) ── */}
              {tabActiva === 'categorias' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative sm:col-span-1">
                      <input
                        type="text"
                        placeholder="Buscar categoría..."
                        value={busquedaCat}
                        onChange={(e) => setBusquedaCat(e.target.value)}
                        className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 pr-8 outline-none focus:border-primary"
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                        search
                      </span>
                    </div>

                    <select
                      value={filtroGenderCat}
                      onChange={(e) => setFiltroGenderCat(e.target.value)}
                      className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="todos">Todos los géneros</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Mixto">Mixto</option>
                    </select>

                    <select
                      value={filtroDiscCat}
                      onChange={(e) => setFiltroDiscCat(e.target.value)}
                      className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="todos">Todas las disciplinas</option>
                      {disciplinas.map((d) => (
                        <option key={d.id} value={String(d.id)}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ── Barra de Filtros y Búsqueda (Equipos) ── */}
              {tabActiva === 'equipos' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-1">
                      <input
                        type="text"
                        placeholder="Buscar por nombre o delegado..."
                        value={busquedaEq}
                        onChange={(e) => setBusquedaEq(e.target.value)}
                        className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 pr-8 outline-none focus:border-primary"
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                        search
                      </span>
                    </div>

                    <select
                      value={filtroCategoriaEq}
                      onChange={(e) => setFiltroCategoriaEq(e.target.value)}
                      className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
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

                    <select
                      value={filtroEstadoEq}
                      onChange={(e) => setFiltroEstadoEq(e.target.value as any)}
                      className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="rechazado">Rechazado</option>
                    </select>

                    <select
                      value={ordenEq}
                      onChange={(e) => setOrdenEq(e.target.value as any)}
                      className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="nombre_asc">Nombre (A-Z)</option>
                      <option value="nombre_desc">Nombre (Z-A)</option>
                      <option value="representante_asc">Representante (A-Z)</option>
                      <option value="representante_desc">Representante (Z-A)</option>
                      <option value="estado">Estado</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── Barra de Filtros y Búsqueda (Jugadores) ── */}
              {tabActiva === 'jugadores' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative md:col-span-2">
                      <input
                        type="text"
                        placeholder="Buscar por nombre del jugador o DNI..."
                        value={busquedaJug}
                        onChange={(e) => setBusquedaJug(e.target.value)}
                        className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 pr-8 outline-none focus:border-primary"
                      />
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
                        search
                      </span>
                    </div>

                    <select
                      value={ordenJug}
                      onChange={(e) => setOrdenJug(e.target.value as any)}
                      className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="nombre_asc">Nombre (A-Z)</option>
                      <option value="nombre_desc">Nombre (Z-A)</option>
                      <option value="equipo_asc">Equipo (A-Z)</option>
                      <option value="equipo_desc">Equipo (Z-A)</option>
                    </select>
                  </div>

                  {delegadoTeamId === null && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={filtroCategoriaJug ?? ''}
                        onChange={(e) => {
                          setFiltroCategoriaJug(e.target.value ? Number(e.target.value) : null);
                          setFiltroEquipoJug(null);
                        }}
                        className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                      >
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={filtroEquipoJug ?? ''}
                        onChange={(e) => setFiltroEquipoJug(e.target.value ? Number(e.target.value) : null)}
                        className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                      >
                        <option value="">Todos los equipos</option>
                        {equipos
                          .filter((eq) => !filtroCategoriaJug || eq.category?.id === filtroCategoriaJug)
                          .map((eq) => (
                            <option key={eq.id} value={eq.id}>{eq.name}</option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Loader */}
              {cargando ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
                  <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Cargando registros...</span>
                </div>
              ) : tabActiva === 'categorias' ? (
                /* ── Galería de Tarjetas de Categorías ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2 animate-fadeIn">
                  {categorias.filter((c) => {
                    const q = busquedaCat.toLowerCase().trim();
                    const discName = c.championship_discipline?.discipline?.name?.toLowerCase() || '';
                    const matchBusqueda = !q || c.name.toLowerCase().includes(q) || discName.includes(q);
                    const matchGender = filtroGenderCat === 'todos' || (c.gender_type || c.gender || '').toLowerCase() === filtroGenderCat.toLowerCase();
                    const matchDisc = filtroDiscCat === 'todos' || String(c.championship_discipline?.discipline_id || c.discipline_id) === filtroDiscCat;
                    return matchBusqueda && matchGender && matchDisc;
                  }).map((c) => (
                    <div
                      key={c.id}
                      className="group relative flex flex-col justify-between p-5 bg-primary-container hover:bg-surface border border-outline hover:border-primary/50 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between w-full mb-3 gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 truncate">
                          {c.championship_discipline?.discipline?.name || 'Deporte'}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                          (c.gender_type || c.gender) === 'Femenino'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : (c.gender_type || c.gender) === 'Mixto'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        }`}>
                          {c.gender_type || c.gender || 'General'}
                        </span>
                      </div>

                      {/* Main Info */}
                      <div className="my-2 space-y-1">
                        <h4 className="text-base font-extrabold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {c.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium pt-1">
                          <span className="material-symbols-outlined text-sm text-primary">group</span>
                          <span>Rango de edad: <strong>{c.age_min ?? 0} - {c.age_max ?? 'Sin límite'} años</strong></span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-outline/60 w-full flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirModalEditarCat(c)}
                          className="px-3 py-1.5 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarElemento(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {categorias.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">category</span>
                      <p className="text-xs font-bold uppercase tracking-wider">No hay categorías creadas aún</p>
                    </div>
                  )}
                </div>
) : tabActiva === 'equipos' ? (
                /* ── Galería de Tarjetas de Equipos ── */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 py-2 animate-fadeIn">
                  {equiposPaginados.map((eq) => (
                    <div
                      key={eq.id}
                      className="group relative flex flex-col justify-between p-5 bg-primary-container hover:bg-surface border border-outline hover:border-primary/50 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Header de la Tarjeta */}
                      <div className="flex items-center justify-between w-full mb-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          eq.registration_status === 'aprobado'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : eq.registration_status === 'rechazado'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {eq.registration_status || 'pendiente'}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Ver Detalle"
                            onClick={(e) => { e.stopPropagation(); setModalVerEq({ abierto: true, eq }); }}
                            className="w-7 h-7 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button
                            type="button"
                            title="Editar Equipo"
                            onClick={(e) => { e.stopPropagation(); abrirModalEditar(eq); }}
                            className="w-7 h-7 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        </div>
                      </div>

                      {/* Contenido Central: Logo y Nombre */}
                      <div
                        onClick={() => setModalVerEq({ abierto: true, eq })}
                        className="flex flex-col items-center text-center cursor-pointer my-1"
                      >
                        <div className="w-20 h-20 rounded-full border-2 border-outline flex items-center justify-center overflow-hidden bg-surface mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                          {eq.logo ? (
                            <img src={resolverUrlImagen(eq.logo) || ''} alt={eq.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl text-on-surface-variant font-extrabold uppercase">{eq.name[0] || '?'}</span>
                          )}
                        </div>

                        <h4 className="text-sm font-extrabold text-on-surface line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                          {eq.name}
                        </h4>
                      </div>

                      {/* Pie con Estado de Delegado */}
                      <div className="mt-3 pt-3 border-t border-outline/60 w-full flex items-center justify-center">
                        {eq.championship_user?.user?.name || eq.representative ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold truncate max-w-full">
                            <span className="material-symbols-outlined text-[13px]">badge</span>
                            <span className="truncate">{eq.championship_user?.user?.name || eq.representative}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); abrirModalEditar(eq); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">add_circle</span>
                            <span>Asignar Delegado</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {equiposFiltrados.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">group_off</span>
                      <p className="text-xs font-bold uppercase tracking-wider">No se encontraron equipos</p>
                    </div>
                  )}

                  <Paginacion
                    paginaActual={paginaEq}
                    totalPaginas={totalPaginasEq}
                    totalItems={equiposFiltrados.length}
                    itemsPorPagina={ITEMS_POR_PAGINA_EQ}
                    onCambiar={setPaginaEq}
                  />
                </div>

              ) : (
                /* ── Galería de Tarjetas de Jugadores ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2 animate-fadeIn">
                  {jugadoresPaginados.map((j) => (
                    <div
                      key={j.id}
                      className="group relative flex flex-col justify-between p-5 bg-primary-container hover:bg-surface border border-outline hover:border-primary/50 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between w-full mb-3 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">tag</span>
                          #{j.number ?? 'N/A'}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface border border-outline text-on-surface-variant truncate max-w-[120px]">
                          {j.team?.name || 'Sin equipo'}
                        </span>
                      </div>

                      {/* Avatar y Datos del Jugador */}
                      <div className="flex items-center gap-3.5 my-2">
                        <div className="w-14 h-14 rounded-full border-2 border-outline flex items-center justify-center overflow-hidden bg-surface shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
                          {j.photo ? (
                            <img src={resolverUrlImagen(j.photo) || ''} alt={j.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl text-on-surface-variant font-extrabold uppercase">{j.name[0] || '?'}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-on-surface truncate leading-snug group-hover:text-primary transition-colors">
                            {j.name}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                            DNI: {j.dni || 'Sin DNI'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mt-1 font-bold">
                            {j.age && <span>{j.age} años</span>}
                            {j.position && <span className="bg-surface px-1.5 py-0.5 rounded border border-outline uppercase">{j.position}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-outline/60 w-full flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirModalEditarJugador(j)}
                          className="px-3 py-1.5 rounded-lg bg-surface border border-outline text-on-surface hover:text-primary text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarElemento(j.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {jugadoresFiltrados.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">person_off</span>
                      <p className="text-xs font-bold uppercase tracking-wider">No se encontraron jugadores</p>
                    </div>
                  )}

                  <Paginacion
                    paginaActual={paginaJug}
                    totalPaginas={totalPaginasJug}
                    totalItems={jugadoresFiltrados.length}
                    itemsPorPagina={ITEMS_POR_PAGINA_JUG}
                    onCambiar={setPaginaJug}
                  />
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
              <div className="relative rounded-2xl bg-primary-container border border-outline p-5 shadow-xs overflow-hidden text-on-surface">
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 pl-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <span className="material-symbols-outlined text-xs">shield</span>
                      Delegado de Equipo Autorizado
                    </span>
                    <h3 className="text-base font-black text-on-surface tracking-tight leading-none">
                      Panel de Inscripción de {equipoSel?.name || 'Cargando equipo...'}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed mt-1">
                      Como delegado oficial, tienes permisos para inscribir jugadores, dorsales y gestionar tu planilla.
                    </p>
                  </div>
                  {equipoSel?.logo && (
                    <div className="w-14 h-14 rounded-2xl bg-surface border border-outline flex items-center justify-center p-2 shrink-0 shadow-2xs">
                      <img src={equipoSel.logo} className="w-full h-full object-contain" alt="Logo Equipo" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-primary-container rounded-2xl border border-outline p-5 shadow-xs text-on-surface">
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
              <div className="bg-primary-container border border-outline rounded-2xl p-5 text-on-surface shadow-xs">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-3">Datos del Equipo — solo lectura</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">Equipo</p>
                    <p className="text-sm font-bold text-on-surface mt-0.5">{equipoSel.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">Representante</p>
                    <p className="text-sm font-bold text-on-surface mt-0.5">{equipoSel.representative || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">Estado</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-0.5 ${
                      equipoSel.registration_status === 'aprobado'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {equipoSel.registration_status || 'pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Galería de Tarjetas de Jugadores (Player Cards Grid) */}
            {equipoSel && (
              <div className="space-y-4">
                {/* Cabecera del Plantel de Jugadores */}
                <div className="bg-primary-container rounded-2xl border border-outline p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-on-surface">
                  <div className="space-y-1">
                    <h2 className="font-black text-base uppercase tracking-wider text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">groups</span>
                      Plantel de Jugadores de {equipoSel.name}
                    </h2>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {filasJugadores.filter(f => f.guardado).length} deportistas registrados en el torneo.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalNuevoJugAbierto(true)}
                      disabled={isDeadlineExpired}
                      className="flex items-center gap-2 bg-primary text-white hover:opacity-90 disabled:opacity-50 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      <span>Inscribir Jugador</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalCargaMasivaAbierto(true)}
                      disabled={isDeadlineExpired}
                      className="flex items-center gap-2 bg-surface hover:bg-surface-bright text-on-surface border border-outline px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">upload_file</span>
                      <span>Carga Masiva</span>
                    </button>

                    <button
                      type="button"
                      onClick={descargarPlantilla}
                      className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright text-on-surface border border-outline px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Descargar Formato de Ejemplo CSV"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">download</span>
                      <span>Plantilla (.CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Tarjetas del Plantel */}
                {cargandoPlanilla ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
                    <span className="text-xs text-on-surface-variant font-extrabold uppercase tracking-widest animate-pulse">Cargando plantel...</span>
                  </div>
                ) : filasJugadores.filter(f => f.guardado).length === 0 ? (
                  <div className="bg-primary-container border border-outline rounded-3xl p-12 text-center space-y-4 text-on-surface">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">person_off</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-black">Aún no hay jugadores en tu plantilla</h3>
                      <p className="text-xs text-on-surface-variant max-w-sm mx-auto font-medium leading-relaxed">
                        Inscribe a tus deportistas uno por uno o sube la planilla masiva en formato Excel / CSV.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalNuevoJugAbierto(true)}
                      className="inline-flex items-center gap-2 bg-primary text-white hover:opacity-90 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      <span>Inscribir Primer Jugador</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filasJugadores.filter(f => f.guardado).map((fila, idx) => {
                      const jug = jugadoresDePlanilla.find(j => j.id === fila.id);
                      return (
                        <div
                          key={fila.id || idx}
                          className="bg-primary-container border border-outline rounded-3xl p-4 shadow-xs hover:shadow-lg hover:border-primary transition-all duration-300 relative flex flex-col items-center text-center group text-on-surface"
                        >
                          {/* Badge de Dorsal (#) */}
                          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-md border border-white/20 z-10">
                            #{fila.dorsal || idx + 1}
                          </div>

                          {/* Foto de Rostro del Jugador Prominente */}
                          <div className="relative my-2 group-hover:scale-105 transition-transform duration-300">
                            {fila.foto ? (
                              <img
                                src={resolverUrlImagen(fila.foto) || fila.foto}
                                alt={fila.nombre}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-primary/50 shadow-md"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-surface-dim border-2 border-dashed border-outline flex flex-col items-center justify-center text-on-surface-variant shadow-2xs">
                                <span className="material-symbols-outlined text-4xl text-primary/60">person</span>
                              </div>
                            )}
                          </div>

                          {/* Nombre Completo */}
                          <h3 className="font-black text-xs sm:text-sm text-on-surface tracking-tight leading-tight line-clamp-1 mt-1 w-full px-1" title={fila.nombre}>
                            {fila.nombre}
                          </h3>

                          {/* Metadatos: DNI y Edad */}
                          <div className="flex items-center justify-center gap-1.5 text-[10px] text-on-surface-variant font-semibold mt-2 w-full">
                            <span className="truncate px-2 py-0.5 rounded-lg bg-surface border border-outline/70 font-mono">
                              DNI: {fila.dni || '—'}
                            </span>
                            <span className="truncate px-2 py-0.5 rounded-lg bg-surface border border-outline/70">
                              {fila.edad ? `${fila.edad} a.` : '—'}
                            </span>
                          </div>

                          {/* Acciones de la Tarjeta */}
                          <div className="flex items-center justify-center gap-1.5 mt-2.5 pt-2 border-t border-outline/40 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                if (jug) abrirModalEditarJugador(jug);
                              }}
                              disabled={isDeadlineExpired}
                              className="flex-1 flex items-center justify-center gap-1 bg-surface hover:bg-surface-bright text-on-surface border border-outline py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[11px] text-primary">edit</span>
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => { if (!isDeadlineExpired) eliminarFilaJugador(idx); }}
                              disabled={isDeadlineExpired}
                              className="flex items-center justify-center p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                              title="Eliminar Jugador"
                            >
                              <span className="material-symbols-outlined text-[11px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
      {modalNuevoEqAbierto && createPortal(
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-nuevo-equipo-title"
        >
          <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">group_add</span>
                <h3 id="modal-nuevo-equipo-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">Añadir Nuevo Equipo</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalNuevoEqAbierto(false);
                  setNuevoEq({ name: '', representative: '', discipline_id: '', category_id: '', enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' });
                  setLogoEqFile(null); setLogoEqUrl('');
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={guardarEquipo} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto font-sans">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Nombre del Equipo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Real Arequipa"
                  value={nuevoEq.name}
                  onChange={(e) => setNuevoEq({ ...nuevoEq, name: e.target.value })}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                />
              </div>

              {!nuevoEq.enable_delegate && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Delegado/Representante (Solo Nombre)</label>
                  <input
                    type="text"
                    placeholder="Representante del equipo"
                    value={nuevoEq.representative}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, representative: e.target.value })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="border border-outline bg-surface rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={nuevoEq.enable_delegate}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, enable_delegate: e.target.checked })}
                    className="w-4 h-4 text-primary border-outline rounded focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-on-surface">Habilitar cuenta de acceso para el Delegado</span>
                </label>
                
                {nuevoEq.enable_delegate && (
                  <div className="space-y-2.5 pt-1.5 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">Nombre del Delegado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre completo"
                        value={nuevoEq.delegate_name}
                        onChange={(e) => setNuevoEq({ ...nuevoEq, delegate_name: e.target.value })}
                        className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="correo@ejemplo.com"
                        value={nuevoEq.delegate_email}
                        onChange={(e) => setNuevoEq({ ...nuevoEq, delegate_email: e.target.value })}
                        className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">Contraseña Temporal *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Clave de 8+ caracteres"
                          value={nuevoEq.delegate_password}
                          onChange={(e) => setNuevoEq({ ...nuevoEq, delegate_password: e.target.value })}
                          className="flex-1 text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
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
                          className="px-2.5 py-2 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all cursor-pointer flex items-center gap-1"
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
                  <label className="text-xs font-bold text-on-surface-variant block">Disciplina *</label>
                  <select
                    required
                    value={nuevoEq.discipline_id}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, discipline_id: e.target.value, category_id: '' })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="">Seleccionar Disciplina</option>
                    {disciplinas.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Categoría *</label>
                  <select
                    required
                    value={nuevoEq.category_id}
                    onChange={(e) => setNuevoEq({ ...nuevoEq, category_id: e.target.value })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
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

              <div className="pt-2 border-t border-outline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalNuevoEqAbierto(false);
                    setNuevoEq({ name: '', representative: '', discipline_id: '', category_id: '', enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' });
                    setLogoEqFile(null); setLogoEqUrl('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface-bright transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider shadow-xs"
                >
                  <span className="material-symbols-outlined text-xs">save</span>
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Ver Detalles del Equipo ── */}
      {modalVerEq.abierto && modalVerEq.eq && createPortal((() => {
        const eq = modalVerEq.eq;
        const jugadoresDelEquipo = jugadores.filter(j => (j.team_id ?? j.team?.id) === eq.id);
        return (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-ver-equipo-title"
          >
            <div className="bg-primary-container border border-outline text-on-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">info</span>
                  <h3 id="modal-ver-equipo-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">Detalle del Equipo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalVerEq({ abierto: false, eq: null })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Logo y Nombre principal */}
                <div className="flex flex-col items-center text-center pb-4 border-b border-outline">
                  <div className="w-24 h-24 rounded-full border border-outline flex items-center justify-center overflow-hidden bg-surface mb-3 shadow-inner">
                    {eq.logo ? (
                      <img src={resolverUrlImagen(eq.logo) || ''} alt={eq.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-on-surface-variant font-extrabold uppercase">{eq.name[0] || '?'}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-on-surface">{eq.name}</h2>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                    Delegado: {eq.championship_user?.user?.name || eq.representative || <span className="text-on-surface-variant italic">Sin registrar</span>}
                  </p>
                </div>

                {/* Grid de Información Técnica */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="bg-surface p-3 rounded-xl border border-outline">
                    <p className="text-on-surface-variant font-bold uppercase tracking-wider mb-1">Disciplina</p>
                    <p className="font-extrabold text-on-surface text-sm">{eq.discipline?.name || 'No asignada'}</p>
                  </div>
                  <div className="bg-surface p-3 rounded-xl border border-outline">
                    <p className="text-on-surface-variant font-bold uppercase tracking-wider mb-1">Categoría</p>
                    <p className="font-extrabold text-on-surface text-sm">{eq.category?.name || 'No asignada'}</p>
                  </div>
                </div>

                {/* Selector de Estado con 3 Botones */}
                <div className="space-y-2 bg-surface p-3.5 rounded-xl border border-outline font-sans">
                  <span className="text-xs font-black uppercase tracking-wider text-on-surface block">
                    Estado del Registro
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await cambiarEstadoEquipo(eq.id, 'aprobado');
                        setModalVerEq(prev => prev.eq ? { ...prev, eq: { ...prev.eq, registration_status: 'aprobado' } } : prev);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        eq.registration_status === 'aprobado'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-[1.02]'
                          : 'bg-surface text-on-surface-variant border-outline hover:border-emerald-500/50 hover:bg-emerald-500/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      <span>Aprobado</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await cambiarEstadoEquipo(eq.id, 'pendiente');
                        setModalVerEq(prev => prev.eq ? { ...prev, eq: { ...prev.eq, registration_status: 'pendiente' } } : prev);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        eq.registration_status === 'pendiente' || !eq.registration_status
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                          : 'bg-surface text-on-surface-variant border-outline hover:border-amber-500/50 hover:bg-amber-500/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>Pendiente</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await cambiarEstadoEquipo(eq.id, 'rechazado');
                        setModalVerEq(prev => prev.eq ? { ...prev, eq: { ...prev.eq, registration_status: 'rechazado' } } : prev);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        eq.registration_status === 'rechazado'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs scale-[1.02]'
                          : 'bg-surface text-on-surface-variant border-outline hover:border-rose-500/50 hover:bg-rose-500/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">cancel</span>
                      <span>Rechazado</span>
                    </button>
                  </div>
                </div>

                {/* Jugadores Inscritos */}
                <div className="border-t border-outline pt-4 font-sans">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Jugadores Inscritos ({jugadoresDelEquipo.length})</h4>
                  {jugadoresDelEquipo.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic py-2">No hay jugadores inscritos en este equipo.</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {jugadoresDelEquipo.map(j => (
                        <li key={j.id} className="flex items-center gap-2 text-xs text-on-surface bg-surface border border-outline rounded-lg px-2.5 py-1.5">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                          <span className="font-semibold">{j.name || j.name}</span>
                          {j.number && <span className="ml-auto text-on-surface-variant font-mono">#{j.number}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Delegado */}
                {(eq.delegate || eq.championship_user?.user) && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs font-sans">
                    <p className="text-primary font-bold uppercase tracking-wider mb-1">Cuenta de Delegado</p>
                    <p className="font-semibold text-on-surface">{eq.championship_user?.user?.name || eq.delegate?.name}</p>
                    <p className="text-on-surface-variant">{eq.championship_user?.user?.email || eq.delegate?.email}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-outline flex justify-end items-center gap-2 bg-surface-dim">
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
      })(), document.body)}

      {/* ── Modal Crear Categoría ── */}
      {modalNuevaCatAbierto && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">category</span>
                <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wide">Añadir Nueva Categoría</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevaCatAbierto(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={guardarCategoria} className="p-6 space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Disciplina deportiva *</label>
                <select
                  required
                  value={nuevaCat.discipline_id}
                  onChange={(e) => setNuevaCat(prev => ({ ...prev, discipline_id: e.target.value }))}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  <option value="">-- Selecciona Disciplina --</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Nombre de la Categoría *</label>
                <input
                  type="text" required
                  placeholder="Ej: Sub-18, Libres, Máster +40"
                  value={nuevaCat.name}
                  onChange={(e) => setNuevaCat(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Edad Mínima</label>
                  <input
                    type="number" min="0" placeholder="Ej: 16"
                    value={nuevaCat.age_min}
                    onChange={(e) => setNuevaCat(prev => ({ ...prev, age_min: e.target.value }))}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Edad Máxima</label>
                  <input
                    type="number" min="0" placeholder="Ej: 35"
                    value={nuevaCat.age_max}
                    onChange={(e) => setNuevaCat(prev => ({ ...prev, age_max: e.target.value }))}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Género / Modalidad</label>
                <select
                  value={nuevaCat.gender}
                  onChange={(e) => setNuevaCat(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>
              <div className="pt-3 border-t border-outline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalNuevaCatAbierto(false)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface-bright transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Editar Categoría ── */}
      {modalEditarCat.abierto && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
              <h3 className="font-extrabold text-sm text-on-surface uppercase tracking-wide">Editar Categoría</h3>
              <button
                type="button"
                onClick={() => setModalEditarCat({ abierto: false, id: null, name: '', age_min: '', age_max: '', gender: 'Masculino', guardando: false })}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={guardarEdicionCat} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Nombre Categoría *</label>
                <input
                  type="text" required
                  value={modalEditarCat.name}
                  onChange={(e) => setModalEditarCat(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Edad Mínima</label>
                  <input
                    type="number" min="0"
                    value={modalEditarCat.age_min}
                    onChange={(e) => setModalEditarCat(prev => ({ ...prev, age_min: e.target.value }))}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Edad Máxima</label>
                  <input
                    type="number" min="0"
                    value={modalEditarCat.age_max}
                    onChange={(e) => setModalEditarCat(prev => ({ ...prev, age_max: e.target.value }))}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Género</label>
                <select
                  value={modalEditarCat.gender}
                  onChange={(e) => setModalEditarCat(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none cursor-pointer"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>
              <div className="pt-2 border-t border-outline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalEditarCat({ abierto: false, id: null, name: '', age_min: '', age_max: '', gender: 'Masculino', guardando: false })}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface-bright transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalEditarCat.guardando}
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {modalEditarCat.guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
            {/* ── Modal Editar Equipo ── */}
      {modalEditarEq.abierto && createPortal(
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-editar-equipo-title"
        >
          <div className="bg-primary-container text-on-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline bg-surface-dim">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">edit</span>
                <h3 id="modal-editar-equipo-title" className="font-extrabold text-sm text-on-surface uppercase tracking-wide">Editar Equipo</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarEq({ abierto: false, eq: null, nombre: '', representante: '', estado: 'pendiente', guardando: false, enable_delegate: false, delegate_name: '', delegate_email: '', delegate_password: '' })}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-outline text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block">Nombre del Equipo *</label>
                <input
                  type="text"
                  value={modalEditarEq.nombre}
                  onChange={e => setModalEditarEq(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del equipo"
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                />
              </div>

              {/* Representante */}
              {!modalEditarEq.enable_delegate && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block">Representante / Delegado (Solo Nombre)</label>
                  <input
                    type="text"
                    value={modalEditarEq.representante}
                    onChange={e => setModalEditarEq(prev => ({ ...prev, representante: e.target.value }))}
                    placeholder="Nombre del representante"
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-2.5 outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="border border-outline bg-surface rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalEditarEq.enable_delegate}
                    onChange={(e) => setModalEditarEq(prev => ({ ...prev, enable_delegate: e.target.checked }))}
                    className="w-4 h-4 text-primary border-outline rounded focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-on-surface">Habilitar cuenta de acceso para el Delegado</span>
                </label>

                {modalEditarEq.enable_delegate && (
                  <div className="space-y-2.5 pt-1.5 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">Nombre del Delegado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre completo"
                        value={modalEditarEq.delegate_name}
                        onChange={(e) => setModalEditarEq(prev => ({ ...prev, delegate_name: e.target.value }))}
                        className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="correo@ejemplo.com"
                        value={modalEditarEq.delegate_email}
                        onChange={(e) => setModalEditarEq(prev => ({ ...prev, delegate_email: e.target.value }))}
                        className="w-full text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-on-surface-variant uppercase block">Contraseña Temporal / Restablecer</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Dejar en blanco para no cambiar"
                          value={modalEditarEq.delegate_password || ''}
                          onChange={(e) => setModalEditarEq(prev => ({ ...prev, delegate_password: e.target.value }))}
                          className="flex-1 text-xs border border-outline bg-surface text-on-surface rounded-lg p-2 outline-none focus:border-primary"
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
                          className="px-2.5 py-2 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all cursor-pointer flex items-center gap-1"
                        >
                          Generar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Estado de Registro con 3 Botones */}
              <div className="space-y-1.5 font-sans">
                <label className="text-xs font-bold text-on-surface-variant block">Estado del Registro *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEditarEq(prev => ({ ...prev, estado: 'aprobado' }))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      modalEditarEq.estado === 'aprobado'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-[1.02]'
                        : 'bg-surface text-on-surface-variant border-outline hover:border-emerald-500/50 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>Aprobado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalEditarEq(prev => ({ ...prev, estado: 'pendiente' }))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      modalEditarEq.estado === 'pendiente'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                        : 'bg-surface text-on-surface-variant border-outline hover:border-amber-500/50 hover:bg-amber-500/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    <span>Pendiente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalEditarEq(prev => ({ ...prev, estado: 'rechazado' }))}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      modalEditarEq.estado === 'rechazado'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs scale-[1.02]'
                        : 'bg-surface text-on-surface-variant border-outline hover:border-rose-500/50 hover:bg-rose-500/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">cancel</span>
                    <span>Rechazado</span>
                  </button>
                </div>
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
        </div>,
        document.body
      )}

      {/* ── Modal Editar Jugador ── */}
      {modalEditarJug.abierto && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-editar-jugador-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-base">edit</span>
                <h3 id="modal-editar-jugador-title" className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Editar Jugador</h3>
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
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-ayuda-title"
        >
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">help</span>
                <h3 id="drawer-ayuda-title" className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Ayuda: Equipos y Jugadores</h3>
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
                {delegadoTeamId !== null
                  ? 'Guía rápida para la inscripción de deportistas de tu equipo:'
                  : 'Sigue estos pasos en orden para inscribir correctamente a los competidores de tu torneo:'
                }
              </p>
              {(delegadoTeamId !== null ? PASOS_AYUDA_DELEGADO : PASOS_AYUDA_PARTICIPANTES).map((p) => (
                <div key={p.paso} className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                  p.paso === '5' || p.paso === '6' || p.paso === '7'
                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                }`}>
                  <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border ${
                    p.paso === '5' || p.paso === '6' || p.paso === '7'
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
      {/* ── Modal Inscribir Nuevo Jugador ── */}
      {modalNuevoJugAbierto && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn text-on-surface"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-nuevo-jugador-title"
        >
          <div className="bg-primary-container border border-outline rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">person_add</span>
                <h3 id="modal-nuevo-jugador-title" className="font-black text-sm uppercase tracking-wide">Inscribir Nuevo Jugador</h3>
              </div>
              <button
                type="button"
                onClick={cerrarModalNuevoJug}
                className="w-8 h-8 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:bg-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={async (e) => {
              await guardarJugador(e);
              cerrarModalNuevoJug();
            }} className="p-6 space-y-4">
              {/* Indicaciones de Validación */}
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-on-surface">
                <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">info</span>
                <p className="text-[11px] font-medium leading-tight">
                  <strong className="font-extrabold text-primary block mb-0.5">Reglas de Inscripción:</strong>
                  El <strong>DNI/Cédula</strong> debe ser único y el <strong>número de dorsal (#)</strong> no se puede repetir dentro del mismo equipo.
                </p>
              </div>

              {/* Cargador de Foto */}
              <LogoInput
                logoFile={fotoJugFile}
                logoUrlTexto={fotoJugUrl}
                onFileChange={setFotoJugFile}
                onUrlChange={setFotoJugUrl}
                label="Foto del Rostro del Jugador"
              />

              {/* Nombre Completo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant block font-sans">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mateo Messi"
                  value={nuevoJug.name}
                  onChange={(e) => setNuevoJug({ ...nuevoJug, name: e.target.value })}
                  className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
                />
              </div>

              {/* DNI y Edad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block font-sans">DNI / Cédula *</label>
                  <input
                    type="text"
                    required
                    placeholder="Número de documento"
                    value={nuevoJug.dni}
                    onChange={(e) => setNuevoJug({ ...nuevoJug, dni: e.target.value })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block font-sans">Edad *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej: 22"
                    value={nuevoJug.age}
                    onChange={(e) => setNuevoJug({ ...nuevoJug, age: e.target.value })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium"
                  />
                </div>
              </div>

              {/* Dorsal (#) y Equipo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block font-sans">Dorsal (#) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej: 10"
                    value={nuevoJug.number}
                    onChange={(e) => setNuevoJug({ ...nuevoJug, number: e.target.value })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none focus:border-primary transition-all font-medium font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block font-sans">Equipo *</label>
                  <select
                    value={delegadoTeamId !== null ? String(delegadoTeamId) : (equipoSelId ? String(equipoSelId) : nuevoJug.team_id)}
                    disabled={delegadoTeamId !== null}
                    onChange={(e) => setNuevoJug({ ...nuevoJug, team_id: e.target.value })}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none cursor-pointer font-medium disabled:opacity-60"
                  >
                    <option value="">Seleccionar Equipo</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={String(eq.id)}>{eq.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-outline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModalNuevoJug}
                  className="px-4 py-2.5 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Guardar Jugador</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* ── Modal Carga Masiva de Plantel ── */}
      {modalCargaMasivaAbierto && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn text-on-surface"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-carga-masiva-title"
        >
          <div className="bg-primary-container border border-outline rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">upload_file</span>
                <h3 id="modal-carga-masiva-title" className="font-black text-sm uppercase tracking-wide">Carga Masiva de Plantel en Bloque</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCargaMasivaAbierto(false)}
                className="w-8 h-8 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:bg-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Reglas de Unicidad */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">verified</span>
                <p className="text-[11px] font-medium leading-tight">
                  <strong className="font-extrabold block mb-0.5">Importante para la Carga Masiva:</strong>
                  Revisa que ningún jugador tenga el mismo <strong>DNI</strong> ni el mismo <strong>número de dorsal (#)</strong> repetido en la planilla.
                </p>
              </div>

              {/* Banner de Descarga de Plantilla */}
              <div className="bg-surface border border-outline rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-extrabold text-xs text-on-surface">Formato de Plantilla Requerido</h4>
                  <p className="text-[10px] text-on-surface-variant">Descarga el archivo CSV de muestra para llenar la plantilla de deportistas.</p>
                </div>
                <button
                  type="button"
                  onClick={descargarPlantilla}
                  className="shrink-0 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  <span>Descargar CSV</span>
                </button>
              </div>

              {/* Equipo Destino */}
              {delegadoTeamId === null && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant block font-sans">Equipo Destino *</label>
                  <select
                    value={equipoIdMasiva ?? (equipoSelId ?? '')}
                    onChange={(e) => {
                      setEquipoIdMasiva(e.target.value ? parseInt(e.target.value) : null);
                      setResultadoCarga(null);
                    }}
                    className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none cursor-pointer font-medium"
                  >
                    <option value="">-- Selecciona el equipo --</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Zona de Dropzone */}
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
                    mostrarMensaje('Solo se permiten archivos CSV o Excel.', true);
                  }
                }}
                className="border-2 border-dashed border-outline hover:border-primary bg-surface/50 hover:bg-surface rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group"
              >
                <span className="material-symbols-outlined text-4xl text-primary/70 group-hover:scale-110 transition-transform">cloud_upload</span>
                {archivoCsv ? (
                  <div>
                    <p className="text-xs font-black text-primary">{archivoCsv.name}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{(archivoCsv.size / 1024).toFixed(1)} KB · Haz clic para cambiar archivo</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-on-surface">Arrastra tu archivo de plantilla aquí o haz clic para examinar</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Formatos permitidos: .CSV (Recomendado) / .XLSX</p>
                  </div>
                )}
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setArchivoCsv(file);
                      setResultadoCarga(null);
                    }
                  }}
                />
              </div>

              {/* Resumen de Resultados */}
              {resultadoCarga && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>¡{resultadoCarga.ok} jugadores inscritos con éxito!</span>
                  </div>
                  {resultadoCarga.errores.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-medium space-y-1 max-h-32 overflow-y-auto">
                      {resultadoCarga.errores.map((err, i) => (
                        <p key={i} className="text-[10px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">error</span>
                          {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-outline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalCargaMasivaAbierto(false)}
                  className="px-4 py-2.5 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await procesarCsvJugadores();
                    if (delegadoTeamId !== null) {
                      cargarJugadoresDeEquipo(delegadoTeamId);
                    }
                  }}
                  disabled={!archivoCsv || cargandoCsv}
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  {cargandoCsv ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Procesando...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">upload</span>Procesar Carga Masiva</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>

    </div>
  );
};
