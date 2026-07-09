import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CabeceraPublica } from '../../componentes/public/CabeceraPublica';
import type { Campeonato } from '../../servicios/api';

const FEATURES = [
  { icon: 'emoji_events',   title: 'Gestión de Campeonatos',    desc: 'Administra torneos multidisciplinarios con múltiples categorías, disciplinas y formatos de competencia.' },
  { icon: 'groups',         title: 'Control de Participantes',  desc: 'Registro de equipos, jugadores, delegados y árbitros centralizado en una sola plataforma.' },
  { icon: 'bar_chart',      title: 'Estadísticas en Tiempo Real', desc: 'Tablas de posiciones, rankings y sanciones actualizados automáticamente tras cada partido.' },
  { icon: 'calendar_month', title: 'Fixture Automático',         desc: 'Genera calendarios para liga, grupos y eliminación directa con soporte para walkovers.' },
  { icon: 'public',         title: 'Portal Público',             desc: 'Resultados visibles para todos sin necesidad de cuenta. Comparte el link con los participantes.' },
  { icon: 'verified',       title: 'Mesa de Control',            desc: 'Carga de planillas e incidencias por árbitros y delegados en tiempo real desde cualquier dispositivo.' },
];

interface Props {
  campeonatosPublicos: Campeonato[];
  seleccionarCampeonato: (camp: Campeonato) => void;
}

export const Informacion: React.FC<Props> = ({ campeonatosPublicos, seleccionarCampeonato }) => {
  const navegar = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans overflow-x-hidden">
      <CabeceraPublica />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#0a0b10] to-[#0a0b10] z-0" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            Proyecto Capstone · UNSA 2026
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Sistema de Gestión de<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-200">
              Campeonatos Deportivos
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Plataforma web para la gestión, seguimiento y control estadístico de los campeonatos multidisciplinarios del Colegio de Ingenieros de Arequipa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navegar('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Iniciar sesión
            </button>
            <button
              onClick={() => document.getElementById('torneos')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#11131c] border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white font-bold text-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">sports_score</span>
              Ver torneos activos
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 animate-bounce">
          <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Funcionalidades</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Todo lo que necesitas en un solo lugar</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-400 text-lg">{f.icon}</span>
              </div>
              <h3 className="font-bold text-sm text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TORNEOS */}
      <section id="torneos" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">En Curso</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Torneos disponibles</h2>
          <p className="text-sm text-slate-400">Selecciona un campeonato para ver posiciones, fixture y estadísticas.</p>
        </div>
        {campeonatosPublicos.length === 0 ? (
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-600 text-4xl">sports_score</span>
            <p className="text-sm text-slate-400">No hay campeonatos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campeonatosPublicos.map((camp) => (
              <div
                key={camp.id}
                onClick={() => seleccionarCampeonato(camp)}
                className="p-6 rounded-2xl bg-[#11131c] border border-slate-900 hover:border-indigo-500/50 hover:bg-indigo-950/5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {camp.type === 'completo' ? 'Multidisciplina' : 'Básico'}
                    </span>
                    <span className="material-symbols-outlined text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">arrow_forward_ios</span>
                  </div>
                  <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{camp.name}</h3>
                  {camp.description && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{camp.description}</p>}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {camp.start_date || '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${camp.status === 'en_curso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {camp.status === 'en_curso' ? 'En Curso' : camp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center space-y-1">
        <p className="font-black text-sm text-white">Liga<span className="text-indigo-400">Center</span></p>
        <p className="text-[10px] text-slate-500">© 2026 · Universidad Nacional de San Agustín de Arequipa · Ingeniería de Sistemas</p>
        <p className="text-[10px] text-slate-600">Asesor: Mg. Fredy Orlando Gonzales Saji</p>
      </footer>
    </div>
  );
};