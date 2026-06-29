import React from 'react';
import { NavLanding } from './NavLanding';

const EQUIPO = [
  { nombre: 'Braulio Chavez Nina',        correo: 'bchavezn@unsa.edu.pe',      rol: 'Backend & Base de Datos' },
  { nombre: 'Sharon Condori Paniguara',   correo: 'scondoripan@unsa.edu.pe',    rol: 'Frontend & UX' },
  { nombre: 'José Llave Apaza',           correo: 'jllave@unsa.edu.pe',         rol: 'Arquitectura & DevOps' },
  { nombre: 'Cristhian Puma Larico',      correo: 'cpumal@unsa.edu.pe',         rol: 'Backend & API REST' },
  { nombre: 'Victor Quispe Quicaña',      correo: 'vquispequic@unsa.edu.pe',    rol: 'Frontend & Estadísticas' },
  { nombre: 'Vladimir Solorzano Huamani', correo: 'vsolorzano@unsa.edu.pe',     rol: 'QA & Pruebas' },
  { nombre: 'Kevin Tacuri Masca',         correo: 'ktacurim@unsa.edu.pe',       rol: 'Gestión & Scrum Master' },
  { nombre: 'Rodrigo Veliz Saihua',       correo: 'rvelizs@unsa.edu.pe',        rol: 'Frontend & Diseño UI' },
];

const VALORES = [
  { icon: 'lightbulb',     title: 'Innovación',    desc: 'Aplicamos tecnologías modernas para resolver problemas reales del deporte local.' },
  { icon: 'handshake',     title: 'Colaboración',  desc: 'Trabajamos en equipo con metodología Scrum para entregar valor en cada sprint.' },
  { icon: 'verified_user', title: 'Calidad',       desc: 'Cada módulo pasa por revisión, pruebas funcionales y validación con el cliente.' },
  { icon: 'public',        title: 'Accesibilidad', desc: 'Diseñamos para que cualquier participante pueda consultar información desde cualquier dispositivo.' },
];

export const Nosotros: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans overflow-x-hidden">
      <NavLanding />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          Quiénes somos
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          El equipo detrás de <span className="text-indigo-400">LigaCenter</span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Somos ocho estudiantes de la Escuela Profesional de Ingeniería de Sistemas de la UNSA que desarrollamos esta plataforma como Proyecto Capstone 2026, en colaboración con el Colegio de Ingenieros de Arequipa.
        </p>
      </section>

      {/* FUNDACIÓN / ORIGEN */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Origen del proyecto</span>
            <h2 className="text-2xl font-black text-white">¿Por qué LigaCenter?</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              El Colegio de Ingenieros de Arequipa organiza campeonatos deportivos multidisciplinarios cada año, involucrando a cientos de profesionales de distintas especialidades. La gestión se realizaba con hojas de cálculo y herramientas básicas que limitaban la visibilidad en tiempo real.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              En marzo de 2026, el equipo identificó esta problemática y propuso un sistema web completo que reemplazara las herramientas existentes, mejorando la experiencia de organizadores, delegados, árbitros y público en general.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Inicio del proyecto', valor: 'Marzo 2026',    icon: 'calendar_today' },
              { label: 'Metodología',          valor: 'Scrum',         icon: 'sprint' },
              { label: 'Institución cliente',  valor: 'CIA Arequipa',  icon: 'domain' },
              { label: 'Sprints completados',  valor: '6 sprints',     icon: 'check_circle' },
            ].map((item) => (
              <div key={item.label} className="bg-[#0a0b10] border border-slate-900 rounded-xl p-4 space-y-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">{item.icon}</span>
                <p className="font-black text-sm text-white">{item.valor}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISIÓN / VISIÓN / VALORES */}
      <section className="py-16 px-6 max-w-5xl mx-auto space-y-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400">flag</span>
            </div>
            <h3 className="font-black text-base text-white">Misión</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Desarrollar una plataforma tecnológica accesible y robusta que optimice la gestión de campeonatos deportivos, proporcionando información precisa en tiempo real a todos los actores involucrados.
            </p>
          </div>
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400">visibility</span>
            </div>
            <h3 className="font-black text-base text-white">Visión</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convertirnos en la herramienta de referencia para la gestión deportiva institucional en Arequipa, escalable a otros colegios profesionales y ligas deportivas de la región.
            </p>
          </div>
        </div>

        {/* VALORES */}
        <div>
          <div className="text-center mb-8 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Principios</span>
            <h2 className="text-2xl font-black text-white">Nuestros valores</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALORES.map((v) => (
              <div key={v.title} className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-3 hover:border-indigo-500/30 transition-all text-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-indigo-400">{v.icon}</span>
                </div>
                <h3 className="font-bold text-sm text-white">{v.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Desarrolladores</span>
          <h2 className="text-2xl font-black text-white">El equipo</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {EQUIPO.map((m) => (
            <div key={m.correo} className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 space-y-2 hover:border-indigo-500/30 transition-all text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-indigo-400 text-xl">person</span>
              </div>
              <p className="font-bold text-xs text-white leading-tight">{m.nombre}</p>
              <span className="inline-block text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{m.rol}</span>
              <p className="text-[9px] text-slate-500 break-all">{m.correo}</p>
            </div>
          ))}
        </div>

        {/* Asesor */}
        <div className="mt-8 bg-[#11131c] border border-indigo-500/20 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-400 text-2xl">school</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Asesor del proyecto</p>
            <p className="font-black text-sm text-white">Mg. Fredy Orlando Gonzales Saji</p>
            <p className="text-xs text-slate-400">fgonzaless@unsa.edu.pe · EPIS — UNSA</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 px-6 text-center space-y-1">
        <p className="font-black text-sm text-white">Liga<span className="text-indigo-400">Center</span></p>
        <p className="text-[10px] text-slate-500">© 2026 · Universidad Nacional de San Agustín de Arequipa · Ingeniería de Sistemas</p>
      </footer>
    </div>
  );
};