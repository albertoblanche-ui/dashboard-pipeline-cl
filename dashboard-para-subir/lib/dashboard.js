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

// Busca fechas escritas en el next step ("lun 19-oct", "2-nov", "20/10") y devuelve la primera
// que no sea anterior al día en que se escribió el next step.
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

// Si el next step solo espera algo del cliente, la pelota está en el cliente.
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

    // Prioridad: plata en juego × probabilidad × urgencia.
    const prob = info?.prob ?? 0;
    let urgencia = 1;
    if (vencido) urgencia += pelota === 'Cliente' ? 0.5 : 1.5;
    if (estancado) urgencia += 1;
    if (mustWin) urgencia += 1;
    if (firmaEsperada && firmaEsperada <= META_FECHA) urgencia += 0.5;
    if (!nextStep) urgencia += 1;
    urgencia += Math.min(diasInactivo / DIAS_SIN_ACTIVIDAD, 2) * 0.5;
    const prioridad = abierto ? arrUsd * Math.max(prob, 0.05) * urgencia : 0;

    const movimientos = hist
      .slice(1)
      .map((v, i) => ({ de: titulo(hist[i]), a: titulo(v), fecha: v.active_from, por: miembro[v.created_by_actor?.id]?.corto ?? null }))
      .filter((m) => new Date(m.fecha) >= semanaAtras);

    return {
      id,
      nombre,
      cuenta: nombre.split(' - ')[0],
      url: `https://app.attio.com/telepatia-ai/custom/opportunities/record/${id}`,
      etapa,
      ordenEtapa: info?.orden ?? (ETAPAS_CERRADAS.includes(etapa) ? 99 : 98),
      abierto,
      firmado: ETAPAS_FIRMADAS.includes(etapa),
      perdido: etapa === 'Closed lost',
      arrUsd: Math.round(arrUsd),
      arrEstimado: arrUsdAttio === 0 && arrClp > 0,
      ponderadoUsd: Math.round(arrUsd * prob),
      firmaEsperada,
      firma2026: Boolean(firmaEsperada && firmaEsperada <= META_FECHA),
      owner: miembro[ownerId]?.corto ?? null,
      responsable: miembro[responsableId]?.corto ?? null,
      responsableNombre: miembro[responsableId]?.nombre ?? null,
      nextStep,
      fechaNextStep: fechaNS?.toISOString().slice(0, 10) ?? null,
      fechaNextStepLeidaDelTexto: Boolean(!fechaCampo && fechaNS),
      pelota,
      pelotaPorTexto: !titulo(valor(d, c.pelotaEn)) && Boolean(pelota),
      vencido,
      diasEtapa,
      diasInactivo,
      limiteEtapa: info?.estancado ?? null,
      estancado,
      candidatoPerdido,
      mustWin,
      tgp: deTGP.has(id),
      problemas,
      prioridad: Math.round(prioridad),
      movimientos,
      primeraReunion: texto(d, 'first_meeting_date'),
      creado: d.created_at,
    };
  });

  const abiertos = deals.filter((d) => d.abierto);
  const firmados = deals.filter((d) => d.firmado);
  const suma = (xs, k) => xs.reduce((a, d) => a + d[k], 0);

  const funnel = ETAPAS.map((e) => {
    const xs = deals.filter((d) => d.etapa === e.nombre);
    return { etapa: e.nombre, deals: xs.length, arrUsd: suma(xs, 'arrUsd'), ponderadoUsd: suma(xs, 'ponderadoUsd'), estancados: xs.filter((d) => d.estancado).length };
  });

  const arrFirmado = suma(firmados, 'arrUsd');
  const diasAlCierre = Math.max(0, Math.ceil((new Date(META_FECHA + 'T23:59:59-03:00') - ahora) / DIA));
  const falta = Math.max(0, META_ARR_USD - arrFirmado);

  // Tareas de Attio del equipo, ligadas al deal cuando corresponde.
  const porId = Object.fromEntries(deals.map((d) => [d.id, d]));
  const vistas = new Set();
  const tareas = raw.tareas
    .filter((t) => !vistas.has(t.id.task_id) && vistas.add(t.id.task_id))
    .map((t) => {
      const deal = t.linked_records.map((l) => porId[l.target_record_id]).find(Boolean);
      return {
        id: t.id.task_id,
        texto: t.content_plaintext,
        vence: t.deadline_at?.slice(0, 10) ?? null,
        vencida: t.deadline_at ? new Date(t.deadline_at) < ahora : false,
        asignados: t.assignees.map((a) => miembro[a.referenced_actor_id]?.corto).filter(Boolean),
        deal: deal ? { id: deal.id, cuenta: deal.cuenta, url: deal.url } : null,
      };
    })
    .sort((a, b) => (a.vence ?? '9999').localeCompare(b.vence ?? '9999'));

  const personas = raw.equipo.map((p) => {
    const suyos = abiertos.filter((d) => d.responsable === p.corto && d.nextStep);
    return {
      corto: p.corto,
      nombre: p.nombre,
      avatar: p.avatar,
      nosToca: suyos.filter((d) => d.pelota !== 'Cliente').sort((a, b) => (a.fechaNextStep ?? '9').localeCompare(b.fechaNextStep ?? '9')),
      esperandoCliente: suyos.filter((d) => d.pelota === 'Cliente').sort((a, b) => b.diasInactivo - a.diasInactivo),
      tareas: tareas.filter((t) => t.asignados.includes(p.corto)),
      vencidos: suyos.filter((d) => d.vencido).length + tareas.filter((t) => t.asignados.includes(p.corto) && t.vencida).length,
    };
  });

  const movimientosSemana = deals
    .flatMap((d) => d.movimientos.map((m) => ({ ...m, cuenta: d.cuenta, arrUsd: d.arrUsd, url: d.url })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return {
    actualizado: raw.leidoEn,
    meta: {
      metaUsd: META_ARR_USD,
      arrFirmadoUsd: arrFirmado,
      arrEnVivoUsd: suma(deals.filter((d) => d.etapa === 'Ready for use 🎉'), 'arrUsd'),
      avance: arrFirmado / META_ARR_USD,
      faltaUsd: falta,
      diasAlCierre,
      ritmoSemanalUsd: Math.round(falta / Math.max(1, diasAlCierre / 7)),
      ponderado2026Usd: suma(abiertos.filter((d) => d.firma2026), 'ponderadoUsd'),
      pipelineAbiertoUsd: suma(abiertos, 'arrUsd'),
      dealsAbiertos: abiertos.length,
      firmados: firmados.map((d) => ({ id: d.id, cuenta: d.cuenta, arrUsd: d.arrUsd, etapa: d.etapa })),
    },
    funnel,
    mustWin: deals.filter((d) => d.mustWin && !d.perdido).sort((a, b) => b.arrUsd - a.arrUsd),
    cola: abiertos.filter((d) => d.prioridad > 0).sort((a, b) => b.prioridad - a.prioridad),
    higiene: abiertos.filter((d) => d.problemas.length).sort((a, b) => b.arrUsd - a.arrUsd),
    candidatosPerdido: abiertos.filter((d) => d.candidatoPerdido).sort((a, b) => b.diasEtapa - a.diasEtapa),
    personas,
    movimientosSemana,
    pelotaClienteDias: DIAS_PELOTA_CLIENTE,
    deals,
  };
}
