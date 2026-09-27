import type { Partido } from '../../servicios/api';

export const obtenerRondasDisponibles = (partidos: Partido[]): number[] =>
  Array.from(new Set(partidos.map((partido) => partido.round))).sort((a, b) => a - b);

export const formatearFechaFixture = (fecha?: string | null): string => {
  if (!fecha) return 'Por definir';

  const fechaDate = new Date(fecha);

  if (Number.isNaN(fechaDate.getTime())) {
    return 'Por definir';
  }

  return fechaDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const calcularTotalPaginas = (total: number, porPagina: number): number =>
  Math.max(1, Math.ceil(total / porPagina));

export const obtenerEquiposEnPartidos = (partidos: Partido[]) =>
  Array.from(
    new Map(
      partidos.flatMap((partido) => [
        partido.local_team ? [partido.local_team_id, partido.local_team.name] as [number, string] : null,
        partido.visitor_team ? [partido.visitor_team_id, partido.visitor_team.name] as [number, string] : null,
      ].filter((valor): valor is [number, string] => valor !== null))
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

export const convertirHoraTexto = (valor: string): string => {
  if (!valor) return '';
  const texto = valor.trim();
  return texto.includes(':') ? texto.slice(0, 5) : texto;
};
