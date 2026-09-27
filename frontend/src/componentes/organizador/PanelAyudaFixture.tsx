import React from 'react';

interface PasoAyudaFixture {
  paso: string;
  titulo: string;
  desc: string;
  icono: string;
}

interface PanelAyudaFixtureProps {
  visible: boolean;
  onClose: () => void;
  pasos: PasoAyudaFixture[];
}

export const PanelAyudaFixture: React.FC<PanelAyudaFixtureProps> = ({ visible, onClose, pasos }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">help</span>
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Ayuda: Fixture y Fechas</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
            Sigue estos pasos en orden para estructurar y programar los partidos del campeonato:
          </p>
          {pasos.map((p) => (
            <div key={p.paso} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
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
            La asignación de horarios calcula los partidos basándose en la relevancia de cada equipo. Los partidos de alta expectación o puntaje acumulado suelen asignarse de manera optimizada en horarios centrales.
          </p>
        </div>
      </div>
    </div>
  );
};
