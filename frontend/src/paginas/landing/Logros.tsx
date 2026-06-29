import React from 'react';
import { NavLanding } from './NavLanding';

const HITOS = [
  { fecha: 'Mar 2026', titulo: 'Inicio del proyecto',          desc: 'Acta de constitución firmada. Reunión inicial con el Ing. Percy Palma del CIA Arequipa.',        icono: 'flag' },
  { fecha: 'Abr 2026', titulo: 'Sprint 1 completado',          desc: 'Módulos de autenticación, gestión de usuarios y estructura base de la API REST implementados.',   icono: 'check_circle' },
  { fecha: 'Abr 2026', titulo: 'Sprint 2 completado',          desc: 'Gestión de campeonatos, disciplinas y categorías. Panel de control del organizador operativo.',    icono: 'check_circle' },
  { fecha: 'May 2026', titulo: 'Sprint 3 completado',          desc: 'Módulo de participantes: equipos, jugadores y delegados. Carga masiva por CSV implementada.',     icono: 'check_circle' },
  { fecha: 'May 2026', titulo: 'Sprint 4 completado',          desc: 'Fixture automático para liga, grupos y eliminación directa. Programación de partidos.',           icono: 'check_circle' },
  { fecha: 'Jun 2026', titulo: 'Sprint 5 completado',          desc: 'Mesa de control: carga de resultados, planillas e incidencias en tiempo real desde el campo.',    icono: 'check_circle' },
  { fecha: 'Jun 2026', titulo: 'Portal público lanzado',       desc: 'Portal de estadísticas disponible para el público general sin necesidad de cuenta.',              icono: 'public' },
  { fecha: 'Jun 2026', titulo: 'Presentación al CIA Arequipa', desc: 'Demostración oficial del sistema ante directivos del Colegio de Ingenieros de Arequipa.',         icono: 'emoji_events' },
];

const STATS = [
  { valor: '8',    label: 'Integrantes del equipo',    icon: 'groups' },
  { valor: '6',    label: 'Sprints completados',        icon: 'sprint' },
  { valor: '+40',  label: 'Historias de usuario',       icon: 'task_alt' },
  { valor: '+15',  label: 'Módulos implementados',      icon: 'widgets' },
  { valor: '+200', label: 'Commits en repositorio',     icon: 'commit' },
  { valor: '3',    label: 'Disciplinas deportivas',     icon: 'sports_soccer' },
  { valor: '+80',  label: 'Equipos gestionados',        icon: 'shield' },
  { valor: '99%',  label: 'Uptime del sistema',         icon: 'monitoring' },
];

const RECONOCIMIENTOS = [
  { titulo: 'Mejor Proyecto Capstone 2026', entidad: 'EPIS — UNSA', desc: 'Seleccionado entre 12 proyectos por su impacto real en la comunidad y calidad técnica.', icono: 'workspace_premium' },
  { titulo: 'Caso de Éxito CIA Arequipa',   entidad: 'Colegio de Ingenieros', desc: 'Adoptado oficialmente para los campeonatos del segundo semestre 2026.', icono: 'verified' },
  { titulo: 'Prototipo Destacado',          entidad: 'Feria Tecnológica UNSA', desc: 'Exhibido como ejemplo de aplicación web moderna con impacto social.', icono: 'star' },
];

export const Logros: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans overflow-x-hidden">
      <NavLanding />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          Avance del proyecto
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Hitos y <span className="text-indigo-400">logros alcanzados</span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Desde marzo de 2026, el equipo ha trabajado de forma iterativa entregando valor en cada sprint. Aquí el resumen del camino recorrido.
        </p>
      </section>

      {/* STATS */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 text-center space-y-2 hover:border-indigo-500/30 transition-all">
              <span className="material-symbols-outlined text-indigo-400 text-xl">{s.icon}</span>
              <p className="font-black text-2xl text-white">{s.valor}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Cronología</span>
          <h2 className="text-2xl font-black text-white">Línea de tiempo</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />
          <div className="space-y-6 pl-12">
            {HITOS.map((h, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-8 w-8 h-8 rounded-full bg-[#11131c] border border-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-400 text-sm">{h.icono}</span>
                </div>
                <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-2 hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-bold text-sm text-white">{h.titulo}</h3>
                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">{h.fecha}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECONOCIMIENTOS */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Reconocimientos</span>
          <h2 className="text-2xl font-black text-white">Distinciones obtenidas</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {RECONOCIMIENTOS.map((r) => (
            <div key={r.titulo} className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-400">{r.icono}</span>
              </div>
              <div>
                <p className="font-black text-sm text-white">{r.titulo}</p>
                <p className="text-[10px] text-indigo-400 font-bold">{r.entidad}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 px-6 text-center space-y-1">
        <p className="font-black text-sm text-white">Liga<span className="text-indigo-400">Center</span></p>
        <p className="text-[10px] text-slate-500">© 2026 · Universidad Nacional de San Agustín de Arequipa · Ingeniería de Sistemas</p>
      </footer>
    </div>
  );
};