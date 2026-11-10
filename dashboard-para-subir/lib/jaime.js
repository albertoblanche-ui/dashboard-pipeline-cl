// Vista de Jaime Mañalich (/jaime). Solo lo que necesita para leer en segundos: institución, ARR y un color.
// Reglas (5-nov-2026; rojo cambiado el 9-nov por Beto: ya no son los días en la etapa):
//   Verde  = firmado, o subió de etapa en los últimos DIAS_VERDE días.
//   Rojo   = estancado según la regla de ritmo del dashboard (config.js): next step vencido o sin fecha y nada que
//            lo justifique. Un piloto en curso, una licitación, una LOI o un contrato en firma no son rojo.
//   Blanco = todo el resto (avanza o en espera justificada; el motivo va en el detalle).
// No se muestra Qualification (First meeting held volvió el 5-nov a pedido de Beto). Sí van las contrapartes del cliente (nombre y cargo,
// ordenadas por cargo), por si Jaime las conoce. Sin correos, teléfonos, next steps ni notas.
import { ETAPAS, ETAPAS_FIRMADAS } from './config.js';

export const DIAS_VERDE = 14;
// Partners, no clientes: no van en la vista.
const EXCLUIR = [/celerity/i];

// Secciones de la página, de la más avanzada a la menos.
export const SECCIONES = [
  { nombre: 'Firmados', etapas: ETAPAS_FIRMADAS },
  { nombre: 'En piloto', etapas: ['PoC preparation', 'PoC execution'] },
  { nombre: 'Negociando', etapas: ['Negotiation'] },
  { nombre: 'Construyendo acuerdo', etapas: ['Build consensus'] },
  { nombre: 'Primera reunión', etapas: ['First meeting held'] },
];
const NOMBRE_ETAPA = {
  'First meeting held': 'Primera reunión',
  'Build consensus': 'Construyendo acuerdo',
  'Negotiation': 'Negociando',
  'PoC preparation': 'Preparando piloto',
  'PoC execution': 'En piloto',
  'Contract signature': 'Firmado',
  'Ready for use 🎉': 'En uso',
};
// Orden de los cargos para mostrar primero a quien decide (el primero que calza manda).
const JERARQUIA = [
  /\b(ceo|gerente general|director(a)? (general|ejecutiv[oa])|presidente|rector)\b/i,
  /\b(director(a)? m[eé]dic[oa]|subdirector(a)?|gerente|cfo|coo|cmo|cio|cto)\b/i,
  /\b(director(a)?|jef[ea]|head|encargad[oa])\b/i,
  /\b(coordinador(a)?|subgerente|asesor(a)?)\b/i,
];
const rango = (cargo) => {
  const i = JERARQUIA.findIndex((re) => re.test(cargo ?? ''));
  return i === -1 ? (cargo ? JERARQUIA.length : JERARQUIA.length + 1) : i;
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
  const contactosDe = Object.fromEntries(
    raw.deals.map((d) => [
      d.id.record_id,
      (d.values?.contacts ?? []).map((c) => raw.contactos?.[c.target_record_id]).filter((c) => c?.nombre)
        .sort((a, b) => rango(a.cargo) - rango(b.cargo))
        .map(({ nombre, cargo }) => ({ nombre, cargo })),
    ]),
  );
  const visibles = new Set(SECCIONES.flatMap((s) => s.etapas));
  const deals = dashboard.deals
    .filter((d) => visibles.has(d.etapa) && !EXCLUIR.some((re) => re.test(d.cuenta)))
    .map((d) => {
      const color = d.firmado || subioHacePoco(raw.historial[d.id], d.diasEtapa) ? 'verde' : d.estancado ? 'rojo' : 'blanco';
      const etapa = NOMBRE_ETAPA[d.etapa] ?? d.etapa;
      const dias = d.diasEtapa === 1 ? '1 día' : `${d.diasEtapa} días`;
      const hace = d.diasEtapa === 0 ? 'hoy' : d.diasEtapa === 1 ? 'ayer' : `hace ${dias}`;
      const razon = d.firmado
        ? (d.etapa === 'Ready for use 🎉' ? 'En uso' : 'Contrato firmado')
        : color === 'verde'
          ? `Pasó a ${etapa} ${hace}`
          : `${d.motivoRitmo ? d.motivoRitmo + ' · ' : ''}${dias} en ${etapa}`;
      return {
        id: d.id, cuenta: d.cuenta, etapa: d.etapa, arrUsd: d.arrUsd, arrEstimado: d.arrEstimado,
        owner: d.owner, color, razon, firmado: d.firmado, diasEtapa: d.diasEtapa, motivo: d.motivoRitmo,
        contactos: contactosDe[d.id] ?? [],
      };
    });
  return {
    actualizado: dashboard.actualizado,
    reglas: { diasVerde: DIAS_VERDE },
    secciones: SECCIONES.map((s) => ({
      nombre: s.nombre,
      deals: deals.filter((d) => s.etapas.includes(d.etapa)).sort((a, b) => b.arrUsd - a.arrUsd),
    })),
  };
}
