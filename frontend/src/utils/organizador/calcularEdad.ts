export function calcularEdad(birthDateStr: string | null | undefined): string {
  if (!birthDateStr) return '';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '';
  const hoy = new Date();
  let edad = hoy.getFullYear() - birth.getFullYear();
  const mes = hoy.getMonth() - birth.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < birth.getDate())) {
    edad--;
  }
  return String(edad);
}