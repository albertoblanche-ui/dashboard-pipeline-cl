// Utilidades compartidas por la torre de control y la TV.

// La vista de Jaime usa otro endpoint y guarda su clave aparte.
export async function cargarDatos({ refrescar = false, ruta = '/api/data', claveLS = 'dashboard-clave', pregunta = 'Clave del dashboard' } = {}) {
  let clave = '';
  try { clave = localStorage.getItem(claveLS) ?? ''; } catch {}
  const r = await fetch(ruta + (refrescar ? '?refrescar=1' : ''), { headers: { 'x-dashboard-clave': clave } });
  if (r.status === 401) {
    const nueva = prompt(pregunta);
    if (!nueva) throw new Error('Falta la clave');
    try { localStorage.setItem(claveLS, nueva); } catch {}
    return cargarDatos({ refrescar, ruta, claveLS, pregunta });
  }
  const json = await r.json();
  if (!r.ok) throw new Error(json.detalle ?? json.error ?? 'Error al leer Attio');
  return json;
}

export function usd(n, { exacto = false } = {}) {
  if (n == null) return '—';
  if (exacto) return 'USD ' + Math.round(n).toLocaleString('es-CL');
  if (Math.abs(n) >= 1e6) return 'USD ' + (n / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 2 }) + 'M';
  if (Math.abs(n) >= 1e3) return 'USD ' + Math.round(n / 1e3).toLocaleString('es-CL') + 'K';
  return 'USD ' + Math.round(n);
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return `${DIAS[d.getDay()]} ${d.getDate()}-${MESES[d.getMonth()]}`;
}
export function hora(iso) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function etapaCorta(e) {
  return { 'Qualification': 'Qualification', 'First meeting held': '1ª reunión', 'Build consensus': 'Build consensus', 'Negotiation': 'Negotiation', 'PoC preparation': 'PoC prep', 'PoC execution': 'PoC', 'Contract signature': 'Firmado', 'Ready for use 🎉': 'En vivo' }[e] ?? e;
}

// Estado del next step: vencido, hoy, próximo o sin fecha.
export function estadoNextStep(d) {
  if (!d.nextStep) return { clase: 'critico', texto: 'Sin next step' };
  if (!d.fechaNextStep) return { clase: 'aviso', texto: 'Sin fecha' };
  const hoy = new Date().toISOString().slice(0, 10);
  if (d.vencido) return { clase: 'critico', texto: 'Vencido ' + fecha(d.fechaNextStep) };
  if (d.fechaNextStep === hoy) return { clase: 'serio', texto: 'Hoy' };
  return { clase: 'neutro', texto: fecha(d.fechaNextStep) };
}
