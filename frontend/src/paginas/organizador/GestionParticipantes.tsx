import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sileo } from 'sileo';
import { useConfirm } from '@omit/react-confirm-dialog';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { serviciosParticipantes, resolverUrlImagen } from '../../servicios/api';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';

import { useParticipantesData } from '../../hooks/organizador/useParticipantesData';
import { useDelegadoEquipo } from '../../hooks/organizador/useDelegadoEquipo';
import { usePlanillaJugadores } from '../../hooks/organizador/usePlanillaJugadores';
import { descargarPlantillaCsv, procesarCsvJugadores } from '../../utils/organizador/participantesCsv';

import { TabCategorias } from '../../componentes/participantes/TabCategorias';
import { TabEquipos } from '../../componentes/participantes/TabEquipos';
import { TabJugadores } from '../../componentes/participantes/TabJugadores';
import { TabRegistroRapido } from '../../componentes/participantes/TabRegistroRapido';
import { TabPlanillaJugadores } from '../../componentes/participantes/TabPlanillaJugadores';
import { BannerPlazoInscripcion } from '../../componentes/participantes/BannerPlazoInscripcion';
import { DrawerAyudaParticipantes } from '../../componentes/participantes/DrawerAyudaParticipantes';

import { ModalNuevoEquipo } from '../../componentes/participantes/ModalNuevoEquipo';
import { ModalEditarEquipo } from '../../componentes/participantes/ModalEditarEquipo';
import { ModalEquipoExistente } from '../../componentes/participantes/ModalEquipoExistente';
import { ModalVerEquipo } from '../../componentes/participantes/ModalVerEquipo';
import { ModalNuevaCategoria } from '../../componentes/participantes/ModalNuevaCategoria';
import { ModalEditarCategoria } from '../../componentes/participantes/ModalEditarCategoria';
import { ModalNuevoJugador } from '../../componentes/participantes/ModalNuevoJugador';
import { ModalEditarJugador } from '../../componentes/participantes/ModalEditarJugador';
import { ModalJugadoresExistentes } from '../../componentes/participantes/ModalJugadoresExistentes';
import { ModalCargaMasiva } from '../../componentes/participantes/ModalCargaMasiva';

import type { TabParticipantes } from '../../types/Participantes';
import type { Equipo, Categoria, Jugador } from '../../servicios/api';
import type { NuevoEquipoState } from '../../componentes/participantes/ModalNuevoEquipo';
import type { EditarEquipoState } from '../../componentes/participantes/ModalEditarEquipo';
import type { NuevaCategoriaState } from '../../componentes/participantes/ModalNuevaCategoria';
import type { EditarCategoriaState } from '../../componentes/participantes/ModalEditarCategoria';
import type { NuevoJugadorState } from '../../componentes/participantes/ModalNuevoJugador';
import type { EditarJugadorState } from '../../componentes/participantes/ModalEditarJugador';
import type { ResultadoCargaCsv } from '../../utils/organizador/participantesCsv';

