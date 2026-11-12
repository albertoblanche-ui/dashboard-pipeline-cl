// GET /api/jaime → solo lo que ve Jaime Mañalich (lib/jaime.js). Tiene su propia clave (JAIME_PASSWORD).
import { datosAttio } from '../lib/datos.js';
import { construirDashboard } from '../lib/dashboard.js';
import { construirJaime } from '../lib/jaime.js';

export async function GET(request) {
  const clave = process.env.JAIME_PASSWORD;
  if (!clave || request.headers.get('x-dashboard-clave') !== clave) {
    return Response.json({ error: 'clave' }, { status: 401 });
  }
  try {
    const raw = await datosAttio(false);
    return Response.json(construirJaime(construirDashboard(raw), raw), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'attio' }, { status: 502 });
  }
}
