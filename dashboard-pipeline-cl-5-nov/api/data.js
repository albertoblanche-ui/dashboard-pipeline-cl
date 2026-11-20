// GET /api/data → JSON del dashboard. Lee Attio como mucho cada 5 minutos por instancia.
import { datosAttio } from '../lib/datos.js';
import { construirDashboard } from '../lib/dashboard.js';

export async function GET(request) {
  // Sin clave desde el 9-nov-2026 (pedido de Beto): el dashboard abre directo. /api/jaime conserva la suya.
  try {
    const forzar = new URL(request.url).searchParams.has('refrescar');
    const raw = await datosAttio(forzar);
    const dashboard = construirDashboard(raw);
    return Response.json(dashboard, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'attio', detalle: String(e.message).slice(0, 300) }, { status: 502 });
  }
}
