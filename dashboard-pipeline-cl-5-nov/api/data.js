// GET /api/data → JSON del dashboard. Lee Attio como mucho cada 5 minutos por instancia.
import { datosAttio } from '../lib/datos.js';
import { construirDashboard } from '../lib/dashboard.js';
import { construirIniciativas } from '../lib/iniciativas.js';

export async function GET(request) {
  // Sin clave desde el 9-nov-2026 (pedido de Beto): el Panel y la Torre abren directo. /api/jaime conserva la suya.
  try {
    const forzar = new URL(request.url).searchParams.has('refrescar');
    const raw = await datosAttio(forzar);
    const dashboard = construirDashboard(raw);
    // Vista "Mis iniciativas": si su cálculo falla, el resto del dashboard sigue funcionando.
    try {
      dashboard.iniciativas = construirIniciativas(dashboard, raw);
    } catch (e) {
      console.error('iniciativas', e);
      dashboard.iniciativas = null;
    }
    return Response.json(dashboard, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'attio', detalle: String(e.message).slice(0, 300) }, { status: 502 });
  }
}
