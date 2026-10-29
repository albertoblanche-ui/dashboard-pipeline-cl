// Vista de Jaime Mañalich: la carrera de deals sin Qualification, con los contactos principales
// de cada deal. Solo lo necesario: sin next steps, sin notas, sin correos ni teléfonos.

// Orden de los cargos para elegir los contactos principales (el primero que calza manda).
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

export function construirJaime(dashboard, raw) {
  const contactosDe = Object.fromEntries(
    raw.deals.map((d) => [d.id.record_id, (d.values?.contacts ?? []).map((c) => raw.contactos?.[c.target_record_id]).filter((c) => c?.nombre)]),
  );
  const m = dashboard.meta;
  return {
    actualizado: dashboard.actualizado,
    meta: {
      metaUsd: m.metaUsd, arrFirmadoUsd: m.arrFirmadoUsd, avance: m.avance, faltaUsd: m.faltaUsd,
      diasAlCierre: m.diasAlCierre, ritmoSemanalUsd: m.ritmoSemanalUsd,
      firmados: m.firmados.map(({ id, cuenta, arrUsd }) => ({ id, cuenta, arrUsd })),
    },
    deals: dashboard.deals
      .filter((d) => (d.abierto || d.firmado) && d.etapa !== 'Qualification')
      .map((d) => {
        const cs = [...contactosDe[d.id]].sort((a, b) => rango(a.cargo) - rango(b.cargo));
        return {
          id: d.id, cuenta: d.cuenta, etapa: d.etapa, arrUsd: d.arrUsd, arrEstimado: d.arrEstimado,
          abierto: d.abierto, firmado: d.firmado, owner: d.owner, mustWin: d.mustWin,
          lento: d.lento, estancado: d.estancado, candidatoPerdido: d.candidatoPerdido,
          diasEtapa: d.diasEtapa, diasInactivo: d.diasInactivo, limiteEtapa: d.limiteEtapa,
          creado: d.creado, firmaEsperada: d.firmaEsperada,
          movimientos: d.movimientos.map(({ de, a, fecha, avance }) => ({ de, a, fecha, avance })),
          contactos: cs,
        };
      }),
  };
}
