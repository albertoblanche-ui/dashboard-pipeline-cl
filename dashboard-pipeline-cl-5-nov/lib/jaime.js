// Vista de Jaime Mañalich (/jaime). Solo lo que necesita para leer en segundos: institución, ARR y un color.
// Reglas acordadas con Beto y Tomi (5-nov-2026), un solo reloj (días en la etapa actual):
//   Verde  = firmado, o subió de etapa en los últimos DIAS_VERDE días.
//   Rojo   = abierto y más de DIAS_ROJO días en la misma etapa.
//   Blanco = todo el resto.
// No se muestran Qualification ni First meeting held. Sin contactos, next steps ni notas.
import { ETAPAS, ETAPAS_FIRMADAS } from './config.js';

export const DIAS_ROJO = 20;
export const DIAS_VERDE = 14;
// Partners, no clientes: no van en la vista.
const EXCLUIR = [/celerity/i];

// Secciones de la página, de la más avanzada a la menos.
export const SECCIONES = [
  { nombre: 'Firmados', etapas: ETAPAS_FIRMADAS },
  { nombre: 'En piloto', etapas: ['PoC preparation', 'PoC execution'] },
  { nombre: 'Negociando', etapas: ['Negotiation'] },
  { nombre: 'Construyendo acuerdo', etapas: ['Build consensus'] },
];
const NOMBRE_ETAPA = {
  'Build consensus': 'Construyendo acuerdo',
  'Negotiation': 'Negociando',
  'PoC preparation': 'Preparando piloto',
  'PoC execution': 'En piloto',
  'Contract signature': 'Firmado',
  'Ready for use 🎉': 'En uso',
};
const orden = Object.fromEntries(ETAPAS.map((e, i) => [e.nombre, i]));
const titulo = (v) => v?.status?.title ?? null;

// ¿El último cambio de etapa fue un avance y pasó hace DIAS_VERDE días o menos?
function subioHacePoco(hist, diasEtapa) {
  if (diasEtapa > DIAS_VERDE || !hist || hist.length < 2) return false;
  const de = titulo(hist[hist.length - 2]);
  const a = titulo(hist[hist.length - 1]);
  return (orden[a] ?? -1) > (orden[de] ?? -1);
}

export function construirJaime(dashboard, raw) {
  const visibles = new Set(SECCIONES.flatMap((s) => s.etapas));
  const deals = dashboard.deals
    .filter((d) => visibles.has(d.etapa) && !EXCLUIR.some((re) => re.test(d.cuenta)))
    .map((d) => {
      const color = d.firmado || subioHacePoco(raw.historial[d.id], d.diasEtapa) ? 'verde' : d.diasEtapa > DIAS_ROJO ? 'rojo' : 'blanco';
      const etapa = NOMBRE_ETAPA[d.etapa] ?? d.etapa;
      const dias = d.diasEtapa === 1 ? '1 día' : `${d.diasEtapa} días`;
      const hace = d.diasEtapa === 0 ? 'hoy' : d.diasEtapa === 1 ? 'ayer' : `hace ${dias}`;
      const razon = d.firmado
        ? (d.etapa === 'Ready for use 🎉' ? 'En uso' : 'Contrato firmado')
        : color === 'verde'
          ? `Pasó a ${etapa} ${hace}`
          : `${dias} en ${etapa}`;
      return {
        id: d.id, cuenta: d.cuenta, etapa: d.etapa, arrUsd: d.arrUsd, arrEstimado: d.arrEstimado,
        owner: d.owner, color, razon, firmado: d.firmado,
      };
    });
  return {
    actualizado: dashboard.actualizado,
    reglas: { diasRojo: DIAS_ROJO, diasVerde: DIAS_VERDE },
    secciones: SECCIONES.map((s) => ({
      nombre: s.nombre,
      deals: deals.filter((d) => s.etapas.includes(d.etapa)).sort((a, b) => b.arrUsd - a.arrUsd),
    })),
  };
}
