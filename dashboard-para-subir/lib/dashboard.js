// lib/dashboard.js
// Convierte los datos crudos de Attio en lo que muestran la torre de control y la TV.
import {
  ATTIO, CLP_POR_USD, DIAS_PELOTA_CLIENTE, DIAS_SIN_ACTIVIDAD, ETAPAS, ETAPAS_CERRADAS,
  ETAPAS_FIRMADAS, META_ARR_USD, META_FECHA, MUST_WIN, TICKET_MINIMO_USD,
} from './config.js';

const DIA = 86_400_000;
const MESES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, sept: 8, set: 8, oct: 9, nov: 10, dic: 11 };

const valor = (d, slug) => d.values?.[slug]?.[0];
const texto = (d, slug) => valor(d, slug)?.value ?? null;
const titulo = (v) => v?.status?.title ?? v?.option?.title ?? null;
const dias = (desde, hasta) => Math.floor((hasta - new Date(desde)) / DIA);

export function fechaEnTexto(txt, escritoEn, ahora) {
  if (!txt) return null;
  const fechas = [];
  const re = /(\d{1,2})\s*(?:-|\/|\s|de\s)\s*(ene|feb|mar|abr|may|jun|jul|ago|sept?|set|oct|nov|dic|\d{1,2})\b/gi;
  for (const m of txt.matchAll(re)) {
    const dia = Number(m[1]);
    const mes = /\d/.test(m[2]) ? Number(m[2]) - 1 : MESES[m[2].toLowerCase()];
    if (dia < 1 || dia > 31 || mes == null || mes < 0 || mes > 11) continue;
    let f = new Date(Date.UTC(ahora.getUTCFullYear(), mes, dia, 15));
    if (f - ahora > 240 * DIA) f = new Date(Date.UTC(ahora.getUTCFullYear() - 1, mes, dia, 15));
    if (ahora - f > 120 * DIA) f = new Date(Date.UTC(ahora.getUTCFullYear() + 1, mes, dia, 15));
    fechas.push(f);
  }
  if (!fechas.length) return null;
  const base = new Date(escritoEn ?? ahora).getTime() - DIA;
  return fechas.find((f) => f >= base) ?? fechas[fechas.length - 1];
}

export function pelotaPorTexto(txt) {
  if (!txt) return null;
  const primero = txt.split(/[.·\n]/)[0];
  return /\b(esperar|esperando|en espera|aguardar|respuesta de|que (el cliente|ellos)|pendiente que)\b/i.test(primero)
    ? 'Cliente'
    : 'Nosotros';
}

export function construirDashboard(raw, ahora = new Date()) {
  const miembro = Object.fromEntries(
    raw.miembros.map((m) => [m.id.workspace_member_id, { nombre: `${m.first_name} ${m.last_name}`.trim(), corto: m.first_name, avatar: m.avatar_url }]),
  );
  for (const p of raw.equipo) miembro[p.id] = { ...miembro[p.id], corto: p.corto };

  const ownerNextStep = {};
  for (const e of raw.entradasPipeline) {
    const v = e.entry_values?.owner_of_next_step?.[0];
    if (v?.referenced_actor_id) ownerNextStep[e.parent_record_id] = v.referenced_actor_id;
  }
  const deTGP = new Set(raw.entradasTGP.map((e) => e.parent_record_id));
  const etapaInfo = Object.fromEntries(ETAPAS.map((e, i) => [e.nombre, { ...e, orden: i }]));
  const semanaAtras = new Date(ahora - 7 * DIA);

  const deals = raw.deals.map((d) => {
    const id = d.id.record_id;
    const etapa = titulo(valor(d, 'deal_stage')) ?? 'Sin etapa';
    const info = etapaInfo[etapa];
    const hist = raw.historial[id] ?? [];
    const entradaEtapa = valor(d, 'deal_stage')?.active_from ?? d.created_at;
    const arrUsdAttio = valor(d, 'arr_usd')?.currency_value ?? 0;
    const arrClp = texto(d, 'arr_local_currency') ?? 0;
    const arrUsd = arrUsdAttio > 0 ? arrUsdAttio : arrClp / CLP_POR_USD;
    const nextStep = texto(d, 'next_step');
    const nextStepEn = valor(d, 'next_step')?.active_from ?? null;
    const c = ATTIO.campos;
    const fechaCampo = texto(d, c.fechaNextStep);
    const fechaNS = fechaCampo ? new Date(fechaCampo + 'T15:00:00Z') : fechaEnTexto(nextStep, nextStepEn, ahora);
    const respCampo = valor(d, c.responsableNextStep)?.referenced_actor_id;
    const ownerId = valor(d, 'deal_owner')?.referenced_actor_id ?? null;
    const responsableId = respCampo ?? ownerNextStep[id] ?? ownerId;
    const pelota = titulo(valor(d, c.pelotaEn)) ?? pelotaPorTexto(nextStep);
    const mustWinCampo = valor(d, c.mustWin)?.value;
    const nombre = texto(d, 'deal_name') ?? '(sin nombre)';
    const mustWin = mustWinCampo ?? MUST_WIN.some((re) => re.test(nombre));
    const ultimaActividad = [d.created_at, entradaEtapa, texto(d, 'last_update'), nextStepEn, valor(d, 'last_action')?.active_from]
      .filter(Boolean)
      .map((x) => new Date(x))
      .reduce((a, b) => (b > a ? b : a));
    const firmaEsperada = texto(d, 'expected_close_date');
    const abierto = !ETAPAS_FIRMADAS.includes(etapa) && !ETAPAS_CERRADAS.includes(etapa);
    const diasEtapa = dias(entradaEtapa, ahora);
    const diasInactivo = dias(ultimaActividad, ahora);
    const vencido = fechaNS ? fechaNS < new Date(ahora - DIA / 2) : false;
    const estancado = abierto && info?.estancado != null && diasEtapa > info.estancado;
    const candidatoPerdido = abierto && info?.perdido != null && diasEtapa > info.perdido && diasInactivo > DIAS_SIN_ACTIVIDAD;

    const problemas = [];
    if (abierto) {
      if (!nextStep) problemas.push('Sin next step');
      else if (!fechaNS) problemas.push('Next step sin fecha');
      if (vencido) problemas.push('Next step vencido');
      if (!responsableId) problemas.push('Sin responsable');
      if (diasInactivo > DIAS_SIN_ACTIVIDAD) problemas.push(`Sin actividad hace ${diasInactivo} días`);
      if (estancado) problemas.push(`${diasEtapa} días en ${etapa} (límite ${info.estancado})`);
      if (firmaEsperada && new Date(firmaEsperada) < ahora) problemas.push('Fecha de firma ya pasó');
      if (arrUsdAttio === 0 && arrClp > 0) problemas.push('ARR USD en 0 en Attio');
      if (!arrClp && !arrUsdAttio) problemas.push('Sin ARR');
      else if (arrUsd < TICKET_MINIMO_USD) problemas.push('Ticket bajo USD 50K');
      if ((d.values?.closed_lost_reason ?? []).length) problemas.push('Closed lost reason en deal abierto');
    }

    const movimientos = hist
      .slice(1)
      .map((v, i) => ({ de: titulo(hist[i]), a: titulo(v), fecha: v.active_from, por: miembro[v.created_by_actor?.id]?.
