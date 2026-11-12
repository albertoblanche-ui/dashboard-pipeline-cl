// Lectura de Attio con caché de 5 minutos por instancia. La usan /api/data y /api/jaime.
import { leerAttio } from './attio.js';

const CACHE_MS = 5 * 60 * 1000;
let cache = null;
let enCurso = null;

export async function datosAttio(forzar) {
  if (!forzar && cache && Date.now() - cache.en < CACHE_MS) return cache.raw;
  enCurso ??= leerAttio(process.env.ATTIO_API_KEY)
    .then((raw) => (cache = { raw, en: Date.now() }).raw)
    .finally(() => (enCurso = null));
  return enCurso;
}
