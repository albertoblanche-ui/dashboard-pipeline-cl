// GET /api/paises → deals de otros países, sin nombres, para comparar cohortes (diapositiva 11).
// Se carga solo cuando se activa la comparación. La CDN lo guarda 6 horas y lo renueva en segundo plano.
import { datosPaises } from '../lib/paises.js';

export async function GET() {
  try {
    const datos = await datosPaises(process.env.ATTIO_API_KEY);
    return Response.json(datos, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'attio', detalle: String(e.message).slice(0, 300) }, { status: 502 });
  }
}
