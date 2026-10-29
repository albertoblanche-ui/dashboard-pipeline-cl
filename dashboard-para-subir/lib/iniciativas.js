// lib/iniciativas.js
// Cálculo de métricas para la vista "Mis iniciativas" (Beto)
import { INICIATIVAS, ETAPAS } from './config.js';

const DIA = 86_400_000;
const dias = (desde, hasta) => Math.floor((new Date(hasta) - new Date(desde)) / DIA);

function mediana(valores) {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 !== 0 ? ordenados[mid] : Math.round((ordenados[mid - 1] + ordenados[mid]) / 2);
}

function percentil75(valores) {
  if (!valores.length) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const idx = Math.floor(ordenados.length * 0.75);
  return ordenados[idx] ?? ordenados[ordenados.length - 1];
}

export function construirIniciativas(dashboard, raw, ahora = new Date()) {
  const deals = dashboard.deals;
  const deTGP = new Set(raw.entradasTGP.map((e) => e.parent_record_id));

  // --- 2.1 Ciclo de venta (Key Result) ---
  const cerradosConReunion = deals.filter(d => d.primeraReunion && (d.firmado || d.etapa === 'Contract signature'));
  const duracionesReunionAFirma = cerradosConReunion.map(d => {
    const hist = raw.historial[d.id] ?? [];
    const entradaFirma = hist.find(h => (h?.status?.title ?? h?.option?.title) === 'Contract signature');
    const fechaFirma = entradaFirma ? new Date(entradaFirma.active_from) : (d.firmaEsperada ? new Date(d.firmaEsperada) : ahora);
    return Math.max(0, dias(d.primeraReunion, fechaFirma));
  });

  const medianaCicloActual = mediana(duracionesReunionAFirma);

  // Tiempos de permanencia por etapa
  const diasPorEtapa = ETAPAS.map(e => {
    const duracionesEtapa = [];
    for (const d of deals) {
      const hist = raw.historial[d.id] ?? [];
      for (let i = 0; i < hist.length; i++) {
        const h = hist[i];
        const tit = h?.status?.title ?? h?.option?.title;
        if (tit === e.nombre) {
          const fin = hist[i + 1]?.active_from ? new Date(hist[i + 1].active_from) : ahora;
          duracionesEtapa.push(Math.max(0, dias(h.active_from, fin)));
        }
      }
    }
    return {
      etapa: e.nombre,
      mediana: mediana(duracionesEtapa),
      p75: percentil75(duracionesEtapa),
      n: duracionesEtapa.length
    };
  });

  // --- 1.4 Conversión a Build consensus en 45 días ---
  const ordenBuildConsensus = ETAPAS.findIndex(e => e.nombre === 'Build consensus');
  function evaluoConversion45(listaDeals) {
    let candidatos = 0;
    let convertidos = 0;
    for (const d of listaDeals) {
      if (!d.primeraReunion) continue;
      const diasDesdeReunion = dias(d.primeraReunion, ahora);
      if (diasDesdeReunion < 45) continue;
      candidatos++;
      const hist = raw.historial[d.id] ?? [];
      const entroBuildOPosterior = hist.some(h => {
        const tit = h?.status?.title ?? h?.option?.title;
        const idx = ETAPAS.findIndex(e => e.nombre === tit);
        if (idx >= ordenBuildConsensus) {
          const dReunionAEntrada = dias(d.primeraReunion, h.active_from);
          return dReunionAEntrada >= 0 && dReunionAEntrada <= 45;
        }
        return false;
      });
      if (entroBuildOPosterior) convertidos++;
    }
    return {
      tasa: candidatos > 0 ? Math.round((convertidos / candidatos) * 100) : 0,
      convertidos,
      total: candidatos
    };
  }

  const dealsTGP = deals.filter(d => deTGP.has(d.id));
  const conversionTGP = evaluoConversion45(dealsTGP);

  const dealsSeba = deals.filter(d => !deTGP.has(d.id) && (d.owner === 'Seba' || d.responsable === 'Seba'));
  const conversionSeba = evaluoConversion45(dealsSeba);

  // --- 4.1 ARR en mis deals (Beto) ---
  const misDeals = deals.filter(d => d.abierto && (d.owner === 'Beto' || d.responsable === 'Beto'));
  const arrMisDealsPorEtapa = ETAPAS.map(e => {
    const enEtapa = misDeals.filter(d => d.etapa === e.nombre);
    return {
      etapa: e.nombre,
      arrUsd: enEtapa.reduce((sum, d) => sum + d.arrUsd, 0),
      deals: enEtapa.length
    };
  });

  const semanaAtras = new Date(ahora - 7 * DIA);
  const arrAvanzadoSemana = misDeals
    .filter(d => d.movimientos.some(m => new Date(m.fecha) >= semanaAtras))
    .reduce((sum, d) => sum + d.arrUsd, 0);

  return {
    okr: {
      objetivo: "Cerrar más deals, más rápido, y liberar al Revenue Manager.",
      keyResult: "Acortar el ciclo de venta (mediana de días a firma).",
      medianaActual: medianaCicloActual,
      puntoPartidaX: 45, // Congelado al 19-oct
      metaY: null, // Por definir con Tomi en el 1:1
      n: duracionesReunionAFirma.length,
      diasPorEtapa
    },
    iniciativa1_tgp: {
      conversion45d: conversionTGP,
      conversionSebaComparativa: conversionSeba
    },
    iniciativa4_beto: {
      totalArrUsd: misDeals.reduce((sum, d) => sum + d.arrUsd, 0),
      arrPorEtapa: arrMisDealsPorEtapa,
      arrAvanzadoSemana,
      deals: misDeals
    }
  };
}
