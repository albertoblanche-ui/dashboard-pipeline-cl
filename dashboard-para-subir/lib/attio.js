// Lectura de Attio por API (solo lectura). Devuelve los datos crudos que usa lib/dashboard.js.
import { ATTIO, EQUIPO } from './config.js';

const BASE = 'https://api.attio.com/v2';

async function api(key, method, path, body) {
  for (let intento = 0; intento < 4; intento++) {
    const r = await fetch(BASE + path, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) {
      await new Promise((ok) => setTimeout(ok, 500 * (intento + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`Attio ${method} ${path}: ${r.status} ${await r.text()}`);
    return r.json();
  }
  throw new Error(`Attio ${method} ${path}: límite de velocidad`);
}

async function paginar(key, path, body = {}) {
  const filas = [];
  for (let offset = 0; ; offset += 500) {
    const { data } = await api(key, 'POST', path, { ...body, limit: 500, offset });
    filas.push(...data);
    if (data.length < 500) return filas;
  }
}

// Ejecuta fn sobre items con como máximo n llamadas en paralelo.
async function enParalelo(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const j = i++;
        out[j] = await fn(items[j]);
      }
    }),
  );
  return out;
}

export async function leerAttio(key) {
  const [deals, entradasPipeline, entradasTGP, miembros] = await Promise.all([
    paginar(key, '/objects/opportunities/records/query', { filter: { opportunity_country: ATTIO.pais } }),
    paginar(key, `/lists/${ATTIO.listaPipeline}/entries/query`),
    paginar(key, `/lists/${ATTIO.listaTGP}/entries/query`).catch(() => []),
    api(key, 'GET', '/workspace_members').then((r) => r.data),
  ]);

  const historial = {};
  await enParalelo(deals, 8, async (d) => {
    const id = d.id.record_id;
    const { data } = await api(
      key,
      'GET',
      `/objects/opportunities/records/${id}/attributes/deal_stage/values?show_historic=true`,
    );
    historial[id] = data;
  });

  const equipo = EQUIPO.map((p) => {
    const m = miembros.find((x) => x.email_address?.toLowerCase() === p.email);
    return m ? { ...p, id: m.id.workspace_member_id, nombre: `${m.first_name} ${m.last_name}`, avatar: m.avatar_url } : null;
  }).filter(Boolean);

  const tareas = (
    await Promise.all(
      equipo.map((p) =>
        api(key, 'GET', `/tasks?assignee=${p.id}&is_completed=false&limit=500`).then((r) => r.data),
      ),
    )
  ).flat();

  return { deals, historial, entradasPipeline, entradasTGP, miembros, equipo, tareas, leidoEn: new Date().toISOString() };
}
