import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Equipo } from '../../servicios/api';
import type { ResultadoCargaCsv } from '../../utils/organizador/participantesCsv';

interface ModalCargaMasivaProps {
  abierto: boolean;
  onCerrar: () => void;
  equipos: Equipo[];
  delegadoTeamId: number | null;
  equipoIdMasiva: number | null;
  onEquipoIdMasivaChange: (id: number | null) => void;
  archivoCsv: File | null;
  onArchivoCsvChange: (f: File | null) => void;
  cargandoCsv: boolean;
  resultadoCarga: ResultadoCargaCsv | null;
  onDescargarPlantilla: () => void;
  onProcesar: () => void;
}

export const ModalCargaMasiva: React.FC<ModalCargaMasivaProps> = ({
  abierto,
  onCerrar,
  equipos,
  delegadoTeamId,
  equipoIdMasiva,
  onEquipoIdMasivaChange,
  archivoCsv,
  onArchivoCsvChange,
  cargandoCsv,
  resultadoCarga,
  onDescargarPlantilla,
  onProcesar,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!abierto) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn text-on-surface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-carga-masiva-title"
    >
      <div className="bg-primary-container border border-outline rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">upload_file</span>
            <h3 id="modal-carga-masiva-title" className="font-black text-sm uppercase tracking-wide">
              Carga Masiva de Plantel en Bloque
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full border border-outline flex items-center justify-center text-on-surface-variant hover:bg-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">verified</span>
            <p className="text-[11px] font-medium leading-tight">
              <strong className="font-extrabold block mb-0.5">Importante para la Carga Masiva:</strong>
              Revisa que ningún jugador tenga el mismo <strong>DNI</strong> ni el mismo{' '}
              <strong>número de dorsal (#)</strong> repetido en la planilla.
            </p>
          </div>

          <div className="bg-surface border border-outline rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-extrabold text-xs text-on-surface">Formato de Plantilla Requerido</h4>
              <p className="text-[10px] text-on-surface-variant">
                Descarga el archivo CSV de muestra para llenar la plantilla de deportistas.
              </p>
            </div>
            <button
              type="button"
              onClick={onDescargarPlantilla}
              className="shrink-0 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              <span>Descargar CSV</span>
            </button>
          </div>

          {delegadoTeamId === null && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant block font-sans">Equipo Destino *</label>
              <select
                value={equipoIdMasiva ?? ''}
                onChange={(e) => onEquipoIdMasivaChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full text-sm border border-outline bg-surface text-on-surface rounded-xl p-3 outline-none cursor-pointer font-medium"
              >
                <option value="">-- Selecciona el equipo --</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
                onArchivoCsvChange(file);
              }
            }}
            className="border-2 border-dashed border-outline hover:border-primary bg-surface/50 hover:bg-surface rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group"
          >
            <span className="material-symbols-outlined text-4xl text-primary/70 group-hover:scale-110 transition-transform">
              cloud_upload
            </span>
            {archivoCsv ? (
              <div>
                <p className="text-xs font-black text-primary">{archivoCsv.name}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  {(archivoCsv.size / 1024).toFixed(1)} KB · Haz clic para cambiar archivo
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-on-surface">
                  Arrastra tu archivo de plantilla aquí o haz clic para examinar
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  Formatos permitidos: .CSV (Recomendado) / .XLSX
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onArchivoCsvChange(file);
              }}
            />
          </div>

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

          <div className="pt-3 border-t border-outline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2.5 text-xs font-bold text-on-surface-variant border border-outline rounded-xl hover:bg-surface transition-all cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onProcesar}
              disabled={!archivoCsv || cargandoCsv}
              className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-primary hover:opacity-90 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              {cargandoCsv ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">upload</span>
                  Procesar Carga Masiva
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};