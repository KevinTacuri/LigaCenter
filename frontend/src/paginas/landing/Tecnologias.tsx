import React from 'react';
import { NavLanding } from './NavLanding';

const STACK = [
  { categoria: 'Frontend', color: 'indigo', items: [
    { nombre: 'React 18',       desc: 'Librería UI con hooks y componentes funcionales.' },
    { nombre: 'TypeScript',     desc: 'Tipado estático para mayor robustez del código.' },
    { nombre: 'Tailwind CSS',   desc: 'Utilidades CSS para diseño rápido y consistente.' },
    { nombre: 'React Router v6',desc: 'Navegación SPA con rutas anidadas y protegidas.' },
    { nombre: 'Vite',           desc: 'Bundler ultrarrápido para desarrollo y producción.' },
  ]},
  { categoria: 'Backend', color: 'emerald', items: [
    { nombre: 'Laravel 11',     desc: 'Framework PHP robusto con arquitectura MVC.' },
    { nombre: 'API REST',       desc: 'Endpoints JSON para comunicación con el frontend.' },
    { nombre: 'Laravel Sanctum',desc: 'Autenticación por tokens para SPA y mobile.' },
    { nombre: 'MySQL 8',        desc: 'Base de datos relacional para datos del campeonato.' },
    { nombre: 'PHP 8.3',        desc: 'Lenguaje base con soporte para tipos y fibras.' },
  ]},
  { categoria: 'Infraestructura', color: 'amber', items: [
    { nombre: 'Git & GitHub',   desc: 'Control de versiones con flujo de ramas por feature.' },
    { nombre: 'Conventional Commits', desc: 'Historial de commits semántico y trazable.' },
    { nombre: 'Figma',          desc: 'Prototipado de alta fidelidad y diseño de UI.' },
    { nombre: 'Postman',        desc: 'Documentación y prueba de endpoints de la API.' },
    { nombre: 'Railway / VPS',  desc: 'Despliegue del backend con CI/CD básico.' },
  ]},
];

const ARQUITECTURA = [
  { paso: '01', titulo: 'Cliente (Navegador)',  desc: 'React SPA que consume la API REST mediante fetch. Rutas protegidas por contexto de autenticación.' },
  { paso: '02', titulo: 'API REST (Laravel)',   desc: 'Controladores por recurso, middleware de autenticación Sanctum, respuestas JSON estandarizadas.' },
  { paso: '03', titulo: 'Base de Datos (MySQL)',desc: 'Esquema relacional normalizado con migraciones Laravel. Relaciones polimórficas para incidencias.' },
  { paso: '04', titulo: 'Autenticación',        desc: 'Tokens de sesión por Sanctum. Login silencioso para vista pública anónima sin exponer credenciales.' },
];

export const Tecnologias: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans overflow-x-hidden">
      <NavLanding />

      <section className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          Stack técnico
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Tecnologías utilizadas
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          LigaCenter está construido sobre un stack moderno, elegido por su rendimiento, escalabilidad y facilidad de mantenimiento.
        </p>
      </section>

      {/* STACK */}
      <section className="py-12 px-6 max-w-5xl mx-auto space-y-8">
        {STACK.map((cat) => (
          <div key={cat.categoria}>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{cat.categoria}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item) => (
                <div key={item.nombre} className="bg-[#11131c] border border-slate-900 rounded-xl p-4 space-y-1 hover:border-indigo-500/30 transition-all">
                  <p className="font-black text-sm text-white">{item.nombre}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ARQUITECTURA */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Diseño del sistema</span>
          <h2 className="text-2xl font-black text-white">Arquitectura general</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {ARQUITECTURA.map((a) => (
            <div key={a.paso} className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-3">
                <span className="font-black text-2xl text-indigo-500/40">{a.paso}</span>
                <h3 className="font-bold text-sm text-white">{a.titulo}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{a.desc}</p>
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