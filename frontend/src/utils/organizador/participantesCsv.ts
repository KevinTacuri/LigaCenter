import { serviciosParticipantes } from '../../servicios/api';

export interface ResultadoCargaCsv {
  ok: number;
  errores: string[];
}

export function descargarPlantillaCsv() {
  const cabecera = 'nombre_completo,dni,edad,dorsal\n';
  const ejemplo = 'Juan Pérez,12345678,22,10\n';
  const blob = new Blob([cabecera + ejemplo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_jugadores.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function procesarCsvJugadores(
  archivo: File,
  teamId: number
): Promise<ResultadoCargaCsv> {
  const texto = await archivo.text();
  const lineas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
  const filas = lineas.slice(1);
  let ok = 0;
  const errores: string[] = [];

  for (let i = 0; i < filas.length; i++) {
    const cols = filas[i].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
    const [nombre, dni, edad, dorsal] = cols;
    if (!nombre || !edad) {
      errores.push(`Fila ${i + 2}: Faltan campos obligatorios (nombre, edad).`);
      continue;
    }
    try {
      const res = await serviciosParticipantes.crearJugadorEnCampeonato({
        full_name: nombre,
        team_id: teamId,
        dni: dni || null,
        age: parseInt(edad),
        number: dorsal ? parseInt(dorsal) : null,
        position: null,
      });
      if (res.success) ok++;
      else errores.push(`Fila ${i + 2}: ${res.message || 'Error desconocido.'}`);
    } catch (err: any) {
      errores.push(`Fila ${i + 2}: ${err.response?.data?.message || 'Error al guardar.'}`);
    }
  }

  return { ok, errores };
}