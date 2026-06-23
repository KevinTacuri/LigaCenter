import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { serviciosParticipantes } from '../servicios/api';
import { BarraLateral } from '../componentes/BarraLateral';
import { CabeceraEstandar } from '../componentes/CabeceraEstandar';
import { useConfirm } from '@omit/react-confirm-dialog';
import type {
  Disciplina,
  Categoria,
  Equipo,
  Jugador
} from '../servicios/api';

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
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export const GestionParticipantes: React.FC = () => {
  const { usuario, tienePermiso, tieneRol } = useAutenticacion();
  const navegar = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const queryTab = searchParams.get('tab');

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

  // ── Formularios originales ─────────────────
  const [nuevaDisc, setNuevaDisc] = useState({ name: '', description: '', rules: '', status: 'active' });
  const [customDiscName, setCustomDiscName] = useState('');
  const [nuevaCat, setNuevaCat] = useState({
    name: '',
    age_min: '',
    age_max: '',
    gender: 'Masculino',
    discipline_id: '',
    format: 'liga' as 'liga' | 'grupos' | 'eliminacion_directa',
    num_groups: '',
    advance_per_group: '',
    third_place: false
  });
  const [nuevoEq, setNuevoEq] = useState({ name: '', representative: '', discipline_id: '', category_id: '' });
  const [nuevoJug, setNuevoJug] = useState({ name: '', dni: '', age: '', phone: '', team_id: '', number: '', position: 'Delantero' });

  // Agregar estado del modo de registro (Modo manual o Modo carga masiva)
  const [modoJugador, setModoJugador] = useState<'manual' | 'masiva'>('manual');
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [cargandoCsv, setCargandoCsv] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<{ ok: number; errores: string[] } | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  // Agregar función de procesamiento CSV (Modo carga masiva)
  const procesarCsvJugadores = async () => {
  if (!archivoCsv || equipoIdMasiva === null) return;
  // ahora usa el estado directamente ↑
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
          team_id: equipoIdMasiva,  // ← lee el estado correctamente
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

  // ── Estado: Modal Editar Equipo ────────────
  const [modalEditarEq, setModalEditarEq] = useState<{
    abierto: boolean;
    eq: Equipo | null;
    nombre: string;
    representante: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    guardando: boolean;
  }>({ abierto: false, eq: null, nombre: '', representante: '', estado: 'pendiente', guardando: false });

  // ─────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!tienePermiso('ver_equipos') || tieneRol('administrador')) {
      navegar('/tablero');
    } else {
      cargarDatos();
    }
  }, [tabActiva]);

  // Al cambiar equipo seleccionado en planilla
  useEffect(() => {
    if (equipoSelId !== null) {
      cargarJugadoresDeEquipo(equipoSelId);
      const eq = equipos.find(e => e.id === equipoSelId) || null;
      setEquipoSel(eq);
    } else {
      setFilasJugadores([]);
      setEquipoSel(null);
    }
  }, [equipoSelId]);

  // ─────────────────────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────────────────────
  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      if (tabActiva === 'disciplinas') {
        const res = await serviciosParticipantes.obtenerDisciplinas();
        if (res.success) setDisciplinas(res.data);
      } else if (tabActiva === 'categorias') {
        const res = await serviciosParticipantes.obtenerCategorias();
        if (res.success) setCategorias(res.data);
        const resDisc = await serviciosParticipantes.obtenerDisciplinas();
        if (resDisc.success) setDisciplinas(resDisc.data);
      } else if (tabActiva === 'equipos') {
        const [resEq, resDisc, resCat] = await Promise.all([
          serviciosParticipantes.obtenerEquipos(),
          serviciosParticipantes.obtenerDisciplinas(),
          serviciosParticipantes.obtenerCategorias(),
        ]);
        if (resEq.success) setEquipos(resEq.data);
        if (resDisc.success) setDisciplinas(resDisc.data);
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
          serviciosParticipantes.obtenerDisciplinas(),
          serviciosParticipantes.obtenerCategorias(),
        ]);
        if (resDisc.success) setDisciplinas(resDisc.data);
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

  const cargarJugadoresDeEquipo = async (teamId: number) => {
    setCargandoPlanilla(true);
    try {
      const res = await serviciosParticipantes.obtenerJugadores();
      if (res.success) {
        const jugEquipo = res.data.filter((j: Jugador) => j.team_id === teamId);
        const filas: FilaJugador[] = jugEquipo.map((j: Jugador) => ({
          id: j.id,
          nombre: j.name || '',
          dni: j.dni || '',
          edad: '', // la API no devuelve age en el listado
          dorsal: j.number != null ? String(j.number) : '',
          guardado: true,
        }));
        // Agregar fila vacía al final
        filas.push({ nombre: '', dni: '', edad: '', dorsal: '', guardado: false });
        setFilasJugadores(filas);
      }
    } catch {
      mostrarMensaje('Error al cargar jugadores del equipo.', true);
    } finally {
      setCargandoPlanilla(false);
    }
  };

  // ─────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────
  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    if (esError) {
      sileo.error({ title: 'Error', description: msg });
    } else {
      sileo.success({ title: 'Operación Exitosa', description: msg });
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

    // Construir format_settings dinámicamente según el formato seleccionado
    let format_settings: any = null;
    if (nuevaCat.format === 'grupos') {
      const numGroups = parseInt(nuevaCat.num_groups);
      const advancePerGroup = parseInt(nuevaCat.advance_per_group);
      if (isNaN(numGroups) || isNaN(advancePerGroup)) {
        mostrarMensaje('Debes ingresar el número de grupos y de clasificados.', true);
        return;
      }
      format_settings = {
        num_groups: numGroups,
        advance_per_group: advancePerGroup,
        third_place: nuevaCat.third_place
      };
    } else if (nuevaCat.format === 'eliminacion_directa') {
      format_settings = {
        third_place: nuevaCat.third_place
      };
    } else {
      format_settings = {};
    }

    try {
      const res = await serviciosParticipantes.crearCategoria({
        name: nuevaCat.name,
        age_min: nuevaCat.age_min ? parseInt(nuevaCat.age_min) : null,
        age_max: nuevaCat.age_max ? parseInt(nuevaCat.age_max) : null,
        gender_type: nuevaCat.gender,
        discipline_id: parseInt(nuevaCat.discipline_id),
        format: nuevaCat.format,
        format_settings: format_settings
      });
      if (res.success) {
        mostrarMensaje('Categoría registrada exitosamente.');
        setNuevaCat({
          name: '',
          age_min: '',
          age_max: '',
          gender: 'Masculino',
          discipline_id: '',
          format: 'liga',
          num_groups: '',
          advance_per_group: '',
          third_place: false
        });
        cargarDatos();
      }
    } catch (err: any) {
      // Capturar errores de validación HTTP 422
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const msg = errors ? Object.values(errors).flat().join('\n') : 'Datos inválidos para el formato seleccionado.';
        sileo.error({
          title: 'Error de Configuración',
          description: msg
        });
      } else {
        mostrarMensaje('Error al registrar categoría.', true);
      }
    }
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEq.name || !nuevoEq.discipline_id || !nuevoEq.category_id) {
      mostrarMensaje('Complete todos los campos obligatorios para el equipo.', true); return;
    }
    try {
      const res = await serviciosParticipantes.crearEquipo({
        name: nuevoEq.name,
        discipline_id: parseInt(nuevoEq.discipline_id),
        category_id: parseInt(nuevoEq.category_id),
        representative: nuevoEq.representative || null,
        registration_status: 'aprobado'
      });
      if (res.success) {
        mostrarMensaje('Equipo registrado y aprobado exitosamente.');
        setNuevoEq({ name: '', representative: '', discipline_id: '', category_id: '' });
        cargarDatos();
      }
    } catch { mostrarMensaje('Error al registrar equipo.', true); }
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
    if (!nuevoJug.name || !nuevoJug.team_id || !nuevoJug.age) {
      mostrarMensaje('El nombre, el equipo y la edad son obligatorios.', true); return;
    }
    try {
      const res = await serviciosParticipantes.crearJugador({
        full_name: nuevoJug.name,
        team_id: parseInt(nuevoJug.team_id),
        dni: nuevoJug.dni || null,
        age: parseInt(nuevoJug.age),
        number: nuevoJug.number ? parseInt(nuevoJug.number) : null,
        position: nuevoJug.position
      });
      if (res.success) {
        mostrarMensaje('Jugador inscrito exitosamente.');
        setNuevoJug({ name: '', dni: '', age: '', phone: '', team_id: '', number: '', position: 'Delantero' });
        setJugadores(prev => [...prev, res.data]);
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al inscribir jugador.', true);
    }
  };

  const eliminarElemento = async (id: number) => {
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




  // Crear categoría inline (requiere disciplina seleccionada)
  const crearCatInline = async (nombre: string): Promise<number | null> => {
    if (!reqEq.discId) {
      mostrarMensaje('Selecciona primero una disciplina para crear la categoría.', true);
      return null;
    }
    try {
      const res = await serviciosParticipantes.crearCategoria({
        name: nombre,
        age_min: null, age_max: null,
        gender_type: 'Mixto',
        discipline_id: reqEq.discId
      });
      if (res.success) {
        mostrarMensaje(`Categoría "${nombre}" creada (edades pendientes).`);
        const nuevas = await serviciosParticipantes.obtenerCategorias();
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
      const res = await serviciosParticipantes.crearEquipo({
        name: reqEq.nombre.trim(),
        discipline_id: reqEq.discId,
        category_id: reqEq.catId,
        representative: reqEq.representante.trim() || null,
        registration_status: 'aprobado'
      });
      if (res.success) {
        mostrarMensaje(`Equipo "${reqEq.nombre}" registrado y aprobado.`);
        setReqEq({ nombre: '', representante: '', discId: null, catId: null });
        // Refrescar equipos para la planilla
        const resEq = await serviciosParticipantes.obtenerEquipos();
        if (resEq.success) setEquipos(resEq.data);
      }
    } catch { mostrarMensaje('Error al registrar el equipo.', true); }
    finally { setGuardandoReqEq(false); }
  };

  // Categorías filtradas por disciplina seleccionada en registro rápido
  const catsFiltradas = categorias.filter(c =>
    !reqEq.discId || c.discipline_id === reqEq.discId
  );

  // ─────────────────────────────────────────────
  // HANDLERS NUEVOS: Planilla Jugadores
  // ─────────────────────────────────────────────
  const actualizarFila = (idx: number, campo: keyof FilaJugador, valor: string) => {
    setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, [campo]: valor, error: undefined } : f));
  };

  const guardarFila = async (idx: number) => {
    if (!equipoSelId) return;
    const fila = filasJugadores[idx];
    if (!fila.nombre.trim() || !fila.edad.trim()) {
      setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, error: 'Nombre y edad son obligatorios.' } : f));
      return;
    }
    // Marcar como guardando
    setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, guardando: true, error: undefined } : f));
    try {
      const res = await serviciosParticipantes.crearJugador({
        full_name: fila.nombre.trim(),
        team_id: equipoSelId,
        dni: fila.dni.trim() || null,
        age: parseInt(fila.edad),
        number: fila.dorsal.trim() ? parseInt(fila.dorsal) : null,
        position: null
      });
      if (res.success) {
        // Congelar fila y agregar nueva fila vacía al final
        setFilasJugadores(prev => {
          const nuevas = prev.map((f, i) =>
            i === idx ? { ...f, id: res.data.id, guardado: true, guardando: false } : f
          );
          // Solo agregar fila vacía si la actual era la última
          const esUltima = idx === prev.length - 1;
          if (esUltima) nuevas.push({ nombre: '', dni: '', edad: '', dorsal: '', guardado: false });
          return nuevas;
        });
        mostrarMensaje('Jugador guardado.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar jugador.';
      setFilasJugadores(prev => prev.map((f, i) => i === idx ? { ...f, guardando: false, error: msg } : f));
    }
  };

  const abrirModalEditar = (eq: Equipo) => {
    setModalEditarEq({
      abierto: true,
      eq,
      nombre: eq.name,
      representante: eq.representative || '',
      estado: eq.registration_status || 'pendiente',
      guardando: false,
    });
  };

  const guardarEdicionEq = async () => {
    if (!modalEditarEq.eq) return;
    if (!modalEditarEq.nombre.trim()) {
      mostrarMensaje('El nombre del equipo es obligatorio.', true); return;
    }
    setModalEditarEq(prev => ({ ...prev, guardando: true }));
    try {
      const res = await serviciosParticipantes.actualizarEquipo(modalEditarEq.eq.id, {
        name: modalEditarEq.nombre.trim(),
        representative: modalEditarEq.representante.trim() || null,
        registration_status: modalEditarEq.estado,
      });
      if (res.success) {
        setEquipos(prev => prev.map(e =>
          e.id === modalEditarEq.eq!.id
            ? { ...e, name: modalEditarEq.nombre.trim(), representative: modalEditarEq.representante.trim() || null, registration_status: modalEditarEq.estado }
            : e
        ));
        mostrarMensaje('Equipo actualizado correctamente.');
        setModalEditarEq({ abierto: false, eq: null, nombre: '', representante: '', estado: 'pendiente', guardando: false });
      }
    } catch {
      mostrarMensaje('Error al actualizar el equipo.', true);
    } finally {
      setModalEditarEq(prev => ({ ...prev, guardando: false }));
    }
  };

  const eliminarFilaJugador = async (idx: number) => {
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
        }
      } catch { mostrarMensaje('Error al eliminar jugador.', true); }
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  // Opciones para autocompletes
  const opcsCats: { id: number; label: string }[] = catsFiltradas.map(c => ({ id: c.id, label: c.name }));
  const opcsEquipos: { id: number; label: string }[] = equipos.map(e => ({ id: e.id, label: e.name }));

  const TABS: { key: TabType; label: string; nuevo?: boolean }[] = [
    // Ocultamos el TAB de "Disciplinas" por ahora para simplificar, pero se puede reactivar fácilmente si se necesita
    // { key: 'disciplinas', label: 'Disciplinas' },
    { key: 'categorias', label: 'Categorías' },
    { key: 'equipos', label: 'Equipos' },
    { key: 'jugadores', label: 'Jugadores' },
    { key: 'registro-equipo', label: 'Registro Rápido Equipo', nuevo: true },
    { key: 'planilla-jugadores', label: 'Planilla Jugadores', nuevo: true },
  ];

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen izquierdo en desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        <CabeceraEstandar titulo="Gestión de Participantes" subtitulo="Inscripciones y Configuración del Campeonato" />

      {/* Tabs (visibles solo en móvil ya que en desktop se navega por la barra lateral) */}
      <div className="bg-[#11131c] border-b border-slate-900 px-6 py-2 flex flex-wrap gap-2 lg:hidden">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ tab: tab.key })}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
              tabActiva === tab.key
                ? tab.nuevo
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-indigo-650 text-white shadow-xs'
                : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
            }`}
          >
            {tab.nuevo && <span className="material-symbols-outlined text-xs">bolt</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">

        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* ════════════════════════════════════════════
            TABS ORIGINALES (sin tocar)
        ════════════════════════════════════════════ */}
        {(tabActiva === 'disciplinas' || tabActiva === 'categorias' || tabActiva === 'equipos' || tabActiva === 'jugadores') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Formulario de Registro */}
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

                  {/* Formato de Competencia */}
                  <div className="space-y-1 border-t border-slate-105 pt-3">
                    <label className="text-xs font-bold text-slate-700 block">Formato de Competencia</label>
                    <select value={nuevaCat.format} onChange={(e) => setNuevaCat({ ...nuevaCat, format: e.target.value as any })}
                      className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                      <option value="liga">Liga (Todos contra todos)</option>
                      <option value="grupos">Fase de Grupos + Eliminación</option>
                      <option value="eliminacion_directa">Eliminación Directa</option>
                    </select>
                  </div>

                  {/* Campos condicionales de format_settings */}
                  {nuevaCat.format === 'grupos' && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">N° de Grupos *</label>
                          <input type="number" min="2" placeholder="Ej: 4"
                            value={nuevaCat.num_groups} onChange={(e) => setNuevaCat({ ...nuevaCat, num_groups: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-hidden bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">Clasificados/Grupo *</label>
                          <input type="number" min="1" placeholder="Ej: 2"
                            value={nuevaCat.advance_per_group} onChange={(e) => setNuevaCat({ ...nuevaCat, advance_per_group: e.target.value })}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-hidden bg-white" />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={nuevaCat.third_place} onChange={(e) => setNuevaCat({ ...nuevaCat, third_place: e.target.checked })}
                          className="rounded-sm border-slate-300 text-indigo-600 outline-hidden" />
                        <span className="text-[10px] font-bold text-slate-650 uppercase">Partido por 3° Puesto</span>
                      </label>
                    </div>
                  )}

                  {nuevaCat.format === 'eliminacion_directa' && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-fadeIn">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={nuevaCat.third_place} onChange={(e) => setNuevaCat({ ...nuevaCat, third_place: e.target.checked })}
                          className="rounded-sm border-slate-300 text-indigo-600 outline-hidden" />
                        <span className="text-[10px] font-bold text-slate-650 uppercase">Partido por 3° Puesto</span>
                      </label>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                    Guardar Categoría
                  </button>
                </form>
              )}

              {tabActiva === 'equipos' && (
                <form onSubmit={guardarEquipo} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Nombre del Equipo *</label>
                    <input type="text" required placeholder="Ej: Real Arequipa"
                      value={nuevoEq.name} onChange={(e) => setNuevoEq({ ...nuevoEq, name: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Delegado/Representante</label>
                    <input type="text" placeholder="Representante del equipo"
                      value={nuevoEq.representative} onChange={(e) => setNuevoEq({ ...nuevoEq, representative: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
                      <select required value={nuevoEq.discipline_id}
                        onChange={(e) => setNuevoEq({ ...nuevoEq, discipline_id: e.target.value, category_id: '' })}
                        className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                        <option value="">Seleccionar Disciplina</option>
                        {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Categoría *</label>
                      <select required value={nuevoEq.category_id}
                        onChange={(e) => setNuevoEq({ ...nuevoEq, category_id: e.target.value })}
                        className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                        <option value="">Seleccionar Categoría</option>
                        {categorias
                          .filter((c) => !nuevoEq.discipline_id || c.discipline_id === parseInt(nuevoEq.discipline_id))
                          .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                    Guardar Equipo
                  </button>
                </form>
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
                        <label className="text-xs font-bold text-slate-700 block">Equipo *</label>
                        <select required value={nuevoJug.team_id}
                          onChange={(e) => setNuevoJug({ ...nuevoJug, team_id: e.target.value })}
                          className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer">
                          <option value="">Seleccionar Equipo</option>
                          {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer">
                        Guardar Jugador
                      </button>
                    </form>
                  )}

                  {/* ── MODO CARGA MASIVA ── */}
                  {modoJugador === 'masiva' && (
                    <div className="space-y-3">

                        {/* Selector de equipo — NUEVO */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Equipo destino *</label>
                          <select
                            value={equipoIdMasiva ?? ''}
                            onChange={(e) => {
                              setEquipoIdMasiva(e.target.value ? parseInt(e.target.value) : null);
                              setResultadoCarga(null);
                              setArchivoCsv(null);  // ← limpiar también el archivo
                              if (inputArchivoRef.current) inputArchivoRef.current.value = '';
                            }}
                            className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                          >
                            <option value="">-- Selecciona el equipo --</option>
                            {equipos.map((eq) => (
                              <option key={eq.id} value={eq.id}>{eq.name}</option>
                            ))}
                          </select>
                        </div>

                      {/* Drop zone */}
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
                        disabled={!archivoCsv || !equipoIdMasiva || cargandoCsv}
                        className="
                          w-full relative overflow-hidden
                          py-3 rounded-xl text-xs font-bold tracking-wide uppercase
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

            {/* Columna Derecha: Listado */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-100 pb-2">
                Lista de {tabActiva}
              </h2>
              {cargando ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cargando registros...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        {tabActiva === 'equipos' ? (
                          <>
                            <th className="p-3 pl-4">Nombre del Equipo</th>
                            <th className="p-3">Representante</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 pr-4 text-right">Acciones</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3 pl-4">Detalles</th>
                            {tabActiva === 'jugadores' && <th className="p-3">Equipo</th>}
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
                              Edades: {c.age_min ?? 'N/A'} - {c.age_max ?? 'N/A'} | Género: {c.gender_type || c.gender || 'N/A'} | Disciplina: {c.discipline?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <button onClick={() => eliminarElemento(c.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {tabActiva === 'equipos' && equipos.map((eq) => (
                        <tr key={eq.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{eq.name}</div>
                          </td>
                          <td className="p-3 text-sm text-slate-700">
                            {eq.representative || <span className="text-slate-400 italic text-xs">No registrado</span>}
                          </td>
                          <td className="p-3">
                            <select
                              value={eq.registration_status || 'pendiente'}
                              onChange={async (e) => {
                                const nuevoEstado = e.target.value as 'pendiente' | 'aprobado' | 'rechazado';
                                await cambiarEstadoEquipo(eq.id, nuevoEstado);
                              }}
                              className={`text-[10px] font-bold uppercase tracking-wide rounded px-2 py-0.5 border cursor-pointer outline-hidden transition-colors ${
                                eq.registration_status === 'aprobado'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : eq.registration_status === 'rechazado'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="aprobado">Aprobado</option>
                              <option value="rechazado">Rechazado</option>
                            </select>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => abrirModalEditar(eq)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                Editar
                              </button>
                              <button
                                onClick={() => eliminarElemento(eq.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {tabActiva === 'jugadores' && jugadores.map((j) => (
                        <tr key={j.id} className="hover:bg-slate-50/40">
                          <td className="p-3 pl-4">
                            <div className="font-bold text-slate-900">{j.name}</div>
                            <div className="text-xs text-slate-500">DNI: {j.dni || 'No registrado'} | Camiseta: {j.number || 'N/A'} ({j.position})</div>
                          </td>
                          <td className="p-3 text-slate-700">{j.team?.name || 'Sin equipo'}</td>
                          <td className="p-3 pr-4 text-right">
                            <button onClick={() => eliminarElemento(j.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                      {!cargando && (
                        (tabActiva === 'disciplinas' && disciplinas.length === 0) ||
                        (tabActiva === 'categorias' && categorias.length === 0) ||
                        (tabActiva === 'equipos' && equipos.length === 0) ||
                        (tabActiva === 'jugadores' && jugadores.length === 0)
                      ) && (
                        <tr>
                          <td colSpan={4} className="p-10 text-center text-slate-500 text-xs">No hay registros cargados.</td>
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
            {/* Selector de equipo */}
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

                            {/* Nombre */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={fila.nombre}
                                disabled={fila.guardado}
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
                                disabled={fila.guardado}
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
                                disabled={fila.guardado}
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
                                disabled={fila.guardado}
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
                            <td className="p-2 pr-5 text-right">
                              {fila.guardado ? (
                                <button
                                  onClick={() => eliminarFilaJugador(idx)}
                                  className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer transition-colors"
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <button
                                  onClick={() => guardarFila(idx)}
                                  disabled={fila.guardando}
                                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
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

      {/* ── Modal Editar Equipo ── */}
      {modalEditarEq.abierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-base">edit</span>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Editar Equipo</h3>
              </div>
              <button
                onClick={() => setModalEditarEq(prev => ({ ...prev, abierto: false }))}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre del Equipo *</label>
                <input
                  type="text"
                  value={modalEditarEq.nombre}
                  onChange={e => setModalEditarEq(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del equipo"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                />
              </div>

              {/* Representante */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Representante / Delegado</label>
                <input
                  type="text"
                  value={modalEditarEq.representante}
                  onChange={e => setModalEditarEq(prev => ({ ...prev, representante: e.target.value }))}
                  placeholder="Nombre del representante"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
                />
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Estado de Registro</label>
                <select
                  value={modalEditarEq.estado}
                  onChange={e => setModalEditarEq(prev => ({ ...prev, estado: e.target.value as 'pendiente' | 'aprobado' | 'rechazado' }))}
                  className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalEditarEq(prev => ({ ...prev, abierto: false }))}
                disabled={modalEditarEq.guardando}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicionEq}
                disabled={modalEditarEq.guardando || !modalEditarEq.nombre.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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