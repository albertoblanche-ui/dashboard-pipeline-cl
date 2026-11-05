// Convierte los datos crudos de Attio en lo que muestran la torre de control y la TV.
import {
  ATTIO, CLP_POR_USD, DIAS_PELOTA_CLIENTE, DIAS_PERDIDO_SIN_ACTIVIDAD, DIAS_SIN_ACTIVIDAD, ETAPAS,
  ETAPAS_CERRADAS, ETAPAS_FIRMADAS, META_ARR_USD, META_FECHA, MUST_WIN, PAISES, TICKET_MINIMO_USD,
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
  const re = /(\d{1,2})\s*(?:-|\/|\s|de\s)\s*(?:(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-záéíóú]*|(\d{1,2}))\b/gi;
  for (const m of txt.matchAll(re)) {
    const dia = Number(m[1]);
    const mes = m[3] ? Number(m[3]) - 1 : MESES[m[2].toLowerCase()];
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
  const movimientosPorDeal = new Map();

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
    // Lento: pasó el límite de la etapa. Estancado: además nadie lo toca hace más de 7 días.
    const lento = abierto && info?.limite != null && diasEtapa > info.limite;
    const estancado = lento && diasInactivo > DIAS_SIN_ACTIVIDAD;
    const candidatoPerdido =
      abierto && info?.perdido != null && diasEtapa > info.perdido && diasInactivo > DIAS_PERDIDO_SIN_ACTIVIDAD;

    const problemas = [];
    if (abierto) {
      if (!nextStep) problemas.push('Sin next step');
      else if (!fechaNS) problemas.push('Next step sin fecha');
      if (vencido) problemas.push('Next step vencido');
      if (!responsableId) problemas.push('Sin responsable');
      if (diasInactivo > DIAS_SIN_ACTIVIDAD) problemas.push(`Sin actividad hace ${diasInactivo} días`);
      if (estancado) problemas.push(`Estancado: ${diasEtapa} días en ${etapa} (límite ${info.limite})`);
      if (firmaEsperada && new Date(firmaEsperada) < ahora) problemas.push('Fecha de firma ya pasó');
      if (arrUsdAttio === 0 && arrClp > 0) problemas.push('ARR USD en 0 en Attio');
      if (!arrClp && !arrUsdAttio) problemas.push('Sin ARR');
      else if (arrUsd < TICKET_MINIMO_USD) problemas.push('Ticket bajo USD 50K');
      if ((d.values?.closed_lost_reason ?? []).length) problemas.push('Closed lost reason en deal abierto');
    }

    const prob = info?.prob ?? 0;
    const orden = (e) => etapaInfo[e]?.orden ?? -1;
    const todos = hist.slice(1).map((v, i) => {
      const de = titulo(hist[i]);
      const a = titulo(v);
      return { de, a, fecha: v.active_from, avance: orden(a) > orden(de), por: miembro[v.created_by_actor?.id]?.corto ?? null };
    });
    movimientosPorDeal.set(id, todos);
    const movimientos = todos.filter((m) => new Date(m.fecha) >= semanaAtras);
    const firmaContrato = texto(d, 'contract_signature_date') ?? (ETAPAS_FIRMADAS.includes(etapa) ? entradaEtapa.slice(0, 10) : null);

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
      limiteEtapa: info?.limite ?? null,
      lento,
      estancado,
      candidatoPerdido,
      mustWin,
      tgp: deTGP.has(id),
      problemas,
      firmaContrato,
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

  // Esta semana (últimos 7 días) contra los 7 anteriores.
  function resumenPeriodo(desde, hasta) {
    const en = (f) => Boolean(f) && new Date(f.length === 10 ? f + 'T12:00:00Z' : f) >= desde && new Date(f.length === 10 ? f + 'T12:00:00Z' : f) < hasta;
    const movs = (d) => (movimientosPorDeal.get(d.id) ?? []).filter((m) => en(m.fecha));
    const avanzaron = deals.filter((d) => movs(d).some((m) => m.avance));
    const firmadosP = firmados.filter((d) => en(d.firmaContrato));
    return {
      nuevos: deals.filter((d) => en(d.creado)).length,
      avanzaron: avanzaron.length,
      arrAvanzoUsd: suma(avanzaron, 'arrUsd'),
      primerasReuniones: deals.filter((d) => en(d.primeraReunion)).length,
      perdidos: deals.filter((d) => movs(d).some((m) => ETAPAS_CERRADAS.includes(m.a))).length,
      firmadosUsd: suma(firmadosP, 'arrUsd'),
    };
  }

  // Demand generation: deals nuevos por semana (lunes a domingo), TGP contra el resto.
  const lunes = (f) => {
    const x = new Date(f);
    x.setUTCHours(0, 0, 0, 0);
    return new Date(x - ((x.getUTCDay() + 6) % 7) * DIA);
  };
  const demanda = Array.from({ length: 10 }, (_, i) => {
    const desde = new Date(lunes(ahora) - (9 - i) * 7 * DIA);
    const hasta = new Date(+desde + 7 * DIA);
    const xs = deals.filter((d) => new Date(d.creado) >= desde && new Date(d.creado) < hasta);
    return { semana: desde.toISOString().slice(0, 10), tgp: xs.filter((d) => d.tgp).length, equipo: xs.filter((d) => !d.tgp).length, arrUsd: suma(xs, 'arrUsd') };
  });

  // Carrera de países: ARR firmado acumulado por días desde el día 0 de cada país.
  function acumular(firmas) {
    let total = 0;
    return firmas
      .filter((f) => f.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((f) => ({ ...f, acumuladoUsd: (total += f.arrUsd) }));
  }
  const paises = PAISES.map((p) => {
    const firmas =
      p.attio === ATTIO.pais
        ? firmados.map((d) => ({ fecha: d.firmaContrato, arrUsd: d.arrUsd }))
        : (raw.firmadosPaises ?? [])
            .filter((d) => titulo(valor(d, 'opportunity_country')) === p.attio && !ETAPAS_CERRADAS.includes(titulo(valor(d, 'deal_stage'))))
            .map((d) => ({
              fecha: texto(d, 'contract_signature_date') ?? valor(d, 'deal_stage')?.active_from?.slice(0, 10),
              arrUsd: Math.round(valor(d, 'arr_usd')?.currency_value ?? 0),
            }));
    return {
      nombre: p.nombre,
      inicio: p.inicio,
      diasEnMercado: dias(p.inicio, ahora),
      puntos: acumular(firmas).map((f) => ({ dia: Math.max(0, dias(p.inicio, new Date(f.fecha + 'T12:00:00Z'))), acumuladoUsd: f.acumuladoUsd })),
    };
  });

  const movimientosSemana = deals
    .flatMap((d) => d.movimientos.map((m) => ({ ...m, cuenta: d.cuenta, arrUsd: d.arrUsd, url: d.url })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Para la torre de control (28-oct): deals nuevos en las últimas 8 semanas móviles y ARR por tramo.
  const demandGenWoW = Array.from({ length: 8 }, (_, j) => {
    const i = 7 - j;
    const inicio = new Date(ahora.getTime() - (i * 7 + 7) * DIA);
    const fin = new Date(ahora.getTime() - i * 7 * DIA);
    const xs = deals.filter((d) => new Date(d.creado) >= inicio && new Date(d.creado) < fin);
    return { etiqueta: `${inicio.getDate()}/${inicio.getMonth() + 1}`, deals: xs.length, arrUsd: suma(xs, 'arrUsd') };
  });
  const tramo = (etapas) => suma(abiertos.filter((d) => etapas.includes(d.etapa)), 'arrUsd');
  const avanzadoUsd = tramo(['PoC preparation', 'PoC execution', 'Negotiation']);
  const tempranoUsd = tramo(['Qualification', 'First meeting held', 'Build consensus']);
  const desgloseArr = { firmadoUsd: arrFirmado, avanzadoUsd, tempranoUsd, totalPipelineUsd: arrFirmado + avanzadoUsd + tempranoUsd, metaUsd: META_ARR_USD };

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
      pipelineAbiertoUsd: suma(abiertos, 'arrUsd'),
      dealsAbiertos: abiertos.length,
      firmados: firmados.map((d) => ({ id: d.id, cuenta: d.cuenta, arrUsd: d.arrUsd, etapa: d.etapa })),
    },
    funnel,
    mustWin: deals.filter((d) => d.mustWin && !d.perdido).sort((a, b) => b.arrUsd - a.arrUsd),
    // Dónde presionar: todos los abiertos, la etapa más avanzada primero y después el ticket más grande.
    cola: [...abiertos].sort((a, b) => b.ordenEtapa - a.ordenEtapa || b.arrUsd - a.arrUsd),
    higiene: abiertos.filter((d) => d.problemas.length).sort((a, b) => b.arrUsd - a.arrUsd),
    candidatosPerdido: abiertos.filter((d) => d.candidatoPerdido).sort((a, b) => b.diasEtapa - a.diasEtapa),
    personas,
    tareas,
    demandGenWoW,
    desgloseArr,
    movimientosSemana,
    pelotaClienteDias: DIAS_PELOTA_CLIENTE,
    semana: {
      actual: resumenPeriodo(new Date(ahora - 7 * DIA), ahora),
      anterior: resumenPeriodo(new Date(ahora - 14 * DIA), new Date(ahora - 7 * DIA)),
    },
    demanda,
    camino: { desde: PAISES.find((p) => p.attio === ATTIO.pais)?.inicio, hasta: META_FECHA, firmas: acumular(firmados.map((d) => ({ fecha: d.firmaContrato, cuenta: d.cuenta, arrUsd: d.arrUsd }))) },
    paises,
    deals,
  };
}