export const GestionParticipantes: React.FC = () => {
  const { usuario, tienePermiso, tieneRol, cargando: cargandoAuth } = useAutenticacion();
  const navegar = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();
  const queryTab = searchParams.get('tab');
  const { campeonatoActivo, cargandoCampeonato } = useCampeonato();

  const [tabActiva, setTabActiva] = useState<TabParticipantes>(
    (queryTab as TabParticipantes) || 'categorias'
  );
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    if (queryTab && queryTab !== tabActiva) {
      setTabActiva(queryTab as TabParticipantes);
    }
  }, [queryTab]);

  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    try {
      if (esError) sileo.error({ title: 'Error', description: msg });
      else sileo.success({ title: 'Operación Exitosa', description: msg });
    } catch {
      if (esError) alert('Error: ' + msg);
      else alert('Éxito: ' + msg);
    }
  };

  // ── Guardia de acceso ──
  useEffect(() => {
    if (cargandoAuth || cargandoCampeonato) return;
    if (!tienePermiso('ver_equipos') || tieneRol('administrador')) {
      navegar('/tablero');
    }
  }, [cargandoAuth, cargandoCampeonato]);

  // ── Delegado / deadlines ──
  const delegado = useDelegadoEquipo({
    campeonatoId: campeonatoActivo?.id ?? null,
    usuarioId: usuario?.id,
  });

  // ── Datos principales ──
  const datos = useParticipantesData({
    campeonatoId: campeonatoActivo?.id ?? null,
    tabActiva,
    delegadoTeamId: delegado.delegadoTeamId,
  });

  // Cargar relación del delegado cuando cambian tab/campeonato
  useEffect(() => {
    (async () => {
      const teamId = await delegado.cargarRelacionDelegado();
      if (teamId) {
        setEquipoSelId(teamId);
        setEquipoIdMasiva(teamId);
      }
    })();
  }, [campeonatoActivo?.id, tabActiva]);

  // Redirigir al delegado a planilla si está en tab no permitido
  useEffect(() => {
    if (
      delegado.delegadoTeamId !== null &&
      tabActiva !== 'planilla-jugadores' &&
      tabActiva !== 'jugadores'
    ) {
      setTabActiva('planilla-jugadores');
    }
  }, [delegado.delegadoTeamId, tabActiva]);

  // ── Planilla de jugadores (tab dedicado) ──
  const [equipoSelId, setEquipoSelId] = useState<number | null>(null);
  const [equipoIdMasiva, setEquipoIdMasiva] = useState<number | null>(null);

  const planilla = usePlanillaJugadores({
    equipoSelId,
    equipos: datos.equipos,
    isDeadlineExpired: delegado.isDeadlineExpired,
    mostrarMensaje,
  });

  // ── Modales: Disciplinas/Categorías ──
  const [modalNuevaCatAbierto, setModalNuevaCatAbierto] = useState(false);
  const [nuevaCat, setNuevaCat] = useState<NuevaCategoriaState>({
    name: '',
    age_min: '',
    age_max: '',
    gender: 'Masculino',
    discipline_id: '',
  });
  const [modalEditarCat, setModalEditarCat] = useState<EditarCategoriaState>({
    abierto: false,
    id: null,
    name: '',
    age_min: '',
    age_max: '',
    gender: 'Masculino',
    guardando: false,
  });

  const guardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCat.name || !nuevaCat.discipline_id) {
      mostrarMensaje('El nombre y la disciplina son obligatorios.', true);
      return;
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
        setNuevaCat({ name: '', age_min: '', age_max: '', gender: 'Masculino', discipline_id: '' });
        datos.recargar();
      }
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const msg = errors ? Object.values(errors).flat().join('\n') : 'Datos inválidos.';
        sileo.error({ title: 'Error de Configuración', description: msg });
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
      guardando: false,
    });
  };

  const guardarEdicionCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarCat.id || !modalEditarCat.name) return;
    setModalEditarCat((prev) => ({ ...prev, guardando: true }));
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
        datos.recargar();
      }
    } catch {
      mostrarMensaje('Error al actualizar categoría.', true);
      setModalEditarCat((prev) => ({ ...prev, guardando: false }));
    }
  };

  // ── Modales: Equipos ──
  const [modalNuevoEqAbierto, setModalNuevoEqAbierto] = useState(false);
  const [nuevoEq, setNuevoEq] = useState<NuevoEquipoState>({
    name: '',
    representative: '',
    discipline_id: '',
    category_id: '',
    enable_delegate: false,
    delegate_name: '',
    delegate_email: '',
    delegate_password: '',
  });
  const [logoEqFile, setLogoEqFile] = useState<File | null>(null);
  const [logoEqUrl, setLogoEqUrl] = useState('');

  const cerrarModalNuevoEq = () => {
    setModalNuevoEqAbierto(false);
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
    setLogoEqFile(null);
    setLogoEqUrl('');
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEq.name || !nuevoEq.discipline_id || !nuevoEq.category_id) {
      mostrarMensaje('Complete todos los campos obligatorios para el equipo.', true);
      return;
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
          } catch {
            alert(`Equipo y Delegado Creados\nEmail: ${nuevoEq.delegate_email}\nContraseña: ${nuevoEq.delegate_password}`);
          }
        } else {
          mostrarMensaje('Equipo registrado y aprobado exitosamente.');
        }
        cerrarModalNuevoEq();
        datos.recargar();
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

  const [modalEqExistenteAbierto, setModalEqExistenteAbierto] = useState(false);
  const [equiposExistentes, setEquiposExistentes] = useState<Equipo[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<number[]>([]);
  const [busquedaEquipoExistente, setBusquedaEquipoExistente] = useState('');

  const cargarEquiposExistentes = async () => {
    try {
      const res = await serviciosParticipantes.obtenerEquiposBase(true);
      if (res.success) setEquiposExistentes(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const anadirEquiposExistentes = async () => {
    if (equiposSeleccionados.length === 0) {
      mostrarMensaje('Debes seleccionar al menos un equipo.', true);
      return;
    }
    try {
      const res = await serviciosParticipantes.anadirVariosEquiposExistentes(equiposSeleccionados);
      if (res.success) {
        mostrarMensaje('Equipos añadidos correctamente.');
        setModalEqExistenteAbierto(false);
        setEquiposSeleccionados([]);
        datos.recargar();
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al añadir equipos existentes.', true);
    }
  };

  const [modalVerEq, setModalVerEq] = useState<{ abierto: boolean; eq: Equipo | null }>({
    abierto: false,
    eq: null,
  });

  const cambiarEstadoEquipo = async (id: number, nuevoEstado: 'aprobado' | 'rechazado' | 'pendiente') => {
    try {
      const res = await serviciosParticipantes.actualizarEquipo(id, { registration_status: nuevoEstado });
      if (res.success) {
        datos.setEquipos((prev) => prev.map((e) => (e.id === id ? { ...e, registration_status: nuevoEstado } : e)));
        setModalVerEq((prev) =>
          prev.eq && prev.eq.id === id ? { ...prev, eq: { ...prev.eq, registration_status: nuevoEstado } } : prev
        );
        mostrarMensaje(`Estado actualizado a "${nuevoEstado}" correctamente.`);
      }
    } catch {
      mostrarMensaje('Error al cambiar el estado del equipo.', true);
    }
  };

  const [modalEditarEq, setModalEditarEq] = useState<EditarEquipoState>({
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
  const [logoEditFile, setLogoEditFile] = useState<File | null>(null);
  const [logoEditUrl, setLogoEditUrl] = useState('');

  const cerrarModalEditarEq = () => {
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
  };

  const abrirModalEditarEq = (eq: Equipo) => {
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
      mostrarMensaje('El nombre del equipo es obligatorio.', true);
      return;
    }
    setModalEditarEq((prev) => ({ ...prev, guardando: true }));
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
        datos.setEquipos((prev) => prev.map((e) => (e.id === modalEditarEq.eq!.id ? res.data : e)));
        if (modalEditarEq.enable_delegate && modalEditarEq.delegate_password) {
          try {
            sileo.success({
              title: 'Equipo y Acceso Actualizados',
              description: `Equipo actualizado con éxito. Accesos del delegado:\nEmail: ${modalEditarEq.delegate_email}\nNueva Contraseña: ${modalEditarEq.delegate_password}`,
            });
          } catch {
            alert(`Accesos del delegado:\nEmail: ${modalEditarEq.delegate_email}\nNueva Contraseña: ${modalEditarEq.delegate_password}`);
          }
        } else {
          mostrarMensaje('Equipo actualizado correctamente.');
        }
        cerrarModalEditarEq();
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al actualizar equipo.', true);
    } finally {
      setModalEditarEq((prev) => ({ ...prev, guardando: false }));
    }
  };

  // ── Modales: Registro rápido de equipo ──
  const [reqEq, setReqEq] = useState({
    nombre: '',
    representante: '',
    discId: null as number | null,
    catId: null as number | null,
  });
  const [logoReqFile, setLogoReqFile] = useState<File | null>(null);
  const [logoReqUrl, setLogoReqUrl] = useState('');
  const [guardandoReqEq, setGuardandoReqEq] = useState(false);

  const crearCatInline = async (nombre: string): Promise<number | null> => {
    if (!reqEq.discId) {
      mostrarMensaje('Selecciona primero una disciplina para crear la categoría.', true);
      return null;
    }
    try {
      const res = await serviciosParticipantes.crearCategoria(reqEq.discId, {
        name: nombre,
        age_min: null,
        age_max: null,
        gender_type: 'Mixto',
      });
      if (res.success) {
        mostrarMensaje(`Categoría "${nombre}" creada (edades pendientes).`);
        const nuevas = await serviciosParticipantes.obtenerCategoriasPorCampeonato(campeonatoActivo!.id);
        if (nuevas.success) datos.setCategorias(nuevas.data);
        return res.data.id;
      }
    } catch {
      mostrarMensaje('Error al crear categoría.', true);
    }
    return null;
  };

  const guardarReqEq = async () => {
    if (!reqEq.nombre.trim() || !reqEq.discId || !reqEq.catId) {
      mostrarMensaje('Completa todos los campos obligatorios.', true);
      return;
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
        setLogoReqFile(null);
        setLogoReqUrl('');
        const resEq = await serviciosParticipantes.obtenerTodosEquipos();
        if (resEq.success) datos.setEquipos(resEq.data);
      }
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        const msg = errors ? Object.values(errors).flat().join('\n') : (err.response.data.message || 'Datos inválidos.');
        sileo.error({ title: 'Error de Validación', description: msg });
      } else {
        mostrarMensaje(err.response?.data?.message || 'Error al registrar el equipo.', true);
      }
    } finally {
      setGuardandoReqEq(false);
    }
  };

  // ── Modales: Jugadores ──
  const [modalNuevoJugAbierto, setModalNuevoJugAbierto] = useState(false);
  const [nuevoJug, setNuevoJug] = useState<NuevoJugadorState>({
    name: '',
    dni: '',
    age: '',
    phone: '',
    team_id: '',
    number: '',
    position: 'Delantero',
  });
  const [fotoJugFile, setFotoJugFile] = useState<File | null>(null);
  const [fotoJugUrl, setFotoJugUrl] = useState('');

  useEffect(() => {
    if (delegado.delegadoTeamId !== null) {
      setNuevoJug((prev) => ({ ...prev, team_id: String(delegado.delegadoTeamId) }));
    }
  }, [delegado.delegadoTeamId]);

  const cerrarModalNuevoJug = () => {
    setModalNuevoJugAbierto(false);
    setNuevoJug({
      name: '',
      dni: '',
      age: '',
      phone: '',
      team_id: delegado.delegadoTeamId !== null ? String(delegado.delegadoTeamId) : equipoSelId ? String(equipoSelId) : '',
      number: '',
      position: 'Delantero',
    });
    setFotoJugFile(null);
    setFotoJugUrl('');
  };

  const guardarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delegado.isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    const targetTeamId = delegado.delegadoTeamId !== null ? delegado.delegadoTeamId : nuevoJug.team_id;
    if (!nuevoJug.name || !targetTeamId || !nuevoJug.age) {
      mostrarMensaje('El nombre, el equipo y la edad son obligatorios.', true);
      return;
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

      const res = await serviciosParticipantes.crearJugadorEnCampeonato(formData);
      if (res.success) {
        mostrarMensaje('Jugador inscrito exitosamente.');
        datos.setJugadores((prev) => [...prev, res.data]);
        if (delegado.delegadoTeamId !== null) {
          planilla.cargarJugadoresDeEquipo(delegado.delegadoTeamId);
        }
        cerrarModalNuevoJug();
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al inscribir jugador.', true);
    }
  };

  const [modalEditarJug, setModalEditarJug] = useState<EditarJugadorState>({
    abierto: false,
    jug: null,
    nombre: '',
    dni: '',
    numero: '',
    teamId: '',
    guardando: false,
  });
  const [fotoEditJugFile, setFotoEditJugFile] = useState<File | null>(null);
  const [fotoEditJugUrl, setFotoEditJugUrl] = useState('');

  const abrirModalEditarJugador = (j: Jugador) => {
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
    if (delegado.isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    if (!modalEditarJug.nombre.trim() || !modalEditarJug.teamId) {
      mostrarMensaje('El nombre y el equipo son obligatorios.', true);
      return;
    }
    setModalEditarJug((prev) => ({ ...prev, guardando: true }));
    try {
      const formData = new FormData();
      formData.append('full_name', modalEditarJug.nombre.trim());
      if (modalEditarJug.dni.trim()) formData.append('dni', modalEditarJug.dni.trim());
      if (modalEditarJug.numero.trim()) formData.append('number', modalEditarJug.numero.trim());
      formData.append('team_id', modalEditarJug.teamId);
      if (fotoEditJugFile) formData.append('photo', fotoEditJugFile);
      else if (fotoEditJugUrl.trim()) formData.append('photo', fotoEditJugUrl.trim());

      const res = await serviciosParticipantes.actualizarJugadorEnCampeonato(modalEditarJug.jug.id, formData);
      if (res.success) {
        datos.setJugadores((prev) => prev.map((j) => (j.id === modalEditarJug.jug!.id ? res.data : j)));
        mostrarMensaje('Jugador actualizado correctamente.');
        setModalEditarJug({ abierto: false, jug: null, nombre: '', dni: '', numero: '', teamId: '', guardando: false });
        if (equipoSelId !== null) planilla.cargarJugadoresDeEquipo(equipoSelId);
      }
    } catch (err: any) {
      mostrarMensaje(err.response?.data?.message || 'Error al actualizar el jugador.', true);
    } finally {
      setModalEditarJug((prev) => ({ ...prev, guardando: false }));
    }
  };

  const [modalJugExistenteAbierto, setModalJugExistenteAbierto] = useState(false);
  const [busquedaJugadorExistente, setBusquedaJugadorExistente] = useState('');
  const [jugadoresExistentesSeleccionados, setJugadoresExistentesSeleccionados] = useState<number[]>([]);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState<Jugador[]>([]);
  const [cargandoJugadoresExistentes, setCargandoJugadoresExistentes] = useState(false);
  const [guardandoJugadoresExistentes, setGuardandoJugadoresExistentes] = useState(false);

  const cerrarModalJugExistente = () => {
    setModalJugExistenteAbierto(false);
    setBusquedaJugadorExistente('');
    setJugadoresExistentesSeleccionados([]);
  };

  const cargarJugadoresDisponibles = async () => {
    setCargandoJugadoresExistentes(true);
    try {
      const res = await serviciosParticipantes.obtenerJugadores(true);
      if (res.success) setJugadoresDisponibles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoJugadoresExistentes(false);
    }
  };

  const agregarJugadoresExistentes = async () => {
    if (jugadoresExistentesSeleccionados.length === 0) {
      mostrarMensaje('Debes seleccionar al menos un jugador.', true);
      return;
    }
    setGuardandoJugadoresExistentes(true);
    try {
      const res = await serviciosParticipantes.anadirVariosJugadoresExistentes(
        jugadoresExistentesSeleccionados,
        equipoSelId!
      );
      if (res.success) mostrarMensaje('Jugadores añadidos correctamente.');
      else mostrarMensaje('Error al añadir jugadores existentes.', true);
      cerrarModalJugExistente();
      datos.recargar();
    } catch (error) {
      console.error('Error al añadir jugadores existentes:', error);
    } finally {
      setGuardandoJugadoresExistentes(false);
    }
  };

  // ── Carga masiva CSV ──
  const [modalCargaMasivaAbierto, setModalCargaMasivaAbierto] = useState(false);
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [cargandoCsv, setCargandoCsv] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<ResultadoCargaCsv | null>(null);

  const procesarCsv = async () => {
    const targetTeamId = delegado.delegadoTeamId !== null ? delegado.delegadoTeamId : equipoIdMasiva;
    if (!archivoCsv || targetTeamId === null) return;
    if (delegado.isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido.', true);
      return;
    }
    setCargandoCsv(true);
    setResultadoCarga(null);
    try {
      const resultado = await procesarCsvJugadores(archivoCsv, targetTeamId);
      setResultadoCarga(resultado);
      if (resultado.ok > 0) {
        mostrarMensaje(`${resultado.ok} jugador(es) importado(s) exitosamente.`);
        datos.recargar();
        if (delegado.delegadoTeamId !== null) {
          planilla.cargarJugadoresDeEquipo(delegado.delegadoTeamId);
        }
      }
    } catch {
      mostrarMensaje('No se pudo leer el archivo CSV.', true);
    } finally {
      setCargandoCsv(false);
    }
  };

  // ── Eliminar genérico (con confirmación) ──
  const eliminarElemento = async (id: number) => {
    if (tabActiva === 'jugadores' && delegado.isDeadlineExpired) {
      mostrarMensaje('El plazo de inscripción de jugadores ha vencido y no se permiten modificaciones.', true);
      return;
    }
    const isConfirmed = await confirm({
      title: '¿Eliminar Registro?',
      description:
        '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer y podría afectar a otros registros vinculados.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmButton: { variant: 'destructive' },
    });
    if (!isConfirmed) return;
    try {
      let res: any;
      if (tabActiva === 'categorias') res = await serviciosParticipantes.eliminarCategoria(id);
      else if (tabActiva === 'equipos') res = await serviciosParticipantes.eliminarEquipo(id);
      else if (tabActiva === 'jugadores') res = await serviciosParticipantes.eliminarJugadorDeCampeonato(id);
      if (res && res.success) {
        mostrarMensaje('Registro eliminado correctamente.');
        if (tabActiva === 'categorias') datos.setCategorias((prev) => prev.filter((c) => c.id !== id));
        else if (tabActiva === 'equipos') datos.setEquipos((prev) => prev.filter((e) => e.id !== id));
        else if (tabActiva === 'jugadores') datos.setJugadores((prev) => prev.filter((j) => j.id !== id));
      }
    } catch {
      mostrarMensaje('No se puede eliminar el registro. Puede estar en uso.', true);
    }
  };

  const eliminarFilaJugadorConConfirmacion = (idx: number) => {
    planilla.eliminarFilaJugador(idx, async () => {
      return confirm({
        title: '¿Eliminar Jugador?',
        description: '¿Está seguro de que desea eliminar este jugador de la planilla?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmButton: { variant: 'destructive' },
      });
    });
  };

  if (!usuario) return null;

  const esDelegado = delegado.delegadoTeamId !== null;
  const opcsEquipos = (esDelegado ? datos.equipos.filter((e) => e.id === delegado.delegadoTeamId) : datos.equipos).map(
    (e) => ({ id: e.id, label: e.name })
  );

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans relative overflow-hidden">
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      <div
        className={`${esDelegado ? 'w-full' : 'lg:ml-64'} flex flex-col min-h-screen relative z-10 transition-all duration-300`}
      >
        <CabeceraEstandar titulo="Gestión de Participantes" subtitulo="Inscripciones y Configuración del Campeonato" />

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 px-4 md:px-8">
          {datos.errorLocal && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{datos.errorLocal}</span>
            </div>
          )}

          <BannerPlazoInscripcion
            delegadoTeamId={delegado.delegadoTeamId}
            limiteDate={delegado.limiteDate}
            isDeadlineExpired={delegado.isDeadlineExpired}
            prorrogaPendiente={delegado.prorrogaPendiente}
            mostrarFormProrroga={delegado.mostrarFormProrroga}
            onMostrarFormProrroga={delegado.setMostrarFormProrroga}
            prorrogaFecha={delegado.prorrogaFecha}
            onProrrogaFechaChange={delegado.setProrrogaFecha}
            prorrogaMotivo={delegado.prorrogaMotivo}
            onProrrogaMotivoChange={delegado.setProrrogaMotivo}
            enviandoProrroga={delegado.enviandoProrroga}
            onEnviarSolicitud={(e) => delegado.enviarSolicitudProrroga(e, campeonatoActivo?.name || '')}
          />

          {tabActiva === 'categorias' && (
            <TabCategorias
              categorias={datos.categorias}
              disciplinas={datos.disciplinas}
              cargando={datos.cargando}
              onAbrirModalNueva={() => setModalNuevaCatAbierto(true)}
              onAbrirModalEditar={abrirModalEditarCat}
              onEliminar={eliminarElemento}
            />
          )}

          {tabActiva === 'equipos' && (
            <TabEquipos
              equiposPaginados={datos.equiposFiltrados}
              categorias={datos.categorias}
              cargando={datos.cargando}
              filtros={datos.filtrosEq}
              onFiltrosChange={datos.setFiltrosEq}
              paginaActual={datos.paginaEq}
              totalPaginas={datos.paginacionEq.last_page}
              totalRegistros={datos.paginacionEq.total}
              onCambiarPagina={datos.setPaginaEq}
              onAbrirModalNuevo={() => setModalNuevoEqAbierto(true)}
              onAbrirModalExistente={() => {
                setModalEqExistenteAbierto(true);
                cargarEquiposExistentes();
              }}
              onVerDetalle={(eq) => setModalVerEq({ abierto: true, eq })}
              onEditar={abrirModalEditarEq}
            />
          )}

          {tabActiva === 'jugadores' && (
            <TabJugadores
              jugadoresPaginados={datos.jugadoresFiltrados}
              equipos={datos.equipos}
              categorias={datos.categorias}
              cargando={datos.cargando}
              filtros={datos.filtrosJug}
              onFiltrosChange={datos.setFiltrosJug}
              paginaActual={datos.paginaJug}
              totalPaginas={datos.paginacionJug.last_page}
              totalRegistros={datos.paginacionJug.total}
              onCambiarPagina={datos.setPaginaJug}
              esDelegado={esDelegado}
              isDeadlineExpired={delegado.isDeadlineExpired}
              onAbrirModalNuevo={() => setModalNuevoJugAbierto(true)}
              onEditar={abrirModalEditarJugador}
              onEliminar={eliminarElemento}
            />
          )}

          {tabActiva === 'registro-equipo' && (
            <TabRegistroRapido
              disciplinas={datos.disciplinas}
              categorias={datos.categorias}
              reqEq={reqEq}
              onReqEqChange={setReqEq}
              logoFile={logoReqFile}
              logoUrl={logoReqUrl}
              onLogoFileChange={setLogoReqFile}
              onLogoUrlChange={setLogoReqUrl}
              onCrearCategoriaInline={crearCatInline}
              guardando={guardandoReqEq}
              onGuardar={guardarReqEq}
            />
          )}

          {tabActiva === 'planilla-jugadores' && (
            <TabPlanillaJugadores
              delegadoTeamId={delegado.delegadoTeamId}
              equipoSelId={equipoSelId}
              onEquipoSelIdChange={setEquipoSelId}
              equipoSel={planilla.equipoSel}
              equiposOpciones={opcsEquipos}
              filasJugadores={planilla.filasJugadores}
              jugadoresDePlanilla={planilla.jugadoresDePlanilla}
              cargandoPlanilla={planilla.cargandoPlanilla}
              isDeadlineExpired={delegado.isDeadlineExpired}
              cargandoJugadoresExistentes={cargandoJugadoresExistentes}
              onAbrirModalNuevo={() => setModalNuevoJugAbierto(true)}
              onAbrirModalExistente={() => {
                setModalJugExistenteAbierto(true);
                cargarJugadoresDisponibles();
              }}
              onAbrirModalCargaMasiva={() => setModalCargaMasivaAbierto(true)}
              onDescargarPlantilla={descargarPlantillaCsv}
              onEditarJugador={abrirModalEditarJugador}
              onEliminarFila={eliminarFilaJugadorConConfirmacion}
            />
          )}
        </main>

        {/* ── Modales ── */}
        <ModalNuevoEquipo
          abierto={modalNuevoEqAbierto}
          onCerrar={cerrarModalNuevoEq}
          disciplinas={datos.disciplinas}
          categorias={datos.categorias}
          nuevoEq={nuevoEq}
          onNuevoEqChange={setNuevoEq}
          logoFile={logoEqFile}
          logoUrl={logoEqUrl}
          onLogoFileChange={setLogoEqFile}
          onLogoUrlChange={setLogoEqUrl}
          onGuardar={guardarEquipo}
        />

        <ModalEditarEquipo
          estado={modalEditarEq}
          onEstadoChange={setModalEditarEq}
          onCerrar={cerrarModalEditarEq}
          logoFile={logoEditFile}
          logoUrl={logoEditUrl}
          onLogoFileChange={setLogoEditFile}
          onLogoUrlChange={setLogoEditUrl}
          onGuardar={guardarEdicionEq}
        />

        <ModalEquipoExistente
          abierto={modalEqExistenteAbierto}
          onCerrar={() => {
            setModalEqExistenteAbierto(false);
            setEquiposSeleccionados([]);
            setBusquedaEquipoExistente('');
          }}
          equiposExistentes={equiposExistentes}
          busqueda={busquedaEquipoExistente}
          onBusquedaChange={setBusquedaEquipoExistente}
          seleccionados={equiposSeleccionados}
          onSeleccionadosChange={setEquiposSeleccionados}
          onConfirmar={anadirEquiposExistentes}
        />

        <ModalVerEquipo
          abierto={modalVerEq.abierto}
          eq={modalVerEq.eq}
          jugadores={datos.jugadores}
          esDelegado={esDelegado}
          onCerrar={() => setModalVerEq({ abierto: false, eq: null })}
          onCambiarEstado={cambiarEstadoEquipo}
          onEliminar={eliminarElemento}
          onEditar={abrirModalEditarEq}
        />

        <ModalNuevaCategoria
          abierto={modalNuevaCatAbierto}
          onCerrar={() => setModalNuevaCatAbierto(false)}
          disciplinas={datos.disciplinas}
          nuevaCat={nuevaCat}
          onNuevaCatChange={setNuevaCat}
          onGuardar={guardarCategoria}
        />

        <ModalEditarCategoria
          estado={modalEditarCat}
          onEstadoChange={setModalEditarCat}
          onCerrar={() =>
            setModalEditarCat({ abierto: false, id: null, name: '', age_min: '', age_max: '', gender: 'Masculino', guardando: false })
          }
          onGuardar={guardarEdicionCat}
        />

        <ModalNuevoJugador
          abierto={modalNuevoJugAbierto}
          onCerrar={cerrarModalNuevoJug}
          equipos={datos.equipos}
          delegadoTeamId={delegado.delegadoTeamId}
          equipoSelId={equipoSelId}
          nuevoJug={nuevoJug}
          onNuevoJugChange={setNuevoJug}
          fotoFile={fotoJugFile}
          fotoUrl={fotoJugUrl}
          onFotoFileChange={setFotoJugFile}
          onFotoUrlChange={setFotoJugUrl}
          onGuardar={guardarJugador}
        />

        <ModalEditarJugador
          estado={modalEditarJug}
          onEstadoChange={setModalEditarJug}
          onCerrar={() => setModalEditarJug((prev) => ({ ...prev, abierto: false }))}
          equipos={datos.equipos}
          delegadoTeamId={delegado.delegadoTeamId}
          fotoFile={fotoEditJugFile}
          fotoUrl={fotoEditJugUrl}
          onFotoFileChange={setFotoEditJugFile}
          onFotoUrlChange={setFotoEditJugUrl}
          onGuardar={guardarEdicionJugador}
        />

        <ModalJugadoresExistentes
          abierto={modalJugExistenteAbierto}
          onCerrar={cerrarModalJugExistente}
          jugadoresDisponibles={jugadoresDisponibles}
          busqueda={busquedaJugadorExistente}
          onBusquedaChange={setBusquedaJugadorExistente}
          seleccionados={jugadoresExistentesSeleccionados}
          onSeleccionadosChange={setJugadoresExistentesSeleccionados}
          guardando={guardandoJugadoresExistentes}
          onConfirmar={agregarJugadoresExistentes}
        />

        <ModalCargaMasiva
          abierto={modalCargaMasivaAbierto}
          onCerrar={() => setModalCargaMasivaAbierto(false)}
          equipos={datos.equipos}
          delegadoTeamId={delegado.delegadoTeamId}
          equipoIdMasiva={equipoIdMasiva}
          onEquipoIdMasivaChange={setEquipoIdMasiva}
          archivoCsv={archivoCsv}
          onArchivoCsvChange={(f) => {
            setArchivoCsv(f);
            setResultadoCarga(null);
          }}
          cargandoCsv={cargandoCsv}
          resultadoCarga={resultadoCarga}
          onDescargarPlantilla={descargarPlantillaCsv}
          onProcesar={procesarCsv}
        />

        {/* Botón flotante de ayuda */}
        <button
          onClick={() => setMostrarAyuda(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40 cursor-pointer"
          title="¿Cómo usar esta sección?"
        >
          <span className="material-symbols-outlined text-lg">question_mark</span>
        </button>

        <DrawerAyudaParticipantes
          abierto={mostrarAyuda}
          onCerrar={() => setMostrarAyuda(false)}
          esDelegado={esDelegado}
        />
      </div>
    </div>
  );
};