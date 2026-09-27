import React, { useEffect, useRef, useState } from 'react';
import type { OpcionAutocomplete } from '../types/Participantes';

interface AutocompleteProps {
  label: string;
  placeholder: string;
  opciones: OpcionAutocomplete[];
  valorId: number | null;
  onChange: (id: number | null, texto: string) => void;
  onCrear?: (texto: string) => Promise<number | null>;
  requerido?: boolean;
  deshabilitado?: boolean;
  textoCrear?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  placeholder,
  opciones,
  valorId,
  onChange,
  onCrear,
  requerido,
  deshabilitado,
  textoCrear,
}) => {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valorId !== null) {
      const op = opciones.find((o) => o.id === valorId);
      if (op) setTexto(op.label);
    } else {
      setTexto('');
    }
  }, [valorId, opciones]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtradas = opciones.filter((o) =>
    o.label.toLowerCase().includes(texto.toLowerCase())
  );
  const existeExacto = opciones.some(
    (o) => o.label.toLowerCase() === texto.toLowerCase().trim()
  );
  const mostrarCrear = onCrear && texto.trim().length > 1 && !existeExacto;

  const seleccionar = (op: OpcionAutocomplete) => {
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
        {label}
        {requerido && ' *'}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={texto}
          disabled={deshabilitado}
          onChange={(e) => {
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
            {filtradas.map((op) => (
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