// lib/config.js
// Reglas del dashboard. Cambiar aquí, no en el código de cálculo.

export const META_ARR_USD = 1_000_000;
export const META_FECHA = '2026-12-31';
export const CLP_POR_USD = 930;
export const TICKET_MINIMO_USD = 50_000;
export const DIAS_SIN_ACTIVIDAD = 7;
export const DIAS_PELOTA_CLIENTE = 3;

// Límites de días realistas para estancado y candidato a perdido
export const ETAPAS = [
  { nombre: 'Qualification', estancado: 14, perdido: 30 },
  { nombre: 'First meeting held', estancado: 14, perdido: 30 },
  { nombre: 'Build consensus', estancado: 30, perdido: 60 },
  { nombre: 'PoC preparation', estancado: 21, perdido: 45 },
  { nombre: 'PoC execution', estancado: 45, perdido: 90 },
  { nombre: 'Negotiation', estancado: 30, perdido: 60 },
  { nombre: 'Contract signature', estancado: 30, perdido: null },
  { nombre: 'Ready for use 🎉', estancado: null, perdido: null },
];
export const ETAPAS_FIRMADAS = ['Contract signature', 'Ready for use 🎉'];
export const ETAPAS_CERRADAS = ['Closed lost', 'Churned'];

// Must-win: Solo ACHS
export const MUST_WIN = [/\bACHS\b/i];

// Equipo Chile
export const EQUIPO = [
  { corto: 'Tomi', email: 'tomas.guiloff@telepatia.ai' },
  { corto: 'Seba', email: 'sebastian.zaliasnik@telepatia.ai' },
  { corto: 'Anto', email: 'antonia.benavente@telepatia.ai' },
  { corto: 'Beto', email: 'alberto.blanche@telepatia.ai' },
];

export const ATTIO = {
  pais: 'Chile',
  listaPipeline: '247224c9-54d6-4bf6-a60a-dc1f162cbab7',
  listaTGP: '28f819fd-0249-404d-b52e-3365ba7bd212',
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
