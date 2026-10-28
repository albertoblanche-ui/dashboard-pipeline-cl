// api/data.js
// GET /api/data → JSON del dashboard. Lee Attio como mucho cada 5 minutos por instancia.
import { leerAttio } from '../lib/attio.js';
import { construirDashboard } from '../lib/dashboard.js';

const CACHE_MS = 5 * 60 * 1000;
let cache = null;
let enCurso = null;

async function datos(forzar) {
  if (!forzar && cache && Date.now() - cache.en < CACHE_MS) return cache.raw;
  enCurso ??= leerAttio(process.env.ATTIO_API_KEY)
    .then((raw) => (cache = { raw, en: Date.now() }).raw)
    .finally(() => (enCurso = null));
  return enCurso;
}

export async function GET(request) {
  const clave = process.env.DASHBOARD_PASSWORD;
  if (clave && request.headers.get('x-dashboard-clave') !== clave) {
    return Response.json({ error: 'clave' }, { status: 401 });
  }
  try {
    const forzar = new URL(request.url).searchParams.has('refrescar');
    const raw = await datos(forzar);
    return Response.json(construirDashboard(raw), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'attio', detalle: String(e.message).slice(0, 300) }, { status: 502 });
  }
}
