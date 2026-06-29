import React from 'react';
import { NavLanding } from './NavLanding';

const RECURSOS = [
  { titulo: 'Acta de Constitución',          tipo: 'PDF',  icono: 'description',    desc: 'Documento oficial de inicio del proyecto con alcance, objetivos y stakeholders.' },
  { titulo: 'Plan de Gestión del Proyecto',  tipo: 'PDF',  icono: 'article',         desc: 'Cronograma, EDT, plan de riesgos, comunicaciones y gestión de calidad.' },
  { titulo: 'Manual de Usuario',             tipo: 'PDF',  icono: 'menu_book',       desc: 'Guía paso a paso para organizadores, delegados y árbitros del sistema.' },
  { titulo: 'Documentación de la API',       tipo: 'JSON', icono: 'code',            desc: 'Colección Postman con todos los endpoints REST del backend Laravel.' },
  { titulo: 'Informe Final Capstone',        tipo: 'PDF',  icono: 'school',          desc: 'Informe académico completo presentado a la EPIS-UNSA incluyendo resultados.' },
  { titulo: 'Prototipo Figma',               tipo: 'Link', icono: 'draw',            desc: 'Mockups de alta fidelidad del sistema completo, incluyendo flujos de usuario.' },
];

const FAQS = [
  { q: '¿Necesito una cuenta para ver los resultados?',       a: 'No. El portal público en /publico permite ver posiciones, partidos y estadísticas sin iniciar sesión.' },
  { q: '¿Cómo se registran los resultados de un partido?',    a: 'El árbitro o delegado accede a la Mesa de Control con sus credenciales y carga la planilla oficial.' },
  { q: '¿Qué formatos de torneo soporta el sistema?',         a: 'Liga (round-robin), grupos con fase de eliminación y eliminación directa (octavos, cuartos, semi, final).' },
  { q: '¿Puedo registrar jugadores en masa?',                 a: 'Sí. El módulo de participantes permite carga masiva mediante archivo CSV con validación automática.' },
  { q: '¿El sistema soporta múltiples disciplinas?',          a: 'Sí. Cada campeonato puede tener varias disciplinas (fútbol, vóley, básquet) con sus propias categorías y estadísticas.' },
];

export const Documentacion: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans overflow-x-hidden">
      <NavLanding />

      <section className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          Recursos del proyecto
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Documentación y descargas
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Todos los entregables académicos, manuales y recursos técnicos del proyecto disponibles en un solo lugar.
        </p>
      </section>

      {/* RECURSOS */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-8 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Entregables</span>
          <h2 className="text-xl font-black text-white">Documentos disponibles</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-3 hover:border-indigo-500/30 transition-all group">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-400">{r.icono}</span>
                </div>
                <span className="text-[9px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full uppercase">{r.tipo}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-white">{r.titulo}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">download</span>
                Descargar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Preguntas frecuentes</span>
          <h2 className="text-2xl font-black text-white">¿Tienes dudas?</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-2 hover:border-indigo-500/30 transition-all">
              <p className="font-bold text-sm text-white flex items-start gap-2">
                <span className="text-indigo-400 shrink-0">Q.</span>
                {f.q}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pl-5">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTO */}
      <section className="py-16 px-6 max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-2xl font-black text-white">¿Necesitas más información?</h2>
        <p className="text-sm text-slate-400">Contacta al equipo o al asesor del proyecto directamente.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="mailto:scondoripan@unsa.edu.pe" className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-2 hover:border-indigo-500/30 transition-all text-left block">
            <span className="material-symbols-outlined text-indigo-400">mail</span>
            <p className="font-bold text-xs text-white">Equipo de desarrollo</p>
            <p className="text-[10px] text-slate-400">scondoripan@unsa.edu.pe</p>
          </a>
          <a href="mailto:fgonzaless@unsa.edu.pe" className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-2 hover:border-indigo-500/30 transition-all text-left block">
            <span className="material-symbols-outlined text-indigo-400">school</span>
            <p className="font-bold text-xs text-white">Asesor del proyecto</p>
            <p className="text-[10px] text-slate-400">fgonzaless@unsa.edu.pe</p>
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 px-6 text-center space-y-1">
        <p className="font-black text-sm text-white">Liga<span className="text-indigo-400">Center</span></p>
        <p className="text-[10px] text-slate-500">© 2026 · Universidad Nacional de San Agustín de Arequipa · Ingeniería de Sistemas</p>
      </footer>
    </div>
  );
};