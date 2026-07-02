import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useCampeonato } from '../../contexto/ContextoCampeonato';
import { serviciosCampeonatos } from '../../servicios/api';
import { sileo } from 'sileo';
import { BarraLateral } from '../../componentes/BarraLateral';
import { CabeceraEstandar } from '../../componentes/CabeceraEstandar';

export const Configuracion: React.FC = () => {
  const { usuario, cargando, tieneRol } = useAutenticacion();
  const { campeonatoActivo, seleccionarCampeonato } = useCampeonato();
  const navegar = useNavigate();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'basico' | 'completo'>('basico');
  const [estado, setEstado] = useState('creado');
  const [isPublic, setIsPublic] = useState(false);
  const [reglamento, setReglamento] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && !usuario) {
      navegar('/login');
      return;
    }
    if (usuario && tieneRol('administrador')) {
      navegar('/tablero');
    }
  }, [usuario, cargando, navegar]);

  useEffect(() => {
    if (campeonatoActivo) {
      setNombre(campeonatoActivo.name || '');
      setTipo(campeonatoActivo.type || 'basico');
      setEstado(campeonatoActivo.status || 'creado');
      setIsPublic(campeonatoActivo.is_public || false);
    }
  }, [campeonatoActivo]);

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campeonatoActivo) return;
    setGuardando(true);
    setErrorLocal(null);

    try {
      const formData = new FormData();
      formData.append('name', nombre.trim());
      formData.append('type', tipo);
      formData.append('status', estado);
      formData.append('is_public', isPublic ? '1' : '0');
      if (reglamento) {
        formData.append('rules_pdf', reglamento);
      }

      const res = await serviciosCampeonatos.actualizarCampeonato(campeonatoActivo.id, formData);
      if (res.success) {
        seleccionarCampeonato(res.data);
        setReglamento(null);
        sileo.success({
          title: 'Configuración Guardada',
          description: 'Los cambios del campeonato han sido aplicados con éxito.'
        });
      }
    } catch (err: any) {
      setErrorLocal(err.response?.data?.message || 'Error al guardar los cambios del campeonato.');
    } finally {
      setGuardando(false);
    }
  };

  const manejarDescargarReglamento = async () => {
    if (!campeonatoActivo) return;
    try {
      const blob = await serviciosCampeonatos.descargarReglamento(campeonatoActivo.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reglamento-${campeonatoActivo.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      sileo.error({
        title: 'Error de Descarga',
        description: 'No se pudo descargar el reglamento del torneo.'
      });
    }
  };

  if (cargando || !usuario) return null;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
      <CabeceraEstandar titulo="Configuración del Campeonato" subtitulo="Parámetros, reglas y estado de competencia" />

      {/* Contenido */}
      <main className="flex-1 p-6 max-w-3xl w-full mx-auto space-y-6">
        {!campeonatoActivo ? (
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">warning</span>
            <p className="text-sm font-semibold">No has seleccionado ningún campeonato activo.</p>
            <p className="text-xs text-slate-450 mt-1">Regresa al tablero y selecciona un campeonato antes de continuar.</p>
          </div>
        ) : (
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Ajustes Generales del Torneo</h2>
              <p className="text-xs text-slate-450 mt-1">Configura los detalles básicos y sube el reglamento oficial de {campeonatoActivo.name}.</p>
            </div>

            {errorLocal && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorLocal}
              </div>
            )}

            <form onSubmit={manejarGuardar} className="space-y-5">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-350 block">Nombre del Campeonato *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Copa Clausura Ingenieros"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Gestión */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-350 block">Tipo / Modo de Gestión *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white cursor-pointer"
                  >
                    <option value="basico">Básico (Fixture rápido, marcadores)</option>
                    <option value="completo">Completo (Multi-deporte, actas detalladas, sanciones)</option>
                  </select>
                </div>

                {/* Estado */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-350 block">Estado del Campeonato *</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white cursor-pointer"
                  >
                    <option value="creado">Creado / Inscripciones abiertas</option>
                    <option value="en_curso">En Curso / Partidos programados</option>
                    <option value="finalizado">Finalizado / Premiación</option>
                  </select>
                </div>
              </div>

              {/* Visibilidad Publica - Toggle Switch */}
              <div className="space-y-3 pt-2 border-t border-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-350 block">Visibilidad del Campeonato</label>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                      {isPublic 
                        ? 'Público - Visible para todos los visitantes' 
                        : 'Privado - Solo usuarios con acceso pueden verlo'}
                    </p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                      isPublic ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border transition-all ${
                    !isPublic 
                      ? 'border-indigo-500 bg-indigo-500/5' 
                      : 'border-slate-800 bg-[#171a26]/40 opacity-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                      <span className="text-xs font-bold text-white">Privado</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Solo usuarios autenticados</span>
                  </div>
                  <div className={`p-3 rounded-xl border transition-all ${
                    isPublic 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-800 bg-[#171a26]/40 opacity-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">public</span>
                      <span className="text-xs font-bold text-white">Público</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Visible sin login</span>
                  </div>
                </div>
                
                <div className={`text-[10px] font-medium px-3 py-1.5 rounded-lg ${
                  isPublic 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-slate-700/20 text-slate-400 border border-slate-700/30'
                }`}>
                  {isPublic 
                    ? 'El campeonato aparecerá en la página pública y será visible para todos los visitantes.' 
                    : 'El campeonato solo será visible para usuarios autenticados en el panel de control.'}
                </div>
              </div>

              {/* PDF Reglamento */}
              <div className="space-y-2.5 pt-3 border-t border-slate-900">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-350 block">Reglamento Oficial (PDF)</label>
                  {campeonatoActivo.rules_pdf && (
                    <button
                      type="button"
                      onClick={manejarDescargarReglamento}
                      className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-hidden"
                    >
                      <span className="material-symbols-outlined text-xs">download</span>
                      Descargar Reglamento Actual
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setReglamento(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500/10 file:text-indigo-400 file:hover:bg-indigo-500/20 file:cursor-pointer outline-hidden cursor-pointer bg-[#171a26] border border-slate-800 p-2"
                />
                <p className="text-[10px] text-slate-500 leading-none">Sube un nuevo archivo PDF para reemplazar o registrar el reglamento del torneo.</p>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white py-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 uppercase tracking-wider"
              >
                {guardando ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Guardando Ajustes...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold">save</span>
                    <span>Guardar Configuración</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="mt-auto bg-[#11131c] border-t border-slate-900 py-5 text-center text-xs text-slate-450">
        © 2026 LigaCenter — Gestión de campeonatos deportivos, Arequipa, Perú.
      </footer>
      </div>
    </div>
  );
};