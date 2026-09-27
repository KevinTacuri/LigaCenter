import React from 'react';

interface PasoAyuda {
  paso: string;
  titulo: string;
  desc: string;
  icono: string;
}

const PASOS_DELEGADO: PasoAyuda[] = [
  { paso: '1', titulo: 'Seleccionar tu Equipo', desc: 'Verifica los datos y categoría de tu equipo asignado.', icono: 'groups' },
  { paso: '2', titulo: 'Modalidad de Carga', desc: 'Descarga la plantilla Excel/CSV para carga masiva o usa el formulario uno por uno.', icono: 'upload_file' },
  { paso: '3', titulo: 'Dorsales y DNI Únicos', desc: 'El número de dorsal no se puede repetir en el mismo equipo y cada deportista debe tener un DNI/cédula único.', icono: 'badge' },
  { paso: '4', titulo: 'Foto de Perfil', desc: 'Adjunta la foto de cada jugador para su carnet digital oficial.', icono: 'add_a_photo' },
  { paso: '5', titulo: 'Habilitación de Planilla', desc: 'El organizador del torneo validará tus deportistas para su participación.', icono: 'check_circle' },
];

const PASOS_PARTICIPANTES: PasoAyuda[] = [
  { paso: '1', titulo: 'Disciplinas (Deportes)', desc: 'Registra los deportes que se jugarán (ej. Fútbol, Vóley).', icono: 'sports' },
  { paso: '2', titulo: 'Categorías', desc: 'Define los rangos de edad, el género y formato para cada deporte.', icono: 'category' },
  { paso: '3', titulo: 'Equipos', desc: 'Registra los equipos asociándolos a su categoría.', icono: 'groups' },
  { paso: '4', titulo: 'Jugadores', desc: 'Inscribe a los jugadores en su respectivo equipo.', icono: 'person' },
  { paso: '5', titulo: 'Registro Rápido Equipo ✨', desc: 'Crea un equipo con autocomplete — escribe y selecciona o crea disciplina y categoría al vuelo.', icono: 'bolt' },
  { paso: '6', titulo: 'Planilla de Jugadores ✨', desc: 'Selecciona un equipo y llena jugadores en una tabla estilo Excel. Cada fila se guarda individualmente.', icono: 'table' },
];

interface DrawerAyudaParticipantesProps {
  abierto: boolean;
  onCerrar: () => void;
  esDelegado: boolean;
}

export const DrawerAyudaParticipantes: React.FC<DrawerAyudaParticipantesProps> = ({
  abierto,
  onCerrar,
  esDelegado,
}) => {
  if (!abierto) return null;

  const pasos = esDelegado ? PASOS_DELEGADO : PASOS_PARTICIPANTES;

  return (
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
            <h3 id="drawer-ayuda-title" className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
              Ayuda: Equipos y Jugadores
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
            {esDelegado
              ? 'Guía rápida para la inscripción de deportistas de tu equipo:'
              : 'Sigue estos pasos en orden para inscribir correctamente a los competidores de tu torneo:'}
          </p>
          {pasos.map((p) => {
            const destacado = ['5', '6', '7'].includes(p.paso);
            return (
              <div
                key={p.paso}
                className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                  destacado
                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100/60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border ${
                    destacado
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}
                >
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
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[10px] text-slate-400 font-semibold mb-1">💡 Consejo rápido:</p>
          <p className="text-[10px] text-slate-500 leading-normal font-medium">
            Si un jugador no aparece para registrar, asegúrate de que el equipo esté aprobado. El fixture Round Robin
            solo se podrá generar con equipos aprobados.
          </p>
        </div>
      </div>
    </div>
  );
};