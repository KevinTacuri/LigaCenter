import React, { useState } from 'react';
import { EstadoVacio } from '../EstadoVacio';
import type { Categoria, Disciplina } from '../../servicios/api';

interface TabCategoriasProps {
  categorias: Categoria[];
  disciplinas: Disciplina[];
  cargando: boolean;
  onAbrirModalNueva: () => void;
  onAbrirModalEditar: (c: Categoria) => void;
  onEliminar: (id: number) => void;
}

export const TabCategorias: React.FC<TabCategoriasProps> = ({
  categorias,
  disciplinas,
  cargando,
  onAbrirModalNueva,
  onAbrirModalEditar,
  onEliminar,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroGender, setFiltroGender] = useState('todos');
  const [filtroDisc, setFiltroDisc] = useState('todos');

  const categoriasFiltradas = categorias.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    const discName = c.championship_discipline?.discipline?.name?.toLowerCase() || '';
    const matchBusqueda = !q || c.name.toLowerCase().includes(q) || discName.includes(q);
    const matchGender =
      filtroGender === 'todos' ||
      (c.gender_type || c.gender || '').toLowerCase() === filtroGender.toLowerCase();
    const matchDisc =
      filtroDisc === 'todos' ||
      String(c.championship_discipline?.discipline_id || c.discipline_id) === filtroDisc;
    return matchBusqueda && matchGender && matchDisc;
  });

  return (
    <div className="w-full space-y-4">
      <div className="bg-[var(--surface-card-azul)] text-on-surface rounded-2xl border border-[var(--outline)] p-6 shadow-xs space-y-4 w-full">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--outline)] pb-4">
          <div>
            <h2 className="font-black text-base uppercase tracking-wide text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--text-accent)] text-xl">category</span>
              Gestión de Categorías
            </h2>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Total: {categorias.length} categorías registradas.
            </p>
          </div>

          <button
            type="button"
            onClick={onAbrirModalNueva}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all duration-200 shadow-xs hover:-translate-y-0.5 hover:brightness-[1.04] active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Añadir Categoría
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-sm border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] rounded-xl p-2.5 pr-8 outline-none focus:border-[var(--primary)]"
            />
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none">
              search
            </span>
          </div>

          <select
            value={filtroGender}
            onChange={(e) => setFiltroGender(e.target.value)}
            className="w-full text-sm border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] rounded-xl p-2.5 outline-none cursor-pointer"
          >
            <option value="todos">Todos los géneros</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Mixto">Mixto</option>
          </select>

          <select
            value={filtroDisc}
            onChange={(e) => setFiltroDisc(e.target.value)}
            className="w-full text-sm border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] rounded-xl p-2.5 outline-none cursor-pointer"
          >
            <option value="todos">Todas las disciplinas</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-[var(--surface-card-elevated)] rounded-2xl border border-[var(--surface-card-elevated-border)] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--outline)] pb-2">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-[var(--surface-card-title)]">
            Lista de categorías
          </h2>
        </div>

        {cargando ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-outline border-t-primary animate-spin" />
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
              Cargando registros...
            </span>
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <EstadoVacio icono="category" titulo="No hay categorías creadas aún" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2 animate-fadeIn">
            {categoriasFiltradas.map((c, index) => {
              const tonoCard = index % 2 === 0
                ? 'bg-[var(--surface-card-azul)] hover:bg-[var(--surface-card-azul)]/90'
                : 'bg-[var(--surface-card-verde)] hover:bg-[var(--surface-card-verde)]/90';

              return (
              <div
                key={c.id}
                className={`group relative flex flex-col justify-between p-5 border border-[var(--outline)] rounded-2xl transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden ${tonoCard}`}
              >
                <div className="flex items-center justify-between w-full mb-3 gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-card-verde)] text-[var(--text-accent)] border border-[var(--outline)] truncate">
                    {c.championship_discipline?.discipline?.name || 'Deporte'}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${
                      (c.gender_type || c.gender) === 'Femenino'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        : (c.gender_type || c.gender) === 'Mixto'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {c.gender_type || c.gender || 'General'}
                  </span>
                </div>

                <div className="my-2 space-y-1">
                  <h4 className="text-base font-extrabold text-[var(--surface-card-title)] line-clamp-1 transition-colors">
                    {c.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium pt-1">
                    <span className="material-symbols-outlined text-sm text-[var(--text-accent)]">group</span>
                    <span>
                      Rango de edad: <strong>{c.age_min ?? 0} - {c.age_max ?? 'Sin límite'} años</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline/60 w-full flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onAbrirModalEditar(c)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-card-celeste)] border border-[var(--outline)] text-on-surface hover:text-[var(--text-accent)] text-xs font-bold transition-all duration-200 shadow-2xs flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 hover:brightness-[1.03]"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEliminar(c.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all duration-200 shadow-2xs flex items-center gap-1 cursor-pointer hover:-translate-y-0.5"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};