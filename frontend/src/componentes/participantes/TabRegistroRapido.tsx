import React from 'react';
import { Autocomplete } from '../Autocomplete';
import { LogoInput } from '../LogoInput';
import { resolverUrlImagen } from '../../servicios/api';
import type { Disciplina, Categoria } from '../../servicios/api';
import type { OpcionAutocomplete } from '../../types/Participantes';

interface ReqEquipoState {
  nombre: string;
  representante: string;
  discId: number | null;
  catId: number | null;
}

interface TabRegistroRapidoProps {
  disciplinas: Disciplina[];
  categorias: Categoria[];
  reqEq: ReqEquipoState;
  onReqEqChange: (v: ReqEquipoState) => void;
  logoFile: File | null;
  logoUrl: string;
  onLogoFileChange: (f: File | null) => void;
  onLogoUrlChange: (u: string) => void;
  onCrearCategoriaInline: (nombre: string) => Promise<number | null>;
  guardando: boolean;
  onGuardar: () => void;
}

export const TabRegistroRapido: React.FC<TabRegistroRapidoProps> = ({
  disciplinas,
  categorias,
  reqEq,
  onReqEqChange,
  logoFile,
  logoUrl,
  onLogoFileChange,
  onLogoUrlChange,
  onCrearCategoriaInline,
  guardando,
  onGuardar,
}) => {
  const catsFiltradas: OpcionAutocomplete[] = categorias
    .filter((c) => !reqEq.discId || c.championship_discipline_id === reqEq.discId)
    .map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-emerald-400 text-base mt-0.5">bolt</span>
        <div>
          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Registro Rápido</p>
          <p className="text-xs text-emerald-200/70 mt-0.5 leading-relaxed">
            Escribe para buscar. Si no existe lo que buscas, aparecerá la opción de crearlo en el momento.
            Los datos provisionales (delegado, edades) se pueden completar después en las pestañas individuales.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
          Datos del Equipo
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Nombre del Equipo *</label>
          <input
            type="text"
            placeholder="Ej: Real Arequipa"
            value={reqEq.nombre}
            onChange={(e) => onReqEqChange({ ...reqEq, nombre: e.target.value })}
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Delegado / Representante</label>
          <input
            type="text"
            placeholder="Nombre del representante (opcional)"
            value={reqEq.representante}
            onChange={(e) => onReqEqChange({ ...reqEq, representante: e.target.value })}
            className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Disciplina *</label>
          <select
            required
            value={reqEq.discId || ''}
            onChange={(e) => {
              const val = e.target.value;
              onReqEqChange({ ...reqEq, discId: val ? parseInt(val) : null, catId: null });
            }}
            className="w-full text-sm border border-slate-200 bg-white rounded-lg p-2.5 outline-hidden cursor-pointer"
          >
            <option value="">-- Selecciona Disciplina --</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <Autocomplete
          label="Categoría"
          placeholder={reqEq.discId ? 'Escribe el nombre de la categoría...' : 'Selecciona primero una disciplina'}
          opciones={catsFiltradas}
          valorId={reqEq.catId}
          onChange={(id) => onReqEqChange({ ...reqEq, catId: id })}
          onCrear={reqEq.discId ? onCrearCategoriaInline : undefined}
          requerido
          deshabilitado={!reqEq.discId}
          textoCrear="categoría"
        />

        <LogoInput
          logoFile={logoFile}
          logoUrlTexto={logoUrl}
          onFileChange={onLogoFileChange}
          onUrlChange={onLogoUrlChange}
          resolverUrl={resolverUrlImagen}
          label="Logo del Equipo"
        />

        {(reqEq.discId || reqEq.catId) && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wide mb-1">Vista previa</p>
            {reqEq.nombre && (
              <p>
                <span className="font-semibold">Equipo:</span> {reqEq.nombre}
              </p>
            )}
            {reqEq.discId && (
              <p>
                <span className="font-semibold">Disciplina:</span>{' '}
                {disciplinas.find((d) => d.id === reqEq.discId)?.name}
              </p>
            )}
            {reqEq.catId && (
              <p>
                <span className="font-semibold">Categoría:</span>{' '}
                {categorias.find((c) => c.id === reqEq.catId)?.name}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onGuardar}
          disabled={guardando || !reqEq.nombre.trim() || !reqEq.discId || !reqEq.catId}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {guardando ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Guardar Equipo
            </>
          )}
        </button>
      </div>
    </div>
  );
};