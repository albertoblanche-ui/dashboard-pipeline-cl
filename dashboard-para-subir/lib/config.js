// Reglas del dashboard. Cambiar aquí, no en el código de cálculo.
// Decisiones en 01-definicion-vistas.md (sección 5b, 22-oct-2026).

export const META_ARR_USD = 1_000_000;
export const META_FECHA = '2026-12-31';
export const CLP_POR_USD = 930; // tasa implícita de Attio (mapas/attio.md, 8-oct-2026)
export const TICKET_MINIMO_USD = 50_000;
export const DIAS_SIN_ACTIVIDAD = 7;
export const DIAS_PELOTA_CLIENTE = 3;
export const DIAS_PERDIDO_SIN_ACTIVIDAD = 14;

// Orden del funnel, probabilidad (descripción del campo Weighted amount en Attio) y límites de días.
// Reglas (29-oct-2026): pasar el límite = Lento; pasar el límite y más de DIAS_SIN_ACTIVIDAD sin
// actividad = Estancado; pasar el límite de perdido y más de DIAS_PERDIDO_SIN_ACTIVIDAD sin
// actividad = Candidato a Closed lost.
export const ETAPAS = [
  { nombre: 'Qualification', prob: 0.0, limite: 7, perdido: 21 },
  { nombre: 'First meeting held', prob: 0.1, limite: 10, perdido: 30 },
  { nombre: 'Build consensus', prob: 0.3, limite: 21, perdido: 45 },
  { nombre: 'Negotiation', prob: 0.8, limite: 10, perdido: 30 },
  { nombre: 'PoC preparation', prob: 0.6, limite: 10, perdido: 30 },
  { nombre: 'PoC execution', prob: 0.6, limite: 30, perdido: 60 },
  { nombre: 'Contract signature', prob: 0.9, limite: 30, perdido: null },
  { nombre: 'Ready for use 🎉', prob: 1.0, limite: null, perdido: null },
];
export const ETAPAS_FIRMADAS = ['Contract signature', 'Ready for use 🎉'];
export const ETAPAS_CERRADAS = ['Closed lost', 'Churned'];

// Must-win (29-oct: por ahora solo ACHS). Se reemplaza por el campo "must_win" cuando exista en Attio.
export const MUST_WIN = [/\bACHS\b/i];

// Carrera de países: ARR firmado acumulado desde el día 0 de cada país.
// Día 0 PROVISORIO (29-oct): el primer deal o primera reunión registrada en Attio.
// Colombia y Brasil se cargaron a Attio en nov-2025, así que su día 0 real puede ser anterior.
// Reemplazar por la fecha real de entrada de cada país cuando Tomi la confirme.
export const PAISES = [
  { nombre: 'Chile', attio: 'Chile', inicio: '2026-06-12' },
  { nombre: 'Colombia', attio: 'Colombia', inicio: '2025-01-22' },
  { nombre: 'Brasil', attio: 'Brazil', inicio: '2025-07-04' },
  { nombre: 'Argentina', attio: 'Argentina', inicio: '2026-08-31' },
];

// Equipo Chile: se buscan en Attio por correo.
export const EQUIPO = [
  { corto: 'Tomi', email: 'tomas.guiloff@telepatia.ai' },
  { corto: 'Seba', email: 'sebastian.zaliasnik@telepatia.ai' },
  { corto: 'Anto', email: 'antonia.benavente@telepatia.ai' },
  { corto: 'Beto', email: 'alberto.blanche@telepatia.ai' },
];

export const ATTIO = {
  pais: 'Chile',
  listaPipeline: '247224c9-54d6-4bf6-a60a-dc1f162cbab7', // CL - Pipeline
  listaTGP: '28f819fd-0249-404d-b52e-3365ba7bd212', // CL - Agendadas por TGP
  // Campos nuevos aprobados el 22-oct. Si aún no existen, se usan los respaldos.
  campos: {
    fechaNextStep: 'next_step_date',
    responsableNextStep: 'next_step_owner',
    pelotaEn: 'ball_in',
    mustWin: 'must_win',
  },
};

export const INICIATIVAS = {
  fechaPuntoPartidaOKR: '2026-10-19',
  fechasInicio: {
    tgp: '2026-10-15',
    centralizacion: '2026-10-22',
    agenteAttioV3: '2026-10-26'
  },
  ventanaDiasConversion: 45,
  idSebaParaSDR: 'sebastian.zaliasnik@telepatia.ai',
  campos: {
    calificacionTgp: 'calificacion_tgp',
    motivoCalificacion: 'motivo_calificacion',
    betoParticipa: 'beto_participa'
  }
};
