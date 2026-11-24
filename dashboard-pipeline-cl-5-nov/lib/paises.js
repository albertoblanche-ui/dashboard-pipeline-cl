// Benchmark de cohortes con otros países (24-nov-2026, pedido de Beto). Solo lectura de Attio.
// Devuelve cada deal sin nombre: país, fecha de creación, primera reunión, sector, ARR, etapa actual, firma e historial de etapas.
// Tarda unos 40 segundos (un historial por deal), así que se guarda 6 horas por instancia y en la CDN de Vercel.
import { BENCH_PAISES } from './config.js';

const BASE = 'https://api.attio.com/v2';
const CACHE_MS = 6 * 60 * 60 * 1000;
let cache = null;
let enCurso = null;

async function api(key, method, path, body) {
  for (let intento = 0; intento < 6; intento++) {
    const r = await fetch(BASE + path, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) {
      await new Promise((ok) => setTimeout(ok, 400 * (intento + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`Attio ${method} ${path}: ${r.status}`);
    return r.json();
  }
  throw new Error(`Attio ${method} ${path}: límite de velocidad`);
}

const valor = (d, k) => d.values?.[k]?.[0];
const titulo = (v) => v?.option?.title ?? v?.status?.title ?? v?.value ?? null;

async function leer(key) {
  const deals = [];
  for (const p of BENCH_PAISES) {
    for (let offset = 0; ; offset += 500) {
      const { data } = await api(key, 'POST', '/objects/opportunities/records/query', { filter: { opportunity_country: p.attio }, limit: 500, offset });
      deals.push(...data.map((d) => ({ d, pais: p.nombre })));
      if (data.length < 500) break;
    }
  }
  let i = 0;
  const hist = new Array(deals.length);
  await Promise.all(
    Array.from({ length: 30 }, async () => {
      while (i < deals.length) {
        const j = i++;
        const { data } = await api(key, 'GET', `/objects/opportunities/records/${deals[j].d.id.record_id}/attributes/deal_stage/values?show_historic=true`);
        hist[j] = data.map((h) => [h.status?.title, h.active_from?.slice(0, 10)]).filter((h) => h[0] && h[1]).sort((a, b) => a[1].localeCompare(b[1]));
      }
    }),
  );
  return {
    leidoEn: new Date().toISOString(),
    paises: BENCH_PAISES.map((p) => p.nombre),
    deals: deals.map(({ d, pais }, j) => ({
      pais,
      creado: d.created_at.slice(0, 10),
      primeraReunion: titulo(valor(d, 'first_meeting_date')),
      sector: (d.values?.client_segment ?? []).some((s) => s.option?.title === 'Government') ? 'Público' : 'Privado',
      arrUsd: Math.round(valor(d, 'arr_usd')?.currency_value ?? 0),
      etapa: titulo(valor(d, 'deal_stage')),
      firmaContrato: titulo(valor(d, 'contract_signature_date')),
      hist: hist[j],
    })),
  };
}

export async function datosPaises(key) {
  if (cache && Date.now() - cache.en < CACHE_MS) return cache.datos;
  enCurso ??= leer(key)
    .then((datos) => (cache = { datos, en: Date.now() }).datos)
    .finally(() => (enCurso = null));
  return enCurso;
}
