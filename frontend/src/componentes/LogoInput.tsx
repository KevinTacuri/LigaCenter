import React, { useState } from 'react';

interface LogoInputProps {
  logoFile: File | null;
  logoUrlTexto: string;
  logoActualUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onUrlChange: (texto: string) => void;
  label?: string;
  resolverUrl?: (url: string | null) => string | null; // inyectado por el consumidor (ej. resolverUrlImagen de servicios/api)
}

export const LogoInput: React.FC<LogoInputProps> = ({
  logoFile,
  logoUrlTexto,
  logoActualUrl,
  onFileChange,
  onUrlChange,
  label = 'Imagen',
  resolverUrl,
}) => {
  const [modo, setModo] = useState<'archivo' | 'url'>('archivo');

  const previewSrc = logoFile
    ? URL.createObjectURL(logoFile)
    : modo === 'url' && logoUrlTexto
    ? logoUrlTexto
    : resolverUrl
    ? resolverUrl(logoActualUrl || null)
    : logoActualUrl || null;

  return (
    <div className="space-y-2 font-sans">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">{label}</label>

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-[10px] font-bold w-fit bg-slate-50 dark:bg-[#151722]/50">
        <button
          type="button"
          onClick={() => setModo('archivo')}
          className={`px-3 py-1.5 transition-all cursor-pointer ${
            modo === 'archivo' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          Subir Imagen
        </button>
        <button
          type="button"
          onClick={() => setModo('url')}
          className={`px-3 py-1.5 transition-all cursor-pointer ${
            modo === 'url' ? 'bg-sky-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          Pegar URL
        </button>
      </div>

      <div className="flex items-center gap-3">
        {previewSrc && (
          <img
            src={previewSrc}
            alt="Vista previa"
            className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-800"
          />
        )}

        {modo === 'archivo' ? (
          <div className="flex-1">
            <input
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